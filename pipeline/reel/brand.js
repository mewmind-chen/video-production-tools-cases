// 频道品牌层：所有栏目、所有期共用，让人设在每条视频里都看得见。规则见 content-system/persona.md 第 7 节。
// 1. 左上角频道标识（两行：频道名 / 栏目与期数）
// 2. 右上角深圳电头（SHENZHEN · 日期）
// 3. 字幕旁的 AI 主播标 "AI VOICE"（在 engine.js 的 subtitle 里）
// 4. 统一片尾卡：栏目、一周排期、Human-sourced. AI-narrated.、找料入口、来源
// 5. 一线笔记卡：你本人在华强北问到、看到的东西，用它标出来，和公开报道区分开
import { K, F, LAY, W, clamp, seg, lerp, easeOut, backOut, font } from './engine.js';

export const BRAND = {
  name: 'CHINA SUPPLY CHAIN SIGNAL',
  city: 'SHENZHEN',
  motto: 'HUMAN-SOURCED. AI-NARRATED.',
  shows: [['MON', 'NEWS DECODER'], ['WED', 'MARKET PULSE'], ['FRI', 'BUYER’S PLAYBOOK']],
  cta: ['PART YOU CAN’T FIND?', 'SEND US THE PART NUMBER.'],
  ctaWhere: 'DM ON LINKEDIN · CHINA SUPPLY CHAIN SIGNAL',
};

const showOf = series => BRAND.shows.find(([, n]) => n.replace('’', "'") === String(series || '').toUpperCase().replace('’', "'"));

export function createBrand(R, EP) {
  const { txt, measure, rrect, circle, chip, dropWord, line } = R;
  const ML = LAY.ml, MR = LAY.mr, CW = MR - ML;
  const dateline = `${BRAND.city} · ${(EP.date || '').replace(/^[A-Z]{3} /, '')}`.replace(/ · $/, '');
  const show = showOf(EP.series);

  // 角标：tl 第二行写栏目与期数，tr 默认是深圳电头
  function hud(t, o = {}) {
    R.hud(t, { ...o, tl: null, tr: o.tr ?? dateline, bl: o.bl ?? BRAND.motto });
    const dark = o.dark !== false, k = o.k ?? 1, a = clamp(k * 1.4 - .3), m = 40;
    if (a <= 0) return;
    const col = dark ? 'rgba(241,238,230,.85)' : 'rgba(14,15,14,.85)', dim = dark ? 'rgba(241,238,230,.5)' : 'rgba(14,15,14,.5)';
    circle(m + 30, m + 69, 7, { fill: dark ? K.lime : K.ink, a });
    txt(BRAND.name, m + 46, m + 76, { font: font(F.mono, 21, 700), fill: col, ls: 3, a });
    if (o.tl) txt(o.tl, m + 46, m + 106, { font: font(F.mono, 19, 500), fill: dim, ls: 3, a });
  }

  // 片尾卡：t0 起依次出现。o.sources 为来源列表，o.cta === false 时不放找料入口
  function endCard(t, t0, o = {}) {
    R.bg(K.ink);
    const k = d => seg(t, t0 + d, t0 + d + .35);
    chip(BRAND.name, ML, 300, { k: k(0), bg: 'rgba(241,238,230,.1)', fg: K.cream, font: font(F.mono, 22, 700), ls: 3, h: 48 });
    const title = (EP.series || '').toUpperCase() + '.', size = Math.min(170, Math.floor(170 * CW / measure(title, font(F.cond, 170))));
    dropWord(title, ML, 500, font(F.cond, size), t0 + .1, t, { fill: K.cream, fall: 140, stag: .025, fillAt: i => i === title.length - 1 ? K.lime : undefined });
    if (show) txt(`EVERY ${({ MON: 'MONDAY', WED: 'WEDNESDAY', FRI: 'FRIDAY' })[show[0]]}`, ML, 570, { font: font(F.mono, 30, 700), fill: K.lime, ls: 6, a: k(.4) });
    // 一周排期，本栏目高亮
    BRAND.shows.forEach(([d, n], i) => {
      const y = 660 + i * 58, on = show && show[1] === n, a = k(.55 + i * .08);
      if (on) rrect(ML - 14, y - 38, CW + 28, 52, 4, { fill: 'rgba(221,245,61,.14)', a });
      txt(d, ML, y, { font: font(F.mono, 28, 700), fill: on ? K.lime : 'rgba(241,238,230,.5)', ls: 4, a });
      txt(n, ML + 110, y, { font: font(F.mono, 28, 700), fill: on ? K.cream : 'rgba(241,238,230,.5)', ls: 4, a });
    });
    // 找料入口：人设里最重要的一句
    let y = 900;
    if (o.cta !== false) {
      const kk = easeOut(k(.9));
      rrect(ML, y, CW * kk, 176, 8, { fill: K.lime });
      BRAND.cta.forEach((s, i) => txt(s, ML + 32, y + 66 + i * 52, { font: font(F.cond, 50), fill: K.ink, a: seg(kk, .6, 1) }));
      txt(BRAND.ctaWhere, ML + 32, y + 152, { font: font(F.mono, 19, 700), fill: 'rgba(14,15,14,.7)', ls: 2, a: seg(kk, .7, 1) });
      y += 230;
    }
    if (o.sources?.length) {
      txt('SOURCES', ML, y, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.5)', ls: 4, a: k(1.1) });
      o.sources.slice(0, 4).forEach((s, i) => txt(s, ML, y + 38 + i * 34, { font: font(F.mono, 21, 500), fill: 'rgba(241,238,230,.85)', a: k(1.15 + i * .06) }));
    }
    txt(`${BRAND.motto}  ·  AI-GENERATED VOICE & VISUALS`, ML, 1405, { font: font(F.mono, 19, 700), fill: 'rgba(241,238,230,.5)', ls: 2, a: k(1.3) });
  }

  // 一线笔记：只用于你本人得到的信息（例如自己问到的报价），fields: { date, who, text }
  function fieldNote(x, y, w, n, kIn) {
    if (kIn <= 0) return;
    const g = R.ctx, kk = backOut(kIn), lines = Array.isArray(n.text) ? n.text : [n.text], h = 120 + lines.length * 62;
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-.02); g.scale(kk, kk); g.translate(-(x + w / 2), -(y + h / 2));
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 24; g.shadowOffsetY = 10;
    rrect(x, y, w, h, 4, { fill: '#FBF7EA' }); g.shadowColor = 'transparent';
    rrect(x, y, 12, h, 0, { fill: K.lime });
    txt(`FIELD NOTE · ${BRAND.city} · ${n.date || ''}`, x + 36, y + 48, { font: font(F.mono, 20, 700), fill: 'rgba(14,15,14,.6)', ls: 3 });
    lines.forEach((s, i) => txt(s, x + 36, y + 112 + i * 62, { font: `italic 54px ${F.serif}`, fill: K.ink }));
    if (n.who) txt(n.who, x + 36, y + h - 24, { font: font(F.mono, 18, 700), fill: 'rgba(14,15,14,.5)', ls: 2 });
    g.restore();
  }

  return { hud, endCard, fieldNote, dateline, BRAND };
}
