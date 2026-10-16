// 离线合成器（无采样、无依赖）：鼓、贝斯、拨弦、铺底、音效。编曲脚本调用这些乐器，最后 write() 出 WAV。
// Adapted from the kinetic-reel skill's music/score.mjs (MIT License, Copyright (c) 2026 tuzhechen2005).
// 规则：转场不用噪声"嗖"声；章节切换用反向铺底 swell，场内切换用小的音高提示或者干脆不加。
import { writeFileSync } from 'fs';

export function createSynth(dur, SR = 44100) {
  const N = Math.ceil(SR * (dur + 1)), TAU = Math.PI * 2;
  const L = new Float32Array(N), R = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
  const musL = new Float32Array(N), musR = new Float32Array(N), duck = new Float32Array(N).fill(1);
  let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const lerpN = (a, b, k) => a + (b - a) * k;

  function put(t0, len, gen, { gain = 1, pan = 0, rev = 0, bus = 'drum' } = {}) {
    const i0 = Math.max(0, Math.floor(t0 * SR)), i1 = Math.min(N, Math.floor((t0 + len) * SR));
    const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    const BL = bus === 'mus' ? musL : L, BR = bus === 'mus' ? musR : R;
    for (let i = i0; i < i1; i++) { const v = gen(Math.max(0, (i - t0 * SR) / SR)); BL[i] += v * gl; BR[i] += v * gr; sendL[i] += v * gl * rev; sendR[i] += v * gr * rev; }
  }
  function noise(t0, len, env, filt, o = {}) {
    let lp = 0, bp = 0;
    put(t0, len, tt => { const n = rnd() * 2 - 1, [fc, q0] = filt(tt), q = Math.max(q0, .45), f = Math.min(.85, 2 * Math.sin(Math.PI * Math.min(fc, SR / 7) / SR)); lp += f * bp; const hp = n - lp - q * bp; bp += f * hp; return env(tt) * (o.hp ? hp : o.lp ? lp : bp); }, o);
  }
  const S = {
    put, mtof,
    kick(t, v = 1) {
      put(t, .55, tt => v * Math.sin(TAU * (48 * tt + 110 * (1 - Math.exp(-tt * 32)) / 32)) * Math.exp(-tt * 6.5) * (tt < .003 ? tt / .003 : 1), { gain: .95 });
      noise(t, .02, tt => v * .5 * Math.exp(-tt * 300), () => [3000, .5], { gain: .5 });
      const i0 = Math.floor(t * SR); for (let i = 0; i < SR * .3 && i0 + i < N; i++) duck[i0 + i] = Math.min(duck[i0 + i], 1 - .65 * Math.exp(-i / SR * 11));
    },
    clap(t, v = 1) { for (let k = 0; k < 3; k++) noise(t + k * .012, .25, tt => v * (k === 2 ? .8 * Math.exp(-tt * 14) : .6 * Math.exp(-tt * 70)), () => [1400, .5], { gain: .75, rev: .25 }); put(t, .12, tt => v * .25 * Math.sin(TAU * 190 * tt) * Math.exp(-tt * 30), { gain: .6 }); },
    hat(t, v = 1, open = false) { noise(t, open ? .3 : .06, tt => v * .45 * Math.exp(-tt * (open ? 12 : 70)), () => [9000, .6], { gain: .5, pan: .25, hp: true }); },
    tick(t, v = 1) { put(t, .03, tt => v * .3 * Math.sin(TAU * 2600 * tt) * Math.exp(-tt * 180), { gain: .5, pan: -.3 }); },
    impact(t, v = 1) { S.kick(t, v); noise(t, 1.4, tt => v * .9 * Math.exp(-tt * 3.2), tt => [1800 * Math.exp(-tt * 2) + 200, .7], { gain: .7, rev: .6, lp: true }); put(t, 1.6, tt => v * .5 * Math.sin(TAU * (38 * tt + 30 * (1 - Math.exp(-tt * 8)) / 8)) * Math.exp(-tt * 2.2), { gain: .8 }); },
    softImpact(t, v = 1) { S.kick(t, v); put(t, 1.2, tt => v * .4 * Math.sin(TAU * (40 * tt + 24 * (1 - Math.exp(-tt * 8)) / 8)) * Math.exp(-tt * 2.6), { gain: .8 }); },
    riser(t, len, v = 1) { noise(t, len, tt => v * .35 * Math.pow(tt / len, 2.2), tt => [400 * Math.pow(12, tt / len), .6], { gain: .55, rev: .5, lp: true }); put(t, len, tt => v * .12 * Math.sin(TAU * (220 * tt + 440 * tt * tt / len)) * Math.pow(tt / len, 2), { gain: .6, rev: .4, bus: 'mus' }); },
    glitch(t, len, v = 1) { for (let k = 0; k < Math.floor(len / .035); k++) { const tt = t + k * .035, f = 300 + 3000 * rnd(); put(tt, .03, x => v * .22 * Math.sign(Math.sin(TAU * f * x)) * (rnd() < .5 ? 1 : .3), { gain: .6, pan: rnd() * 2 - 1 }); } },
    blip(t, m = 93, v = 1, pan = 0) { put(t, .14, tt => v * .28 * Math.sin(TAU * mtof(m) * tt) * Math.exp(-tt * 28), { gain: .7, pan, rev: .35, bus: 'mus' }); },
    stab(t, notes, v = 1) { notes.forEach((m, i) => put(t, .7, tt => v * .12 * (Math.sin(TAU * mtof(m) * tt) + .5 * Math.sin(TAU * mtof(m) * 2.001 * tt) + .25 * Math.sin(TAU * mtof(m) * 3 * tt)) * Math.exp(-tt * 5), { gain: .8, pan: (i - 1) * .4, rev: .45, bus: 'mus' })); },
    odo(t, len, v = 1) { for (let k = 0; k < len / .045; k++) S.tick(t + k * .045 * (1 + k * .02), v * (.5 + .5 * rnd())); },
    buzz(t, len = .35, v = 1) { let ph = 0; put(t, len, tt => { ph += 55 / SR; return v * .18 * Math.tanh(3 * Math.sin(TAU * ph) + Math.sin(TAU * ph * 3.02)) * Math.min(1, tt / .01) * Math.exp(-tt * 5); }, { gain: .8 }); },
    shutter(t, v = 1) { noise(t, .05, tt => v * .9 * Math.exp(-tt * 120), () => [4200, .6], { gain: .8 }); noise(t + .07, .09, tt => v * .6 * Math.exp(-tt * 60), () => [2400, .6], { gain: .7, rev: .2 }); S.tick(t, v); },
    lock(t, v = 1) { noise(t, .03, tt => v * .8 * Math.exp(-tt * 160), () => [1800, .7], { gain: .7 }); S.blip(t + .02, 88, .8 * v); S.blip(t + .1, 95, .8 * v); },
    pop(t, v = 1) { put(t, .12, tt => v * .35 * Math.sin(TAU * (500 + 900 * Math.exp(-tt * 40)) * tt) * Math.exp(-tt * 30), { gain: .7, rev: .2, bus: 'mus' }); },
    bass(t, m, len, v = 1) { let ph = 0; put(t, len + .05, tt => { ph += mtof(m) / SR; const saw = 2 * (ph % 1) - 1, sq = (ph % 1) < .5 ? 1 : -1, env = Math.min(1, tt / .005) * (tt < len ? 1 : Math.exp(-(tt - len) * 60)); return v * .32 * env * (Math.tanh(1.8 * (saw * .6 + sq * .25 + Math.sin(TAU * ph * .5) * .8))); }, { gain: .75, bus: 'mus' }); },
    sub(t, m, len, v = 1) { put(t, len, tt => v * .35 * Math.sin(TAU * mtof(m) * tt) * Math.exp(-tt * 2.5) * Math.min(1, tt / .01), { gain: .8, bus: 'mus' }); },
    pluck(t, m, v = 1, pan = 0) { put(t, .5, tt => v * .16 * (Math.sin(TAU * mtof(m) * tt) + .35 * Math.sin(TAU * mtof(m) * 2 * tt) * Math.exp(-tt * 12) + .15 * Math.sin(TAU * mtof(m) * 3.01 * tt) * Math.exp(-tt * 20)) * Math.exp(-tt * 9), { gain: .8, pan, rev: .3, bus: 'mus' }); },
    pad(t, notes, len, v = 1) { notes.forEach((m, i) => { const d = [1, 1.004, .996]; put(t, len + .8, tt => { let s = 0; for (const k of d) for (let h = 1; h <= 4; h++) s += Math.sin(TAU * mtof(m) * k * h * tt + h) / (h * h); return v * .025 * s * Math.min(1, tt / .4) * (tt > len ? Math.exp(-(tt - len) * 4) : 1); }, { gain: .8, pan: (i - 1) * .5, rev: .6, bus: 'mus' }); }); },
    swell(tEnd, notes, len = 1.6, v = 1) { notes.forEach((m, i) => put(tEnd - len, len + .06, tt => { const q = tt / len, env = q < 1 ? Math.pow(q, 2.6) : Math.max(0, 1 - (tt - len) / .06); let s = 0; for (let h = 1; h <= 3; h++) s += Math.sin(TAU * mtof(m) * h * tt + h) / (h * h); return v * .07 * s * env; }, { gain: .8, pan: (i / Math.max(1, notes.length - 1) - .5) * .6, rev: .35, bus: 'mus' })); },
    bloom(t, notes, v = 1) { notes.forEach((m, i) => put(t + i * .03, 1.6, tt => v * .06 * (Math.sin(TAU * mtof(m) * tt) + .3 * Math.sin(TAU * mtof(m) * 2.01 * tt)) * Math.min(1, tt / .08) * Math.exp(-tt * 2.4), { gain: .8, pan: (i - 1) * .4, rev: .6, bus: 'mus' })); },
    glide(t, len, m0, m1, v = 1) { let ph = 0; put(t, len + .15, tt => { const q = Math.min(1, tt / len), f = mtof(lerpN(m0, m1, q * q * (3 - 2 * q))); ph += f / SR; const tri = 1 - 4 * Math.abs((ph % 1) - .5); return v * .07 * tri * Math.sin(Math.PI * Math.min(1, tt / (len + .15))); }, { gain: .8, rev: .45, bus: 'mus' }); },
    harp(t, span, notes, v = 1, dir = 1) { notes.forEach((m, i) => S.pluck(t + (dir > 0 ? i : notes.length - 1 - i) * span / notes.length, m, .32 * v, -.6 + 1.2 * i / Math.max(1, notes.length - 1))); },
    hatRoll(t, n = 4, v = .6) { for (let k = 0; k < n; k++) S.hat(t - (n - k) * .0625, v * (.4 + .6 * k / n)); },

    write(path) {
      const verb = (inp, spread) => {
        const combs = [1116, 1188, 1277, 1356, 1422, 1491].map(d => ({ b: new Float32Array(d + spread), i: 0, s: 0 })), aps = [556, 441, 341].map(d => ({ b: new Float32Array(d + spread), i: 0 }));
        const o = new Float32Array(N);
        for (let n = 0; n < N; n++) { const x = inp[n] * .02; let y = 0; for (const c of combs) { const v = c.b[c.i]; c.s = v * .7 + c.s * .3; c.b[c.i] = x + c.s * .82; c.i = (c.i + 1) % c.b.length; y += v; } for (const a of aps) { const v = a.b[a.i]; a.b[a.i] = y + v * .5; a.i = (a.i + 1) % a.b.length; y = v - y; } o[n] = y; }
        return o;
      };
      const wl = verb(sendL, 0), wr = verb(sendR, 23), oL = new Float32Array(N), oR = new Float32Array(N); let peak = 0;
      for (let n = 0; n < N; n++) {
        let l = L[n] + musL[n] * duck[n] + wl[n] * 4, r = R[n] + musR[n] * duck[n] + wr[n] * 4;
        l = Math.tanh(l * 1.2) / 1.2 * 1.1; r = Math.tanh(r * 1.2) / 1.2 * 1.1;
        oL[n] = l; oR[n] = r; peak = Math.max(peak, Math.abs(l), Math.abs(r));
      }
      const g = .9 / peak, fadeOut = Math.floor((dur - .2) * SR), buf = Buffer.alloc(44 + N * 4);
      buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
      buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
      for (let n = 0; n < N; n++) {
        const f = Math.min(1, n / (.02 * SR)) * (n > fadeOut ? Math.max(0, 1 - (n - fadeOut) / (1.2 * SR)) : 1);
        buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, oL[n] * g * f)) * 32767), 44 + n * 4);
        buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, oR[n] * g * f)) * 32767), 46 + n * 4);
      }
      writeFileSync(path, buf);
      return peak;
    },
  };
  return S;
}
