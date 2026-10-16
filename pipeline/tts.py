"""配音：读 episode.json，逐句生成旁白，输出 narration.wav 和 timeline.json。

每句台词可以是字符串，也可以是 {"text": 字幕文字, "say": 实际念法}，
用于数字、缩写等需要"写法和读法不同"的地方，例如
{"text": "DRAM up 60%", "say": "DRAM, up sixty percent"}。
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
MODELS = HERE / "models"

LINE_GAP = 0.28      # 同一场景内句与句之间的停顿（秒）
SCENE_LEAD = 0.20    # 场景开头留白
SCENE_TAIL = 0.45    # 场景结尾留白，给画面收尾


def silence(sec, sr):
    return np.zeros(int(sec * sr), dtype=np.float32)


def normalize_line(line):
    if isinstance(line, str):
        return {"text": line, "say": line}
    return {"text": line["text"], "say": line.get("say", line["text"])}


SUB_MAX_CHARS = 40   # 每屏字幕最多字符数，超过就切成多屏


def split_subs(text, start, end):
    """把一句长台词切成几屏长度相近的短字幕，按字符数比例分配时间。
    先按标点切成小句，再把过长的小句按单词均分。"""
    import math
    import re
    clauses = [c for c in re.split(r"(?<=[,.;:?!])\s+", text) if c]
    chunks = []
    for c in clauses:
        n = math.ceil(len(c) / SUB_MAX_CHARS)
        words, target = c.split(), len(c) / n
        cur = ""
        for w in words:
            cand = f"{cur} {w}".strip()
            if cur and n > 1 and len(cand) > target * 1.15:
                chunks.append(cur)
                cur = w
            else:
                cur = cand
        chunks.append(cur)
    # 合并太短的相邻小句
    merged = []
    for c in chunks:
        if merged and len(merged[-1]) + len(c) + 1 <= SUB_MAX_CHARS and (len(c) < 14 or len(merged[-1]) < 14):
            merged[-1] = f"{merged[-1]} {c}"
        else:
            merged.append(c)
    chunks = merged
    total = sum(len(c) for c in chunks)
    subs, t = [], start
    for c in chunks:
        d = (end - start) * len(c) / total
        subs.append({"text": c, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return subs


def main(ep_dir):
    ep_dir = Path(ep_dir)
    ep = json.loads((ep_dir / "episode.json").read_text())
    voice = ep.get("voice", "am_michael")
    speed = float(ep.get("speed", 1.0))
    lang = "en-gb" if voice.startswith("b") else "en-us"

    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))
    build = ep_dir / "build"
    build.mkdir(exist_ok=True)

    sr = 24000
    chunks, t = [], 0.0
    timeline = {"scenes": [], "lines": [], "subs": []}

    for si, scene in enumerate(ep["scenes"]):
        scene_start = t
        chunks.append(silence(SCENE_LEAD, sr))
        t += SCENE_LEAD
        lines = [normalize_line(l) for l in scene.get("lines", [])]
        for li, line in enumerate(lines):
            samples, sr = kokoro.create(line["say"], voice=voice, speed=speed, lang=lang)
            dur = len(samples) / sr
            timeline["lines"].append({"scene": si, "index": li, "text": line["text"],
                                      "start": round(t, 3), "end": round(t + dur, 3)})
            timeline["subs"].extend(split_subs(line["text"], t, t + dur))
            chunks.append(samples.astype(np.float32))
            t += dur
            if li < len(lines) - 1:
                chunks.append(silence(LINE_GAP, sr))
                t += LINE_GAP
        # 没有台词的场景（纯画面）用 hold 指定时长
        hold = float(scene.get("hold", 0))
        tail = max(SCENE_TAIL, hold) if not lines else SCENE_TAIL + hold
        chunks.append(silence(tail, sr))
        t += tail
        timeline["scenes"].append({"index": si, "type": scene["type"],
                                   "start": round(scene_start, 3), "end": round(t, 3)})

    timeline["duration"] = round(t, 3)
    audio = np.concatenate(chunks)
    sf.write(build / "narration.wav", audio, sr)

    # 每帧（1/30 秒）的音量包络，驱动 AI 主播形象随声音跳动
    hop = sr // 30
    n = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1))
    ref = np.percentile(rms[rms > 1e-4], 95) if np.any(rms > 1e-4) else 1.0
    timeline["env"] = [round(float(v), 3) for v in np.clip(rms / ref, 0, 1)]
    (build / "timeline.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False))
    print(f"narration: {t:.1f}s, {len(timeline['lines'])} lines, voice={voice}")


if __name__ == "__main__":
    main(sys.argv[1])
