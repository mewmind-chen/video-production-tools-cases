"""程序化合成占位音效 + BGM，按 cues 混入人声 → build/mix.wav。
所有音效同时导出到 assets/sfx/*.wav，替换成真素材时保持文件名即可（存在就优先用文件）。"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
T = json.load(open(os.path.join(ROOT, "build/timeline.json"), encoding="utf-8"))
C = json.load(open(os.path.join(ROOT, "build/cues.json")))
SFX = os.path.join(ROOT, "assets/sfx")
os.makedirs(SFX, exist_ok=True)
rng = np.random.default_rng(7)
N = int((T["duration"] + 0.2) * SR)


def tt(d):
    return np.arange(int(d * SR)) / SR


def filt(x, kind, f):
    return sosfilt(butter(2, f, kind, fs=SR, output="sos"), x)


def load(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).astype(np.float64)


def save(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", path],
                   input=pcm, check=True)


# ---------- 占位音效 ----------
def s_ding():
    t = tt(0.9)
    return 0.5 * np.sin(2 * np.pi * 1318.5 * t) * np.exp(-5 * t) + 0.25 * np.sin(2 * np.pi * 1975.5 * t) * np.exp(-7 * t)

def s_scratch():
    t = tt(0.4)
    f = 900 - 1900 * t + 250 * np.sin(2 * np.pi * 18 * t)
    tone = np.sin(2 * np.pi * np.cumsum(np.maximum(f, 80)) / SR)
    noise = filt(rng.standard_normal(len(t)), "bandpass", [600, 3000])
    return (0.45 * tone + 0.25 * noise) * np.minimum(1, t * 60) * np.exp(-3 * t)

def s_key():
    t = tt(0.035)
    return filt(rng.standard_normal(len(t)), "highpass", 1800) * np.exp(-180 * t) * 0.5

def s_enter():
    t = tt(0.12)
    return 0.6 * np.sin(2 * np.pi * 170 * t) * np.exp(-40 * t) + filt(rng.standard_normal(len(t)), "highpass", 1200) * np.exp(-120 * t) * 0.5

def s_tap():
    t = tt(0.05)
    return 0.4 * np.sin(2 * np.pi * 2400 * t) * np.exp(-120 * t)

def s_thud():
    t = tt(0.18)
    return 0.7 * np.sin(2 * np.pi * 90 * t) * np.exp(-25 * t) + 0.2 * filt(rng.standard_normal(len(t)), "lowpass", 900) * np.exp(-40 * t)

def s_sigh():
    t = tt(0.9)
    env = np.sin(np.pi * t / 0.9) ** 2
    return 0.18 * filt(rng.standard_normal(len(t)), "bandpass", [300, 1800]) * env

def s_whoosh():
    t = tt(0.45)
    n = rng.standard_normal(len(t))
    return 0.35 * (filt(n, "bandpass", [500, 2500]) * np.sin(np.pi * t / 0.45) ** 2)

def s_crash():
    t = tt(1.0)
    metal = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-d * t) for f, a, d in
                [(523, .3, 5), (811, .25, 6), (1187, .2, 7), (1730, .15, 9), (2560, .1, 11)])
    thud = 0.8 * np.sin(2 * np.pi * 70 * t) * np.exp(-12 * t)
    noise = 0.4 * filt(rng.standard_normal(len(t)), "bandpass", [800, 6000]) * np.exp(-14 * t)
    x = metal + thud + noise
    for off, g in [(0.22, .35), (0.36, .18)]:  # 弹两下
        k = int(off * SR)
        x[k:] += g * (metal + noise)[: len(x) - k]
    return x

def s_crow():
    out = np.zeros(int(1.0 * SR))
    for off, d in [(0.0, 0.42), (0.5, 0.36)]:
        t = tt(d)
        f = 620 - 240 * t / d + 25 * np.sin(2 * np.pi * 30 * t)
        ph = np.cumsum(f) / SR
        saw = 2 * (ph % 1) - 1
        x = filt(saw, "bandpass", [700, 2600]) * np.minimum(1, t * 40) * np.exp(-2.5 * t) * 0.55
        k = int(off * SR)
        out[k:k + len(x)] += x
    return out

def s_pop():
    t = tt(0.12)
    f = 320 + 1400 * t / 0.12
    return 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-25 * t)

def s_stamp():
    t = tt(0.25)
    return 0.7 * np.sin(2 * np.pi * 110 * t) * np.exp(-30 * t) + 0.3 * filt(rng.standard_normal(len(t)), "lowpass", 2000) * np.exp(-50 * t)

def s_hit():
    t = tt(1.4)
    kick = 0.9 * np.sin(2 * np.pi * np.cumsum(55 + 120 * np.exp(-30 * t)) / SR) * np.exp(-8 * t)
    snare = 0.35 * filt(rng.standard_normal(len(t)), "bandpass", [1500, 7000]) * np.exp(-14 * t)
    cym = 0.2 * filt(rng.standard_normal(len(t)), "highpass", 6000) * np.exp(-3 * t)
    return kick + snare + cym

def s_ding_end():
    t = tt(1.2)
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-4 * t) for f, a in [(1568, .4), (2093, .25), (3136, .1)])

def s_send():
    t = tt(0.18)
    f = 500 + 900 * t / 0.18
    return 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-14 * t)

def s_beep():
    t = tt(0.16)
    return 0.4 * np.sin(2 * np.pi * 880 * t) * np.minimum(1, (0.16 - t) * 60) * np.minimum(1, t * 200)

def s_beep_hi():
    t = tt(0.35)
    return 0.45 * np.sin(2 * np.pi * 1760 * t) * np.exp(-6 * t)

def s_shutter():
    t = tt(0.12)
    return filt(rng.standard_normal(len(t)), "bandpass", [1000, 5000]) * np.exp(-60 * t) * 0.5

def s_glitch():
    t = tt(0.45)
    x = np.sign(np.sin(2 * np.pi * (220 + 600 * (rng.random(len(t)) > 0.97).cumsum() % 3) * t))
    gate = (np.floor(t * 40) % 3 != 0).astype(float)
    return 0.22 * x * gate * np.exp(-3 * t)

def s_error():
    t = tt(0.5)
    a = 0.35 * np.sign(np.sin(2 * np.pi * 180 * t)) * ((t < 0.2) | (t > 0.27))
    return filt(a, "lowpass", 1800) * np.exp(-2 * t)

def s_sad():  # 「哇哇哇——」下行长号占位
    out = []
    for f0, d in [(392, 0.32), (370, 0.32), (349, 0.32), (330, 0.9)]:
        t = tt(d)
        f = f0 * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
        ph = np.cumsum(f) / SR
        saw = 2 * (ph % 1) - 1
        out.append(filt(saw, "lowpass", 1400) * np.minimum(1, t * 30) * np.minimum(1, (d - t) * 20) * 0.28)
    return np.concatenate(out)

def s_rise():
    t = tt(0.6)
    f = 300 * 2 ** (t / 0.6 * 2)
    return 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t * 10) * np.exp(-1.5 * t)

GEN = dict(ding=s_ding, scratch=s_scratch, key=s_key, enter=s_enter, tap=s_tap, thud=s_thud, sigh=s_sigh,
           whoosh=s_whoosh, crash=s_crash, crow=s_crow, pop=s_pop, stamp=s_stamp, hit=s_hit, ding_end=s_ding_end, send=s_send, beep=s_beep, beep_hi=s_beep_hi,
           shutter=s_shutter, glitch=s_glitch, error=s_error, sad=s_sad, rise=s_rise)
SOUNDS = {}
for name, fn in GEN.items():
    path = os.path.join(SFX, name + ".wav")
    if not os.path.exists(path):
        save(path, fn())
    SOUNDS[name] = load(path)


# ---------- 时间线 ----------
vo = np.zeros(N); fx = np.zeros(N)

def put(buf, x, at, gain=1.0):
    k = int(at * SR)
    if k >= N: return
    x = x[: N - k]
    buf[k:k + len(x)] += gain * x

for shot in T["shots"]:
    for seg in shot["segments"]:
        put(vo, load(os.path.join(ROOT, seg["file"])), seg["start"], 1.0)

def keys(a, b, gain=(0.5, 1.0), step=(0.07, 0.14)):
    t = a
    while t < b:
        put(fx, SOUNDS["key"], t, rng.uniform(*gain)); t += rng.uniform(*step)

# 镜 1
put(fx, SOUNDS["pop"], C["markFans"], 0.7)
put(fx, SOUNDS["pop"], C["markLikes"], 0.6)
put(fx, SOUNDS["whoosh"], C["panVisitors"] - 0.05, 0.7)
put(fx, SOUNDS["whoosh"], C["visitorsLeave"] + 0.1, 0.5)
# 镜 2
put(fx, SOUNDS["whoosh"], C["pullOut"], 0.9)
put(fx, SOUNDS["pop"], C["markBanner"], 0.6)
put(fx, SOUNDS["tap"], C["tapPublish"])
put(fx, SOUNDS["whoosh"], C["expand"], 1.0)
put(fx, SOUNDS["stamp"], C["titleIn"], 0.6)
t = C["counter"]
for i in range(14):  # 计数器滚动的滴答
    put(fx, SOUNDS["tap"], t + i * 0.05, 0.35)
put(fx, SOUNDS["pop"], C["progressIn"], 0.7)
# 镜 3
put(fx, SOUNDS["whoosh"], C["aiIn"], 0.9)
keys(C["typeQStart"], C["typeQEnd"])
put(fx, SOUNDS["send"], C["sendQ"])
put(fx, SOUNDS["whoosh"], C["streamStart"], 0.7); put(fx, SOUNDS["whoosh"], C["streamStart"] + 0.5, 0.6)
put(fx, SOUNDS["pop"], C["badge18"])
put(fx, SOUNDS["pop"], C["highlight"], 0.8)
# 镜 4
put(fx, SOUNDS["shutter"], C["camIn"], 0.8)
for k in ("cd3", "cd2", "cd1"):
    put(fx, SOUNDS["beep"], C[k])
put(fx, SOUNDS["beep_hi"], C["rec"])
put(fx, SOUNDS["glitch"], C["crack"] + 0.05)
put(fx, SOUNDS["scratch"], C["crack"] + 0.1, 0.8)
put(fx, SOUNDS["crash"], C["fall"])
put(fx, SOUNDS["error"], C["toast"])
put(fx, SOUNDS["stamp"], C["stamp"])
# 镜 5
put(fx, SOUNDS["whoosh"], C["reportIn"], 0.9)
put(fx, SOUNDS["sad"], C["bar1"], 0.9)
put(fx, SOUNDS["rise"], C["bar2"], 0.9)
put(fx, SOUNDS["ding"], C["bar2"] + 0.55, 0.8)
put(fx, SOUNDS["pop"], C["footnote"], 0.5)
# 镜 6
put(fx, SOUNDS["whoosh"], C["ctaIn"], 0.9)
keys(C["exStart"], C["exStart"] + 1.1, (0.3, 0.6)); keys(C["exStart"] + 1.5, C["exStart"] + 2.5, (0.3, 0.6))
put(fx, SOUNDS["whoosh"], C["endCard"], 0.8)
put(fx, SOUNDS["pop"], C["slogan1"], 0.7)
put(fx, SOUNDS["hit"], C["slogan2"] + 0.05, 0.9)
put(fx, SOUNDS["ding_end"], C["endDing"])


# ---------- BGM：前段极轻环境垫底，bgmIn 后轻快 lo-fi ----------
def bgm():
    t = np.arange(N) / SR
    pad = 0.012 * filt(rng.standard_normal(N), "lowpass", 300)  # 深夜房间底噪
    out = pad.copy()
    bpm = 92; beat = 60 / bpm
    chords = [[174.6, 220.0, 261.6, 329.6], [164.8, 196.0, 246.9, 293.7],
              [146.8, 174.6, 220.0, 261.6], [130.8, 164.8, 196.0, 246.9]]
    start = 0.0
    nb = int((T["duration"] - start) / beat) + 2
    for b in range(nb):
        at = start + b * beat
        if at >= C["freeze"] + 0.1: break
        k = int(at * SR); seg = min(int(beat * SR * 2), N - k)
        if seg <= 0: break
        tl = np.arange(seg) / SR
        if b % 2 == 0:  # 和弦（电钢感：基频 + 二次谐波，指数衰减）
            ch = chords[(b // 4) % 4]
            x = sum(np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(4 * np.pi * f * tl) for f in ch) * np.exp(-2.2 * tl) * 0.03
            out[k:k + seg] += x
            bass = chords[(b // 4) % 4][0] / 2
            out[k:k + seg] += 0.07 * np.sin(2 * np.pi * bass * tl) * np.exp(-3 * tl)
        kick_len = min(int(0.25 * SR), N - k); tk = np.arange(kick_len) / SR
        if b % 2 == 0:
            out[k:k + kick_len] += 0.18 * np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-35 * tk)) / SR) * np.exp(-12 * tk)
        else:
            out[k:k + kick_len] += 0.06 * filt(rng.standard_normal(kick_len), "bandpass", [1500, 6000]) * np.exp(-20 * tk)
        for h in (0, 0.5):  # 八分音符 hi-hat
            kh = int((at + h * beat) * SR); hl = min(int(0.05 * SR), N - kh)
            if hl > 0:
                th = np.arange(hl) / SR
                out[kh:kh + hl] += 0.025 * filt(rng.standard_normal(hl), "highpass", 7000) * np.exp(-80 * th)
    music = out - pad
    gate = np.zeros(N)
    for a, b in [(0.0, C["silenceStart"]), (C["silenceEnd"], C["crack"] + 0.1), (C["bar2"], C["freeze"] + 0.6)]:
        gate[int(a * SR):int(b * SR)] = 1
    gate = np.convolve(gate, np.ones(int(0.03 * SR)) / int(0.03 * SR), mode="same")
    return pad + music * gate

music = bgm()
# 人声出现时压低 BGM（包络侧链）
env = np.convolve(np.abs(vo), np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same")
env = np.clip(env / (env.max() + 1e-9) * 4, 0, 1)
env = np.convolve(env, np.ones(int(0.15 * SR)) / int(0.15 * SR), mode="same")
music *= 1 - 0.55 * env

mix = vo * 0.95 + fx * 0.6 + music
# 镜 3 看镜头那一秒：全部静音（含 BGM）
a, b = int(C["silenceStart"] * SR), int(C["silenceEnd"] * SR)
mix[a:b] = 0
ramp = int(0.01 * SR)
mix[a - ramp:a] *= np.linspace(1, 0, ramp); mix[b:b + ramp] *= np.linspace(0, 1, ramp)
mix /= max(1.0, np.abs(mix).max() / 0.95)
save(os.path.join(ROOT, "build/mix.wav"), mix)
print("mix ok", round(len(mix) / SR, 2), "s, peak", round(float(np.abs(mix).max()), 3))
