// 渲染前的自动检查：node pipeline/check.mjs episodes/<id>
// 有 ✗ 错误时退出码为 1（make.sh 会停下，不渲染）；⚠ 警告不拦，但要看一眼。
// 检查：日期 / 星期 / 周数、固定台词、台词编号引用、各栏目的必填字段和文字长度、念法、时长、FACTS.md。
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';

const dir = resolve(process.argv[2] || '.');
const errs = [], warns = [], infos = [];
const E = (where, msg) => errs.push(`✗ ${where}：${msg}`);
const Wn = (where, msg) => warns.push(`⚠ ${where}：${msg}`);

let ep;
try { ep = JSON.parse(readFileSync(join(dir, 'episode.json'), 'utf8')); }
catch (e) { console.log(`✗ episode.json 读不出来：${e.message}`); process.exit(1); }
const SC = ep.scenes || [];
const lineText = l => typeof l === 'string' ? l : l?.text ?? '';
const lineSay = l => typeof l === 'string' ? l : l?.say ?? l?.text ?? '';
const where = i => `场景 ${i}（${SC[i]?.type}）`;

// ---------- 栏目、日期、周数 ----------
const SHOWS = { 'News Decoder': ['news-decoder', 'MON', 'Monday'], 'Market Pulse': ['market-pulse', 'WED', 'Wednesday'], "Buyer's Playbook": ['playbook', 'FRI', 'Friday'] };
const show = SHOWS[ep.series];
if (!show) E('series', `"${ep.series}" 不是三个栏目之一（${Object.keys(SHOWS).join(' / ')}）`);
if (basename(dir) !== 'example' && ep.id !== basename(dir)) E('id', `"${ep.id}" 和文件夹名 "${basename(dir)}" 不一致`);
if (show && ep.format && ep.format !== show[0]) E('format', `${ep.series} 应该用 "${show[0]}"，现在是 "${ep.format}"`);
if (show && !ep.format) Wn('format', '没有写 format，按单独制作的一期处理，只做通用检查');

const MON = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const m = /^([A-Z]{3}) (\d{1,2}) ([A-Z]{3}) (\d{4})$/.exec(ep.date || '');
if (!m) E('date', `"${ep.date}" 格式应为 "MON 19 OCT 2026"`);
else {
  const d = new Date(Date.UTC(+m[4], MON[m[3]], +m[2]));
  if (DOW[d.getUTCDay()] !== m[1]) E('date', `${m[2]} ${m[3]} ${m[4]} 是 ${DOW[d.getUTCDay()]}，不是 ${m[1]}`);
  if (show && m[1] !== show[1]) E('date', `${ep.series} 每周 ${show[1]} 发布，日期却是 ${m[1]}`);
  const t = new Date(d); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const wk = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  if (!ep.week) Wn('week', `没写周数（应为 "WK ${wk}"）`);
  else if (ep.week !== `WK ${wk}`) E('week', `${ep.date} 是 ISO 第 ${wk} 周，应写 "WK ${wk}"，现在是 "${ep.week}"`);
}

// ---------- 固定台词 ----------
const INTRO = "I'm Leo. I trade components in Shenzhen.";
if (SC[1]?.type !== 'intro') E('场景 1', '第二个场景必须是 intro（LEO 自我介绍）');
else if ((SC[1].lines || []).length !== 1 || lineText(SC[1].lines[0]) !== INTRO) E('场景 1（intro）', `只能有一句固定台词："${INTRO}"`);
const last = SC[SC.length - 1];
if (last?.type !== 'outro') (ep.format ? E : Wn)('最后一个场景', '必须是 outro');
else if (show) {
  const want = `${ep.series}. Every ${show[2]}. Sources in the caption.`, got = lineText((last.lines || [])[last.lines.length - 1]);
  if (got !== want) E(`场景 ${SC.length - 1}（outro）`, `最后一句应为 "${want}"，现在是 "${got}"`);
}

// ---------- 台词：念法、长度 ----------
const SPOKEN_AS_WORD = new Set(['APEC', 'NAND', 'DRAM', 'ASEAN', 'NATO', 'MOFCOM', 'LEO', 'CNY']);
SC.forEach((sc, i) => (sc.lines || []).forEach((l, n) => {
  const tx = lineText(l), say = lineSay(l), w = `${where(i)} 第 ${n} 句`;
  if (!tx.trim()) E(w, '台词是空的');
  if (tx.length > 140) Wn(w, `字幕 ${tx.length} 个字符，偏长（建议 ≤ 140），考虑拆成两句`);
  const sayNum = say.replace(/\bQ[1-4]\b/g, '');   // Q1–Q4 念得对，不算
  if (/\d/.test(sayNum)) Wn(w, `念法里有数字 "${sayNum.match(/[\d.,%]+/)[0]}"，Kokoro 可能念错，建议写成英文单词（在 say 里改）`);
  const ac = (say.match(/\b[A-Z][A-Z0-9]{2,}\b/g) || []).filter(a => !SPOKEN_AS_WORD.has(a));
  if (ac.length) Wn(w, `念法里有缩写 ${[...new Set(ac)].join(', ')}，需要逐个字母念的写成 "M-L-C-C" 这种形式`);
}));

// ---------- 台词编号引用 ----------
function walk(o, fn, path = '') { if (Array.isArray(o)) o.forEach((v, k) => walk(v, fn, `${path}[${k}]`)); else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { fn(k, v, `${path}.${k}`); walk(v, fn, `${path}.${k}`); } }
SC.forEach((sc, i) => {
  const nl = (sc.lines || []).length;
  walk(sc.visual || {}, (k, v, p) => {
    if ((k === 'line' || /Line$/.test(k)) && typeof v === 'number' && (v < 0 || v >= nl || !Number.isInteger(v))) E(`${where(i)} visual${p}`, `= ${v}，但这个场景只有 ${nl} 句台词（编号从 0 开始）`);
    if ((k === 'at' || /At$/.test(k)) && typeof v === 'number' && (v < 0 || v > 1)) E(`${where(i)} visual${p}`, `= ${v}，必须在 0–1 之间`);
  });
});

// ---------- 各栏目的结构和文字长度 ----------
const len = (s, max, w, hard = false) => { if (typeof s === 'string' && s.length > max) (hard ? E : Wn)(w, `"${s}" ${s.length} 个字符，超过 ${max}，画面上可能放不下`); };
const need = (v, keys, w) => keys.forEach(k => { if (v?.[k] == null) E(w, `缺少 visual.${k}`); });
const actionsCheck = (v, w) => { need(v, ['title', 'items'], w); (v.items || []).forEach((it, k) => { len(it.head, 28, `${w} items[${k}].head`); len(it.sub, 72, `${w} items[${k}].sub`); len(it.tag, 14, `${w} items[${k}].tag`); }); if ((v.items || []).length > 3) E(w, '最多 3 张卡'); };
const types = SC.map(s => s.type);

if (ep.format === 'market-pulse') {
  const ORDER = ['open', 'intro', 'spot', 'contract', 'street', 'actions', 'outro'];
  if (types.join() !== ORDER.join()) E('场景顺序', `Market Pulse 必须是 ${ORDER.join(' → ')}，现在是 ${types.join(' → ')}`);
  SC.forEach((sc, i) => { const v = sc.visual || {}, w = where(i);
    if (sc.type === 'open') { need(v, ['kicker', 'from', 'to', 'after', 'source'], w); len(v.kicker, 44, `${w} kicker`); (v.after || []).forEach((s, k) => len(s, 14, `${w} after[${k}]`)); }
    if (sc.type === 'spot') { need(v, ['title', 'yMax', 'yStep', 'months', 'points', 'source'], w); (v.points || []).forEach((p, k) => { if (p.v > v.yMax || p.v2 > v.yMax) E(`${w} points[${k}]`, `数值超过 yMax ${v.yMax}`); len(p.label, 14, `${w} points[${k}].label`); }); }
    if (sc.type === 'contract') { need(v, ['title', 'kicker', 'bars', 'quote', 'final', 'source'], w); if ((v.bars || []).length > 5) E(w, 'bars 最多 5 根'); len(v.quote, 30, `${w} quote`); }
    if (sc.type === 'street') { need(v, ['label', 'quote', 'attribution', 'years', 'range'], w); (v.quote || []).forEach((s, k) => len(s, 22, `${w} quote[${k}]`)); }
    if (sc.type === 'actions') actionsCheck(v, w);
  });
  (ep.ticker || []).forEach((t, k) => { if (!Array.isArray(t) || t.length !== 3) E(`ticker[${k}]`, '格式应为 [名称, 数值, "up"/"down"]'); });
}

if (ep.format === 'news-decoder') {
  const OK = new Set(['open', 'intro', 'what', 'rules', 'bom', 'date2', 'calendar', 'actions', 'unknown', 'outro']);
  types.forEach((t, i) => { if (!OK.has(t)) E(where(i), `News Decoder 没有 "${t}" 这种场景`); });
  ['open', 'intro', 'what', 'actions', 'unknown', 'outro'].forEach(t => { if (!types.includes(t)) E('场景', `缺少必须的 ${t}`); });
  if (types[0] !== 'open' || types[2] !== 'what') E('场景顺序', '前三个必须是 open → intro → what');
  if (new Set(types).size !== types.length) E('场景', '每种场景最多出现一次');
  SC.forEach((sc, i) => { const v = sc.visual || {}, w = where(i);
    if (sc.type === 'open') { need(v, ['kicker', 'from', 'to', 'tail'], w); (v.tail || []).forEach((s, k) => len(s, 20, `${w} tail[${k}]`)); }
    if (sc.type === 'what') { need(v, ['stamp', 'headline', 'from', 'to', 'delta', 'source'], w); (v.headline || []).forEach((s, k) => len(s, 18, `${w} headline[${k}]`)); if ((v.headline || []).length > 3) E(w, 'headline 最多 3 行'); }
    if (sc.type === 'rules') { need(v, ['paused', 'active', 'source'], w); (v.paused?.items || []).forEach((s, k) => len(s, 40, `${w} paused.items[${k}]`)); if ((v.active?.tiles || []).length > 8) E(w, 'active.tiles 最多 8 个'); len(v.active?.note, 44, `${w} active.note`); }
    if (sc.type === 'bom') { need(v, ['links'], w); if ((v.links || []).length > 2) E(w, 'links 最多 2 组'); (v.links || []).forEach((L, k) => { if (!['mlcc', 'magnet'].includes(L.icon)) E(`${w} links[${k}].icon`, '只有 mlcc、magnet 两种'); len(L.part, 18, `${w} links[${k}].part`); }); }
    if (sc.type === 'date2') { need(v, ['date', 'tiles', 'label'], w); if ((v.tiles || []).length > 3) E(w, 'tiles 最多 3 个'); }
    if (sc.type === 'calendar') { need(v, ['start', 'end'], w); [...(v.markers || []), ...(v.bands || [])].forEach((m2, k) => { len(m2.label, 22, `${w} 标记 ${k} label`); const ds = [m2.date, m2.from, m2.to].filter(Boolean); ds.forEach(d => { if (d < v.start || d > v.end) E(`${w} 标记 ${k}`, `日期 ${d} 不在 ${v.start}–${v.end} 范围内`); }); }); }
    if (sc.type === 'actions') actionsCheck(v, w);
    if (sc.type === 'unknown') { need(v, ['question', 'answer', 'watch'], w); (v.watch || []).forEach((s, k) => len(s, 18, `${w} watch[${k}]`)); }
  });
}

if (ep.format === 'playbook') {
  const steps = SC.filter(s => s.type === 'step').length;
  if (types[0] !== 'open' || types[2] !== 'why') E('场景顺序', '前三个必须是 open → intro → why');
  if (steps < 3 || steps > 5) E('step', `需要 3–5 个 step，现在 ${steps} 个`);
  if (types[types.length - 2] !== 'recap') E('场景顺序', '倒数第二个必须是 recap');
  const KINDS = { photo: [], code: ['code', 'parts'], label: ['title', 'rows'], doc: ['title', 'rows'], compare: ['good', 'bad'] };
  SC.forEach((sc, i) => { const v = sc.visual || {}, w = where(i);
    if (sc.type === 'open') { need(v, ['big'], w); len(v.bubble?.text, 40, `${w} bubble.text`); (v.big || []).forEach((s, k) => len(s, 14, `${w} big[${k}]`)); (v.chips || []).forEach((s, k) => len(s, 26, `${w} chips[${k}]`)); if ((v.chips || []).length > 2) E(w, 'chips 最多 2 个'); }
    if (sc.type === 'why') { need(v, ['value', 'label', 'source'], w); len(String(v.value ?? ''), 4, `${w} value`, true); len(v.label, 80, `${w} label`); }
    if (sc.type === 'step') {
      need(v, ['title', 'visual', 'tag'], w); (v.title || []).forEach((s, k) => len(s, 12, `${w} title[${k}]`)); len(v.tag, 34, `${w} tag`);
      if ((sc.lines || []).length !== 2) Wn(w, `建议正好 2 句台词（做法 + 能抓住什么），现在 ${(sc.lines || []).length} 句`);
      const vis = v.visual || {}, kk = KINDS[vis.kind];
      if (!kk) E(`${w} visual.kind`, `"${vis.kind}" 不存在，只有 ${Object.keys(KINDS).join(' / ')}`); else need(vis, kk, `${w} visual.visual`);
      if (vis.kind === 'label' && (vis.rows || []).length > 4) E(w, 'label 最多 4 行');
      if (vis.kind === 'doc' && (vis.rows || []).length > 5) E(w, 'doc 最多 5 行');
      (vis.rows || []).forEach(([a, b], k) => len(`${a}  ${b}`, 28, `${w} rows[${k}]`));
      ['good', 'bad'].forEach(side => { (vis[side]?.items || []).forEach((s, k) => len(s, 26, `${w} ${side}.items[${k}]`)); if ((vis[side]?.items || []).length > 3) E(w, `${side} 最多 3 条`); });
      if (vis.kind === 'code') len(vis.code, 6, `${w} code`, true);
    }
    if (sc.type === 'recap') { need(v, ['items'], w); if ((v.items || []).length !== steps) Wn(w, `清单 ${v.items?.length} 项，和 step 数 ${steps} 不一致`); (v.items || []).forEach((s, k) => len(s, 26, `${w} items[${k}]`)); }
  });
}

// ---------- 时长 ----------
const tlPath = join(dir, 'build/timeline.json');
if (existsSync(tlPath) && statSync(tlPath).mtimeMs >= statSync(join(dir, 'episode.json')).mtimeMs) {
  const dur = JSON.parse(readFileSync(tlPath, 'utf8')).duration;
  if (dur > 92 || dur < 55) E('时长', `${dur.toFixed(1)} 秒，必须在 60–90 秒（删台词，不要加快语速）`); else if (dur > 90 || dur < 60) Wn('时长', `${dur.toFixed(1)} 秒，略超出 60–90 秒`);
  else infos.push(`时长 ${dur.toFixed(1)} 秒`);
} else {
  const words = SC.flatMap(s => (s.lines || []).map(lineSay)).join(' ').split(/\s+/).filter(Boolean).length;
  const est = words / 2.75 + SC.length * .9 + SC.reduce((a, s) => a + (s.hold || 0), 0);
  if (est > 92) Wn('时长（估算）', `约 ${est.toFixed(0)} 秒，可能超过 90 秒，配音后再看`); else infos.push(`时长估算约 ${est.toFixed(0)} 秒（配音后以实际为准）`);
}

// ---------- FACTS.md / PUBLISH.md ----------
if (basename(dir) !== 'example') {
  const fp = join(dir, 'FACTS.md');
  if (!existsSync(fp)) E('FACTS.md', '没有事实核对表，不能制作');
  else { const rows = readFileSync(fp, 'utf8').split('\n').filter(l => l.startsWith('|'));
    const bad = rows.filter(l => /\|\s*❌\s*\|/.test(l)); if (bad.length) E('FACTS.md', `有 ${bad.length} 条标为 ❌，必须从视频里删掉，并从表里移除或改状态`);
    const wn = rows.filter(l => /\|\s*⚠️/.test(l)).length; if (wn) Wn('FACTS.md', `${wn} 条 ⚠️，发布前要用户确认`); }
  if (!existsSync(join(dir, 'PUBLISH.md'))) Wn('PUBLISH.md', '还没有发布文案');
}

// ---------- 输出 ----------
console.log(`检查 ${basename(dir)} · ${ep.series || '?'} · ${ep.date || '?'}`);
[...errs, ...warns].forEach(s => console.log('  ' + s));
infos.forEach(s => console.log('  · ' + s));
console.log(errs.length ? `\n${errs.length} 个错误，先改再渲染。` : `\n没有错误${warns.length ? `（${warns.length} 个警告，看一眼）` : ''}。`);
process.exit(errs.length ? 1 : 0);
