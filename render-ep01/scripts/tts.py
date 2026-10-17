"""逐句配音 → 量时长 → 生成 build/timeline.json（配音先行，画面按实测时长排）。"""
import asyncio, json, os, subprocess, sys

ca = "/root/.ccr/ca-bundle.crt"
if os.path.exists(ca):  # 云端容器走代理时需要信任代理 CA
    import certifi
    certifi.where = lambda: ca
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, "config/ep01.json"), encoding="utf-8"))
VO = os.path.join(ROOT, "build/vo")
os.makedirs(VO, exist_ok=True)


def duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", path])
    return float(out)


async def synth(seg, path):
    v = cfg["voice"]
    c = edge_tts.Communicate(seg["text"], v["name"], rate=seg.get("rate", v["rate"]),
                             pitch=seg.get("pitch", v["pitch"]), volume=seg.get("volume", v["volume"]),
                             proxy=os.environ.get("HTTPS_PROXY"))
    await c.save(path + ".mp3")
    # 去掉首尾静音，时长才准；破音句额外做升调 + 失真
    af = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    if seg.get("crack"):
        af += ",asetrate=24000*1.12,aresample=24000,acrusher=bits=6:mix=0.35,volume=1.4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path + ".mp3", "-af", af, "-ar", "48000", "-ac", "2",
                    path + ".wav"], check=True)
    return duration(path + ".wav")


async def main():
    t = 0.0
    shots = []
    for shot in cfg["shots"]:
        start = t
        t += shot["lead"]
        segs = []
        for i, seg in enumerate(shot["segments"]):
            path = os.path.join(VO, f"s{shot['id']}_{i}")
            d = await synth(seg, path)
            segs.append({"start": round(t, 3), "end": round(t + d, 3), "sub": seg["sub"],
                         "file": os.path.relpath(path + ".wav", ROOT)})
            t += d + seg.get("pauseAfter", 0)
        t += shot["tail"]
        shots.append({"id": shot["id"], "start": round(start, 3), "end": round(t, 3), "segments": segs})
    timeline = {"duration": round(t, 3), "fps": cfg["fps"], "shots": shots}
    json.dump(timeline, open(os.path.join(ROOT, "build/timeline.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    for s in shots:
        print(f"shot {s['id']}: {s['start']:.2f}–{s['end']:.2f}s  ({s['end']-s['start']:.2f}s)")
        for g in s["segments"]:
            print(f"    {g['start']:.2f}–{g['end']:.2f}  {g['sub']!r}")
    print(f"total {t:.2f}s")
    if not 25 <= t <= 33:
        print("WARNING: 总时长不在 25–33s，调整 config 里的 voice.rate / lead / tail / pauseAfter", file=sys.stderr)


asyncio.run(main())
