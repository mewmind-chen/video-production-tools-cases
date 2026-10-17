// 频道人设层：所有栏目、所有期共用。人设是 LEO（化名），深圳做元器件的业内人，用展会胸牌介绍自己。
// 规则见 content-system/persona.md。每期视频固定包含：
// 1. 钩子（各栏目自己画，前 3 秒）
// 2. 自我介绍：钩子之后一句身份，胸牌挂着挂绳甩进画面 → intro()，台词固定："I'm Leo. I trade components in Shenzhen."
//    （调研：不要用打招呼、报频道名开场；身份放在钩子后面，回答"凭什么听你的"。见 content-system/research/2026-10-17-persona-research.md）
// 3. 全程常驻：字幕左侧挂着 LEO 的小胸牌 + 声纹（替换 engine 默认的光球）
// 4. 角标：左上频道名 / 栏目与期数，右上深圳电头
// 5. 统一片尾卡：胸牌 + 找料入口 + 一周排期 + 来源
// 6. 一线笔记卡：LEO 本人在华强北问到、看到的东西
import { K, F, LAY, W, H, TAU, clamp, seg, lerp, easeOut, easeIn, backOut, hash, font } from './engine.js';

export const BRAND = {
  name: 'CHINA SUPPLY CHAIN SIGNAL',
  city: 'SHENZHEN',
  host: { name: 'LEO', role: 'COMPONENTS TRADER', place: 'HUAQIANGBEI · SHENZHEN', footer: 'AI VOICE · MY NUMBERS' },
  shows: [['MON', 'NEWS DECODER'], ['WED', 'MARKET PULSE'], ['FRI', 'BUYER’S PLAYBOOK']],
  cta: ['PART YOU CAN’T FIND?', 'COMMENT OR DM THE PART NUMBER.'],
  ctaWhere: 'I’LL ASK AROUND SHENZHEN AND REPLY',
};
// 自我介绍的固定台词（写进各期 episode.json 的 intro 场景）
export const INTRO_LINE = { text: "I'm Leo. I trade components in Shenzhen.", say: "I'm Leo. I trade components in Shenzhen." };

const norm = s => String(s || '').toUpperCase().replace(/[’']/g, "'");
const DAY = { MON: 'MONDAY', WED: 'WEDNESDAY', FRI: 'FRIDAY' };

export function createBrand(R, EP, TL) {
  const { txt, measure, rrect, circle, chip, dropWord, line, barcode } = R;
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML;
  const dateline = `${BRAND.city} · ${(EP.date || '').replace(/^[A-Z]{3} /, '')}`.replace(/ · $/, '');
  const show = BRAND.shows.find(([, n]) => norm(n) === norm(EP.series));
  const env = TL ? (t => { const e = TL.env || [], i = Math.floor(t * 30); let s = 0, n = 0; for (let k = -2; k <= 1; k++) if (e[i + k] != null) { s += e[i + k]; n++; } return n ? s / n : 0; }) : () => 0;

  // ---------- 胸牌：挂绳 + 金属夹 + 卡片，绕夹子转 ang。w 为卡片宽，top 为夹子下沿 ----------
  function badge(cx, top, w, ang, o = {}) {
    const c = R.ctx, h = w * 1.45, s = w / 600, Hs = BRAND.host;
    c.save(); c.translate(cx, top); c.rotate(ang);
    if (o.strap !== false) {
      const reach = o.reach ?? top + 60;
      for (const sx of [-1, 1]) {
        c.save(); c.beginPath(); c.moveTo(sx * 46 * s, -40 * s); c.lineTo(sx * 150 * s, -reach); c.lineTo(sx * 230 * s, -reach); c.lineTo(sx * 96 * s, -40 * s); c.closePath();
        c.fillStyle = K.lime; c.fill(); c.clip();
        c.translate(sx * 70 * s, -40 * s); c.rotate(Math.atan2(-reach, sx * 130 * s) + (sx > 0 ? 0 : Math.PI));
        txt('CN SUPPLY CHAIN SIGNAL · '.repeat(10), -1800, 8 * s, { font: font(F.mono, Math.round(22 * s), 700), fill: K.ink, ls: 3 });
        c.restore();
      }
    }
    const cg = c.createLinearGradient(-60 * s, 0, 60 * s, 0); cg.addColorStop(0, '#6d7275'); cg.addColorStop(.5, '#d9dde0'); cg.addColorStop(1, '#73787b');
    c.fillStyle = cg; c.beginPath(); c.roundRect(-52 * s, -54 * s, 104 * s, 74 * s, 10 * s); c.fill();
    c.fillStyle = '#2a2d2f'; c.beginPath(); c.roundRect(-26 * s, -40 * s, 52 * s, 16 * s, 8 * s); c.fill();
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50 * s; c.shadowOffsetY = 24 * s;
    rrect(-w / 2, 0, w, h, 22 * s, { fill: '#F4F1E8' }); c.restore();
    c.save(); c.beginPath(); c.roundRect(-w / 2, 0, w, h, 22 * s); c.clip();
    rrect(-w / 2, 0, w, 150 * s, 0, { fill: K.ink });
    rrect(-60 * s, 26 * s, 120 * s, 22 * s, 11 * s, { fill: '#F4F1E8' });
    txt('SHENZHEN · CN', -w / 2 + 40 * s, 118 * s, { font: font(F.mono, Math.round(26 * s), 700), fill: K.lime, ls: 4 * s });
    txt(o.tag ?? EP.week ?? '', w / 2 - 40 * s, 118 * s, { font: font(F.mono, Math.round(26 * s), 700), fill: 'rgba(241,238,230,.6)', ls: 3 * s, align: 'right' });
    // 头像区：不露脸，首字母压在料盘轮廓上
    const py = 330 * s, pr = 130 * s;
    circle(0, py, pr, { fill: K.ink });
    for (let i = 0; i < 4; i++) { const a0 = i * TAU / 4 + .25; c.beginPath(); c.arc(0, py, pr * .86, a0, a0 + .95); c.arc(0, py, pr * .52, a0 + .95, a0, true); c.closePath(); c.fillStyle = 'rgba(241,238,230,.08)'; c.fill(); }
    circle(0, py, pr * .36, { stroke: 'rgba(241,238,230,.18)', lw: 3 * s });
    txt(Hs.name[0], 0, py + 62 * s, { font: font(F.cond, Math.round(180 * s)), fill: K.lime, align: 'center' });
    txt(Hs.name, 0, 650 * s, { font: font(F.cond, Math.round(190 * s)), fill: K.ink, align: 'center' });
    txt(Hs.role, 0, 712 * s, { font: font(F.mono, Math.round(30 * s), 700), fill: K.ink, ls: 5 * s, align: 'center' });
    txt(Hs.place, 0, 756 * s, { font: font(F.mono, Math.round(22 * s), 700), fill: 'rgba(14,15,14,.5)', ls: 4 * s, align: 'center' });
    barcode(-w / 2 + 40 * s, 784 * s, 300 * s, 30 * s, 7);
    rrect(-w / 2, h - 66 * s, w, 66 * s, 0, { fill: K.lime });
    txt(Hs.footer, 0, h - 22 * s, { font: font(F.mono, Math.round(24 * s), 700), fill: K.ink, ls: 4 * s, align: 'center' });
    c.restore();
    c.restore();
    return h;
  }

  // ---------- 常驻：字幕左侧的小胸牌 + 声纹 ----------
  R.setHost(t => {
    const e = env(t);
    badge(132, LAY.subY - 18, 116, Math.sin(t * 1.3) * .035 + e * .02, { strap: false });
    for (let i = 0; i < 9; i++) { const v = env(t - i * .04) * (.45 + .55 * hash(i + 3)); rrect(80 + i * 12, LAY.subY + 176 - v * 20, 6, 4 + v * 20, 3, { fill: K.lime }); }
  });

  // ---------- 自我介绍：胸牌从上方甩进来，阻尼摆动，结束前收起 ----------
  function intro(t, t0, t1, o = {}) {
    R.bg(K.ink);
    const c = R.ctx; c.save(); c.strokeStyle = 'rgba(241,238,230,.035)'; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x < W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y < H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); c.restore();
    const u = t - t0, drop = easeOut(seg(u, 0, .55)), lift = easeIn(seg(t, t1 - .45, t1));
    const top = lerp(-1000, 300, drop) - lift * 1300;
    const ang = .32 * Math.exp(-u * 2.6) * Math.cos(u * 7.5 + .4) + Math.sin(u * 1.1) * .012;
    badge(W / 2, top, 560, ang, { reach: top + 80 });
    const k = seg(u, .7, 1.0) * (1 - lift);
    if (show) txt(`${show[1]} · EVERY ${DAY[show[0]]}`, W / 2, 1255, { font: font(F.mono, 28, 700), fill: K.lime, ls: 5, align: 'center', a: k });
    txt('PEN NAME · AI VOICE · HUMAN-CHECKED NUMBERS', W / 2, 1305, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.45)', ls: 3, align: 'center', a: k });
    if (o.after) o.after(t, k);
  }

  // ---------- 角标 ----------
  function hud(t, o = {}) {
    R.hud(t, { ...o, tl: null, tr: o.tr ?? dateline, bl: o.bl });
    const dark = o.dark !== false, k = o.k ?? 1, a = clamp(k * 1.4 - .3), m = 40;
    if (a <= 0) return;
    const col = dark ? 'rgba(241,238,230,.85)' : 'rgba(14,15,14,.85)', dim = dark ? 'rgba(241,238,230,.5)' : 'rgba(14,15,14,.5)';
    circle(m + 30, m + 69, 7, { fill: dark ? K.lime : K.ink, a });
    txt(BRAND.name, m + 46, m + 76, { font: font(F.mono, 21, 700), fill: col, ls: 3, a });
    if (o.tl) txt(o.tl, m + 46, m + 106, { font: font(F.mono, 19, 500), fill: dim, ls: 3, a });
  }

  // ---------- 片尾卡：大胸牌 + 找料入口 + 排期 + 来源 ----------
  function endCard(t, t0, o = {}) {
    R.bg(K.ink);
    const k = d => seg(t, t0 + d, t0 + d + .35), u = t - t0;
    // 胸牌挂在右上，轻微摆动
    const drop = easeOut(seg(u, 0, .5));
    badge(870, lerp(-700, 250, drop), 290, .18 * Math.exp(-u * 2.4) * Math.cos(u * 7) - .04, { reach: 320 });
    const title = norm(EP.series) + '.', size = Math.min(150, Math.floor(150 * 560 / measure(title, font(F.cond, 150))));
    dropWord(title, ML, 400, font(F.cond, size), t0 + .15, t, { fill: K.cream, fall: 140, stag: .025, fillAt: i => i === title.length - 1 ? K.lime : undefined });
    if (show) txt(`EVERY ${DAY[show[0]]}`, ML, 462, { font: font(F.mono, 28, 700), fill: K.lime, ls: 6, a: k(.4) });
    BRAND.shows.forEach(([d, n], i) => {
      const y = 560 + i * 54, on = show && show[1] === n, a = k(.5 + i * .08);
      if (on) rrect(ML - 14, y - 36, 560, 50, 4, { fill: 'rgba(221,245,61,.14)', a });
      txt(d, ML, y, { font: font(F.mono, 26, 700), fill: on ? K.lime : 'rgba(241,238,230,.5)', ls: 4, a });
      txt(n, ML + 100, y, { font: font(F.mono, 26, 700), fill: on ? K.cream : 'rgba(241,238,230,.5)', ls: 4, a });
    });
    let y = 820;
    if (o.cta !== false) {
      const kk = easeOut(k(.8));
      rrect(ML, y, CW * kk, 190, 8, { fill: K.lime });
      BRAND.cta.forEach((s, i) => txt(s, ML + 32, y + 72 + i * 56, { font: font(F.cond, 56), fill: K.ink, a: seg(kk, .6, 1) }));
      txt(`— ${BRAND.host.name} · ${BRAND.ctaWhere}`, ML + 32, y + 166, { font: font(F.mono, 19, 700), fill: 'rgba(14,15,14,.7)', ls: 2, a: seg(kk, .7, 1) });
      y += 250;
    }
    if (o.sources?.length) {
      txt('SOURCES', ML, y, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.5)', ls: 4, a: k(1.1) });
      o.sources.slice(0, 4).forEach((s, i) => txt(s, ML, y + 38 + i * 34, { font: font(F.mono, 21, 500), fill: 'rgba(241,238,230,.85)', a: k(1.15 + i * .06) }));
    }
    txt('LEO IS A PEN NAME · AI-GENERATED VOICE & VISUALS', ML, 1405, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.5)', ls: 2, a: k(1.3) });
  }

  // ---------- 一线笔记：只用于 LEO 本人得到的信息，n: { date, who, text } ----------
  function fieldNote(x, y, w, n, kIn) {
    if (kIn <= 0) return;
    const g = R.ctx, kk = backOut(kIn), lines = Array.isArray(n.text) ? n.text : [n.text], h = 120 + lines.length * 62;
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-.02); g.scale(kk, kk); g.translate(-(x + w / 2), -(y + h / 2));
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
    rrect(x, y, w, h, 4, { fill: '#FBF7EA' }); g.shadowColor = 'transparent';
    rrect(x, y, 12, h, 0, { fill: K.lime });
    txt(`FIELD NOTE · ${BRAND.host.name} · ${n.date || ''}`, x + 36, y + 48, { font: font(F.mono, 20, 700), fill: 'rgba(14,15,14,.6)', ls: 3 });
    lines.forEach((s, i) => txt(s, x + 36, y + 112 + i * 62, { font: `italic 54px ${F.serif}`, fill: K.ink }));
    if (n.who) txt(n.who, x + 36, y + h - 24, { font: font(F.mono, 18, 700), fill: 'rgba(14,15,14,.5)', ls: 2 });
    g.restore();
  }

  return { hud, intro, endCard, badge, fieldNote, dateline, BRAND };
}
