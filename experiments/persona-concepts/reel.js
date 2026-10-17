// 人设样片帧：两个方向各 4 帧（钩子 / 自我介绍 / 内容中的常驻形象 / 头像）。
// A = 深圳业内人（展会胸牌），B = SIGNAL（示波器脸的 AI 分析师）。名字 ALEX 是占位。
import { createReel, K, F, LAY, W, H, clamp, lerp, seg, easeOut, backOut, hash, TAU, font } from '/pipeline/reel/engine.js';

const NAME = 'ALEX';
const SUB_Y = LAY.subY + 4;
const PHOS = '#B9FF66';

export default async function (EP, TL) {
  const R = createReel({ EP, TL });
  const { txt, measure, bg, line, circle, rrect, chip, barcode } = R;
  const g = () => R.ctx, ML = LAY.ml, CW = LAY.mr - ML;
  const env = t => TL.env[Math.floor(t * 30) % TL.env.length] || 0;

  function grid(col) { const c = g(); c.save(); c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); for (let x = 0; x < W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y < H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.restore(); }
  function corner(label) { txt(label, ML, 120, { font: font(F.mono, 22, 700), fill: 'rgba(241,238,230,.5)', ls: 3 }); }

  // ---------- 共用：钩子卡（前 3 秒）----------
  function hook(t) {
    bg(K.ink); grid('rgba(241,238,230,.035)');
    chip('THIS WEEK IN SHENZHEN', ML, 330, { bg: K.lime, fg: K.ink, font: font(F.mono, 24, 700), ls: 3, h: 52 });
    txt('¥200', ML, 640, { font: font(F.cond, 300), fill: 'rgba(241,238,230,.55)' });
    const ax = ML + measure('¥200', font(F.cond, 300)) + 50; line([[ax, 540], [ax + 150, 540]], 'rgba(241,238,230,.55)', 16); line([[ax + 100, 490], [ax + 152, 540], [ax + 100, 590]], 'rgba(241,238,230,.55)', 16);
    txt('¥1,400.', ML, 930, { font: font(F.cond, 300), fill: K.red });
    txt('SAME 16GB DDR5 STICK.', ML, 1060, { font: font(F.cond, 96), fill: K.cream });
    txt('ONE YEAR.', ML, 1160, { font: font(F.cond, 96), fill: K.cream });
  }
  function subtitle(s, x0 = 232) {
    const c = g(); c.save(); c.font = font(F.sans, 46, 700);
    const w = Math.min(c.measureText(s).width, 760) + 56;
    c.fillStyle = 'rgba(14,15,14,.92)'; c.beginPath(); c.roundRect(x0, SUB_Y, w, 98, [8, 30, 30, 30]); c.fill();
    c.strokeStyle = 'rgba(241,238,230,.25)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = K.cream; c.fillText(s, x0 + 28, SUB_Y + 64, 760); c.restore();
  }

  // =========== A：深圳业内人，展会胸牌 ===========
  // 挂绳 + 金属夹 + 胸牌，绕夹子摆动。w 为胸牌宽
  function badge(cx, top, w, ang, o = {}) {
    const c = g(), h = w * 1.45, s = w / 600;
    c.save(); c.translate(cx, top); c.rotate(ang);
    if (o.strap !== false) {
      for (const sx of [-1, 1]) {
        c.save(); c.beginPath(); c.moveTo(sx * 46 * s, -40 * s); c.lineTo(sx * 150 * s, -top - 40); c.lineTo(sx * 230 * s, -top - 40); c.lineTo(sx * 96 * s, -40 * s); c.closePath();
        c.fillStyle = K.lime; c.fill(); c.clip();
        const a = Math.atan2(-top, sx * 130 * s); c.translate(sx * 70 * s, -40 * s); c.rotate(a + (sx > 0 ? 0 : Math.PI));
        txt('CN SUPPLY CHAIN SIGNAL · '.repeat(8), -1400, 8 * s, { font: font(F.mono, Math.round(22 * s), 700), fill: K.ink, ls: 3 });
        c.restore();
      }
    }
    // 金属夹
    const cg = c.createLinearGradient(-60 * s, 0, 60 * s, 0); cg.addColorStop(0, '#6d7275'); cg.addColorStop(.5, '#d9dde0'); cg.addColorStop(1, '#73787b');
    c.fillStyle = cg; c.beginPath(); c.roundRect(-52 * s, -54 * s, 104 * s, 74 * s, 10 * s); c.fill();
    c.fillStyle = '#2a2d2f'; c.beginPath(); c.roundRect(-26 * s, -40 * s, 52 * s, 16 * s, 8 * s); c.fill();
    // 卡片
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50 * s; c.shadowOffsetY = 24 * s;
    rrect(-w / 2, 0, w, h, 22 * s, { fill: '#F4F1E8' }); c.restore();
    c.save(); c.beginPath(); c.roundRect(-w / 2, 0, w, h, 22 * s); c.clip();
    rrect(-w / 2, 0, w, 150 * s, 0, { fill: K.ink });
    rrect(-60 * s, 26 * s, 120 * s, 22 * s, 11 * s, { fill: '#F4F1E8' });            // 挂孔
    txt('SHENZHEN · CN', -w / 2 + 40 * s, 118 * s, { font: font(F.mono, Math.round(26 * s), 700), fill: K.lime, ls: 4 * s });
    txt(o.tag || 'WK 42', w / 2 - 40 * s, 118 * s, { font: font(F.mono, Math.round(26 * s), 700), fill: 'rgba(241,238,230,.6)', ls: 3 * s, align: 'right' });
    // 头像区：不露脸，用首字母 + 料盘轮廓
    const py = 330 * s, pr = 130 * s;
    circle(0, py, pr, { fill: K.ink });
    for (let i = 0; i < 4; i++) { const a0 = i * TAU / 4 + .25; c.save(); c.beginPath(); c.arc(0, py, pr * .86, a0, a0 + .95); c.arc(0, py, pr * .52, a0 + .95, a0, true); c.closePath(); c.fillStyle = 'rgba(241,238,230,.08)'; c.fill(); c.restore(); }
    circle(0, py, pr * .36, { stroke: 'rgba(241,238,230,.18)', lw: 3 * s });
    txt(NAME[0], 0, py + 62 * s, { font: font(F.cond, Math.round(180 * s)), fill: K.lime, align: 'center' });
    txt(NAME, 0, 640 * s, { font: font(F.cond, Math.round(170 * s)), fill: K.ink, align: 'center' });
    txt('COMPONENTS TRADER', 0, 702 * s, { font: font(F.mono, Math.round(30 * s), 700), fill: K.ink, ls: 5 * s, align: 'center' });
    txt('HUAQIANGBEI · SHENZHEN', 0, 748 * s, { font: font(F.mono, Math.round(22 * s), 700), fill: 'rgba(14,15,14,.5)', ls: 4 * s, align: 'center' });
    barcode(-w / 2 + 40 * s, 780 * s, 300 * s, 34 * s, 7);
    rrect(-w / 2, h - 66 * s, w, 66 * s, 0, { fill: K.lime });
    txt('AI VOICE · MY NUMBERS', 0, h - 22 * s, { font: font(F.mono, Math.round(24 * s), 700), fill: K.ink, ls: 4 * s, align: 'center' });
    c.restore();
    c.restore();
  }
  // 常驻：字幕左侧的小胸牌 + 声纹
  function miniBadge(t) {
    badge(132, LAY.subY - 22, 132, Math.sin(t * 1.4) * .04, { strap: false });
    const c = g(); for (let i = 0; i < 9; i++) { const v = env(t + i * .05) * (0.4 + .6 * hash(i)); rrect(84 + i * 12, LAY.subY + 192 - v * 22, 6, 4 + v * 22, 3, { fill: K.lime }); }
  }

  function A0(t) { hook(t); badge(900, 1360, 150, -.12, { strap: false }); corner('A · HOOK  0–3s'); }
  function A1(t) {
    hook(t); const c = g(); c.save(); c.fillStyle = 'rgba(14,15,14,.93)'; c.fillRect(0, 0, W, H); c.restore();
    badge(W / 2, 330, 560, -.05);
    subtitle('I’m Alex. I trade components in Shenzhen.', 120);
    corner('A · INTRO  3–5s');
  }
  function A2(t) {
    bg('#ECE8DD'); grid('rgba(14,15,14,.05)');
    chip('CONVENTIONAL DRAM CONTRACT · QoQ', ML, 330, { bg: K.ink, fg: K.lime, font: font(F.mono, 23, 700), ls: 2.5, h: 50 });
    txt('CONTRACT: ONLY UP.', ML, 470, { font: font(F.cond, 128), fill: K.ink });
    [[95, 'Q1'], [60, 'Q2'], [15, 'Q3 F'], [12, 'Q4 F']].forEach(([v, l], i) => { const x = 160 + i * 210, hh = v * 6; rrect(x, 1180 - hh, 150, hh, 0, { fill: K.red }); txt(l, x + 75, 1230, { font: font(F.mono, 26, 700), fill: K.ink, align: 'center' }); });
    line([[100, 1180], [1000, 1180]], K.ink, 3);
    miniBadge(t); subtitle('Contract prices this year? Only up.');
    txt('A · ALWAYS ON SCREEN', ML, 120, { font: font(F.mono, 22, 700), fill: 'rgba(14,15,14,.5)', ls: 3 });
  }
  function A3(t) {
    bg('#1a1c1a');
    const c = g(); c.save(); c.translate(W / 2, 760); c.beginPath(); c.arc(0, 0, 400, 0, TAU); c.clip();
    rrect(-400, -400, 800, 800, 0, { fill: K.ink });
    const pr = 400; for (let i = 0; i < 4; i++) { const a0 = i * TAU / 4 + .25; c.beginPath(); c.arc(0, 0, pr * .86, a0, a0 + .95); c.arc(0, 0, pr * .52, a0 + .95, a0, true); c.closePath(); c.fillStyle = 'rgba(241,238,230,.07)'; c.fill(); }
    circle(0, 0, pr * .36, { stroke: 'rgba(241,238,230,.16)', lw: 6 });
    txt(NAME[0], 0, 190, { font: font(F.cond, 540), fill: K.lime, align: 'center' });
    c.restore();
    txt('AVATAR · 800×800', W / 2, 1290, { font: font(F.mono, 26, 700), fill: 'rgba(241,238,230,.5)', ls: 4, align: 'center' });
    corner('A · AVATAR');
  }

  // =========== B：SIGNAL，示波器脸的 AI 分析师 ===========
  function scope(cx, cy, w, t, o = {}) {
    const c = g(), h = w * .72, s = w / 600, x0 = cx - w / 2, y0 = cy - h / 2;
    c.save();
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50 * s; c.shadowOffsetY = 26 * s;
    const bgG = c.createLinearGradient(0, y0, 0, y0 + h); bgG.addColorStop(0, '#3a3e3b'); bgG.addColorStop(1, '#1b1d1c');
    rrect(x0, y0, w, h, 42 * s, { fill: bgG }); c.restore();
    rrect(x0 + 4 * s, y0 + 4 * s, w - 8 * s, h * .4, 40 * s, { fill: 'rgba(255,255,255,.05)' });
    // 屏幕
    const sx = x0 + 34 * s, sy = y0 + 34 * s, sw = w * .66, sh = h - 68 * s;
    c.save(); c.beginPath(); c.roundRect(sx, sy, sw, sh, 30 * s); c.clip();
    const sg = c.createRadialGradient(sx + sw / 2, sy + sh / 2, 10, sx + sw / 2, sy + sh / 2, sw * .7); sg.addColorStop(0, '#0f2a17'); sg.addColorStop(1, '#030a05');
    c.fillStyle = sg; c.fillRect(sx, sy, sw, sh);
    c.strokeStyle = 'rgba(185,255,102,.12)'; c.lineWidth = 1.5 * s; c.beginPath();
    for (let i = 1; i < 8; i++) { c.moveTo(sx + sw * i / 8, sy); c.lineTo(sx + sw * i / 8, sy + sh); } for (let i = 1; i < 6; i++) { c.moveTo(sx, sy + sh * i / 6); c.lineTo(sx + sw, sy + sh * i / 6); } c.stroke();
    // 眼睛
    const blink = ((t % 3.3) / 3.3) > .95 ? .15 : 1;
    c.shadowColor = PHOS; c.shadowBlur = 24 * s; c.fillStyle = PHOS;
    for (const dx of [-.17, .17]) { const ew = 26 * s, eh = 76 * s * blink; c.beginPath(); c.roundRect(sx + sw * (.5 + dx) - ew / 2, sy + sh * .36 - eh / 2, ew, eh, ew / 2); c.fill(); }
    // 嘴 = 波形，振幅跟着声音
    const e = o.env ?? env(t); c.lineWidth = 6 * s; c.strokeStyle = PHOS; c.beginPath();
    for (let i = 0; i <= 120; i++) { const u = i / 120, x = sx + sw * (.16 + .68 * u), win = Math.sin(Math.PI * u); const y = sy + sh * .72 - win * (e * 46 * s) * Math.sin(u * 26 + t * 14) - win * 6 * s * Math.sin(u * 9 - t * 5); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.shadowBlur = 0;
    for (let y = sy; y < sy + sh; y += 4 * s) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(sx, y, sw, 1.5 * s); }
    const gl = c.createLinearGradient(sx, sy, sx + sw * .6, sy + sh * .5); gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fillRect(sx, sy, sw, sh);
    c.restore();
    rrect(sx, sy, sw, sh, 30 * s, { stroke: '#0b0c0b', lw: 6 * s });
    // 右侧面板：旋钮、按键、丝印
    const px = sx + sw + 34 * s, pw = x0 + w - 30 * s - px;
    txt('SIGNAL', px + pw / 2, sy + 30 * s, { font: font(F.mono, Math.round(24 * s), 700), fill: 'rgba(241,238,230,.7)', ls: 4 * s, align: 'center' });
    for (const [ky, r] of [[sy + 110 * s, 46 * s], [sy + 240 * s, 38 * s]]) {
      const kg = c.createRadialGradient(px + pw / 2 - r * .3, ky - r * .3, r * .1, px + pw / 2, ky, r); kg.addColorStop(0, '#5a5f5c'); kg.addColorStop(1, '#151716');
      circle(px + pw / 2, ky, r, { fill: kg }); circle(px + pw / 2, ky, r, { stroke: 'rgba(255,255,255,.12)', lw: 2 * s });
      const a = -2 + t * .3 + ky; line([[px + pw / 2, ky], [px + pw / 2 + Math.cos(a) * r * .75, ky + Math.sin(a) * r * .75]], K.lime, 5 * s);
    }
    for (let i = 0; i < 3; i++) rrect(px + 10 * s + i * (pw - 20 * s) / 3, sy + 320 * s, (pw - 20 * s) / 3 - 8 * s, 22 * s, 5 * s, { fill: i === 0 ? K.lime : '#4a4e4b' });
    txt('CH1  AI', px + pw / 2, sy + sh - 6 * s, { font: font(F.mono, Math.round(18 * s), 700), fill: 'rgba(241,238,230,.45)', ls: 3 * s, align: 'center' });
    c.restore();
  }
  function B0(t) { hook(t); scope(900, 1330, 200, t); corner('B · HOOK  0–3s'); }
  function B1(t) {
    hook(t); const c = g(); c.save(); c.fillStyle = 'rgba(14,15,14,.93)'; c.fillRect(0, 0, W, H); c.restore();
    scope(W / 2, 600, 760, t, { env: .7 });
    txt('I’M SIGNAL.', ML, 1020, { font: font(F.cond, 170), fill: K.cream });
    txt('AN AI THAT READS CHINA’S COMPONENT', ML, 1090, { font: font(F.mono, 27, 700), fill: PHOS, ls: 2 });
    txt('MARKET IN CHINESE. A HUMAN IN SHENZHEN', ML, 1130, { font: font(F.mono, 27, 700), fill: PHOS, ls: 2 });
    txt('CHECKS EVERY NUMBER.', ML, 1170, { font: font(F.mono, 27, 700), fill: PHOS, ls: 2 });
    subtitle('I’m Signal. I read China’s market for you.', 120);
    corner('B · INTRO  3–5s');
  }
  function B2(t) {
    bg('#ECE8DD'); grid('rgba(14,15,14,.05)');
    chip('CONVENTIONAL DRAM CONTRACT · QoQ', ML, 330, { bg: K.ink, fg: K.lime, font: font(F.mono, 23, 700), ls: 2.5, h: 50 });
    txt('CONTRACT: ONLY UP.', ML, 470, { font: font(F.cond, 128), fill: K.ink });
    [[95, 'Q1'], [60, 'Q2'], [15, 'Q3 F'], [12, 'Q4 F']].forEach(([v, l], i) => { const x = 160 + i * 210, hh = v * 6; rrect(x, 1180 - hh, 150, hh, 0, { fill: K.red }); txt(l, x + 75, 1230, { font: font(F.mono, 26, 700), fill: K.ink, align: 'center' }); });
    line([[100, 1180], [1000, 1180]], K.ink, 3);
    scope(140, LAY.subY + 52, 170, t); subtitle('Contract prices this year? Only up.');
    txt('B · ALWAYS ON SCREEN', ML, 120, { font: font(F.mono, 22, 700), fill: 'rgba(14,15,14,.5)', ls: 3 });
  }
  function B3(t) { bg('#1a1c1a'); scope(W / 2, 760, 820, t, { env: .55 }); txt('AVATAR · 800×800', W / 2, 1290, { font: font(F.mono, 26, 700), fill: 'rgba(241,238,230,.5)', ls: 4, align: 'center' }); corner('B · AVATAR'); }

  const FR = [A0, A1, A2, A3, B0, B1, B2, B3];
  R.run([[0, t => { FR[Math.min(7, Math.floor(t))](t); R.FX.grain = .04; R.FX.vign = .3; }, 'frames']], {});
}
