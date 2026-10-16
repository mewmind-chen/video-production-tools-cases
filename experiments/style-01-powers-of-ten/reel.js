// 风格样片 01：十的次方。16 秒，无旁白，一镜到底：料盘墙 → 载带 → MLCC → 层间 → 急速拉回。
// 时间按 120 BPM 的拍子排（一拍 0.5 s，一小节 2 s），music.mjs 用同一组时间点。
import * as THREE from 'three';
import { createReel, K, F, W, H, clamp, lerp, seg, ease, easeOut, easeIn, easeInOut, expoOut, ioExpo, backOut, beatPulse, font } from '/pipeline/reel/engine.js';
import { createWorld } from './world.js';
import { T } from './cues.mjs';

export default async function (EP, TL) {
  EP.chapters = [['WALL', 0, 4], ['TAPE', 4, 9], ['CHIP', 9, 14], ['END', 14, 16]];
  const R = createReel({ EP, TL });
  const { txt, measure, circle, chip, dropWord, stackWord, letters, mark, hud, glShot, line } = R;
  const Wd = createWorld(R);
  const PI = Math.PI;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fit = (s, fam, maxW, max) => Math.min(max, Math.floor(max * maxW / measure(s, font(fam, max))));

  // ---------- 世界状态（只由 t 决定）----------
  function state(t) {
    const s = {
      heroPop: backOut(seg(t, T.reelPop, T.reelPop + .45)), heroSpin: 1,
      wall: seg(t, T.pullBack, T.pullBack + 1.2),
      tape: seg(t, T.dive + .6, T.dive + 1.6),
      heroLift: easeOut(seg(t, T.lift, T.lift + .8)) * (1 - seg(t, T.snap + .15, T.snap + .7)),
      xray: seg(t, T.xray, T.xray + .5) * (1 - seg(t, T.explode + .6, T.explode + 1.0)),
      explode: easeInOut(seg(t, T.explode, T.explode + .9)) * (1 - easeInOut(seg(t, T.snap, T.snap + .4))),
      fan: 1, verify: seg(t, T.verified, T.verified + .9),
    };
    s.heroYaw = lerp(0, -.5, seg(t, T.lift, T.explode));
    const bgc = t < T.drop ? K.ink : t < T.lift ? K.lime : t < T.snap ? K.cream : K.ink;
    s.bg = new THREE.Color(bgc);
    return s;
  }

  // ---------- 一条连续的镜头路径：关键帧 + 对数距离插值 ----------
  const C = (t, tgt, yaw, pitch, dist, ez = easeInOut, roll = 0) => ({ t, tgt, yaw, pitch, dist, ez, roll });
  const tapeStart = V(Wd.POCKET_X, Wd.TAPE_Y, 30);
  function keys(s) {
    const heroNow = Wd.heroBase().add(V(0, 6 * easeOut(s.heroLift), 0));
    const gap = Wd.gapPoint(s);
    return [
      C(0, V(0, 0, 0), 0, 0, 1500),
      C(T.pullBack, V(0, 0, 0), 0, 0, 1250),
      C(T.pullBack + 1.2, V(0, 0, 0), .04, .02, 3700, ioExpo),
      C(T.dive, V(0, 0, 0), .08, .04, 3300, easeOut),
      C(T.dive + 2, tapeStart, PI, .38, 18, ioExpo, 0),
      C(T.lift, heroNow, PI + .12, .52, 11, easeInOut),
      C(T.xray, heroNow, PI + .5, .32, 8.5),
      C(T.explode, heroNow, PI + .35, .22, 8),
      C(T.explode + 1, heroNow, PI + .18, .1, 17),
      C(T.inside, gap, PI + .04, 0, .07, ioExpo),
      C(T.snap, gap, PI + .02, 0, .055, t => t),
      C(T.snap + .4, heroNow, PI + .1, .3, 60, ioExpo),          // 先沿原路退出芯片
      C(T.snap + 1, V(0, 0, 0), .06, .03, 4000, ioExpo),         // 再转身拉回整墙
      C(16, V(0, 0, 0), .1, .05, 3600, easeOut),
    ];
  }
  function camAt(t, s) {
    const ks = keys(s);
    let i = 0; while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
    const a = ks[i], b = ks[i + 1], k = b.ez(seg(t, a.t, b.t));
    return { tgt: a.tgt.clone().lerp(b.tgt, k), yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k),
      dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), k)), roll: lerp(a.roll, b.roll, k), speed: Math.abs(Math.log(b.dist / a.dist)) / Math.max(.1, b.t - a.t) * (k > 0 && k < 1 ? 1 : 0) };
  }
  const fmtField = mm => mm >= 1 ? `${Math.round(mm).toLocaleString('en-US')} mm` : `${Math.round(mm * 1000).toLocaleString('en-US')} µm`;

  function film(t) {
    const s = state(t), c = camAt(t, s);
    Wd.update(t, s);
    glShot(Wd.render(c));
    const dark = t < T.drop || t >= T.snap;

    // 0–1 s：黑场里的绿点随鼓点跳动（就是那卷料盘的轴心）
    if (t < T.reelPop + .1) circle(W / 2, H / 2, (22 + 14 * beatPulse(t)) * backOut(seg(t, .05, .4)), { fill: K.lime });

    // 4,000 PCS. IN STOCK.
    if (t > T.slam && t < T.dive + .4) {
      const out = easeIn(seg(t, T.dive, T.dive + .4));
      stackWord('4,000', W / 2, 1010 - out * 900, font(F.cond, 400), T.slam, t, { align: 'center', fill: K.cream, gap: 330, echo: 1, echoCol: 'rgba(241,238,230,.3)' });
      const w1 = measure('PCS. IN STOCK.', font(F.mono, 30, 700), 3) + 36;
      chip('PCS. IN STOCK.', W / 2 - w1 / 2 - 120, 1120 - out * 900, { k: seg(t, T.slam + .5, T.slam + .8), bg: K.lime, fg: K.ink, font: font(F.mono, 30, 700), h: 64 });
      chip('SHIPS TODAY.', W / 2 + w1 / 2 - 90, 1120 - out * 900, { k: seg(t, T.slam + 1.0, T.slam + 1.3), bg: K.cream, fg: K.ink, font: font(F.mono, 30, 700), h: 64 });
    }
    // 载带上每拍一个巨字
    T.words.forEach(([w, t0, fill], i) => {
      const t1 = T.words[i + 1] ? T.words[i + 1][1] : T.lift;
      if (t < t0 || t >= t1) return;
      const f = font(F.wide, fit(w, F.wide, 900, 300));
      letters(w, W / 2, 1060, { font: f, fill, align: 'center' }, j => { const k = seg(t, t0 + j * .02, t0 + j * .02 + .14); return { dy: (1 - expoOut(k)) * 120, s: 1 + (1 - expoOut(k)) * .3, a: k > 0 ? 1 : 0 }; });
      if (t - t0 < 1 / 30) R.FX.flash = Math.max(R.FX.flash, .12);
    });
    // MLCC：X 光、分层标注
    if (t > T.xray && t < T.inside) txt('X-RAY', W / 2, 520, { font: font(F.mono, 30, 700), fill: K.blue, ls: 12, align: 'center', a: s.xray });
    if (t > T.explode + .3 && t < T.inside) {
      const a = seg(t, T.explode + .3, T.explode + .6) * (1 - seg(t, T.inside - .4, T.inside));
      ['Sn  ·  TIN', 'Ni  ·  NICKEL', 'Cu  ·  COPPER', 'BaTiO₃ + Ni × 60 LAYERS'].forEach((l, i) =>
        chip(l, 80, 1300 + i * 72, { k: seg(t, T.explode + .3 + i * .12, T.explode + .6 + i * .12) * (a > 0 ? 1 : 0), bg: i === 3 ? K.blue : K.ink, fg: K.cream, font: font(F.mono, 24, 700), a }));
      txt('LAYER COUNT: SCHEMATIC', 80, 1600, { font: font(F.mono, 20, 700), fill: 'rgba(14,15,14,.55)', ls: 3, a });
    }
    // 层间：一句"人声"
    if (t > T.inside - .5 && t < T.snap) {
      const a = seg(t, T.inside - .5, T.inside - .1);
      txt('look inside', W / 2, 860, { font: `italic 150px ${F.serif}`, fill: K.ink, align: 'center', a });
      dropWord('BEFORE YOU PAY.', W / 2, 1080, font(F.cond, fit('BEFORE YOU PAY.', F.cond, 900, 170)), T.inside, t, { align: 'center', fill: K.ink, fall: 90, fillAt: i => i === 14 ? K.red : K.ink });
    }
    // VERIFIED.
    if (t > T.verified) {
      stackWord('VERIFIED.', W / 2, 1020, font(F.wide, fit('VERIFIED.', F.wide, 920, 190)), T.verified, t, { align: 'center', fill: K.lime, gap: 200, echo: 2, echoCol: 'rgba(221,245,61,.35)' });
      mark(W / 2, 1260, 26, t, seg(t, T.verified + .5, T.verified + .9));
      txt('CHINA SUPPLY CHAIN SIGNAL', W / 2, 1360, { font: font(F.mono, 26, 700), fill: K.cream, ls: 6, align: 'center', a: seg(t, T.verified + .6, T.verified + .9) });
    }

    // 后期：切换处故障，急速拉回时 RGB 错位随速度变大
    for (const tc of [T.drop, T.lift, T.snap]) if (t >= tc && t < tc + .14) { R.FX.slice = Math.max(R.FX.slice, .5 * (1 - (t - tc) / .14)); R.FX.split = Math.max(R.FX.split, .006); R.FX.seed = Math.floor(t * 30); }
    for (const tc of [T.slam, T.explode, T.verified]) if (t >= tc && t < tc + .1) R.FX.flash = Math.max(R.FX.flash, .35 * (1 - (t - tc) / .1));
    R.FX.split = Math.max(R.FX.split, Math.min(.02, c.speed * .0025));

    hud(t, { dark, tl: 'STYLE TEST 01 — POWERS OF TEN', bl: `FIELD ${fmtField(Wd.fieldMM(c))}`, br: 'MLCC 0805 · RENDERED IN CODE' });
  }

  R.run([[0, film, 'film']], {});
}
