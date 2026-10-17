// News Decoder 的配乐与音效：120 BPM，Em C G D，比 Market Pulse 克制（新闻栏目）。读取与画面相同的 cues.mjs。
// 声音标识：电报机嘀嗒 + 两声上行提示音，在钩子之后的胸牌落定时出现，每期一样。
// 用法：node pipeline/formats/news-decoder/music.mjs episodes/<id> → episodes/<id>/build/music.wav
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSynth } from '../../synth.mjs';
import { cues } from './cues.mjs';

const dir = resolve(process.argv[2] || '.');
const EP = JSON.parse(readFileSync(dir + '/episode.json', 'utf8'));
const TL = JSON.parse(readFileSync(dir + '/build/timeline.json', 'utf8'));
const C = cues(EP, TL), S = C.S, E = C.E, at = C.at, BEAT = .5;
const V = Object.fromEntries(EP.scenes.map(s => [s.type, s.visual || {}]));
const when = (k, o) => at(k, o.line ?? 0, o.at ?? 0);
const M = createSynth(C.dur);

const CH = [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]];   // Em C G D
const ROOT = [40, 36, 43, 38];
const barOf = t => Math.floor(t / 2);
const wire = (t, n = 10) => { for (let i = 0; i < n; i++) M.tick(t + i * .055 + (i % 3 === 2 ? .03 : 0), .55 + .3 * (i % 2)); };
const chime = (t, v = 1) => { M.blip(t, 88, .8 * v); M.blip(t + .14, 95, .8 * v); };

// ---- 钩子：撕页
if (S.open != null) {
  const tStrike = at('open', 0, .12), tFall = at('open', 0, .5);
  M.pad(0, [52, 59, 64], at('open', 1, 0), .6);
  M.softImpact(S.open + .1, .7);
  M.buzz(tStrike + .05, .3, .5);
  M.glide(tFall, .7, 76, 64, .5); M.impact(tFall + .55, .9); M.stab(tFall + .55, [64, 67, 71, 76], .8);
  M.kick(at('open', 1, 0) + .05, .7); M.kick(at('open', 1, 0) + .3, .6);
}
// ---- 自我介绍：栏目声音标识
if (S.intro != null) { wire(S.intro + .05); M.softImpact(S.intro + .55, .8); chime(S.intro + .6); M.bloom(S.intro + .65, [64, 71, 76], .6); }

// ---- 律动：新闻段开始，片尾前收住；"不知道"那段只留铺底
const g0 = S.what ?? S.intro, g1 = S.unknown ?? S.outro;
for (let t = Math.ceil(g0 / BEAT) * BEAT; t < g1; t += BEAT) {
  const b = Math.round(t / BEAT), beatIn = b % 4, ch = barOf(t) % 4;
  const full = S.calendar != null && t >= S.calendar;
  M.kick(t, beatIn === 0 ? .85 : (beatIn === 2 ? .6 : 0));
  if (beatIn === 1 || beatIn === 3) M.clap(t, full ? .5 : .35);
  M.hat(t + BEAT / 2, .4);
  M.bass(t, ROOT[ch] + 12, BEAT * .4, .6);
  for (let s2 = 0; s2 < 4; s2 += full ? 1 : 2) M.pluck(t + s2 * BEAT / 4, CH[ch][(b * 4 + s2) % 3] + 12, .26, s2 % 2 ? .35 : -.35);
  if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .4);
}
if (S.unknown != null) { M.pad(S.unknown, [52, 59, 64, 71], E.unknown - S.unknown, .5); M.softImpact(S.unknown + .05, .6); }

// ---- 各场景命中点
if (S.what != null) { M.pop(S.what + .4, .7); M.lock(S.what + .65, .7); M.glide(at('what', V.what.slideLine ?? 1, 0), .9, 64, 76, .5); M.blip(at('what', 0, .65), 93, .5); }
if (S.rules != null) {
  const r = V.rules; M.softImpact(S.rules, .6);
  [0, 1, 2].forEach(i => M.tick(when('rules', r.paused) + .3 + i * .15, .6));
  (r.active.tiles || []).forEach((_, i) => M.blip(when('rules', r.active) + .2 + i * .09, 79 + i * 2, .55, -.5 + i * .16));
  M.buzz(at('rules', r.active.noteLine ?? 1, r.active.noteAt ?? 0), .3, .5);
}
if (S.bom != null) V.bom.links.forEach((L, i) => { const t = when('bom', L); M.pop(t, .7); M.glide(t + .3, .4, 72, 79, .4); M.lock(t + .6, .6); });
if (S.date2 != null) { M.impact(S.date2 + .4, .7); V.date2.tiles.forEach((_, i) => M.blip(S.date2 + .5 + i * .12, 84 + i * 3, .6)); }
if (S.calendar != null) (V.calendar.markers || []).concat(V.calendar.bands || []).forEach(m => M.blip(when('calendar', m), m.hot || m.tone === 'red' ? 76 : 88, .6));
if (S.calendar != null) { const lime = (V.calendar.bands || []).find(b => b.tone === 'lime'); if (lime) { const t = when('calendar', lime) + .4; M.impact(t, .8); M.stab(t, [64, 67, 71, 76], .8); } }
if (S.actions != null) { M.harp(S.actions, .4, [64, 67, 71, 76], .7); V.actions.items.forEach(it => M.lock(when('actions', it) + .3, .8)); }
if (S.unknown != null) { M.buzz(at('unknown', 0, .6), .3, .4); M.bloom(at('unknown', V.unknown.watchLine ?? 1, 0), [71, 76, 79], .7); }

// ---- 片尾：声音标识再来一次
M.swell(S.outro + .02, [60, 67, 72, 76], .9, .7);
wire(S.outro + .3, 8); chime(S.outro + .8, .9);
M.pad(S.outro, [52, 59, 64, 71], E.outro - S.outro - .6, .55);
M.put(E.outro - 1.0, 1.2, tt => .22 * Math.sin(2 * Math.PI * 1318.5 * tt) * Math.exp(-tt * 4), { gain: .5, rev: .8, bus: 'mus' });

const peak = M.write(dir + '/build/music.wav');
console.log(`music.wav: ${C.dur.toFixed(1)} s, peak ${peak.toFixed(2)} → normalized`);
