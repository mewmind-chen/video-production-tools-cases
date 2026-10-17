// 001 · MLCC & memory are on allocation. How to tell if a broker's stock is real.
// 竖屏动效排版短片的逐镜头脚本。时间点见 cues.mjs，版式与动效工具见 pipeline/reel/engine.js。
import { createReel, K, F, LAY, W, H, BEAT, clamp, lerp, seg, ease, easeOut, easeIn, expoOut, backOut, hash, beatPulse, TAU, font } from '/pipeline/reel/engine.js';
import { cues, KEYS } from './cues.mjs';
import { createMLCC } from './mlcc.js';
import { createBrand } from '/pipeline/reel/brand.js';

export default async function (EP, TL) {
  const C = cues(TL), S = C.S, E = C.E, Hh = C.hits;
  EP.chapters = [['OPEN', 0, S.photo], ['01', S.photo, S.datecode], ['02', S.datecode, S.label], ['03', S.label, S.paper], ['04', S.paper, S.teardown], ['05', S.teardown, S.recap], ['END', S.recap, C.dur]];
  const R = createReel({ EP, TL });
  const { txt, letters, measure, bg, line, circle, rrect, starburst, asterisk, arrowNE, arrow, chip, odometer, tape, dropWord, stackWord, glitchIn, redacted, thread, barcode, glShot, mark, hud, terrain, RECT } = R;
  const mlcc = createMLCC(R);
  const B = createBrand(R, EP);
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML;

  // 自适应字号：在最大宽度内取最大字号
  const fit = (s, fam, maxW, max) => Math.min(max, Math.floor(max * maxW / measure(s, font(fam, max))));
  // 标题：多行依次落下；accent 给某一行的最后一个字符（句号）或整行上色
  function headline(lines, y0, t0, t, o = {}) {
    let y = y0;
    lines.forEach((ln, i) => {
      const size = o.size || fit(ln, F.cond, CW, o.max || 250);
      y += i === 0 ? 0 : size * .98;
      const col = o.col || K.cream;
      dropWord(ln, ML, y, font(F.cond, size), t0 + i * .18, t, {
        fill: col, fall: 180, stag: .028,
        fillAt: ch => (o.dot && ch === ln.length - 1 && ln.endsWith('.') && i === lines.length - 1) ? o.dot : (o.keyLine === i ? o.key : col),
      });
    });
    return y;
  }
  const index = (n, t, t0, dark = true) => chip(`CHECK ${String(n).padStart(2, '0')} / 05`, ML, 196, { k: seg(t, t0, t0 + .3), bg: dark ? K.lime : K.ink, fg: dark ? K.ink : K.lime });
  const HUD_TL = 'BUYER’S PLAYBOOK · 001';
  const sec = (i, name) => `■ ${String(i).padStart(2, '0')} / 05   ${name}`;

  // ---------- 产品的平面画法（按真实毫米比例）----------
  // 8 mm 凸起载带：齿孔 Ø1.5 距边 1.75，口袋中心距齿孔线 3.5，节距 4，MLCC 长轴横跨带宽
  function tapeStrip(y, t, o = {}) {
    const ppm = o.ppm || 30, P = 4 * ppm, h = 8 * ppm, scroll = o.scroll || 0, ground = o.ground || K.lime;
    const ctx = R.ctx; ctx.save();
    ctx.fillStyle = '#141414'; ctx.fillRect(-10, y, W + 20, h);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(-10, y + 3, W + 20, 3);
    const first = Math.floor((-scroll) / P) - 1;
    for (let k = first; k < first + W / P + 3; k++) {
      const x = k * P + scroll;
      ctx.fillStyle = ground; ctx.beginPath(); ctx.arc(x, y + 1.75 * ppm, .75 * ppm, 0, TAU); ctx.fill();
      const px = x + 2 * ppm, py = y + 5.25 * ppm, pa = 1.55 * ppm, pb = 2.35 * ppm;
      ctx.fillStyle = '#050505'; ctx.fillRect(px - pa / 2, py - pb / 2, pa, pb);
      ctx.strokeStyle = '#3b3d40'; ctx.lineWidth = 3; ctx.strokeRect(px - pa / 2 - 4, py - pb / 2 - 4, pa + 8, pb + 8);
      const gone = o.empty ? o.empty(k) : 0;
      if (gone < 1) {
        const s = 1 - easeIn(gone), cw = 1.25 * ppm * s, cl = 2.0 * ppm * s;
        ctx.globalAlpha = 1 - gone;
        const gr = ctx.createLinearGradient(px - cw / 2, 0, px + cw / 2, 0); gr.addColorStop(0, '#9b7d58'); gr.addColorStop(.5, '#d4b88f'); gr.addColorStop(1, '#8a6d4b');
        ctx.fillStyle = gr; ctx.fillRect(px - cw / 2, py - cl / 2, cw, cl);
        ctx.fillStyle = '#d9dde1'; ctx.fillRect(px - cw / 2, py - cl / 2, cw, .42 * ppm * s); ctx.fillRect(px - cw / 2, py + cl / 2 - .42 * ppm * s, cw, .42 * ppm * s);
        ctx.globalAlpha = 1;
      } else if (o.markEmpty) { ctx.strokeStyle = K.red; ctx.lineWidth = 5; const r = 14; line([[px - r, py - r], [px + r, py + r]], K.red, 5); line([[px + r, py - r], [px - r, py + r]], K.red, 5); }
    }
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(-10, y + 2.55 * ppm, W + 20, 5.4 * ppm);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-10, y + 2.55 * ppm, W + 20, 2); ctx.fillRect(-10, y + 7.95 * ppm, W + 20, 2);
    ctx.restore();
  }
  // 7 英寸料盘（平面）
  function reelIcon(cx, cy, r, rot, k = 1) {
    if (k <= 0) return; const ctx = R.ctx; ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(backOut(k), backOut(k));
    ctx.fillStyle = K.blue; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1b1c1e'; ctx.beginPath(); ctx.arc(0, 0, r * .81, 0, TAU); ctx.fill();
    for (let rr = r * .8; rr > r * .36; rr -= 7) { ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = K.blue;
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * TAU / 3 + Math.PI / 2); ctx.fillRect(-r * .13, 0, r * .26, r * .82); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, r * .34, 0, TAU); ctx.fill();
    ctx.fillStyle = K.ink; ctx.beginPath(); ctx.arc(0, 0, r * .073, 0, TAU); ctx.fill();
    ctx.restore();
    // 标签不随料盘旋转
    ctx.save(); ctx.translate(cx, cy - r * .58); ctx.scale(backOut(k), backOut(k));
    ctx.fillStyle = K.cream; ctx.fillRect(-r * .3, -r * .19, r * .6, r * .38);
    barcode(-r * .26, -r * .1, r * .36, r * .12, 3); txt('MLCC 0805', -r * .26, r * .12, { font: font(F.mono, Math.round(r * .07), 700), fill: K.ink });
    ctx.restore();
  }
  // 料盘标签（平面，字段按行业做法，内容虚构）
  const LOT = '8K12A0473', DC = '2541', PN = 'CC0805X7R106K250';
  function labelCard(x, y, w, k = 1) {
    const h = w * 34 / 54, s = w / 1080, ctx = R.ctx;
    if (k <= 0) return null;
    ctx.save(); ctx.translate(x, y + (1 - easeOut(k)) * 60); ctx.globalAlpha = clamp(k * 2);
    rrect(0, 0, w, h, 10, { fill: '#FBFAF6' }); rrect(0, 0, w, h, 10, { stroke: K.ink, lw: 3 });
    const T = (s2, xx, yy, sz, wt = 700, col = K.ink) => txt(s2, xx * s, yy * s, { font: font(F.mono, Math.round(sz * s), wt), fill: col });
    txt('CERAMIC CHIP CAPACITOR', 28 * s, 64 * s, { font: font(F.wide, Math.round(40 * s)), fill: K.ink });
    rrect((1080 - 150) * s, 26 * s, 118 * s, 50 * s, 4, { stroke: K.ink, lw: 3 }); T('RoHS', 950, 62, 28);
    line([[24 * s, 90 * s], [1056 * s, 90 * s]], K.ink, 4);
    T(`(1P) PART NO.  ${PN}`, 28, 140, 30); barcode(28 * s, 152 * s, 690 * s, 64 * s, 11);
    T('(Q) QTY  4000 PCS', 28, 262, 30); barcode(28 * s, 274 * s, 400 * s, 54 * s, 12);
    T(`(9D) D/C  ${DC}`, 28, 382, 30); T(`(1T) LOT  ${LOT}`, 360, 382, 30); barcode(28 * s, 394 * s, 690 * s, 54 * s, 13);
    T('INSP. NO.  25410317      (4L) C/O  TW', 28, 496, 26, 500);
    T('10µF ±10%  25V  X7R  0805  ·  REEL 178 mm  ·  8 mm TAPE', 28, 560, 22, 500, '#555');
    // 2D 码
    const qx = 770 * s, qy = 118 * s, qs = 270 * s, n = 22, c = qs / n;
    ctx.fillStyle = K.ink; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (hash(i * 31 + j * 7 + 5) > .52) ctx.fillRect(qx + i * c, qy + j * c, c, c);
    ctx.fillRect(qx, qy, c, qs); ctx.fillRect(qx, qy + qs - c, qs, c);
    ctx.restore();
    const rect = (rx, ry, rw, rh) => [x + rx * s, y + ry * s, rw * s, rh * s];
    return { pn: rect(18, 108, 710, 116), qty: rect(18, 232, 420, 104), dc: rect(18, 352, 300, 44), lot: rect(350, 352, 380, 44), h };
  }
  // 目标框：放大旋转 45° 进场，收拢锁定
  function lockBox([x, y, w, h], p, col = K.ink) {
    if (p <= 0) return;
    const e = easeOut(p / .6), cx = x + w / 2, cy = y + h / 2, sc = 1 + (1 - e) * .9, rot = (1 - e) * Math.PI / 4;
    const ww = w * sc + 18, hh = h * sc + 18, ctx = R.ctx, c = Math.min(26, ww * .25, hh * .4);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const flash = p > .6 && p < .72;
    if (p >= .72) { ctx.fillStyle = 'rgba(221,245,61,.45)'; ctx.fillRect(-ww / 2, -hh / 2, ww, hh); }
    ctx.strokeStyle = flash ? K.red : col; ctx.lineWidth = 5;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x0 = sx * ww / 2, y0 = sy * hh / 2; ctx.beginPath(); ctx.moveTo(x0 - sx * c, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y0 - sy * c); ctx.stroke(); }
    ctx.restore();
  }
  function check(x, y, s, col, k = 1) { if (k <= 0) return; const e = easeOut(k); line([[x - s, y], [x - s * .3, y + s * .7 * Math.min(1, e * 2)], ...(e > .5 ? [[lerp(x - s * .3, x + s, (e - .5) * 2), lerp(y + s * .7, y - s * .8, (e - .5) * 2)]] : [])], col, s * .32); }

  // ---------- 镜头 ----------
  function sOpen(t) {
    bg(K.ink); const lt = t - S.open, h = Hh.open;
    glShot(terrain(t, { fade: ease(seg(t, .1, 1.4)) * .9, amp: lerp(.3, 1.1, easeOut(seg(t, 0, 3))), push: t * .5, camY: 3.2, lookY: -2.2 }));
    // 信号点 → 聊天气泡
    if (t < h.bubble + .2) circle(W / 2, 640, (16 + 8 * beatPulse(t)) * backOut(seg(t, h.dot, h.dot + .35)), { fill: K.lime });
    const bk = seg(t, h.bubble, h.bubble + .35);
    if (bk > 0) {
      const ctx = R.ctx, bw = 860, bh = 190, bx = ML + 30, by = 470 + (1 - easeOut(bk)) * 40;
      ctx.save(); ctx.globalAlpha = clamp(bk * 2);
      rrect(bx, by, bw * backOut(bk), bh, 44, { fill: '#232622' });
      ctx.fillStyle = '#232622'; ctx.beginPath(); ctx.moveTo(bx + 30, by + bh - 4); ctx.lineTo(bx - 10, by + bh + 34); ctx.lineTo(bx + 90, by + bh - 4); ctx.fill();
      txt('BROKER  ·  09:41', bx + 40, by + 52, { font: font(F.mono, 22, 700), fill: 'rgba(241,238,230,.55)', ls: 3 });
      if (t < h.text) for (let i = 0; i < 3; i++) circle(bx + 60 + i * 34, by + 120 - 10 * Math.max(0, Math.sin((t * 6 - i * .7) * Math.PI)), 9, { fill: K.cream });
      else letters('4,000 pcs. In stock. Ships today.', bx + 40, by + 136, { font: font(F.sans, 50, 700), fill: K.cream }, i => ({ a: seg(t, h.text + i * .018, h.text + i * .018 + .06) }));
      ctx.restore();
    }
    // 重锤：REAL STOCK? / OR BAIT.
    if (t > h.slam - .02) {
      stackWord('REAL', W / 2, 1010, font(F.wide, 230), h.slam, t, { align: 'center', fill: K.cream, gap: 190, echo: 2 });
      dropWord('STOCK?', W / 2, 1180, font(F.cond, 150), h.slam + .2, t, { align: 'center', fill: K.cream, fall: 140 });
      dropWord('OR BAIT.', W / 2, 1330, font(F.cond, 150), h.bait, t, { align: 'center', fill: K.cream, fall: 140, fillAt: i => i === 7 ? K.red : (i >= 3 ? K.red : K.cream) });
    }
    const w1 = chip('5 CHECKS', ML, 1400, { k: seg(t, h.chips, h.chips + .3), bg: K.lime, fg: K.ink });
    chip('BEFORE YOU PAY A BROKER', ML + w1 + 14, 1400, { k: seg(t, h.chips + .15, h.chips + .45), bg: K.cream, fg: K.ink });
    RECT.openChip = [ML, 1373, w1, 54];
    B.hud(t, { tl: HUD_TL, bl: sec(0, 'OPEN'), br: 'MLCC · 0805 · RENDERED IN CODE', k: ease(seg(lt, .1, .6)) });
  }

  function sAlloc(t) {
    bg(K.lime); const lt = t - S.alloc, h = Hh.alloc;
    headline(['ON', 'ALLOCATION.'], 470, h.head, t, { col: K.ink, dot: K.red, max: 300 });
    const tk = expoOut(seg(t, h.tape, h.tape + .7));
    // 载带滚动；随着台词，口袋一个个空掉（缺货）
    const scroll = lerp(W, 0, tk) - lt * 60;
    const P = 120, base = Math.floor((0 - scroll) / P);
    tapeStrip(830, t, { ppm: 30, scroll, ground: K.lime, markEmpty: true, empty: k => { const j = [2, 4, 5, 7, 8, 3].indexOf(k - base); return j < 0 ? 0 : seg(t, h.empties[j], h.empties[j] + .25); } });
    const sk = seg(t, h.source, h.source + .3);
    chip('TRENDFORCE · MLCC BULLETIN · AUG 2026', ML, 1170, { k: sk, bg: K.ink, fg: K.lime, font: font(F.mono, 24, 700) });
    txt('SHORTAGES + PRICE HIKES', ML, 1272, { font: font(F.cond, 84), fill: K.ink, a: seg(t, h.source + .25, h.source + .5) });
    txt('→ INTO NEXT QUARTER', ML, 1362, { font: font(F.cond, 84), fill: K.ink, a: seg(t, h.source + .45, h.source + .7) });
    B.hud(t, { dark: false, tl: HUD_TL, bl: sec(0, 'WHY NOW'), br: 'SOURCE: TRENDFORCE, 12 AUG 2026', brackets: false });
  }

  function sDdr5(t) {
    bg(K.cream); const lt = t - S.ddr5, h = Hh.ddr5;
    headline(['DDR5', 'SERVER RAM.'], 430, h.head, t, { col: K.ink, dot: K.red, max: 250 });
    // 10 张订单，只有 3 张被满足
    const bx = ML, by = 740, cell = 150, gap = 14;
    for (let i = 0; i < 10; i++) {
      const c = i % 5, r = Math.floor(i / 5), x = bx + c * (cell + gap) + 4, y = by + r * (cell + gap);
      const k = seg(t, h.boxes + i * .06, h.boxes + i * .06 + .25), filled = i < 3, fk = seg(t, h.fill + i * .25, h.fill + i * .25 + .3);
      if (k <= 0) continue;
      rrect(x, y, cell * backOut(k), cell * backOut(k), 6, { stroke: K.ink, lw: 3 });
      txt(`PO-${String(i + 1).padStart(2, '0')}`, x + 14, y + 34, { font: font(F.mono, 20, 700), fill: K.ink, a: k });
      if (filled && fk > 0) { rrect(x, y, cell, cell, 6, { fill: K.ink, a: fk }); check(x + cell / 2, y + cell / 2 + 10, 34, K.lime, fk); }
      if (!filled && t > h.fill + 1) { const dk = seg(t, h.fill + 1 + (i - 3) * .06, h.fill + 1.2 + (i - 3) * .06); line([[x + 40, y + cell - 40], [x + cell - 40, y + 40]], K.red, 6, dk); }
    }
    const ck = seg(t, h.count, h.count + 1.0);
    if (ck > 0) {
      const f = font(F.cond, 250); txt('<', ML, 1370, { font: f, fill: K.red, a: clamp(ck * 3) });
      const xe = odometer(0, 30, ck, ML + measure('<', f), 1370, f, K.red); txt('%', xe + 6, 1370, { font: f, fill: K.red, a: clamp(ck * 3) });
      const xl = xe + measure('%', f) + 30;
      txt('REPORTED FILL RATE', xl, 1270, { font: font(F.mono, 24, 700), fill: K.ink, ls: 3, a: seg(ck, .5, 1) });
      txt('TRADITIONAL OEMs', xl, 1310, { font: font(F.mono, 24, 700), fill: K.ink, ls: 3, a: seg(ck, .6, 1) });
    }
    B.hud(t, { dark: false, tl: HUD_TL, bl: sec(0, 'WHY NOW'), br: 'SOURCE: FUSION WORLDWIDE, AUG 2026', brackets: false });
  }

  function sPhoto(t) {
    bg(K.ink); const lt = t - S.photo, h = Hh.photo; glitchIn(lt, 3);
    index(1, t, S.photo);
    headline(['PHOTO.', 'TODAY.'], 470, h.head, t, { max: 230, keyLine: 1, key: K.lime });
    // 取景框里：料盘 + 便条；快门后变成一张拍立得
    const pk = easeOut(seg(t, h.shutter + .2, h.shutter + .9)), fk = seg(t, h.finder, h.finder + .3);
    const ctx = R.ctx, fx = 150, fy = 760, fw = 780, fh = 500;
    ctx.save();
    const cx = fx + fw / 2, cy = fy + fh / 2;
    ctx.translate(cx, cy); ctx.rotate(-.06 * pk); ctx.scale(1 - .12 * pk, 1 - .12 * pk); ctx.translate(-cx, -cy);
    if (pk > 0) { rrect(fx - 26, fy - 26, fw + 52, fh + 130, 4, { fill: K.cream, a: pk }); rrect(fx, fy, fw, fh, 0, { fill: '#202320', a: pk }); txt('16 OCT · TODAY', fx, fy + fh + 76, { font: `italic 56px ${F.serif}`, fill: K.ink, a: pk }); }
    reelIcon(fx + 270, fy + 250, 200, t * .3, seg(t, h.finder, h.finder + .5));
    const nk = seg(t, h.note, h.note + .4);
    if (nk > 0) {
      ctx.save(); ctx.translate(fx + 590, fy + 280 - (1 - easeOut(nk)) * 300); ctx.rotate(.08);
      rrect(-130, -130, 260, 260, 2, { fill: '#FFE14D' });
      txt('16 Oct', -100, -30, { font: `italic 74px ${F.serif}`, fill: '#1d2c78' }); txt('for: Your Co.', -100, 60, { font: `italic 50px ${F.serif}`, fill: '#1d2c78' });
      ctx.restore();
    }
    ctx.restore();
    if (fk > 0 && pk < 1) {
      const a = (1 - pk) * fk, c = 70;
      for (const [x, y, sx, sy] of [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]]) line([[x + sx * c, y], [x, y], [x, y + sy * c]], K.cream, 5, a);
      txt('● REC', fx + 10, fy - 22, { font: font(F.mono, 24, 700), fill: K.red, a: a * (Math.floor(t * 2) % 2 ? 1 : .4) });
      txt('ISO 400 · 1/125', fx + fw - 10, fy - 22, { font: font(F.mono, 24, 700), fill: K.cream, align: 'right', a });
    }
    if (t > h.shutter && t < h.shutter + .12) R.FX.flash = .9 * (1 - (t - h.shutter) / .12);
    RECT.polaroid = [fx, fy, fw, fh];
    chip('CATCHES: BAIT STOCK', ML, 1404, { k: seg(t, h.tag, h.tag + .3), bg: K.red, fg: K.cream });
    B.hud(t, { tl: HUD_TL, bl: sec(1, 'PHOTO'), br: 'DATE + YOUR NAME IN FRAME' });
  }

  function sDateCode(t) {
    bg(K.blue); const lt = t - S.datecode, h = Hh.datecode;
    index(2, t, S.datecode);
    headline(['DATE', 'CODE.'], 470, h.head, t, { max: 250, dot: K.lime });
    const f = font(F.cond, 420), rk = seg(t, h.roll, h.roll + 1.4);
    const x0 = ML, y0 = 1180;
    if (rk > 0) odometer(0, 2541, rk, x0, y0, f, K.cream);
    const w25 = measure('25', f), w41 = measure('41', f);
    const yk = seg(t, h.yy, h.yy + .3), wk = seg(t, h.ww, h.ww + .3), by = y0 + 40;
    line([[x0 + 6, by], [x0 + 6, by + 24], [x0 + w25 - 6, by + 24], [x0 + w25 - 6, by]], K.lime, 5, yk);
    txt('YEAR · 2025', x0 + 6, by + 80, { font: font(F.mono, 30, 700), fill: K.lime, ls: 3, a: yk });
    line([[x0 + w25 + 6, by], [x0 + w25 + 6, by + 24], [x0 + w25 + w41 - 6, by + 24], [x0 + w25 + w41 - 6, by]], K.lime, 5, wk);
    txt('WEEK · 41', x0 + w25 + 6, by + 80, { font: font(F.mono, 30, 700), fill: K.lime, ls: 3, a: wk });
    txt('D/C · EXAMPLE YYWW · NO D/C FIELD? CHECK LOT', ML, 760, { font: font(F.mono, 26, 700), fill: 'rgba(241,238,230,.8)', ls: 3, a: seg(lt, .8, 1.1) });
    chip('IMPOSSIBLE DATE → RE-MARKED?', ML, 1400, { k: seg(t, h.warn, h.warn + .3), bg: K.red, fg: K.cream });
    B.hud(t, { tl: HUD_TL, bl: sec(2, 'DATE CODE'), br: 'SAME LOT ACROSS REELS?' });
  }

  function sLabel(t) {
    bg(K.cream); const lt = t - S.label, h = Hh.label;
    index(3, t, S.label, false);
    headline(['LABEL', '= MAKER.'], 470, h.head, t, { col: K.ink, max: 250, keyLine: 1, key: K.blue });
    const r = labelCard(ML, 760, CW, seg(t, h.card, h.card + .5));
    if (r) {
      const items = [['pn', 'P/N'], ['qty', 'QTY'], ['lot', 'LOT']];
      let x = ML;
      items.forEach(([f, name], i) => {
        const p = seg(t, h.locks[i], h.locks[i] + .5);
        lockBox(r[f], p);
        x += chip(`${name}  ✓`, x, 760 + r.h + 70, { k: seg(t, h.locks[i] + .45, h.locks[i] + .75), bg: K.ink, fg: K.lime }) + 14;
      });
    }
    chip('NOT SURE? ASK THE MAKER OR AN AUTHORIZED DISTRIBUTOR', ML, 1400 - 8, { k: seg(t, h.maker, h.maker + .3), bg: K.blue, fg: K.cream, font: font(F.mono, 21, 700), ls: 2 });
    B.hud(t, { dark: false, tl: HUD_TL, bl: sec(3, 'LABEL'), br: 'EXAMPLE: ECIA FORMAT · JP MAKERS DIFFER', brackets: false });
  }

  function sPaper(t) {
    bg(K.ink); const lt = t - S.paper, h = Hh.paper;
    index(4, t, S.paper);
    headline(['PAPER', 'TRAIL.'], 470, h.head, t, { max: 250, dot: K.lime });
    const ck = seg(t, h.cards, h.cards + .5), match = t > h.match;
    // CoC
    const ax = ML, ay = 700 + (1 - easeOut(ck)) * 80, aw = 600, ah = 560;
    if (ck > 0) {
      rrect(ax, ay, aw, ah, 6, { fill: K.cream, a: ck });
      txt('CERTIFICATE OF', ax + 34, ay + 66, { font: font(F.wide, 34), fill: K.ink, a: ck }); txt('CONFORMANCE', ax + 34, ay + 108, { font: font(F.wide, 34), fill: K.ink, a: ck });
      const rows = [['PART NO.', 'CC0805X7R106K250'], ['QTY', '4000 PCS'], ['LOT NO.', LOT], ['D/C', DC]];
      rows.forEach(([k2, v2], i) => {
        const y = ay + 180 + i * 56, on = i === 2 && match;
        if (on) rrect(ax + 22, y - 38, aw - 44, 52, 4, { fill: K.lime });
        txt(k2, ax + 34, y, { font: font(F.mono, 24, 700), fill: '#6b6f69', a: ck }); txt(v2, ax + 220, y, { font: font(F.mono, 26, 700), fill: K.ink, a: ck });
      });
      for (let i = 0; i < 4; i++) redacted(ax + 34, ay + 420 + i * 26, 380 - i * 40, 12, 40 + i, '#bdbfb8', ck);
      circle(ax + aw - 90, ay + ah - 90, 56, { stroke: K.red, lw: 5, a: ck }); txt('QA', ax + aw - 90, ay + ah - 80, { font: font(F.wide, 30), fill: K.red, align: 'center', a: ck });
    }
    // 料盘标签上的 LOT
    const bx = 440, by = 1150 - (1 - easeOut(seg(t, h.cards + .25, h.cards + .75))) * 60, bw = 560, bh = 200, bk = seg(t, h.cards + .25, h.cards + .75);
    if (bk > 0) {
      rrect(bx, by, bw, bh, 8, { fill: '#FBFAF6', a: bk }); rrect(bx, by, bw, bh, 8, { stroke: K.blue, lw: 6, a: bk });
      txt('REEL LABEL', bx + 30, by + 50, { font: font(F.mono, 22, 700), fill: '#6b6f69', ls: 3, a: bk });
      if (match) rrect(bx + 18, by + 72, bw - 36, 56, 4, { fill: K.lime });
      txt(`(1T) LOT  ${LOT}`, bx + 30, by + 112, { font: font(F.mono, 30, 700), fill: K.ink, a: bk });
      barcode(bx + 30, by + 140, 380, 36, 13);
    }
    const p0 = [ax + aw - 30, ay + 180 + 2 * 56 - 12], p1 = [bx + 20, by + 100];
    thread(p0, p1, easeOut(seg(t, h.thread, h.match)), K.lime, 6, 160);
    if (match) { const mk = seg(t, h.match, h.match + .3); circle(p1[0], p1[1], 16 * backOut(mk), { fill: K.lime }); circle(p0[0], p0[1], 16 * backOut(mk), { fill: K.lime }); }
    RECT.matchDot = p1;
    chip('✓ SAME LOT', ML, 1330, { k: seg(t, h.match + .2, h.match + .5), bg: K.lime, fg: K.ink });
    chip('NO PAPER TRAIL = RED FLAG', ML, 1400, { k: seg(t, h.flag, h.flag + .3), bg: K.red, fg: K.cream });
    B.hud(t, { tl: HUD_TL, bl: sec(4, 'PAPER TRAIL'), br: 'CoC + PURCHASE HISTORY' });
  }

  function sTeardown(t) {
    bg(K.cream); const lt = t - S.teardown, h = Hh.teardown;
    index(5, t, S.teardown, false);
    headline(['OPEN', 'IT UP.'], 470, h.head, t, { col: K.ink, max: 230, dot: K.blue });
    chip('THIRD-PARTY LAB · X-RAY · DECAP', ML, 780, { k: seg(t, h.chip, h.chip + .3), bg: K.ink, fg: K.cream, font: font(F.mono, 22, 700) });
    const ap = backOut(seg(t, S.teardown, S.teardown + .5)), lf = easeOut(seg(t, h.lift, h.lift + .8)), xr = seg(t, h.xray, h.xray + .5) * (1 - seg(t, h.explode + .6, h.explode + 1.1));
    const ex = ease(seg(t, h.explode, h.explode + 1.3));
    const s = lerp(1.0, .5, ease(seg(t, h.explode - .3, h.explode + .8))) * ap;
    mlcc.pose({ x: 0, y: lerp(-.95, -.7, lf), s, rx: lerp(.5, .38, ex), ry: lerp(t * .9, -.42, ease(seg(t, h.xray, h.explode + .4))) , rz: 0, explode: ex, xray: xr });
    // 柔和投影
    const sy = 1180 + 140 * (1 - lf);
    R.ctx.save(); R.ctx.globalAlpha = .18 * ap; R.ctx.fillStyle = K.ink; R.ctx.beginPath(); R.ctx.ellipse(W / 2, 1290, 300 * s * (1 + ex * .8), 34, 0, 0, TAU); R.ctx.fill(); R.ctx.restore();
    glShot(mlcc.render());
    if (xr > .2) txt('X-RAY', W / 2, 820, { font: font(F.mono, 26, 700), fill: K.blue, ls: 8, align: 'center', a: xr });
    // 引线标注
    const labels = [['Sn', '01  TIN PLATING', ML, 900], ['Ni', '02  NICKEL BARRIER', ML, 950], ['Cu', '03  COPPER TERMINATION', ML, 1335], ['core', '04  BaTiO₃ + Ni ELECTRODES', 560, 900]];
    labels.forEach(([part, name, lx, ly], i) => {
      const p = seg(t, h.labels[i], h.labels[i] + .6); if (p <= 0) return;
      const [px, py] = mlcc.screen(part), lp = easeOut(p);
      circle(px, py, 9 * lp, { fill: K.ink }); circle(px, py, 18 * lp, { stroke: K.ink, lw: 2 });
      const tx = lx + 10, ty = ly - 10;
      line([[px, py], [lerp(px, tx + 10, lp), lerp(py, ty + 18, lp)]], K.ink, 3);
      txt(name, lx, ly, { font: font(F.mono, 26, 700), fill: K.ink, ls: 2, a: seg(p, .4, 1) });
    });
    chip('REAL STOCK SAYS YES.', ML, 1410, { k: seg(t, h.yes, h.yes + .3), bg: K.lime, fg: K.ink });
    B.hud(t, { dark: false, tl: HUD_TL, bl: sec(5, 'LAB TEST'), br: 'TYPICAL STRUCTURE · SCHEMATIC', brackets: false });
  }

  function sRecap(t) {
    bg(K.lime); const lt = t - S.recap, h = Hh.recap;
    tape(t, 640, -.13, K.ink, K.cream, ['PHOTO', 'DATE CODE', 'LABEL', 'PAPER TRAIL', 'LAB TEST'], 260, -1, seg(t, h.tapes, h.tapes + .7));
    tape(t, 900, .1, K.cream, K.ink, ['PHOTO', 'DATE CODE', 'LABEL', 'PAPER TRAIL', 'LAB TEST'], 230, 1, seg(t, h.tapes + .15, h.tapes + .85));
    const vk = seg(t, h.verified, h.verified + .3);
    if (vk > 0) {
      R.ctx.fillStyle = K.ink; R.ctx.fillRect(0, 1110, W * easeOut(vk), 260);
      stackWord('VERIFIED.', W / 2, 1300, font(F.wide, fit('VERIFIED.', F.wide, CW, 170)), h.verified + .1, t, { align: 'center', fill: K.lime, echo: 0 });
    }
    B.hud(t, { dark: false, tl: HUD_TL, bl: sec(5, 'RECAP'), br: 'SAVE THIS FOR YOUR NEXT URGENT ORDER', brackets: false });
  }

  function sEnd(t) {
    const lt = t - S.end, h = Hh.end;
    B.endCard(t, S.end + .1, { sources: ['TrendForce MLCC Market Bulletin, 2026-08-12', 'Fusion Worldwide Greensheet, 2026-08'] });
    B.hud(t, { tl: HUD_TL, br: 'SOURCES IN CAPTION', k: seg(lt, .5, 1) });
    if (t > h.glitch) { const g = seg(t, h.glitch, h.dot); R.FX.slice = g; R.FX.split = .02 * g; R.FX.seed = Math.floor(t * 30); }
    if (t > h.dot) { const k = seg(t, h.dot, h.dot + .25); bg(K.ink); circle(W / 2, H / 2, lerp(60, 4, easeIn(k)) * (1 - seg(t, C.dur - .2, C.dur)), { fill: K.lime }); R.FX.slice = 0; R.FX.split = 0; }
  }

  const SCENES = [[S.open, sOpen, 'open'], [S.alloc, sAlloc, 'alloc'], [S.ddr5, sDdr5, 'ddr5'], [S.photo, sPhoto, 'photo'], [S.datecode, sDateCode, 'datecode'],
    [S.label, sLabel, 'label'], [S.paper, sPaper, 'paper'], [S.teardown, sTeardown, 'teardown'], [S.recap, sRecap, 'recap'], [S.end, sEnd, 'end']];
  const TR = {
    alloc: [.55, (k, A, B, g) => R.trIris(RECT.openChip ? RECT.openChip[0] + RECT.openChip[2] / 2 : W / 2, 1400, K.ink)(k, A, B, g)],
    ddr5: [.5, R.trPush(0, 1)],
    datecode: [.55, R.trZoom(() => RECT.polaroid || [120, 800, 840, 600])],
    label: [.55, R.trSlats(8)],
    paper: [.5, R.trPush(1, 0)],
    teardown: [.6, (k, A, B, g) => R.trIris((RECT.matchDot || [W / 2, 1200])[0], (RECT.matchDot || [W / 2, 1200])[1], K.lime)(k, A, B, g)],
    recap: [.6, R.trGrid(9, 16, K.ink)],
  };
  R.run(SCENES, TR);
}
