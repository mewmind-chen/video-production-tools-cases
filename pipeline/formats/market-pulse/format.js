// Market Pulse 栏目的固定格式：每周三一期，结构和画面固定，每期只换 episode.json 里的数据和台词。
// 场景顺序：open（钩子数字）→ intro（LEO 胸牌自我介绍，频道统一）→ spot（现货报价）→ contract（合约价）→ street（市场声音）→ actions（本周行动）→ outro。
// 每个场景读 scene.visual；元素出现的时间用 "line"（第几句台词）和 "at"（这句进行到几成）指定。说明见 FORMAT.md。
import { createReel, K, F, LAY, W, H, BEAT, clamp, lerp, seg, ease, easeOut, easeIn, easeInOut, expoOut, ioExpo, backOut, hash, TAU, font } from '/pipeline/reel/engine.js';
import { cues, ORDER } from './cues.mjs';
import { createBrand } from '/pipeline/reel/brand.js';

const PAPER = '#ECE8DD';
const fmtN = n => Math.round(n).toLocaleString('en-US');

export default async function (EP, TL) {
  const C = cues(EP, TL), S = C.S, E = C.E, at = C.at;
  const V = Object.fromEntries(EP.scenes.map(s => [s.type, s.visual || {}]));
  EP.chapters = [['OPEN', 0, S.spot], ['SPOT', S.spot, S.contract], ['CONTRACT', S.contract, S.street], ['STREET', S.street, S.actions], ['ACTIONS', S.actions, S.outro], ['END', S.outro, C.dur]];
  const R = createReel({ EP, TL });
  const B = createBrand(R, EP, TL);
  const { txt, measure, bg, line, circle, rrect, chip, dropWord, hud } = R;
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML;
  const g = () => R.ctx;
  const fit = (s, fam, maxW, max) => Math.min(max, Math.floor(max * maxW / measure(s, font(fam, max))));
  const when = (k, o) => at(k, o.line ?? 0, o.at ?? 0);

  // ---------- 栏目通用元素 ----------
  function grid(col, t, step = 60) {
    const c = g(); c.save(); c.strokeStyle = col; c.lineWidth = 1; c.beginPath();
    const off = (t * 6) % step;
    for (let x = -off; x < W; x += step) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = -off; y < H; y += step) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke(); c.restore();
  }
  // 顶部行情条：本期的关键数字循环滚动，每期从 EP.ticker 读
  function ticker(t, dark, k = 1) {
    if (k <= 0 || !EP.ticker) return;
    const y = 196, h = 50, c = g(), f1 = font(F.mono, 21, 500), f2 = font(F.mono, 21, 700);
    c.save(); c.globalAlpha = k;
    c.fillStyle = dark ? 'rgba(241,238,230,.07)' : 'rgba(14,15,14,.06)'; c.fillRect(0, y, W, h);
    c.fillStyle = dark ? 'rgba(241,238,230,.18)' : 'rgba(14,15,14,.18)'; c.fillRect(0, y, W, 1.5); c.fillRect(0, y + h - 1.5, W, 1.5);
    const items = EP.ticker.map(([a, b, d]) => ({ a, b, d, w: measure(a, f1, 2) + measure(b, f2, 2) + 110 }));
    const unit = items.reduce((s, i) => s + i.w, 0), off = (t * 70) % unit;
    let x = -off;
    while (x < W) for (const it of items) {
      if (x + it.w > 0 && x < W) {
        txt(it.a, x, y + 33, { font: f1, fill: dark ? 'rgba(241,238,230,.55)' : 'rgba(14,15,14,.55)', ls: 2 });
        const xb = x + measure(it.a, f1, 2) + 18;
        txt(it.b, xb, y + 33, { font: f2, fill: dark ? K.cream : K.ink, ls: 2 });
        const xa = xb + measure(it.b, f2, 2) + 14, up = it.d === 'up';
        c.fillStyle = up ? K.red : '#2fae5f'; c.beginPath();
        if (up) { c.moveTo(xa, y + 32); c.lineTo(xa + 16, y + 32); c.lineTo(xa + 8, y + 18); } else { c.moveTo(xa, y + 18); c.lineTo(xa + 16, y + 18); c.lineTo(xa + 8, y + 32); }
        c.fill();
      }
      x += it.w;
    }
    c.restore();
  }
  function source(s, k, dark) { if (k > 0 && s) txt('SOURCE  ' + s, ML, 1405, { font: font(F.mono, 19, 500), fill: dark ? 'rgba(241,238,230,.5)' : 'rgba(14,15,14,.55)', ls: 1.5, a: clamp(k * 2) }); }
  function kicker(s, t, t0, dark) { chip(s, ML, 300, { k: seg(t, t0, t0 + .3), bg: dark ? K.lime : K.ink, fg: dark ? K.ink : K.lime, font: font(F.mono, 23, 700), ls: 2.5, h: 50 }); }
  function title(s, y, t, t0, o = {}) {
    const size = o.size || fit(s, F.cond, o.w || CW, o.max || 230);
    dropWord(s, o.x ?? ML, y, font(F.cond, size), t0, t, { fill: o.col || K.cream, fall: 160, stag: .025, fillAt: i => (i === s.length - 1 && s.endsWith('.')) ? (o.dot || K.red) : undefined });
    return size;
  }
  const HUD = (t, dark, k = 1) => B.hud(t, { tl: `MARKET PULSE · ${EP.week || ''}`, br: 'SOURCES IN CAPTION', dark, k });
  function wrap(s, f, maxW) {
    const words = s.split(' '), out = []; let cur = '';
    for (const w of words) { const c2 = cur ? cur + ' ' + w : w; if (cur && measure(c2, f) > maxW) { out.push(cur); cur = w; } else cur = c2; }
    if (cur) out.push(cur); return out;
  }

  // 心电图线：栏目标识。x0→x1 画一段，beat 是尖峰位置（0–1）
  function ecg(x0, x1, y, amp, k, col, lw = 6, beat = .55, head = true) {
    const n = 220, pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, d = u - beat;
      let v = 0;
      v += .12 * Math.exp(-Math.pow((d + .09) / .018, 2));               // P 波
      v -= .22 * Math.exp(-Math.pow((d + .018) / .006, 2));               // Q
      v += 1.0 * Math.exp(-Math.pow(d / .008, 2));                        // R 尖峰
      v -= .38 * Math.exp(-Math.pow((d - .02) / .007, 2));                // S
      v += .2 * Math.exp(-Math.pow((d - .11) / .03, 2));                  // T 波
      pts.push([lerp(x0, x1, u), y - v * amp]);
    }
    const m = Math.max(2, Math.floor(pts.length * clamp(k)));
    line(pts.slice(0, m), col, lw);
    if (head && k > 0 && k < 1) { const [hx, hy] = pts[m - 1]; circle(hx, hy, lw * 1.6, { fill: col }); circle(hx, hy, lw * 4, { fill: col, a: .25 }); }
  }

  // ---------- 产品画法：DDR5 内存条（UDIMM 133.35 × 31.25 mm，按比例；无品牌）----------
  function dimm(cx, cy, w, t, o = {}) {
    const c = g(), s = w / 133.35, h = 31.25 * s, x0 = cx - w / 2, y0 = cy - h / 2;
    const notchX = x0 + 64.5 * s, nW = 1.2 * s, nH = 3.6 * s;
    c.save();
    c.translate(cx, cy); c.rotate(o.rot || 0); c.translate(-cx, -cy);
    // 投影
    c.save(); c.filter = 'blur(26px)'; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x0 + 20, y0 + 40, w - 40, h); c.restore();
    // PCB 外形（侧面卡扣缺口 + 金手指防呆缺口）
    const pcb = new Path2D();
    pcb.moveTo(x0 + 1.5 * s, y0); pcb.lineTo(x0 + w - 1.5 * s, y0); pcb.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + 1.5 * s);
    pcb.lineTo(x0 + w, y0 + 15 * s); pcb.arc(x0 + w, y0 + 17.5 * s, 2.5 * s, -Math.PI / 2, Math.PI / 2, true); pcb.lineTo(x0 + w, y0 + h - 1 * s);
    pcb.lineTo(x0 + w - 1 * s, y0 + h); pcb.lineTo(notchX + nW, y0 + h); pcb.lineTo(notchX + nW, y0 + h - nH); pcb.arc(notchX, y0 + h - nH, nW, 0, Math.PI, true);
    pcb.lineTo(notchX - nW, y0 + h); pcb.lineTo(x0 + 1 * s, y0 + h); pcb.lineTo(x0, y0 + h - 1 * s);
    pcb.lineTo(x0, y0 + 20 * s); pcb.arc(x0, y0 + 17.5 * s, 2.5 * s, Math.PI / 2, -Math.PI / 2, true); pcb.lineTo(x0, y0 + 1.5 * s); pcb.quadraticCurveTo(x0, y0, x0 + 1.5 * s, y0);
    const gr = c.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#24553c'); gr.addColorStop(.6, '#1a4230'); gr.addColorStop(1, '#143525');
    c.fillStyle = gr; c.fill(pcb);
    c.save(); c.clip(pcb);
    // 金手指
    const fy = y0 + h - 4.2 * s;
    const gg = c.createLinearGradient(0, fy, 0, y0 + h); gg.addColorStop(0, '#f3d27a'); gg.addColorStop(.5, '#c99a3b'); gg.addColorStop(1, '#a87a25');
    c.fillStyle = gg;
    for (let px = x0 + 2.4 * s; px < x0 + w - 2.4 * s; px += .85 * s) { if (Math.abs(px - notchX) < 2.2 * s) continue; c.fillRect(px, fy, .5 * s, 4.2 * s); }
    // 丝印走线与零件框
    c.strokeStyle = 'rgba(230,240,230,.18)'; c.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) { const yy = y0 + (22.2 + (i % 3) * .5) * s, xx = x0 + (4 + i * 9.1) * s; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 5 * s, yy); c.lineTo(xx + 6 * s, yy + 1.2 * s); c.stroke(); }
    // 一排 0402 电容
    for (let i = 0; i < 40; i++) {
      const xx = x0 + (5 + i * 3.15) * s, yy = y0 + 20 * s;
      if (xx > x0 + 56 * s && xx < x0 + 77 * s) continue;
      c.fillStyle = '#b08a5a'; c.fillRect(xx, yy, 1.0 * s, .5 * s); c.fillStyle = '#cfd3d6'; c.fillRect(xx, yy, .22 * s, .5 * s); c.fillRect(xx + .78 * s, yy, .22 * s, .5 * s);
    }
    // 8 颗 DRAM 颗粒（FBGA），中间是 PMIC 区
    const chipsX = [6.5, 19.5, 32.5, 45.5, 77, 90, 103, 116];
    chipsX.forEach((mx, i) => {
      const cx2 = x0 + mx * s, cy2 = y0 + 5.5 * s, cw = 10.5 * s, ch = 12.5 * s;
      c.strokeStyle = 'rgba(230,240,230,.3)'; c.lineWidth = 1.5; c.strokeRect(cx2 - 1, cy2 - 1, cw + 2, ch + 2);
      const cg = c.createLinearGradient(cx2, cy2, cx2 + cw * .4, cy2 + ch); cg.addColorStop(0, '#2a2c2e'); cg.addColorStop(1, '#101112');
      c.fillStyle = cg; c.fillRect(cx2, cy2, cw, ch);
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(cx2, cy2, cw, 1.2);
      c.fillStyle = 'rgba(200,200,200,.18)'; for (let r = 0; r < 3; r++) c.fillRect(cx2 + 1.6 * s, cy2 + (3.5 + r * 2.2) * s, (r === 1 ? 5.5 : 7.2) * s, .55 * s);
      circle(cx2 + 1.4 * s, cy2 + 1.4 * s, .45 * s, { fill: 'rgba(255,255,255,.22)' });
    });
    // PMIC、电感、SPD hub
    c.fillStyle = '#17181a'; c.fillRect(x0 + 62 * s, y0 + 7 * s, 5 * s, 5 * s);
    for (const [mx, my] of [[58, 6], [58, 11], [69, 6], [69, 11]]) { c.fillStyle = '#5b5e62'; c.fillRect(x0 + mx * s, y0 + my * s, 3.6 * s, 3.6 * s); c.fillStyle = '#7d8187'; c.fillRect(x0 + (mx + .5) * s, y0 + (my + .5) * s, 2.6 * s, 2.6 * s); }
    c.fillStyle = '#17181a'; c.fillRect(x0 + 63 * s, y0 + 15.5 * s, 3 * s, 3 * s);
    // 规格贴纸（通用写法，无品牌）
    const lx = x0 + 104 * s, ly = y0 + 19 * s;
    c.fillStyle = '#f2f2ee'; c.fillRect(lx, ly, 26 * s, 3.4 * s);
    txt('16GB 1Rx8 DDR5', lx + .8 * s, ly + 2.5 * s, { font: font(F.mono, Math.round(1.9 * s), 700), fill: '#222' });
    // 高光扫过
    if (o.sweep != null) {
      const sx = lerp(x0 - w * .3, x0 + w * 1.3, o.sweep), sg = c.createLinearGradient(sx - 120, 0, sx + 120, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = sg; c.fillRect(x0, y0, w, h);
    }
    c.restore();
    c.restore();
    return { x0, y0, w, h };
  }

  // =================== 场景 ===================
  // ---------- open：一个反常的数字 ----------
  function sOpen(t) {
    const v = V.open, s0 = S.open;
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    ticker(t, true, seg(t, s0 + .1, s0 + .5));
    kicker(v.kicker, t, s0 + .15, true);
    // 旧价 → 新价：第一句后半句开始滚动
    const tRoll = at('open', 0, .48), kRoll = easeInOut(seg(t, tRoll, tRoll + 1.1));
    const pre = v.prefix || '', f0 = font(F.cond, 300);
    const yBig = 700;
    if (t < tRoll) dropWord(pre + fmtN(v.from), ML, yBig, f0, s0 + .25, t, { fill: K.cream, fall: 200, stag: .04 });
    if (t > tRoll) {
      // 旧价缩到左上角并划掉
      const k2 = easeOut(seg(t, tRoll, tRoll + .5)), sOld = pre + fmtN(v.from) + (v.suffix || '');
      const fs = lerp(300, 74, k2), y = lerp(yBig, 430, k2);
      if (k2 >= 1 || kRoll > .2) {
        txt(sOld, ML, 430, { font: font(F.cond, 74), fill: 'rgba(241,238,230,.45)' });
        const w = measure(sOld, font(F.cond, 74)); line([[ML - 6, 404], [ML - 6 + (w + 12) * seg(t, tRoll + .3, tRoll + .6), 404]], K.red, 6);
        txt('ONE YEAR AGO', ML + w + 24, 418, { font: font(F.mono, 22, 700), fill: 'rgba(241,238,230,.45)', ls: 3, a: seg(t, tRoll + .4, tRoll + .7) });
      } else txt(sOld, ML, y, { font: font(F.cond, fs), fill: K.cream });
      const val = lerp(v.from, v.to, kRoll), sNew = pre + fmtN(kRoll < 1 ? Math.round(val / 10) * 10 : v.to);
      const jitter = kRoll > 0 && kRoll < 1 ? (hash(Math.floor(t * 30)) - .5) * 6 : 0;
      txt(sNew, ML + jitter, yBig, { font: f0, fill: K.red, a: seg(t, tRoll, tRoll + .15) });
      if (kRoll >= 1) {
        txt(v.suffix || '', ML + measure(sNew, f0) + 8, yBig - 150, { font: font(F.cond, 140), fill: K.red, a: seg(t, tRoll + 1.1, tRoll + 1.3) });
        const xm = Math.round(v.to / v.from);
        const kk = backOut(seg(t, tRoll + 1.25, tRoll + 1.6));
        if (kk > 0) { const c = g(); c.save(); c.translate(940, 400); c.rotate(-.12); c.scale(kk, kk); circle(0, 0, 76, { fill: K.lime }); txt(`×${xm}`, 0, 26, { font: font(F.cond, 78), fill: K.ink, align: 'center' }); c.restore(); }
      }
    }
    // 产品
    const kP = expoOut(seg(t, s0 + .35, s0 + 1.2));
    if (kP > 0) {
      const c = g(); c.save(); c.globalAlpha = clamp(kP * 1.5);
      dimm(W / 2, 900 + (1 - kP) * 160, 900, t, { rot: -.035 + Math.sin(t * .7) * .006, sweep: seg(t, s0 + 1.1, s0 + 2.4) });
      c.restore();
      txt((v.productLabel || '') + '  ·  ILLUSTRATION', W / 2, 1050, { font: font(F.mono, 20, 700), fill: 'rgba(241,238,230,.5)', ls: 3, align: 'center', a: seg(t, s0 + 1, s0 + 1.4) });
    }
    // 第二句：结论
    const t2 = at('open', 1, 0);
    (v.after || []).forEach((w, i) => title(w, 1195 + i * 140, t, t2 + .15 + i * .55, { size: 150, dot: K.lime }));
    source(v.source, seg(t, t2, t2 + .4), true);
    HUD(t, true, seg(t, s0, s0 + .4));
    R.FX.grain = .05; R.FX.vign = .4;
    if (t > tRoll + 1.08 && t < tRoll + 1.14) { R.FX.flash = .18; R.FX.flashCol = K.red; }
  }

  // ---------- intro：LEO 的胸牌甩进来（频道固定的自我介绍），下方是本栏目的心电图 ----------
  function sIntro(t) {
    const e0 = E.intro;
    B.intro(t, S.intro, e0, { after: (t, k) => ecg(-20, W + 20, 1395, 60, seg(t, S.intro + .6, S.intro + 1.6), K.lime, 4, .5, false) });
    R.FX.grain = .05; R.FX.vign = .4;
  }

  // ---------- spot：现货报价，只画报道过的点，不画连续曲线 ----------
  function sSpot(t) {
    const v = V.spot, s0 = S.spot, c = g();
    bg(PAPER); grid('rgba(14,15,14,.05)', t);
    ticker(t, false);
    kicker('SPOT · ' + (v.kickerTail || 'HUAQIANGBEI'), t, s0 + .1, false);
    title(v.title.join(' '), 470, t, s0 + .15, { col: K.ink, max: 200 });
    const X0 = 190, X1 = 990, YT = 600, YB = 1170, yMax = v.yMax, n = v.months.length - 1;
    const X = x => lerp(X0, X1, x / n), Y = val => lerp(YB, YT, val / yMax);
    const kA = easeOut(seg(t, s0 + .3, s0 + 1.0));
    for (let val = 0; val <= yMax; val += v.yStep) {
      line([[X0, Y(val)], [X0 + (X1 - X0) * kA, Y(val)]], val ? 'rgba(14,15,14,.14)' : K.ink, val ? 1.5 : 3);
      txt((v.unit || '') + fmtN(val), X0 - 18, Y(val) + 8, { font: font(F.mono, 22, 500), fill: 'rgba(14,15,14,.6)', align: 'right', a: kA });
    }
    v.months.forEach((m, i) => txt(m, X(i), YB + 40, { font: font(F.mono, 22, 700), fill: 'rgba(14,15,14,.6)', align: 'center', a: seg(t, s0 + .4 + i * .03, s0 + .6 + i * .03) }));
    (v.years || []).forEach(([i, y]) => { txt(y, X(i) - 10, YB + 78, { font: font(F.mono, 22, 700), fill: K.ink, ls: 2, a: kA }); line([[X(i) - 14, YB + 18], [X(i) - 14, YB + 86]], 'rgba(14,15,14,.35)', 2, kA); });
    // 事件：竖虚线 + 标注
    for (const ev of v.events || []) {
      const te = when('spot', ev), k = seg(t, te, te + .6);
      if (k <= 0) continue;
      const x = X(ev.x);
      line([[x, YB], [x, lerp(YB, YT + 40, easeOut(k))]], K.red, 3, 1, [10, 10]);
      const lines = Array.isArray(ev.label) ? ev.label : [ev.label];
      const f = font(F.mono, 24, 700), wB = Math.max(...lines.map(l => measure(l, f, 2))) + 36;
      const bx = ev.side === 'right' ? Math.min(x + 18, X1 - wB) : Math.max(X0 + 10, x - 18 - wB), by = YT + 30;
      c.save(); c.globalAlpha = clamp(k * 2); rrect(bx, by, wB * easeOut(k), 30 + lines.length * 34, 4, { fill: K.red }); c.restore();
      lines.forEach((l, i) => txt(l, bx + 18, by + 40 + i * 34, { font: f, fill: K.cream, ls: 2, a: seg(k, .4, 1) }));
      // 向下的箭头：一周跌三成
      const ka = seg(t, te + .3, te + 1.0), ya = lerp(YT + 140, YT + 300, easeInOut(ka));
      if (ka > 0) R.arrow(x + 40, YT + 140, x + 40, ya, K.red, 5, 1, 18);
    }
    // 报价点：按时间出现，点与点之间用虚线连，标明不是连续数据
    const pts = v.points.map(p => ({ ...p, t0: when('spot', p) }));
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], k = seg(t, b.t0 - .05, b.t0 + .45);
      if (k <= 0 || t < a.t0) continue;
      const ya = Y(a.v2 != null ? (a.v + a.v2) / 2 : a.v), yb = Y(b.v2 != null ? (b.v + b.v2) / 2 : b.v);
      line([[X(a.x), ya], [lerp(X(a.x), X(b.x), easeInOut(k)), lerp(ya, yb, easeInOut(k))]], 'rgba(14,15,14,.55)', 3, 1, [4, 12]);
    }
    pts.forEach((p, i) => {
      const k = seg(t, p.t0, p.t0 + .4); if (k <= 0) return;
      const x = X(p.x), col = p.hot ? K.red : K.ink;
      let yLab;
      if (p.v2 != null) {
        const ya = Y(p.v), yb = Y(p.v2), kk = easeOut(k);
        line([[x, (ya + yb) / 2 - (ya - yb) / 2 * kk], [x, (ya + yb) / 2 + (ya - yb) / 2 * kk]], col, 10);
        line([[x - 14, yb], [x + 14, yb]], col, 4, kk); line([[x - 14, ya], [x + 14, ya]], col, 4, kk);
        yLab = ya + 46;
      } else {
        const y = Y(p.v);
        circle(x, y, 13 * backOut(k), { fill: col });
        if (p.hot) for (let j = 0; j < 2; j++) { const q = ((t - p.t0) * .9 + j * .5) % 1; circle(x, y, 13 + q * 50, { stroke: K.red, lw: 3, a: (1 - q) * .7 * k }); }
        yLab = y - 30;
      }
      const f = font(F.cond, p.hot ? 64 : 46), w = measure(p.label, f);
      let lx = clamp(x - w / 2, X0 + 10, X1 - w);
      if (p.labelPos === 'left') { lx = x - 26 - w; yLab += 46; }
      if (p.labelPos === 'right') { lx = x + 26; yLab += 46; }
      txt(p.label, lx, yLab, { font: f, fill: col, a: seg(k, .3, 1) });
    });
    txt(v.note || '', ML, 1300, { font: font(F.mono, 20, 700), fill: 'rgba(14,15,14,.6)', ls: 2, a: seg(t, s0 + 1, s0 + 1.4) });
    source(v.source, seg(t, s0 + 1.2, s0 + 1.6), false);
    HUD(t, false);
    R.FX.grain = .035; R.FX.vign = .18;
  }

  // ---------- contract：季度涨幅柱 → 叠成台阶（招牌镜头）----------
  function sContract(t) {
    const v = V.contract, s0 = S.contract, c = g();
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    ticker(t, true);
    kicker(v.kicker, t, s0 + .1, true);
    title(v.title.join(' '), 470, t, s0 + .15, { max: 200 });
    const X0 = 150, X1 = 990, YB = 1170, slots = v.bars.length + 1, sw = (X1 - X0) / slots, bw = sw * .66;
    const SX = i => X0 + sw * i + (sw - bw) / 2;
    const tS = at('contract', v.stairsLine ?? 3, v.stairsAt ?? 0);
    const kS = (i) => easeInOut(seg(t, tS + i * .16, tS + i * .16 + .9));
    // 台阶数据：区间中值连乘
    let lvl = 100; const steps = v.bars.map(b => { const mid = (b.lo + b.hi) / 2, prev = lvl; lvl = lvl * (1 + mid / 100); return { prev, inc: lvl - prev, top: lvl, mid }; });
    const pctPx = 5.0, idxPx = 560 / lvl;
    // 底座：上年第四季度 = 100
    const k0 = kS(0);
    if (k0 > 0) {
      rrect(SX(0), YB - 100 * idxPx * k0, bw, 100 * idxPx * k0, 0, { fill: 'rgba(241,238,230,.22)' });
      txt('100', SX(0) + bw / 2, YB - 100 * idxPx * k0 - 16, { font: font(F.mono, 26, 700), fill: K.cream, align: 'center', a: k0 });
      txt(v.base || '', SX(0) + bw / 2, YB + 44, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.6)', align: 'center', a: k0 });
    }
    v.bars.forEach((b, i) => {
      const tb = when('contract', b), kb = backOut(seg(t, tb, tb + .55)); if (kb <= 0 && kS(i + 1) <= 0) return;
      const st = steps[i], ks = kS(i + 1), x = SX(i + 1);
      // A：涨幅柱（高度 ∝ 百分比）；B：叠在上一级之上（灰色是之前的价格，红色是本季涨的部分）
      const hA = st.mid * pctPx * kb, hB = st.inc * idxPx, baseB = st.prev * idxPx;
      const hRed = lerp(hA, hB, ks), lift = baseB * ks, top = YB - lift - hRed;
      if (ks > 0) rrect(x, YB - lift, bw, lift, 0, { fill: 'rgba(241,238,230,.22)' });
      rrect(x, top, bw, hRed, 0, { fill: K.red });
      if (b.forecast) { c.save(); c.beginPath(); c.rect(x, top, bw, hRed); c.clip(); c.strokeStyle = 'rgba(14,15,14,.35)'; c.lineWidth = 5; for (let d = -bw; d < hRed + bw; d += 16) { c.beginPath(); c.moveTo(x, top + d); c.lineTo(x + bw, top + d - bw); c.stroke(); } c.restore(); }
      // 区间：在柱顶画出高低两端
      if (ks < .5 && kb > .5) { const yl = YB - b.lo * pctPx, yh = YB - b.hi * pctPx; line([[x + bw / 2, yl], [x + bw / 2, yh]], K.cream, 3, 1 - ks * 2); line([[x + bw * .3, yh], [x + bw * .7, yh]], K.cream, 3, 1 - ks * 2); }
      const la = clamp(kb) * (1 - seg(ks, 0, .4));
      txt(`+${b.lo}–${b.hi}%`, x + bw / 2, YB - b.hi * pctPx - 22, { font: font(F.mono, 27, 700), fill: K.cream, align: 'center', a: la });
      txt(b.label + (b.forecast ? ' F' : ''), x + bw / 2, YB + 44, { font: font(F.mono, 24, 700), fill: b.forecast ? 'rgba(241,238,230,.6)' : K.cream, align: 'center', a: clamp(kb) });
      if (ks > .6) txt(fmtN(st.top), x + bw / 2, top - 16, { font: font(F.mono, 26, 700), fill: K.cream, align: 'center', a: seg(ks, .6, 1) });
    });
    line([[X0, YB], [X1, YB]], K.cream, 3);
    // "降温"：报道里的说法 → 盖上去，台阶出来后加两条注释
    const tq = at('contract', v.quoteLine ?? 3, 0), kq = seg(t, tq, tq + .35);
    if (kq > 0) {
      const f = font(F.mono, 30, 700), s = `“${v.quote}”`, w = measure(s, f, 2) + 44, a = 1 - seg(t, tS + 1.2, tS + 1.6) * .6 - seg(t, at('contract', v.finalLine ?? 4, .4), at('contract', v.finalLine ?? 4, .55)) * .4;
      c.save(); c.translate(ML + w / 2, 600); c.rotate(-.04); c.scale(lerp(1.3, 1, easeOut(kq)), lerp(1.3, 1, easeOut(kq))); c.globalAlpha = clamp(kq * 2) * a;
      rrect(-w / 2, -32, w, 64, 4, { fill: K.cream }); txt(s, -w / 2 + 22, 11, { font: f, fill: K.ink, ls: 2 }); c.restore();
    }
    const kn = seg(t, tS + 1.3, tS + 1.8);
    if (kn > 0) {
      // 红色部分越来越小 / 顶部越来越高
      const xs = v.bars.map((_, i) => SX(i + 1) + bw / 2), tops = steps.map(s => YB - s.top * idxPx);
      line(tops.map((y, i) => [xs[i], y - 54]).slice(0, Math.max(2, Math.ceil(4 * kn))), K.lime, 4, 1, [2, 10]);
      txt('PRICE ↑', xs[3] - bw / 2 - 10, tops[3] - 80, { font: font(F.mono, 28, 700), fill: K.lime, ls: 2, align: 'right', a: kn });
      txt('INCREASE ↓', X1 - 4, YB + 94, { font: font(F.mono, 26, 700), fill: K.red, ls: 2, align: 'right', a: seg(t, tS + 1.6, tS + 2.0) });
    }
    const tf = at('contract', v.finalLine ?? 4, .55), kf = backOut(seg(t, tf, tf + .5));
    if (kf > 0) { c.save(); c.translate(320, 830); c.rotate(-.08); c.scale(kf, kf); txt(v.final, 0, 0, { font: font(F.cond, 210), fill: K.lime, align: 'center' }); c.restore(); }
    txt(v.note || '', ML, 1300, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.55)', ls: 1.5, a: seg(t, tS, tS + .5) });
    source(v.source, seg(t, s0 + 1.2, s0 + 1.6), true);
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .4;
  }

  // ---------- street：市场里的说法，明确标注是观点 ----------
  function sStreet(t) {
    const v = V.street, s0 = S.street, c = g();
    bg(K.blue); grid('rgba(241,238,230,.06)', t);
    ticker(t, true);
    const t1 = at('street', 1, 0), pulse = Math.exp(-Math.max(0, t - t1) * 3) * (t > t1 ? 1 : 0);
    c.save(); c.translate(ML, 300); c.scale(1 + pulse * .12, 1 + pulse * .12); c.translate(-ML, -300);
    chip(v.label, ML, 300, { k: seg(t, s0 + .1, s0 + .4), bg: K.lime, fg: K.ink, font: font(F.mono, 24, 700), ls: 3, h: 52 });
    c.restore();
    txt('“', ML - 10, 640, { font: `italic 420px ${F.serif}`, fill: 'rgba(241,238,230,.22)', a: seg(t, s0 + .2, s0 + .5) });
    const fq = (s) => `italic ${fit(s, F.serif, CW, 132)}px ${F.serif}`;
    const qs = Math.min(...v.quote.map(s => fit(s, F.serif, CW, 132)));
    v.quote.forEach((s, i) => dropWord(s, ML, 640 + i * qs * 1.05, `italic ${qs}px ${F.serif}`, s0 + .3 + i * .35, t, { fill: K.cream, fall: 80, stag: .018 }));
    // 时间轴：今天 → 商户说的年份，实线只画到今天，之后是虚线
    const ys = v.years, X0 = 130, X1 = 950, Y0 = 1080, X = yr => lerp(X0, X1, (yr - ys[0]) / (ys[ys.length - 1] - ys[0] + .5));
    const now = 2026.8, tl0 = at('street', 0, .1), kt = easeInOut(seg(t, tl0, tl0 + 2.6));
    line([[X0, Y0], [X1, Y0]], 'rgba(241,238,230,.35)', 3, seg(t, s0 + .4, s0 + .8));
    ys.forEach((yr, i) => { const x = X(yr); line([[x, Y0 - 14], [x, Y0 + 14]], K.cream, 3, seg(t, s0 + .5 + i * .06, s0 + .7 + i * .06)); txt(String(yr), x, Y0 + 86, { font: font(F.mono, 26, 700), fill: K.cream, align: 'center', a: seg(t, s0 + .5 + i * .06, s0 + .7 + i * .06) }); });
    const xNow = X(now), xEnd = X(v.range[1] + .99), xR0 = X(v.range[0]);
    if (kt > 0) {
      line([[X(ys[0]), Y0], [lerp(X(ys[0]), xNow, clamp(kt * 3)), Y0]], K.lime, 9);
      if (kt > .33) line([[xNow, Y0], [lerp(xNow, xEnd, seg(kt, .33, 1)), Y0]], K.lime, 6, 1, [14, 14]);
      if (kt > .2) { circle(xNow, Y0, 13, { fill: K.lime }); txt('NOW', xNow, Y0 - 34, { font: font(F.mono, 22, 700), fill: K.lime, align: 'center', ls: 3 }); }
      const kr = seg(kt, .75, 1);
      if (kr > 0) { rrect(xR0, Y0 - 44, (xEnd - xR0) * easeOut(kr), 88, 6, { fill: 'rgba(221,245,61,.22)', stroke: K.lime, lw: 2 }); txt('?', (xR0 + xEnd) / 2, Y0 - 62, { font: font(F.cond, 64), fill: K.lime, align: 'center', a: kr }); }
    }
    txt(v.attribution || '', ML, 1240, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.65)', ls: 1.5, a: seg(t, s0 + 1, s0 + 1.4) });
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .35;
  }

  // ---------- actions：本周三件事 ----------
  function icon(kind, x, y, s, col, k) {
    if (k <= 0) return;
    const c = g(); c.save(); c.globalAlpha = clamp(k * 2);
    if (kind === 'stairs') { line([[x, y + s], [x + s * .3, y + s], [x + s * .3, y + s * .66], [x + s * .6, y + s * .66], [x + s * .6, y + s * .33], [x + s * .9, y + s * .33], [x + s * .9, y]], col, 6, 1); R.arrow(x + s * .55, y + s * .2, x + s, y - s * .1, col, 5, 1, 14); }
    if (kind === 'clock') { circle(x + s / 2, y + s / 2, s / 2, { stroke: col, lw: 6 }); line([[x + s / 2, y + s * .22], [x + s / 2, y + s / 2], [x + s * .72, y + s * .62]], col, 6); }
    if (kind === 'lens') { circle(x + s * .42, y + s * .42, s * .34, { stroke: col, lw: 6 }); line([[x + s * .66, y + s * .66], [x + s, y + s]], col, 9); }
    c.restore();
  }
  function sActions(t) {
    const v = V.actions, s0 = S.actions, c = g();
    bg(PAPER); grid('rgba(14,15,14,.05)', t);
    ticker(t, false);
    v.title.forEach((s, i) => title(s, 390 + i * 135, t, s0 + .1 + i * .2, { col: K.ink, size: 140, dot: K.red }));
    const cardH = 230, gap = 24, y0 = 590;
    v.items.forEach((it, i) => {
      const tc = when('actions', it), k = expoOut(seg(t, tc, tc + .5)); if (k <= 0) return;
      const next = v.items[i + 1], active = !next || t < when('actions', next);
      const y = y0 + i * (cardH + gap), x = ML + (1 - k) * 700;
      c.save(); c.globalAlpha = clamp(k * 2) * (active ? 1 : .78);
      rrect(x, y, CW, cardH, 10, { fill: K.ink });
      if (active) rrect(x, y, CW, cardH, 10, { stroke: K.lime, lw: 3 });
      txt(String(i + 1).padStart(2, '0'), x + 36, y + 128, { font: font(F.cond, 110), fill: K.lime });
      chip(it.tag, x + 200, y + 52, { k: seg(t, tc + .2, tc + .5), bg: 'rgba(241,238,230,.1)', fg: K.lime, font: font(F.mono, 21, 700), ls: 3, h: 42 });
      const fh = font(F.sans, 50, 700), fs2 = font(F.sans, 34, 500);
      txt(it.head, x + 200, y + 132, { font: fh, fill: K.cream });
      wrap(it.sub, fs2, CW - 240).slice(0, 2).forEach((l, j) => txt(l, x + 200, y + 182 + j * 40, { font: fs2, fill: 'rgba(241,238,230,.7)' }));
      c.restore();
      icon(it.icon, x + CW - 110, y + 26, 70, K.lime, seg(t, tc + .3, tc + .7) * (active ? 1 : .6));
    });
    HUD(t, false);
    R.FX.grain = .035; R.FX.vign = .18;
  }

  // ---------- outro：频道统一片尾卡 + 栏目的心电图 ----------
  function sOutro(t) {
    const v = V.outro, s0 = S.outro, e0 = E.outro;
    B.endCard(t, s0, { sources: v.sources, cta: v.cta });
    ecg(600, 1010, 316, 46, seg(t, s0 + .3, s0 + 1.0), K.lime, 4, .5);
    HUD(t, true, 1 - seg(t, e0 - .6, e0));
    R.FX.grain = .05; R.FX.vign = .45;
    const fade = seg(t, e0 - .5, e0); if (fade > 0) { const c = g(); c.save(); c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); c.restore(); }
  }

  const FN = { open: sOpen, intro: sIntro, spot: sSpot, contract: sContract, street: sStreet, actions: sActions, outro: sOutro };
  const scenes = EP.scenes.map(s => [S[s.type], FN[s.type], s.type]);
  R.run(scenes, {
    intro: [.5, R.trWipe(K.lime)],
    spot: [.55, R.trIris(W / 2, 760, K.ink)],
    contract: [.5, R.trPush(0, 1)],
    street: [.55, R.trSlats(8)],
    actions: [.6, R.trGrid(9, 16, K.lime)],
    outro: [.5, R.trPush(1, 0)],
  });
}
