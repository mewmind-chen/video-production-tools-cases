// News Decoder 栏目的固定格式：每周一一期。结构和画面固定，每期只换 episode.json 里的数据和台词。说明见 FORMAT.md。
// 场景：open（钩子：撕页日历 / 大字）→ intro（LEO 胸牌，频道统一）→ what（新闻卡 + 时间轴）→ rules / bom / date2（影响）
//      → calendar（日历陷阱）→ actions（本周三件事）→ unknown（我们不知道的）→ outro（频道统一片尾）。
// 栏目标识：电光蓝 + 荧光笔"解码"新闻里的关键句；声音标识是电报机嘀嗒 + 两声提示音。
import { createReel, K, F, LAY, W, H, clamp, lerp, seg, easeOut, easeIn, easeInOut, expoOut, backOut, hash, TAU, font } from '/pipeline/reel/engine.js';
import { createBrand } from '/pipeline/reel/brand.js';
import { cues } from './cues.mjs';

const PAPER = '#ECE8DD';

export default async function (EP, TL) {
  const C = cues(EP, TL), S = C.S, E = C.E, at = C.at;
  const V = Object.fromEntries(EP.scenes.map(s => [s.type, s.visual || {}]));
  const has = k => S[k] != null;
  const after = k => EP.scenes[EP.scenes.findIndex(s => s.type === k) + 1]?.type;
  EP.chapters = [['HOOK', 0, S.what], ['NEWS', S.what, S[after('what')]], ['IMPACT', S[after('what')], S.actions ?? S.outro], ['ACTION', S.actions ?? S.outro, S.outro], ['END', S.outro, C.dur]].filter(c => c[1] != null && c[2] != null);
  const R = createReel({ EP, TL });
  const B = createBrand(R, EP, TL);
  const { txt, measure, bg, line, circle, rrect, chip, dropWord } = R;
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML, g = () => R.ctx;
  const fit = (s, fam, maxW, max) => Math.min(max, Math.floor(max * maxW / measure(s, font(fam, max))));
  const when = (k, o, ln = 'line', fr = 'at') => at(k, o[ln] ?? 0, o[fr] ?? 0);

  // ---------- 通用元素 ----------
  function grid(col, t, step = 60) { const c = g(); c.save(); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); const off = (t * 6) % step; for (let x = -off; x < W; x += step) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = -off; y < H; y += step) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.restore(); }
  const kicker = (s, t, t0, o = {}) => chip(s, ML, o.y ?? 300, { k: seg(t, t0, t0 + .3), bg: o.bg ?? K.blue, fg: o.fg ?? K.cream, font: font(F.mono, 23, 700), ls: 2.5, h: 50 });
  function source(s, k, dark) { if (k > 0 && s) txt('SOURCE  ' + s, ML, 1405, { font: font(F.mono, 19, 500), fill: dark ? 'rgba(241,238,230,.5)' : 'rgba(14,15,14,.55)', ls: 1.5, a: clamp(k * 2) }); }
  function title(s, y, t, t0, o = {}) { const size = o.size || fit(s, F.cond, o.w || CW, o.max || 200); dropWord(s, o.x ?? ML, y, font(F.cond, size), t0, t, { fill: o.col || K.cream, fall: 150, stag: .025, fillAt: i => (i === s.length - 1 && s.endsWith('.')) ? (o.dot || K.blue) : undefined }); return size; }
  const HUD = (t, dark, k = 1) => B.hud(t, { tl: `NEWS DECODER · ${EP.week || ''}`, br: 'SOURCES IN CAPTION', dark, k });
  function wrap(s, f, maxW) { const words = s.split(' '), out = []; let cur = ''; for (const w of words) { const c2 = cur ? cur + ' ' + w : w; if (cur && measure(c2, f) > maxW) { out.push(cur); cur = w; } else cur = c2; } if (cur) out.push(cur); return out; }
  // 荧光笔：从左到右刷过一段文字
  function marker(x, y, w, h, k, col = K.lime) { if (k <= 0) return; const c = g(); c.save(); c.globalAlpha = .85; c.fillStyle = col; c.beginPath(); const ww = w * easeInOut(k); c.moveTo(x, y + 4); c.lineTo(x + ww, y); c.lineTo(x + ww, y + h - 2); c.lineTo(x, y + h + 3); c.closePath(); c.fill(); c.restore(); }
  // 撕页日历：top 为页面上沿；fall 0–1 时整页绕左上角掉落
  function calPage(cx, top, w, mon, day, o = {}) {
    const c = g(), h = w * 1.08, s = w / 520, fall = o.fall || 0;
    c.save();
    if (fall > 0) { c.translate(cx - w / 2, top); c.rotate(easeIn(fall) * 1.2); c.translate(0, easeIn(fall) * 1500); c.translate(-(cx - w / 2), -top); c.globalAlpha = 1 - seg(fall, .6, 1); }
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40 * s; c.shadowOffsetY = 20 * s; rrect(cx - w / 2, top, w, h, 18 * s, { fill: '#F6F3EA' }); c.restore();
    c.save(); c.beginPath(); c.roundRect(cx - w / 2, top, w, h, 18 * s); c.clip();
    rrect(cx - w / 2, top, w, 160 * s, 0, { fill: o.band || K.red });
    txt(mon, cx, top + 128 * s, { font: font(F.cond, Math.round(118 * s)), fill: K.cream, align: 'center', ls: 6 * s });
    txt(day, cx, top + 470 * s, { font: font(F.cond, Math.round(330 * s)), fill: K.ink, align: 'center' });
    if (o.year) txt(o.year, cx, top + 530 * s, { font: font(F.mono, Math.round(30 * s), 700), fill: 'rgba(14,15,14,.5)', align: 'center', ls: 6 * s });
    c.restore();
    for (const dx of [-.28, .28]) { rrect(cx + dx * w - 14 * s, top - 30 * s, 28 * s, 64 * s, 14 * s, { fill: '#9aa0a3' }); rrect(cx + dx * w - 8 * s, top - 24 * s, 16 * s, 52 * s, 8 * s, { fill: '#d4d8da' }); }
    if (o.strike > 0) { const k = o.strike; line([[cx - w * .38, top + h * .3], [lerp(cx - w * .38, cx + w * .38, easeOut(seg(k, 0, .5))), lerp(top + h * .3, top + h * .9, easeOut(seg(k, 0, .5)))]], K.red, 18 * s); if (k > .5) line([[cx + w * .38, top + h * .3], [lerp(cx + w * .38, cx - w * .38, easeOut(seg(k, .5, 1))), lerp(top + h * .3, top + h * .9, easeOut(seg(k, .5, 1)))]], K.red, 18 * s); }
    c.restore();
  }
  // 元素方块（周期表样式）
  function tile(x, y, sz, sym, name, k, o = {}) {
    if (k <= 0) return; const c = g(), kk = backOut(k);
    c.save(); c.translate(x + sz / 2, y + sz / 2); c.scale(kk, kk); c.translate(-(x + sz / 2), -(y + sz / 2));
    rrect(x, y, sz, sz, 8, { fill: o.fill || K.cream }); if (o.line) rrect(x, y, sz, sz, 8, { stroke: o.line, lw: 4 });
    txt(sym, x + sz / 2, y + sz * .62, { font: font(F.cond, Math.round(sz * .5)), fill: o.ink || K.ink, align: 'center' });
    if (name) txt(name, x + sz / 2, y + sz * .86, { font: font(F.mono, Math.round(sz * .1), 700), fill: o.dim || 'rgba(14,15,14,.55)', align: 'center', ls: 1 });
    c.restore();
  }

  // =================== 场景 ===================
  // ---------- open：撕页日历，旧日期被划掉掉落，新日期露出来 ----------
  function sOpen(t) {
    const v = V.open, s0 = S.open, c = g();
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    kicker(v.kicker, t, s0 + .1);
    const tStrike = at('open', 0, .12), tFall = at('open', 0, .5), kIn = expoOut(seg(t, s0 + .05, s0 + .5));
    const top = 430 + (1 - kIn) * -900;
    calPage(W / 2, top, 560, v.to[0], v.to[1], { band: K.blue, year: v.toYear });
    if (t < tFall + 1) calPage(W / 2, top, 560, v.from[0], v.from[1], { band: K.red, year: v.fromYear, strike: seg(t, tStrike, tStrike + .45), fall: seg(t, tFall, tFall + .9) });
    const k2 = seg(t, at('open', 0, .8), at('open', 0, .8) + .4);
    if (k2 > 0) { const pulse = Math.exp(-Math.max(0, t - tFall - .9) * 4); circle(W / 2, top + 330, 300 + pulse * 40, { stroke: K.blue, lw: 6, a: k2 * .6 }); }
    const t1 = at('open', 1, 0);
    (v.tail || []).forEach((s, i) => title(s, 1225 + i * 120, t, t1 + i * .25, { size: 112, dot: K.blue }));
    source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
    HUD(t, true, seg(t, s0, s0 + .4));
    R.FX.grain = .05; R.FX.vign = .4;
    if (t > tFall && t < tFall + .06) R.FX.flash = .12;
  }

  // ---------- intro：频道统一（LEO 胸牌），下方是栏目名 ----------
  function sIntro(t) {
    B.intro(t, S.intro, E.intro);
    R.FX.grain = .05; R.FX.vign = .4;
  }

  // ---------- what：新闻卡 + 荧光笔解码 + 时间轴上的日期挪动 ----------
  function sWhat(t) {
    const v = V.what, s0 = S.what, c = g();
    bg(PAPER); grid('rgba(14,15,14,.05)', t);
    kicker(v.kicker, t, s0 + .1);
    // 卡片
    const kc = expoOut(seg(t, s0 + .15, s0 + .7)), cx = ML, cy = 380 + (1 - kc) * 80, cw = CW, ch = 560;
    c.save(); c.globalAlpha = clamp(kc * 1.5); c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 30; c.shadowOffsetY = 12; rrect(cx, cy, cw, ch, 10, { fill: '#FFFFFF' }); c.restore();
    if (kc > .2) {
      rrect(cx, cy, 14, ch, 0, { fill: K.blue, a: kc });
      txt('OFFICIAL STATEMENT', cx + 50, cy + 66, { font: font(F.mono, 22, 700), fill: 'rgba(14,15,14,.5)', ls: 4, a: kc });
      // 印章
      const ks = backOut(seg(t, s0 + .6, s0 + .9));
      if (ks > 0) { c.save(); c.translate(cx + cw - 105, cy + 92); c.rotate(-.18); c.scale(ks, ks); circle(0, 0, 76, { stroke: K.red, lw: 5 }); circle(0, 0, 63, { stroke: K.red, lw: 2 }); txt(v.stamp[0], 0, -2, { font: font(F.cond, 36), fill: K.red, align: 'center' }); txt(v.stamp[1], 0, 26, { font: font(F.mono, 13, 700), fill: K.red, align: 'center', ls: 1 }); c.restore(); }
      const f = font(F.cond, 100);
      v.headline.forEach((s, i) => {
        const y = cy + 250 + i * 110, last = i === v.headline.length - 1;
        if (last) marker(cx + 44, y - 92, measure(s, f) + 12, 100, seg(t, at('what', 0, .65), at('what', 0, .65) + .6));
        dropWord(s, cx + 50, y, f, s0 + .4 + i * .15, t, { fill: K.ink, fall: 80, stag: .02 });
      });
    }
    // 时间轴：旧日期 → 新日期
    const yA = 1200, xA = ML + 40, xB = MR - 40, xFrom = lerp(xA, xB, .3), xTo = lerp(xA, xB, .82);
    const ka = seg(t, s0 + .8, s0 + 1.2);
    line([[xA, yA], [lerp(xA, xB, ka), yA]], K.ink, 4);
    if (ka > 0) {
      const ts = at('what', v.slideLine ?? 1, 0), ks = easeInOut(seg(t, ts, ts + .9)), xm = lerp(xFrom, xTo, ks);
      line([[xFrom, yA - 16], [xFrom, yA + 16]], 'rgba(14,15,14,.4)', 4, ka);
      txt(v.from, xFrom, yA + 62, { font: font(F.mono, 28, 700), fill: ks > .1 ? 'rgba(14,15,14,.4)' : K.ink, align: 'center', ls: 2, a: ka });
      if (ks > 0) { const w = measure(v.from, font(F.mono, 28, 700), 2); line([[xFrom - w / 2, yA + 52], [xFrom - w / 2 + w * seg(ks, 0, .5), yA + 52]], K.red, 4); }
      if (ks > 0) { line([[xFrom, yA], [xm, yA]], K.blue, 10); const mid = (xFrom + xTo) / 2; c.save(); c.strokeStyle = K.blue; c.lineWidth = 4; c.setLineDash([10, 10]); c.beginPath(); c.moveTo(xFrom, yA - 30); c.quadraticCurveTo(mid, yA - 120, lerp(xFrom, xTo, ks), yA - 30); c.stroke(); c.restore(); }
      circle(xm, yA, 18, { fill: ks >= 1 ? K.blue : K.ink, a: ka });
      if (ks > .6) { txt(v.to, xTo, yA + 62, { font: font(F.mono, 28, 700), fill: K.blue, align: 'center', ls: 2, a: seg(ks, .6, 1) }); chip(v.delta, (xFrom + xTo) / 2 - measure(v.delta, font(F.mono, 26, 700), 3) / 2 - 18, yA - 150, { k: seg(ks, .7, 1), bg: K.blue, fg: K.cream, font: font(F.mono, 26, 700), h: 50 }); }
    }
    source(v.source, seg(t, s0 + 1.2, s0 + 1.6), false);
    HUD(t, false);
    R.FX.grain = .035; R.FX.vign = .18;
  }

  // ---------- rules：暂停的 vs 从未暂停的 ----------
  function sRules(t) {
    const v = V.rules, s0 = S.rules, c = g();
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    kicker(v.kicker, t, s0 + .1);
    // 暂停的：灰色虚线框 + 暂停符号
    const p = v.paused, tp = when('rules', p), kp = expoOut(seg(t, tp, tp + .5));
    if (kp > 0) {
      const x = ML, y = 380, w = CW, h = 330;
      c.save(); c.globalAlpha = clamp(kp * 1.5); c.setLineDash([12, 10]); rrect(x, y, w, h, 10, { stroke: 'rgba(241,238,230,.45)', lw: 3 }); c.restore();
      rrect(x + 34, y + 36, 16, 48, 3, { fill: K.cream, a: kp }); rrect(x + 60, y + 36, 16, 48, 3, { fill: K.cream, a: kp });
      txt(p.label, x + 100, y + 72, { font: font(F.mono, 26, 700), fill: K.cream, ls: 3, a: kp });
      p.items.forEach((s, i) => txt('—  ' + s, x + 34, y + 150 + i * 56, { font: font(F.mono, 26, 700), fill: 'rgba(241,238,230,.6)', ls: 1, a: seg(t, tp + .3 + i * .15, tp + .6 + i * .15) }));
    }
    // 从未暂停的：元素方块 + 红色框
    const a = v.active, ta = when('rules', a), ka = expoOut(seg(t, ta, ta + .4));
    if (ka > 0) {
      const x = ML, y = 745, w = CW, h = 520;
      rrect(x, y, w, h, 10, { stroke: K.red, lw: 4, a: ka });
      circle(x + 48, y + 58, 12, { fill: K.red, a: ka }); txt(a.label, x + 76, y + 68, { font: font(F.mono, 26, 700), fill: K.cream, ls: 3, a: ka });
      const sz = 190, gap = 24, perRow = 4;
      a.tiles.forEach(([sym, name], i) => {
        const r = Math.floor(i / perRow), col = i % perRow, n = r === 0 ? perRow : a.tiles.length - perRow;
        const rowW = n * sz + (n - 1) * gap, x0 = x + (w - rowW) / 2;
        tile(x0 + col * (sz + gap), y + 110 + r * (sz + gap), sz, sym, name, seg(t, ta + .2 + i * .09, ta + .5 + i * .09), { fill: K.cream });
      });
      const tn = at('rules', a.noteLine ?? 1, a.noteAt ?? 0), kn = seg(t, tn, tn + .35);
      if (kn > 0) {
        chip(a.note, x, y + h + 56, { k: kn, bg: K.red, fg: K.cream, font: font(F.mono, 24, 700), h: 54 });
      }
    }
    source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .4;
  }

  // ---------- bom：元素 → 用在什么元器件里 ----------
  function partIcon(kind, x, y, s, k) {
    if (k <= 0) return; const c = g(); c.save(); c.globalAlpha = clamp(k * 2);
    if (kind === 'mlcc') {   // 0805 贴片电容：陶瓷体 + 两端电极
      const w = 260 * s, h = 150 * s, gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#d8bf98'); gr.addColorStop(1, '#a8875c');
      rrect(x, y, w, h, 10 * s, { fill: gr });
      const tg = c.createLinearGradient(0, y, 0, y + h); tg.addColorStop(0, '#f2f4f5'); tg.addColorStop(1, '#9ea4a8');
      rrect(x, y, 56 * s, h, 10 * s, { fill: tg }); rrect(x + w - 56 * s, y, 56 * s, h, 10 * s, { fill: tg });
      for (let i = 1; i < 8; i++) line([[x + 70 * s, y + i * h / 8], [x + w - 70 * s, y + i * h / 8]], 'rgba(90,60,30,.25)', 2);
    }
    if (kind === 'magnet') { // 环形磁体 + 电机轴
      const cx = x + 130 * s, cy = y + 80 * s;
      circle(cx, cy, 86 * s, { fill: '#5d6266' }); circle(cx, cy, 80 * s, { fill: '#7b8186' });
      for (let i = 0; i < 8; i++) { const a0 = i * TAU / 8; c.beginPath(); c.arc(cx, cy, 78 * s, a0, a0 + TAU / 8 - .04); c.arc(cx, cy, 44 * s, a0 + TAU / 8 - .04, a0, true); c.closePath(); c.fillStyle = i % 2 ? K.red : '#3c4a9e'; c.fill(); }
      circle(cx, cy, 30 * s, { fill: '#c9cdd0' }); circle(cx, cy, 12 * s, { fill: '#55595c' });
    }
    c.restore();
  }
  function sBom(t) {
    const v = V.bom, s0 = S.bom, c = g();
    bg(PAPER); grid('rgba(14,15,14,.05)', t);
    kicker(v.kicker, t, s0 + .1, { bg: K.ink, fg: K.lime });
    v.links.forEach((L, i) => {
      const tl = when('bom', L), k = seg(t, tl, tl + .5), y = 420 + i * 450;
      if (k <= 0) return;
      const tz = L.syms.length > 1 ? 170 : 200;
      L.syms.forEach((sym, j) => tile(ML + j * (tz + 16), y + (200 - tz) / 2, tz, sym, '', seg(t, tl + j * .12, tl + .35 + j * .12), { fill: K.ink, ink: K.lime }));
      const xa = ML + L.syms.length * (tz + 16) + 14, ka = seg(t, tl + .3, tl + .7);
      R.arrow(xa, y + 100, lerp(xa, xa + 140, easeOut(ka)), y + 100, K.ink, 6, ka, 22);
      partIcon(L.icon, xa + 170, y + 25, 1.25, seg(t, tl + .5, tl + .9));
      txt(L.part, ML, y + 330, { font: font(F.cond, 92), fill: K.ink, a: seg(t, tl + .6, tl + .9) });
      txt(L.detail, ML, y + 380, { font: font(F.mono, 25, 700), fill: 'rgba(14,15,14,.6)', ls: 3, a: seg(t, tl + .8, tl + 1.1) });
    });
    txt(v.note || '', ML, 1330, { font: font(F.mono, 21, 700), fill: K.red, ls: 3, a: seg(t, s0 + 1.2, s0 + 1.6) });
    source(v.source, seg(t, s0 + 1, s0 + 1.4), false);
    HUD(t, false);
    R.FX.grain = .035; R.FX.vign = .18;
  }

  // ---------- date2：第二个日期 ----------
  function sDate2(t) {
    const v = V.date2, s0 = S.date2, c = g();
    bg(K.blue); grid('rgba(241,238,230,.06)', t);
    kicker(v.kicker, t, s0 + .1, { bg: K.cream, fg: K.blue });
    const kIn = expoOut(seg(t, s0 + .1, s0 + .6));
    calPage(ML + 210, 420 + (1 - kIn) * -700, 400, v.date[0], v.date[1], { band: K.ink });
    v.tiles.forEach(([sym, name], i) => tile(640, 420 + i * 175, 160, sym, name, seg(t, s0 + .5 + i * .12, s0 + .8 + i * .12), { fill: K.cream }));
    chip(v.label, ML, 1000, { k: seg(t, s0 + .9, s0 + 1.2), bg: K.lime, fg: K.ink, font: font(F.mono, 28, 700), ls: 4, h: 60 });
    (v.note || []).forEach((s, i) => txt(s, ML, 1100 + i * 44, { font: font(F.mono, 25, 700), fill: i ? K.lime : K.cream, ls: 2, a: seg(t, at('date2', i, i ? 0 : .5), at('date2', i, i ? 0 : .5) + .4) }));
    if (v.uses) chip(v.uses, ML, 1230, { k: seg(t, at('date2', v.usesLine ?? 1, .5), at('date2', v.usesLine ?? 1, .5) + .3), bg: 'rgba(14,15,14,.35)', fg: K.cream, font: font(F.mono, 24, 700), h: 50 });
    source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .35;
  }

  // ---------- calendar：日历陷阱 ----------
  function sCalendar(t) {
    const v = V.calendar, s0 = S.calendar, c = g();
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    kicker(v.kicker, t, s0 + .1);
    const d0 = Date.parse(v.start), d1 = Date.parse(v.end) + 864e5, X0 = ML + 10, X1 = MR - 10, Y = 860;
    const X = d => lerp(X0, X1, (Date.parse(d) - d0) / (d1 - d0));
    const ka = easeOut(seg(t, s0 + .3, s0 + .9));
    // 月份格
    const months = []; for (let m = new Date(d0); m.getTime() < d1; m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) months.push(m);
    months.forEach((m, i) => { const xa = X(m.toISOString().slice(0, 10)), nm = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)), xb = Math.min(X1, X(nm.toISOString().slice(0, 10)));
      rrect(xa + 3, Y - 90, (xb - xa - 6) * ka, 180, 6, { fill: i % 2 ? 'rgba(241,238,230,.07)' : 'rgba(241,238,230,.04)' });
      txt(m.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase(), xa + 18, Y - 52, { font: font(F.cond, 46), fill: 'rgba(241,238,230,.75)', a: ka });
      for (let d = 7; d < 29; d += 7) { const x = X(new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), d)).toISOString().slice(0, 10)); line([[x, Y + 50], [x, Y + 70]], 'rgba(241,238,230,.25)', 2, ka); }
    });
    // 区间
    (v.bands || []).forEach((b, i) => {
      const tb = when('calendar', b), kb = seg(t, tb, tb + .5); if (kb <= 0) return;
      const xa = X(b.from), xb = X(b.to), col = b.tone === 'red' ? K.red : K.lime;
      rrect(xa, Y + 10, (xb - xa) * easeOut(kb), 70, 4, { fill: col, a: .9 });
      const lw = measure(b.label, font(F.mono, 22, 700), 2), lx = clamp(xa, X0, X1 - lw);
      txt(b.label, lx, Y + 125, { font: font(F.mono, 22, 700), fill: col, ls: 2, a: kb });
      if (b.tone === 'lime') {   // 真正的截止日
        const kk = backOut(seg(t, tb + .4, tb + .9));
        if (kk > 0) { c.save(); c.translate(ML, 1150); c.scale(kk, kk); txt('YOUR REAL DEADLINE.', 0, 0, { font: font(F.cond, 104), fill: K.lime }); c.restore(); R.arrow(xa + 60, 1060, xa + 60, Y + 150, K.lime, 5, kk, 18); }
      }
    });
    // 日期标记
    (v.markers || []).forEach((m, i) => {
      const tm = when('calendar', m), km = seg(t, tm, tm + .4); if (km <= 0) return;
      const x = X(m.date), col = m.hot ? K.red : K.cream, ly = Y - 150 - (i % 2) * 70;
      line([[x, Y + 90], [x, lerp(Y + 90, ly + 14, easeOut(km))]], col, 4);
      circle(x, Y, 12 * backOut(km), { fill: col });
      const f = font(F.mono, 24, 700), w = measure(m.label, f, 2), lx = clamp(x - w / 2, X0, X1 - w);
      txt(m.label, lx, ly, { font: f, fill: col, ls: 2, a: seg(km, .5, 1) });
      if (m.hot) for (let j = 0; j < 2; j++) { const q = ((t - tm) * .9 + j * .5) % 1; circle(x, Y, 12 + q * 46, { stroke: K.red, lw: 3, a: (1 - q) * .7 }); }
    });
    source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .4;
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
    v.title.forEach((s, i) => title(s, 390 + i * 135, t, s0 + .1 + i * .2, { col: K.ink, size: 140 }));
    const cardH = 230, gap = 24, y0 = 590;
    v.items.forEach((it, i) => {
      const tc = when('actions', it), k = expoOut(seg(t, tc, tc + .5)); if (k <= 0) return;
      const next = v.items[i + 1], active = !next || t < when('actions', next);
      const y = y0 + i * (cardH + gap), x = ML + (1 - k) * 700;
      c.save(); c.globalAlpha = clamp(k * 2) * (active ? 1 : .78);
      rrect(x, y, CW, cardH, 10, { fill: K.ink }); if (active) rrect(x, y, CW, cardH, 10, { stroke: K.blue, lw: 4 });
      txt(String(i + 1).padStart(2, '0'), x + 36, y + 128, { font: font(F.cond, 110), fill: K.lime });
      chip(it.tag, x + 200, y + 52, { k: seg(t, tc + .2, tc + .5), bg: K.blue, fg: K.cream, font: font(F.mono, 21, 700), ls: 3, h: 42 });
      const fh = font(F.sans, 48, 700), fs2 = font(F.sans, 31, 500);
      txt(it.head, x + 200, y + 128, { font: fh, fill: K.cream });
      wrap(it.sub, fs2, CW - 250).slice(0, 2).forEach((l, j) => txt(l, x + 200, y + 172 + j * 37, { font: fs2, fill: 'rgba(241,238,230,.7)' }));
      c.restore();
      icon(it.icon, x + CW - 110, y + 26, 70, K.lime, seg(t, tc + .3, tc + .7) * (active ? 1 : .6));
    });
    HUD(t, false);
    R.FX.grain = .035; R.FX.vign = .18;
  }

  // ---------- unknown：我们不知道的 + 要盯的事件 ----------
  function sUnknown(t) {
    const v = V.unknown, s0 = S.unknown, c = g();
    bg(K.ink); grid('rgba(241,238,230,.035)', t);
    kicker(v.kicker, t, s0 + .1);
    const kq = seg(t, s0 + .2, s0 + .8);
    txt('?', W - 120, 900, { font: font(F.cond, 900), fill: null, stroke: 'rgba(47,60,255,.55)', lw: 6, align: 'right', a: kq });
    v.question.forEach((s, i) => title(s, 520 + i * 150, t, s0 + .25 + i * .2, { size: 150 }));
    chip(v.answer, ML, 720, { k: seg(t, at('unknown', 0, .6), at('unknown', 0, .6) + .3), bg: K.red, fg: K.cream, font: font(F.mono, 30, 700), ls: 4, h: 64 });
    const tw = at('unknown', v.watchLine ?? 1, 0), kw = expoOut(seg(t, tw, tw + .5));
    if (kw > 0) {
      const y = 900 + (1 - kw) * 80; c.save(); c.globalAlpha = clamp(kw * 1.5);
      rrect(ML, y, CW, 300, 10, { fill: K.lime });
      txt(v.watch[0], ML + 40, y + 70, { font: font(F.mono, 26, 700), fill: 'rgba(14,15,14,.65)', ls: 6 });
      txt(v.watch[1], ML + 40, y + 180, { font: font(F.cond, 110), fill: K.ink });
      txt(v.watch[2], ML + 40, y + 250, { font: font(F.mono, 34, 700), fill: K.ink, ls: 4 });
      c.restore();
    }
    source(v.source, seg(t, s0 + 1, s0 + 1.4), true);
    HUD(t, true);
    R.FX.grain = .05; R.FX.vign = .4;
  }

  // ---------- outro：频道统一片尾卡 ----------
  function sOutro(t) {
    const v = V.outro, s0 = S.outro, e0 = E.outro;
    B.endCard(t, s0, { sources: v.sources, cta: v.cta });
    HUD(t, true, 1 - seg(t, e0 - .6, e0));
    R.FX.grain = .05; R.FX.vign = .45;
    const fade = seg(t, e0 - .5, e0); if (fade > 0) { const c = g(); c.save(); c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); c.restore(); }
  }

  const FN = { open: sOpen, intro: sIntro, what: sWhat, rules: sRules, bom: sBom, date2: sDate2, calendar: sCalendar, actions: sActions, unknown: sUnknown, outro: sOutro };
  const TRS = { intro: [.5, R.trWipe(K.blue)], what: [.55, R.trIris(W / 2, 760, K.blue)], rules: [.5, R.trPush(0, 1)], bom: [.55, R.trSlats(8)], date2: [.5, R.trPush(1, 0)], calendar: [.55, R.trIris(W / 2, 860, K.lime)], actions: [.6, R.trGrid(9, 16, K.blue)], unknown: [.5, R.trPush(0, 1)], outro: [.5, R.trPush(1, 0)] };
  R.run(EP.scenes.map(s => [S[s.type], FN[s.type], s.type]), TRS);
}
