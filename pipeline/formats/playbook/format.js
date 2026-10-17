// Buyer's Playbook 栏目的固定格式：每周五一期，讲一个可以直接照做的采购方法或清单。说明见 FORMAT.md。
// 场景：open（钩子：消息气泡 + 大问题）→ intro（LEO 胸牌，频道统一）→ why（为什么是现在：一个数字）
//      → step × 3–5（每步一种画面：photo / doc / label / code / compare）→ recap（回顾清单 + 盖章）→ outro（频道统一片尾）。
// 和另外两个栏目不同，step 会重复出现，所以时间按场景序号取（不是按 type）。
// 栏目标识：荧光绿目标框"锁定"；声音标识是锁定的咔嗒声 + 两声拨弦。
import { createReel, K, F, LAY, W, H, TAU, clamp, lerp, seg, easeOut, easeIn, easeInOut, expoOut, backOut, hash, font } from '/pipeline/reel/engine.js';
import { createBrand } from '/pipeline/reel/brand.js';
import { cues } from './cues.mjs';

const PAPER = '#ECE8DD';

export default async function (EP, TL) {
  const C = cues(EP, TL), at = C.at;
  const SC = EP.scenes, N = SC.length, stepIdx = SC.map((s, i) => s.type === 'step' ? i : -1).filter(i => i >= 0);
  const first = type => SC.findIndex(s => s.type === type);
  EP.chapters = [['OPEN', 0, C.S[stepIdx[0] ?? first('recap')]]].concat(stepIdx.map((i, j) => [String(j + 1).padStart(2, '0'), C.S[i], C.E[i]])).concat([['END', C.S[first('recap')], C.dur]]);
  const R = createReel({ EP, TL });
  const B = createBrand(R, EP, TL);
  const { txt, measure, bg, line, circle, rrect, chip, dropWord, barcode } = R;
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML, g = () => R.ctx;
  const fit = (s, fam, maxW, max) => Math.min(max, Math.floor(max * maxW / measure(s, font(fam, max))));
  const when = (i, o, ln = 'line', fr = 'at') => at(i, o?.[ln] ?? 0, o?.[fr] ?? 0);

  // ---------- 通用元素 ----------
  function grid(col, t, step = 60) { const c = g(); c.save(); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); const off = (t * 6) % step; for (let x = -off; x < W; x += step) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = -off; y < H; y += step) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.restore(); }
  function source(s, k, dark) { if (k > 0 && s) txt('SOURCE  ' + s, ML, 1405, { font: font(F.mono, 19, 500), fill: dark ? 'rgba(241,238,230,.5)' : 'rgba(14,15,14,.55)', ls: 1.5, a: clamp(k * 2) }); }
  function headline(lines, y0, t, t0, o = {}) {
    let y = y0;
    lines.forEach((ln, i) => {
      const size = Math.min(o.max || 230, fit(ln, F.cond, CW, o.max || 230));
      y += i === 0 ? 0 : size * .98;
      const col = o.col || K.cream, isLast = i === lines.length - 1;
      dropWord(ln, ML, y, font(F.cond, size), t0 + i * .18, t, { fill: col, fall: 180, stag: .028, fillAt: ch => (isLast && ch === ln.length - 1 && ln.endsWith('.')) ? (o.dot || K.lime) : (o.keyLine === i ? o.key : col) });
    });
    return y;
  }
  const HUD = (t, dark, o = {}) => B.hud(t, { tl: `BUYER’S PLAYBOOK · ${EP.week || ''}`, br: o.br ?? 'SOURCES IN CAPTION', bl: o.bl, dark, k: o.k ?? 1 });
  function wrap(s, f, maxW) { const words = String(s).split(' '), out = []; let cur = ''; for (const w of words) { const c2 = cur ? cur + ' ' + w : w; if (cur && measure(c2, f) > maxW) { out.push(cur); cur = w; } else cur = c2; } if (cur) out.push(cur); return out; }
  // 目标框：放大旋转进场，收拢锁定（栏目标识）
  function lockBox([x, y, w, h], p, col = K.ink) {
    if (p <= 0) return;
    const e = easeOut(p / .6), cx = x + w / 2, cy = y + h / 2, sc = 1 + (1 - e) * .9, rot = (1 - e) * Math.PI / 4;
    const ww = w * sc + 18, hh = h * sc + 18, c = g(), cl = Math.min(26, ww * .25, hh * .4);
    c.save(); c.translate(cx, cy); c.rotate(rot);
    if (p >= .72) { c.fillStyle = 'rgba(221,245,61,.45)'; c.fillRect(-ww / 2, -hh / 2, ww, hh); }
    c.strokeStyle = p > .6 && p < .72 ? K.red : col; c.lineWidth = 5;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x0 = sx * ww / 2, y0 = sy * hh / 2; c.beginPath(); c.moveTo(x0 - sx * cl, y0); c.lineTo(x0, y0); c.lineTo(x0, y0 - sy * cl); c.stroke(); }
    c.restore();
  }
  function tick(x, y, s, k, col = K.lime) { if (k > 0) line([[x, y], [x + s * .35, y + s * .35], [x + s, y - s * .45]].map(([a, b], i, arr) => i === 0 ? [a, b] : [lerp(arr[0][0], a, clamp(k * 1.6)), lerp(arr[0][1], b, clamp(k * 1.6))]), col, s * .16); }
  function cross(x, y, s, k, col = K.red) { if (k > 0) { line([[x, y], [x + s * k, y + s * k]], col, s * .16); if (k > .5) line([[x + s, y], [x + s - s * seg(k, .5, 1), y + s * seg(k, .5, 1)]], col, s * .16); } }

  // ---------- 示意物：料盘、拍立得、单据、标签 ----------
  function reel(cx, cy, r, rot, k) {
    if (k <= 0) return; const c = g(); c.save(); c.globalAlpha = clamp(k * 2); c.translate(cx, cy); c.rotate(rot);
    circle(0, 0, r, { fill: '#e9eef0' }); circle(0, 0, r, { stroke: '#b9c1c5', lw: 3 });
    for (let i = 0; i < 4; i++) { const a0 = i * TAU / 4 + .3; c.beginPath(); c.arc(0, 0, r * .86, a0, a0 + .95); c.arc(0, 0, r * .42, a0 + .95, a0, true); c.closePath(); c.fillStyle = '#3a3f42'; c.fill(); }
    circle(0, 0, r * .3, { fill: '#cfd6d9' }); circle(0, 0, r * .11, { fill: '#3a3f42' });
    c.restore();
  }
  function visPhoto(v, i, t, dark) {
    const t0 = at(i, 0, .15), tShut = at(i, v.shutterLine ?? 0, v.shutterAt ?? .75), c = g();
    const pk = easeOut(seg(t, tShut + .2, tShut + .9)), fk = seg(t, t0, t0 + .3), fx = 150, fy = 760, fw = 780, fh = 500, cx = fx + fw / 2, cy = fy + fh / 2;
    c.save(); c.translate(cx, cy); c.rotate(-.06 * pk); c.scale(1 - .12 * pk, 1 - .12 * pk); c.translate(-cx, -cy);
    if (pk > 0) { rrect(fx - 26, fy - 26, fw + 52, fh + 130, 4, { fill: K.cream, a: pk }); rrect(fx, fy, fw, fh, 0, { fill: '#202320', a: pk }); txt(v.caption || '', fx, fy + fh + 76, { font: `italic 56px ${F.serif}`, fill: K.ink, a: pk }); }
    reel(fx + 270, fy + 250, 200, t * .3, seg(t, t0, t0 + .5));
    const nk = seg(t, t0 + .5, t0 + .9);
    if (nk > 0 && v.note) { c.save(); c.translate(fx + 590, fy + 280 - (1 - easeOut(nk)) * 300); c.rotate(.08); rrect(-130, -130, 260, 260, 2, { fill: '#FFE14D' }); v.note.forEach((s, j) => txt(s, -100, -30 + j * 86, { font: `italic ${j ? 50 : 74}px ${F.serif}`, fill: '#1d2c78' })); c.restore(); }
    c.restore();
    if (fk > 0 && pk < 1) { const a = (1 - pk) * fk, cl = 70; for (const [x, y, sx, sy] of [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]]) line([[x + sx * cl, y], [x, y], [x, y + sy * cl]], K.cream, 5, a); txt('● REC', fx + 10, fy - 22, { font: font(F.mono, 24, 700), fill: K.red, a: a * (Math.floor(t * 2) % 2 ? 1 : .4) }); }
    if (t > tShut && t < tShut + .12) R.FX.flash = .9 * (1 - (t - tShut) / .12);
  }
  // 单据：标题 + 若干行，某一行高亮；可选印章
  function visDoc(v, i, t, dark) {
    const t0 = at(i, 0, .2), k = expoOut(seg(t, t0, t0 + .5)), x = ML + 40, y = 720 + (1 - k) * 80, w = CW - 80, rowH = 64, h = 170 + v.rows.length * rowH + 120, c = g();
    if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 1.6); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.shadowOffsetY = 14; rrect(x, y, w, h, 6, { fill: K.cream }); c.restore();
    c.save(); c.globalAlpha = clamp(k * 1.6);
    wrap(v.title, font(F.wide, 34), w - 200).slice(0, 2).forEach((s, j) => txt(s, x + 36, y + 66 + j * 42, { font: font(F.wide, 34), fill: K.ink }));
    const th = at(i, v.hlLine ?? 0, v.hlAt ?? .6), kh = seg(t, th, th + .4);
    v.rows.forEach(([kk, vv], j) => {
      const ry = y + 180 + j * rowH;
      if (j === v.hl && kh > 0) rrect(x + 22, ry - 42, (w - 44) * easeOut(kh), 56, 4, { fill: K.lime });
      txt(kk, x + 36, ry, { font: font(F.mono, 24, 700), fill: '#6b6f69' }); txt(vv, x + 260, ry, { font: font(F.mono, 27, 700), fill: K.ink });
    });
    for (let j = 0; j < 3; j++) R.redacted(x + 36, y + 190 + v.rows.length * rowH + j * 24, 360 - j * 50, 11, 40 + j, '#bdbfb8');
    if (v.stamp) { const ks = backOut(seg(t, th + .3, th + .7)); if (ks > 0) { c.save(); c.translate(x + w - 110, y + h - 100); c.rotate(-.2); c.scale(ks, ks); circle(0, 0, 62, { stroke: K.red, lw: 5 }); txt(v.stamp, 0, 12, { font: font(F.wide, 30), fill: K.red, align: 'center' }); c.restore(); } }
    c.restore();
  }
  // 标签：若干字段，按顺序被目标框锁定
  function visLabel(v, i, t, dark) {
    const t0 = at(i, 0, .15), k = expoOut(seg(t, t0, t0 + .5)), x = ML, y = 740 + (1 - k) * 60, w = CW, rowH = 124, h = 130 + v.rows.length * rowH + 20, c = g();
    if (k <= 0) return;
    c.save(); c.globalAlpha = clamp(k * 2);
    rrect(x, y, w, h, 10, { fill: '#FBFAF6' }); rrect(x, y, w, h, 10, { stroke: K.ink, lw: 3 });
    txt(v.title, x + 28, y + 62, { font: font(F.wide, 34), fill: K.ink }); line([[x + 24, y + 88], [x + w - 24, y + 88]], K.ink, 4);
    const rects = v.rows.map(([kk, vv], j) => { const ry = y + 160 + j * rowH; txt(`${kk}  ${vv}`, x + 28, ry, { font: font(F.mono, 30, 700), fill: K.ink }); barcode(x + 28, ry + 18, Math.min(520, w - 320), 34, 11 + j); return [x + 18, ry - 36, measure(`${kk}  ${vv}`, font(F.mono, 30, 700)) + 20, 48]; });
    const qx = x + w - 240, qy = y + 120, qs = 200, n = 20, cs = qs / n; c.fillStyle = K.ink; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (hash(a * 31 + b * 7 + 5) > .52) c.fillRect(qx + a * cs, qy + b * cs, cs, cs);
    c.restore();
    const tl = at(i, v.lockLine ?? 0, v.lockAt ?? .45);
    (v.locks || []).forEach((j, n2) => { if (rects[j]) lockBox(rects[j], seg(t, tl + n2 * .55, tl + n2 * .55 + .55)); });
  }
  // 编码拆解：一个大编码，分段标注含义
  function visCode(v, i, t, dark) {
    const t0 = at(i, 0, .3), f = font(F.cond, 380), x0 = ML, y0 = 1120, rk = seg(t, t0, t0 + 1.2);
    if (rk <= 0) return;
    const shown = v.code.split('').map((ch, j) => /\d/.test(ch) && rk < 1 - j * .08 ? String(Math.floor(hash(j * 13 + Math.floor(t * 20)) * 10)) : ch).join('');
    txt(shown, x0, y0, { font: f, fill: dark ? K.cream : K.ink });
    let xx = x0;
    (v.parts || []).forEach(([seg2, label], j) => {
      const w = measure(seg2, f), tk = at(i, v.partsLine ?? 0, (v.partsAt ?? .7) + j * .08), kk = seg(t, tk, tk + .3), by = y0 + 40;
      line([[xx + 6, by], [xx + 6, by + 24], [xx + w - 6, by + 24], [xx + w - 6, by]], K.lime, 5, kk);
      txt(label, xx + 6, by + 80, { font: font(F.mono, 28, 700), fill: K.lime, ls: 3, a: kk });
      xx += w;
    });
    if (v.caption) txt(v.caption, ML, 760, { font: font(F.mono, 26, 700), fill: dark ? 'rgba(241,238,230,.8)' : 'rgba(14,15,14,.7)', ls: 3, a: seg(t, t0, t0 + .3) });
  }
  // 对比：可以 vs 不行
  function visCompare(v, i, t, dark) {
    const cols = [[v.good, K.lime, true], [v.bad, K.red, false]], w = (CW - 30) / 2;
    cols.forEach(([col, tone, ok], j) => {
      if (!col) return;
      const tj = at(i, col.line ?? j, col.at ?? .2), k = expoOut(seg(t, tj, tj + .4)), x = ML + j * (w + 30), y = 770;
      if (k <= 0) return;
      const c = g(); c.save(); c.globalAlpha = clamp(k * 1.6);
      rrect(x, y, w, 540, 10, { fill: dark ? 'rgba(241,238,230,.06)' : '#FFFFFF' }); rrect(x, y, w, 8, 0, { fill: tone });
      txt(col.label, x + 28, y + 70, { font: font(F.cond, 56), fill: tone === K.lime && !dark ? K.ink : tone });
      c.restore();
      col.items.forEach((s, n2) => {
        const ki = seg(t, tj + .25 + n2 * .18, tj + .5 + n2 * .18), yy = y + 150 + n2 * 110;
        if (ok) tick(x + 28, yy - 4, 36, ki, tone === K.lime && !dark ? K.ink : tone); else cross(x + 28, yy - 30, 32, ki, tone);
        wrap(s, font(F.sans, 32, 600), w - 110).slice(0, 2).forEach((l, m) => txt(l, x + 88, yy + m * 38, { font: font(F.sans, 32, 600), fill: dark ? K.cream : K.ink, a: ki }));
      });
    });
  }
  const VIS = { photo: visPhoto, doc: visDoc, label: visLabel, code: visCode, compare: visCompare };

  // =================== 场景 ===================
  function sOpen(i) {
    return t => {
      const v = SC[i].visual, s0 = C.S[i], c = g();
      bg(K.ink); grid('rgba(241,238,230,.035)', t);
      // 消息气泡
      if (v.bubble) {
        const kb = backOut(seg(t, s0 + .1, s0 + .5)), bx = ML, by = 340, f = font(F.sans, 46, 700), tw = Math.min(CW - 60, measure(v.bubble.text, f) + 70);
        if (kb > 0) {
          c.save(); c.translate(bx, by + 60); c.scale(kb, kb); c.translate(-bx, -(by + 60));
          rrect(bx, by, tw, 140, 26, { fill: 'rgba(241,238,230,.1)' });
          txt(`${v.bubble.from}  ·  ${v.bubble.time || ''}`, bx + 34, by + 46, { font: font(F.mono, 20, 700), fill: 'rgba(241,238,230,.5)', ls: 3 });
          const n = Math.floor(v.bubble.text.length * seg(t, at(i, 0, .05), at(i, 0, .7)));
          txt(v.bubble.text.slice(0, n), bx + 34, by + 106, { font: f, fill: K.cream });
          c.restore();
        }
      }
      const t1 = at(i, Math.min(1, (SC[i].lines || []).length - 1), 0);
      const big = v.big || [], sizes = big.map(s => fit(s, F.cond, CW, 260));
      let y = 720;
      big.forEach((s, j) => {
        y += j === 0 ? sizes[0] * .7 : sizes[j] * .95;
        const last = j === big.length - 1;
        dropWord(s, ML, y, font(F.cond, sizes[j]), t1 + j * .15, t, { fill: K.cream, fall: 200, stag: .03, fillAt: ch => last && v.accentLast !== false ? (ch === s.length - 1 && s.endsWith('.') ? K.lime : K.red) : undefined });
      });
      let x = ML;
      (v.chips || []).forEach((s, j) => { x += chip(s, x, 1330, { k: seg(t, at(i, Math.min(1, (SC[i].lines || []).length - 1), .65) + j * .12, at(i, Math.min(1, (SC[i].lines || []).length - 1), .65) + j * .12 + .3), bg: j ? K.cream : K.lime, fg: K.ink, font: font(F.mono, 24, 700), h: 52 }) + 14; });
      source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
      HUD(t, true, { k: seg(t, s0, s0 + .4) });
      R.FX.grain = .05; R.FX.vign = .4;
    };
  }
  function sIntro(i) { return t => { B.intro(t, C.S[i], C.E[i]); R.FX.grain = .05; R.FX.vign = .4; }; }
  function sWhy(i) {
    return t => {
      const v = SC[i].visual, s0 = C.S[i];
      bg(K.lime); grid('rgba(14,15,14,.06)', t);
      chip(v.kicker || 'WHY NOW', ML, 300, { k: seg(t, s0 + .1, s0 + .4), bg: K.ink, fg: K.lime, font: font(F.mono, 23, 700), ls: 3, h: 50 });
      const tv = at(i, v.valueLine ?? 0, v.valueAt ?? .3), kv = seg(t, tv, tv + 1.2), f = font(F.cond, 420);
      const val = String(v.value), n = parseFloat(val.replace(/[^\d.]/g, '')) || 0, shown = kv >= 1 ? val : val.replace(/[\d.,]+/, String(Math.round(n * easeOut(kv))));
      if (kv > 0) { const px = v.prefix || '', sx = v.suffix || ''; let x = ML; txt(px, x, 860, { font: font(F.cond, 260), fill: K.ink }); x += measure(px, font(F.cond, 260)) + 10; txt(shown, x, 860, { font: f, fill: v.tone === 'alert' ? K.red : K.ink }); x += measure(val, f) + 10; txt(sx, x, 860, { font: font(F.cond, 260), fill: K.ink }); }
      wrap(v.label || '', font(F.cond, 76), CW).slice(0, 3).forEach((s, j) => txt(s, ML, 1000 + j * 80, { font: font(F.cond, 76), fill: K.ink, a: seg(t, tv + .6 + j * .1, tv + .9 + j * .1) }));
      if (v.note) txt(v.note, ML, 1290, { font: font(F.mono, 25, 700), fill: 'rgba(14,15,14,.7)', ls: 2, a: seg(t, at(i, v.noteLine ?? 1, 0), at(i, v.noteLine ?? 1, 0) + .3) });
      source(v.source, seg(t, s0 + 1, s0 + 1.4), false);
      HUD(t, false);
      R.FX.grain = .035; R.FX.vign = .15;
    };
  }
  const STEP_BG = [[K.ink, true], [K.blue, true], [PAPER, false], [K.ink, true], [PAPER, false]];
  function sStep(i, n) {
    return t => {
      const v = SC[i].visual, s0 = C.S[i], [bgc, dark] = STEP_BG[n % STEP_BG.length];
      bg(bgc); grid(dark ? 'rgba(241,238,230,.035)' : 'rgba(14,15,14,.05)', t);
      chip(`STEP ${String(v.num ?? n + 1).padStart(2, '0')} / ${String(v.total ?? stepIdx.length).padStart(2, '0')}`, ML, 196, { k: seg(t, s0, s0 + .3), bg: dark ? K.lime : K.ink, fg: dark ? K.ink : K.lime });
      headline(v.title || [], 470, t, s0 + .08, { col: dark ? K.cream : K.ink, max: 230, dot: dark ? K.lime : K.blue, keyLine: 1, key: dark ? K.lime : K.blue });
      (VIS[v.visual?.kind] || (() => {}))(v.visual || {}, i, t, dark);
      if (v.tag) { const tt = at(i, v.tagLine ?? 1, v.tagAt ?? 0); chip(v.tag, ML, 1404, { k: seg(t, tt, tt + .3), bg: v.tagTone === 'ok' ? K.lime : K.red, fg: v.tagTone === 'ok' ? K.ink : K.cream }); }
      source(v.source, seg(t, s0 + 1, s0 + 1.4), dark);
      HUD(t, dark, { bl: `■ ${String(n + 1).padStart(2, '0')} / ${String(stepIdx.length).padStart(2, '0')}   ${(v.short || '').toUpperCase()}`, br: v.note || 'SOURCES IN CAPTION' });
      R.FX.grain = dark ? .05 : .035; R.FX.vign = dark ? .4 : .18;
    };
  }
  function sRecap(i) {
    return t => {
      const v = SC[i].visual, s0 = C.S[i], e0 = C.E[i], c = g();
      bg(PAPER); grid('rgba(14,15,14,.05)', t);
      headline(v.heading || ['BEFORE', 'YOU PAY.'], 400, t, s0 + .05, { col: K.ink, max: 200, dot: K.red });
      const items = v.items || [], span = Math.max(.5, (C.LE[i]?.[0] ?? e0) - at(i, 0, .1));
      items.forEach((s, j) => {
        const tj = at(i, 0, .1) + span * j / items.length, k = seg(t, tj, tj + .3), y = 760 + j * 106;
        rrect(ML, y - 60, 76, 76, 8, { stroke: K.ink, lw: 4, a: clamp(k * 3) });
        tick(ML + 14, y - 22, 52, seg(t, tj + .15, tj + .45), K.ink);
        txt(s, ML + 110, y, { font: font(F.cond, 64), fill: K.ink, a: clamp(k * 2) });
      });
      if (v.stamp) {
        const ts = at(i, v.stampLine ?? 0, v.stampAt ?? .85), ks = backOut(seg(t, ts, ts + .4));
        if (ks > 0) { c.save(); c.translate(760, 1290); c.rotate(-.12); c.scale(ks * 1.0, ks * 1.0); rrect(-230, -70, 460, 140, 10, { stroke: K.red, lw: 8 }); txt(v.stamp, 0, 34, { font: font(F.cond, 96), fill: K.red, align: 'center' }); c.restore(); }
        if (t > ts && t < ts + .08) R.FX.flash = .15;
      }
      HUD(t, false, { br: v.br || 'SAVE THIS FOR YOUR NEXT URGENT ORDER' });
      R.FX.grain = .035; R.FX.vign = .18;
    };
  }
  function sOutro(i) {
    return t => {
      const v = SC[i].visual || {}, s0 = C.S[i], e0 = C.E[i];
      B.endCard(t, s0, { sources: v.sources, cta: v.cta });
      HUD(t, true, { k: 1 - seg(t, e0 - .6, e0) });
      R.FX.grain = .05; R.FX.vign = .45;
      const fade = seg(t, e0 - .5, e0); if (fade > 0) { const c = g(); c.save(); c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); c.restore(); }
    };
  }

  const MK = { open: sOpen, intro: sIntro, why: sWhy, recap: sRecap, outro: sOutro };
  const scenes = SC.map((s, i) => [C.S[i], s.type === 'step' ? sStep(i, stepIdx.indexOf(i)) : MK[s.type](i), 'k' + i]);
  const TRL = [() => R.trWipe(K.lime), () => R.trPush(0, 1), () => R.trSlats(8), () => R.trPush(1, 0), () => R.trIris(W / 2, 900, K.lime), () => R.trGrid(9, 16, K.lime)];
  const TR = {}; SC.forEach((s, i) => { if (i > 0) TR['k' + i] = [.5, TRL[(i - 1) % TRL.length]()]; });
  R.run(scenes, TR);
}
