// Market Pulse 的配乐与音效：120 BPM，Dm B♭ F C，读取与画面相同的 cues.mjs，每期自动跟着台词时间走。
// 声音标识：片头和片尾的"心跳"（两下低频 + 一个高音），每期一样，听到就知道是这个栏目。
// 用法：node pipeline/formats/market-pulse/music.mjs episodes/<id> → episodes/<id>/build/music.wav
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

const CH = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [60, 64, 67]];   // Dm B♭ F C
const ROOT = [38, 34, 41, 36];
const barOf = t => Math.floor(t / 2);
const heartbeat = (t, v = 1) => { M.sub(t, 31, .35, 1.1 * v); M.kick(t, .8 * v); M.sub(t + .22, 31, .3, .8 * v); M.kick(t + .22, .55 * v); M.blip(t + .02, 98, .6 * v); };

// ---- open：铺底，滚动计数，落定时重锤
const o = V.open, tRoll = at('open', 0, .48);
M.pad(0, [50, 57, 62, 65], at('open', 1, 0), .7);
M.blip(S.open + .15, 86, .6);
M.glide(S.open + .35, .8, 50, 62, .6);
M.odo(tRoll, 1.1, .9);
M.riser(tRoll - .4, 1.5, .55);
M.impact(tRoll + 1.1, 1); M.stab(tRoll + 1.1, [62, 65, 69, 74], .9);
M.pop(tRoll + 1.3, .8);
(o.after || []).forEach((_, i) => { M.kick(at('open', 1, 0) + .15 + i * .55, .7); M.blip(at('open', 1, 0) + .2 + i * .55, 81 + i * 5, .6); });

// ---- ident：声音标识
heartbeat(S.ident + .5, 1);
M.bloom(S.ident + .55, [62, 69, 74, 77], .9);
M.tick(S.ident + .2, .6);

// ---- 律动：从现货段开始，片尾前收住；市场声音段半速，"降温"一句前留出近乎静音的半拍
const tQuiet = at('contract', V.contract.quoteLine ?? 3, 0);
for (let t = Math.ceil(S.spot / BEAT) * BEAT; t < S.outro; t += BEAT) {
  const b = Math.round(t / BEAT), beatIn = b % 4, ch = barOf(t) % 4;
  if (t > tQuiet - .9 && t < tQuiet + .1) continue;
  const calm = t >= S.street && t < S.actions;
  if (calm) {
    if (beatIn === 0) { M.kick(t, .6); M.sub(t, ROOT[ch] + 12, 1.6, .8); M.pad(t, CH[ch].map(m => m + 12), 1.9, .5); }
    M.hat(t + BEAT / 2, .25);
    continue;
  }
  const full = t >= S.contract;
  M.kick(t, beatIn === 0 ? .95 : .75);
  if (beatIn === 1 || beatIn === 3) M.clap(t, full ? .6 : .45);
  for (let e = 0; e < 2; e++) M.hat(t + e * BEAT / 2, e ? .65 : .35);
  M.bass(t, ROOT[ch] + 12, BEAT * .42, .75); if (full) M.bass(t + BEAT / 2, ROOT[ch] + 12, BEAT * .35, .55);
  for (let s2 = 0; s2 < 4; s2 += full ? 1 : 2) M.pluck(t + s2 * BEAT / 4, CH[ch][(b * 4 + s2) % 3] + 12, .3, s2 % 2 ? .35 : -.35);
  if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .45);
}

// ---- spot：坐标轴、报价点、事件
M.softImpact(S.spot, .7);
for (let i = 0; i < 13; i++) M.tick(S.spot + .4 + i * .03, .45);
for (const ev of V.spot.events || []) { const te = when('spot', ev); M.buzz(te + .05, .35, .55); M.glide(te + .3, .7, 74, 62, .5); }
V.spot.points.forEach((p, i) => { const tp = when('spot', p); M.blip(tp, 81 + i * 3, .7, -.4 + i * .25); if (p.hot) M.stab(tp, [62, 69, 74], .7); });

// ---- contract：柱子长出来 → 叠成台阶 → ≈4×
const vc = V.contract;
M.bloom(S.contract, [62, 65, 69], .6);
vc.bars.forEach((b, i) => { const tb = when('contract', b); M.pop(tb, .8); M.blip(tb + .05, 74 + i * 3, .6); });
const tS = at('contract', vc.stairsLine ?? 3, vc.stairsAt ?? 0);
M.lock(tQuiet + .05, .8);
for (let i = 0; i < 5; i++) { M.kick(tS + i * .16, .45); M.pluck(tS + i * .16, 62 + [0, 3, 7, 10, 12][i], .6); }
const tF = at('contract', vc.finalLine ?? 4, .55);
M.riser(tF - 1.2, 1.2, .5); M.impact(tF, .9); M.stab(tF, [62, 65, 69, 74, 77], .9);

// ---- street：转换到半速
M.swell(S.street + .05, [58, 62, 65, 70], .8, .7); M.softImpact(S.street + .05, .6);
M.blip(at('street', 1, 0), 93, .6);

// ---- actions：三张卡依次锁定
M.harp(S.actions, .4, [62, 65, 69, 74], .8);
V.actions.items.forEach(it => M.lock(when('actions', it) + .3, .85));

// ---- outro：声音标识再来一次，然后收尾
M.swell(S.outro + .02, [58, 65, 70, 74], .9, .7);
heartbeat(S.outro + .45, .9);
M.pad(S.outro, [50, 57, 62, 69], E.outro - S.outro - .6, .6);
M.put(E.outro - 1.0, 1.2, tt => .22 * Math.sin(2 * Math.PI * 1175 * tt) * Math.exp(-tt * 4), { gain: .5, rev: .8, bus: 'mus' });

const peak = M.write(dir + '/build/music.wav');
console.log(`music.wav: ${C.dur.toFixed(1)} s, peak ${peak.toFixed(2)} → normalized`);
