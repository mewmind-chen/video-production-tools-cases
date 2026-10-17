// 风格样片 02：写实。贸易商用手机拍给你的那段视频 → 代码层接管，逐项核对标签。16 秒，无旁白。
import * as THREE from 'three';
import { createReel, K, F, W, H, clamp, lerp, seg, ease, easeOut, easeIn, easeInOut, expoOut, ioExpo, backOut, hash, font } from '/pipeline/reel/engine.js';
import { createScene } from './scene.js';

export const T = { tap: 3.4, push: 3.9, locks1: [5.0, 5.8, 6.6], move2: 8.2, locks2: [9.6, 10.6], window: 12.0, pull: 13.8, verified: 14.6, dur: 16 };

export default async function (EP, TL) {
  EP.chapters = [['PHONE', 0, T.push], ['LABEL', T.push, T.move2], ['CROSS-CHECK', T.move2, T.window], ['TAPE', T.window, T.pull], ['END', T.pull, 16]];
  const R = createReel({ EP, TL });
  const { txt, measure, rrect, line, circle, chip, dropWord, stackWord, glShot } = R;
  const S = await createScene(R, { hdri: 'apartment', exposure: .85 });

  // ---------- 镜头：关键帧 + 手持晃动 ----------
  const KF = [
    [0, [0, 300, 70], [0, 0, 8]],
    [T.tap, [-6, 288, 58], [0, 0, 2]],
    [T.push + 1.1, [-2, 142, -14], [-2, 7, -50]],
    [T.move2, [8, 134, -16], [6, 7, -50]],
    [T.move2 + 1.2, [4, 122, 94], [4, 7, 58]],
    [T.window, [0, 116, 92], [2, 7, 58]],
    [T.window + 1.3, [-26, 46, 12], [-62, 0, 0]],
    [T.pull, [-30, 42, 8], [-64, 0, 0]],
    [T.pull + 1.0, [0, 305, 74], [0, 0, 8]],
    [16, [0, 318, 80], [0, 0, 8]],
  ];
  const shake = (t, amp) => [0, 1, 2].map(i => amp * (Math.sin(t * (1.3 + i * .7) + i * 2) * .6 + Math.sin(t * (3.1 + i * 1.3) + i) * .3 + Math.sin(t * 7.7 + i * 5) * .1));
  function camAt(t) {
    let i = 0; while (i < KF.length - 2 && t >= KF[i + 1][0]) i++;
    const [t0, p0, g0] = KF[i], [t1, p1, g1] = KF[i + 1], k = easeInOut(seg(t, t0, t1));
    const pos = p0.map((v, j) => lerp(v, p1[j], k)), tgt = g0.map((v, j) => lerp(v, g1[j], k));
    const d = Math.hypot(...pos.map((v, j) => v - tgt[j]));
    const sh = shake(t, d * .006), sg = shake(t + 9, d * .004);
    return { pos: pos.map((v, j) => v + sh[j]), tgt: tgt.map((v, j) => v + sg[j]), d };
  }
  // 对焦：开头略虚，点按对焦后来回找两下再锁定
  function focusAt(t, d) {
    if (t < T.tap) return d * 1.35;
    const h = seg(t, T.tap, T.tap + .55);
    return d * (1 + .35 * Math.cos(h * Math.PI * 2.5) * (1 - h));
  }
  const toScreen = p => { const v = p.clone().project(S.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
  const rectOf = (li, x, y, w, h) => { const a = toScreen(S.labelPoint(li, x, y)), b = toScreen(S.labelPoint(li, x + w, y + h)); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; };

  // ---------- HUD 工具 ----------
  function lockBox([x, y, w, h], p, col = K.lime) {
    if (p <= 0) return;
    const e = easeOut(p / .55), cx = x + w / 2, cy = y + h / 2, sc = 1 + (1 - e) * .8, rot = (1 - e) * Math.PI / 4, ww = w * sc + 20, hh = h * sc + 16, c = Math.min(28, ww * .2, hh * .45), g = R.ctx;
    g.save(); g.translate(cx, cy); g.rotate(rot);
    if (p > .7) { g.fillStyle = 'rgba(221,245,61,.16)'; g.fillRect(-ww / 2, -hh / 2, ww, hh); }
    g.strokeStyle = p > .55 && p < .66 ? '#fff' : col; g.lineWidth = 5; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x0 = sx * ww / 2, y0 = sy * hh / 2; g.beginPath(); g.moveTo(x0 - sx * c, y0); g.lineTo(x0, y0); g.lineTo(x0, y0 - sy * c); g.stroke(); }
    g.restore();
  }
  function card(x, y, lines, p, ok = true) {
    if (p <= 0) return;
    const a = clamp(p * 3), g = R.ctx, f1 = font(F.mono, 24, 700), f2 = font(F.mono, 40, 700);
    const w = Math.max(...lines.map((l, i) => measure(l, i ? f2 : f1, 2))) + 110, h = 46 + 56 * (lines.length - 1) + 30;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - easeOut(p)) * 20);
    rrect(x, y, w, h, 6, { fill: 'rgba(14,15,14,.86)' }); rrect(x, y, w, h, 6, { stroke: ok ? 'rgba(221,245,61,.7)' : 'rgba(232,65,47,.8)', lw: 2 });
    lines.forEach((l, i) => txt(l, x + 24, y + 38 + i * 56 + (i ? 14 : 0), { font: i ? f2 : f1, fill: i ? K.cream : 'rgba(241,238,230,.6)', ls: 2 }));
    if (ok && p > .5) { const cx = x + w - 44, cy = y + h / 2; line([[cx - 14, cy], [cx - 4, cy + 11], [cx + 16, cy - 13]], K.lime, 6, seg(p, .5, .8)); }
    g.restore();
  }
  // 手机取景框界面（通用样式，不仿任何具体系统）
  function phoneUI(t, a) {
    if (a <= 0) return;
    const g = R.ctx; g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, 150);
    circle(W / 2 - 92, 96, 12, { fill: Math.floor(t * 2) % 2 ? '#ff3b30' : 'rgba(255,59,48,.5)' });
    const s = Math.floor(t); txt(`00:${String(s).padStart(2, '0')}`, W / 2 - 66, 108, { font: font(F.mono, 34, 700), fill: '#fff', ls: 2 });
    for (const x of [W / 3, W * 2 / 3]) line([[x, 160], [x, H - 260]], 'rgba(255,255,255,.18)', 1.5);
    for (const y of [H / 3, H * 2 / 3]) line([[0, y], [W, y]], 'rgba(255,255,255,.18)', 1.5);
    rrect(W / 2 - 44, H - 330, 88, 52, 26, { fill: 'rgba(0,0,0,.45)' }); txt('1×', W / 2, H - 293, { font: font(F.sans, 30, 700), fill: '#ffd60a', align: 'center' });
    // 点按对焦框
    const fk = seg(t, T.tap, T.tap + .35);
    if (t > T.tap && t < T.push + .6) {
      const [cx, cy] = toScreen(S.labelPoint(0, 1144, 360)), r = lerp(190, 110, easeOut(fk));
      g.strokeStyle = '#ffd60a'; g.lineWidth = 4; g.strokeRect(cx - r, cy - r, r * 2, r * 2);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) line([[cx + dx * r, cy + dy * r], [cx + dx * (r - 14), cy + dy * (r - 14)]], '#ffd60a', 4);
      if (t > T.tap + .55) { rrect(cx - 105, cy - r - 58, 210, 48, 6, { fill: '#ffd60a' }); txt('AE/AF LOCK', cx, cy - r - 23, { font: font(F.sans, 28, 800), fill: '#000', align: 'center' }); }
    }
    g.restore();
  }

  function film(t) {
    const c = camAt(t);
    R.bg('#000');
    glShot(S.render({ pos: c.pos, tgt: c.tgt, fov: 58, focus: focusAt(t, c.d), k: t > T.window ? 7 : 4.5 }));

    phoneUI(t, 1 - seg(t, T.push, T.push + .4) + seg(t, T.pull + .3, T.pull + .8) * 0);

    // 第一张标签：P/N、QTY、S/N 逐个锁定
    const L1 = [[60, 60, 1260, 92, '⟨P/N⟩', 'S1H1C105A207'], [60, 152, 760, 92, '⟨QTY⟩', '4,000'], [60, 244, 1260, 92, '⟨S/N⟩', '2617408K3521']];
    if (t > T.locks1[0] - .1 && t < T.move2 + .6) {
      const fade = 1 - seg(t, T.move2, T.move2 + .5);
      L1.forEach(([x, y, w, h, k, v], i) => { const p = seg(t, T.locks1[i], T.locks1[i] + .55) * fade; lockBox(rectOf(0, x, y, w, h), p);  });
      card(84, 1060, ['⟨P/N⟩ · ⟨QTY⟩ · ⟨S/N⟩', 'LABEL READ'], seg(t, T.locks1[2] + .4, T.locks1[2] + .9) * fade);
    }
    // 第二张标签：两张标签的数量是否一致，批次号记下来
    if (t > T.locks2[0] - .1 && t < T.window + .5) {
      const fade = 1 - seg(t, T.window, T.window + .4);
      const q = rectOf(1, 50, 380, 560, 100), l = rectOf(1, 50, 278, 1400, 96);
      lockBox(q, seg(t, T.locks2[0], T.locks2[0] + .55) * fade); lockBox(l, seg(t, T.locks2[1], T.locks2[1] + .55) * fade);
      card(84, 360, ['⟨QTY⟩ = ⟨Q⟩', '4,000 = 4,000'], seg(t, T.locks2[0] + .4, T.locks2[0] + .9) * fade);
      card(84, 560, ['⟨L⟩ LOT → MATCH TO CoC', '6KQM418230TR'], seg(t, T.locks2[1] + .4, T.locks2[1] + .9) * fade);
    }
    // 窗口里的纸带
    if (t > T.window + .9 && t < T.pull + .3) {
      const a = seg(t, T.window + .9, T.window + 1.2) * (1 - seg(t, T.pull, T.pull + .3));
      chip('PAPER TAPE · 4 mm PITCH', 84, 360, { k: a, bg: 'rgba(14,15,14,.86)', fg: K.cream, font: font(F.mono, 26, 700) });
      chip('4,000 PCS ON ONE REEL', 84, 430, { k: seg(t, T.window + 1.2, T.window + 1.5) * a, bg: K.lime, fg: K.ink, font: font(F.mono, 26, 700) });
    }
    // 结尾
    if (t > T.verified) {
      const g = R.ctx; g.save(); g.fillStyle = `rgba(14,15,14,${.45 * seg(t, T.verified, T.verified + .4)})`; g.fillRect(0, 0, W, H); g.restore();
      stackWord('VERIFIED.', W / 2, 1000, font(F.wide, 170), T.verified + .1, t, { align: 'center', fill: K.lime, gap: 180, echo: 1, echoCol: 'rgba(221,245,61,.4)' });
      txt('BEFORE YOU PAY.', W / 2, 1110, { font: font(F.cond, 96), fill: K.cream, align: 'center', a: seg(t, T.verified + .5, T.verified + .8) });
    }
    if (t >= T.verified && t < T.verified + .1) R.FX.flash = .3;
    R.FX.grain = .07; R.FX.vign = .45;
    R.hud(t, { tl: 'STYLE TEST 02 — PHOTOREAL', bl: '7" REEL · 0603 MLCC · PAPER TAPE', br: 'BRAND & NUMBERS FICTIONAL', k: seg(t, T.push, T.push + .5) * (1 - seg(t, T.verified, T.verified + .3)) });
  }
  R.run([[0, film, 'film']], {});
}
