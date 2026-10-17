// Buyer's Playbook 的配乐与音效：120 BPM，Am F C G（和 001 同一套和弦，周五栏目一致）。step 场景按序号取时间。
// 声音标识：目标框锁定的咔嗒声 + 两声拨弦，在钩子之后的胸牌落定时出现，每期一样。
// 用法：node pipeline/formats/playbook/music.mjs episodes/<id> → episodes/<id>/build/music.wav
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSynth } from '../../synth.mjs';
import { cues } from './cues.mjs';

const dir = resolve(process.argv[2] || '.');
const EP = JSON.parse(readFileSync(dir + '/episode.json', 'utf8'));
const TL = JSON.parse(readFileSync(dir + '/build/timeline.json', 'utf8'));
const C = cues(EP, TL), S = C.S, E = C.E, at = C.at, BEAT = .5, SC = EP.scenes;
const idx = type => SC.findIndex(s => s.type === type);
const M = createSynth(C.dur);

const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // Am F C G
const ROOT = [33, 29, 36, 31];
const barOf = t => Math.floor(t / 2);
const logo = (t, v = 1) => { M.lock(t, .9 * v); M.pluck(t + .12, 69, .7 * v); M.pluck(t + .26, 76, .7 * v); };

// ---- 钩子：气泡弹出、打字声、大问题落下
const o = idx('open');
if (o >= 0) {
  const t1 = at(o, Math.min(1, (SC[o].lines || []).length - 1), 0);
  M.pad(0, [57, 64, 69], t1, .7);
  M.pop(S[o] + .15, .9);
  for (let i = 0; i < 8; i++) M.tick(at(o, 0, .05) + i * .14, .45);
  M.riser(t1 - 1.4, 1.4, .7); M.impact(t1, 1); M.stab(t1, [57, 60, 64, 69], .9);
  M.blip(at(o, Math.min(1, (SC[o].lines || []).length - 1), .65), 88, .6);
}
// ---- 自我介绍：栏目声音标识
const n = idx('intro'); if (n >= 0) { M.glide(S[n] + .05, .5, 76, 64, .5); M.softImpact(S[n] + .55, .8); logo(S[n] + .6); }

// ---- 律动：从 why 开始，回顾结束前收住
const g0 = S[idx('why') >= 0 ? idx('why') : n + 1], rc = idx('recap'), g1 = rc >= 0 ? E[rc] : S[SC.length - 1];
for (let t = Math.ceil(g0 / BEAT) * BEAT; t < g1; t += BEAT) {
  const b = Math.round(t / BEAT), beatIn = b % 4, ch = barOf(t) % 4, full = rc >= 0 && t >= S[rc];
  M.kick(t, beatIn === 0 ? 1 : .8);
  if (beatIn === 1 || beatIn === 3) M.clap(t, .6);
  for (let e = 0; e < (full ? 4 : 2); e++) M.hat(t + e * BEAT / (full ? 4 : 2), e % 2 ? .7 : .35);
  M.bass(t, ROOT[ch] + 12, BEAT * .45, .8);
  for (let s2 = 0; s2 < 4; s2 += 2) M.pluck(t + s2 * BEAT / 4, CH[ch][(b * 4 + s2) % 3] + 12, .32, s2 % 4 ? .35 : -.35);
  if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .5);
}

// ---- 各场景命中点
SC.forEach((sc, i) => {
  const v = sc.visual || {};
  if (sc.type === 'why') { M.bloom(S[i], [69, 76, 81], .7); M.odo(at(i, v.valueLine ?? 0, v.valueAt ?? .3), 1.2, .8); M.stab(at(i, v.valueLine ?? 0, v.valueAt ?? .3) + 1.2, [57, 60, 64, 69], .8); }
  if (sc.type === 'step') {
    M.glide(S[i], .5, 64, 76, .6); for (let k = 0; k < 8; k++) M.tick(S[i] + .08 + k * .03, .45);
    const vis = v.visual || {};
    if (vis.kind === 'photo') M.shutter(at(i, vis.shutterLine ?? 0, vis.shutterAt ?? .75), 1);
    if (vis.kind === 'code') M.odo(at(i, 0, .3), 1.2, .8);
    if (vis.kind === 'label') (vis.locks || []).forEach((_, k) => M.lock(at(i, vis.lockLine ?? 0, vis.lockAt ?? .45) + k * .55 + .35, .9));
    if (vis.kind === 'doc') M.stab(at(i, vis.hlLine ?? 0, vis.hlAt ?? .6), [69, 72, 76, 81], .7);
    if (vis.kind === 'compare') { M.blip(at(i, vis.good?.line ?? 0, vis.good?.at ?? .2), 88, .7); M.buzz(at(i, vis.bad?.line ?? 1, vis.bad?.at ?? .2), .3, .5); }
    if (v.tag) { const tt = at(i, v.tagLine ?? 1, v.tagAt ?? 0); if (v.tagTone === 'ok') M.stab(tt, [69, 72, 76, 81], .8); else M.buzz(tt, .35, .55); }
  }
  if (sc.type === 'recap') {
    const items = v.items || [], span = Math.max(.5, (C.LE[i]?.[0] ?? E[i]) - at(i, 0, .1));
    items.forEach((_, k) => M.blip(at(i, 0, .1) + span * k / items.length + .15, 81 + k * 2, .6));
    if (v.stamp) { const ts = at(i, v.stampLine ?? 0, v.stampAt ?? .85); M.impact(ts, 1); M.swell(ts, [57, 64, 69, 72], 1.2, .9); }
  }
});

// ---- 片尾：声音标识再来一次
const z = SC.length - 1;
M.swell(S[z] + .02, [53, 60, 65, 69], .9, .7);
logo(S[z] + .7, .9);
M.pad(S[z], [57, 64, 69, 72], E[z] - S[z] - .6, .6);
M.put(E[z] - 1.0, 1.2, tt => .22 * Math.sin(2 * Math.PI * 1760 * tt) * Math.exp(-tt * 4), { gain: .5, rev: .8, bus: 'mus' });

const peak = M.write(dir + '/build/music.wav');
console.log(`music.wav: ${C.dur.toFixed(1)} s, peak ${peak.toFixed(2)} → normalized`);
