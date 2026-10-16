// 001 的配乐与音效：120 BPM，Am F C G，读取与画面相同的 cues.mjs，每个命中点落在同一帧。
// 用法：node episodes/001-broker-stock-check/music.mjs → build/music.wav
import { readFileSync } from 'fs';
import { createSynth } from '../../pipeline/synth.mjs';
import { cues } from './cues.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const TL = JSON.parse(readFileSync(HERE + 'build/timeline.json', 'utf8'));
const C = cues(TL), S = C.S, E = C.E, Hh = C.hits, BEAT = .5;
const M = createSynth(C.dur);

const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];   // Am F C G
const ROOT = [33, 29, 36, 31];
const AM = [57, 64, 69, 72];
const barOf = t => Math.floor(t / 2);

// ---- 开场：铺底 + 上升，第二句"Real stock, or bait?" 重锤落下
M.pad(0, [57, 64, 69], Hh.open.slam, .8);
M.blip(Hh.open.dot, 88, .7);
M.pop(Hh.open.bubble, .9);
for (let i = 0; i < 3; i++) M.tick(Hh.open.bubble + .15 + i * .18, .5);
M.riser(Hh.open.slam - 1.6, 1.6, .8);
M.impact(Hh.open.slam, 1); M.stab(Hh.open.slam, [57, 60, 64, 69], .9);
M.stab(Hh.open.bait, [53, 57, 60, 65], .8); M.buzz(Hh.open.bait + .05, .3, .6);
[0, 1].forEach(i => M.blip(Hh.open.chips + i * .15, 88 + i * 4, .6, -.3 + i * .6));

// ---- 律动：从 "ON ALLOCATION" 开始，拆解段改半速，收尾前停下
const grooveStart = S.alloc, grooveEnd = E.recap;
for (let t = Math.ceil(grooveStart / BEAT) * BEAT; t < grooveEnd; t += BEAT) {
  const b = Math.round(t / BEAT), beatIn = b % 4, ch = barOf(t) % 4;
  const calm = t >= S.teardown && t < S.recap;                         // 拆解段：半速、更安静
  const breath = t >= Hh.teardown.explode - 1.0 && t < Hh.teardown.explode;   // 爆炸前一拍半的近乎静音
  const lead = t >= S.recap;                                            // 回顾段：16 分音符踩镲，最满
  if (breath) continue;
  if (calm) {
    if (beatIn === 0) { M.kick(t, .7); M.sub(t, ROOT[ch] + 12, 1.6, .9); }
    if (beatIn === 2) M.clap(t, .35);
    M.hat(t + BEAT / 2, .3);
    if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .55);
    continue;
  }
  M.kick(t, beatIn === 0 ? 1 : .85);
  if (beatIn === 1 || beatIn === 3) M.clap(t, .7);
  const sub = lead ? 4 : 2;
  for (let e = 0; e < sub; e++) M.hat(t + e * BEAT / sub, e % 2 ? .8 : .4, !lead && e === 1 && beatIn === 3);
  M.bass(t, ROOT[ch] + 12, BEAT * .45, .85); M.bass(t + BEAT / 2, ROOT[ch] + (beatIn === 3 ? 19 : 12), BEAT * .4, .7);
  for (let s2 = 0; s2 < 4; s2++) M.pluck(t + s2 * BEAT / 4, CH[ch][(b * 4 + s2) % 3] + 12 + (s2 === 3 ? 12 : 0), .38, s2 % 2 ? .35 : -.35);
  if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .6);
}

// ---- 每个镜头的命中点（转场不用噪声嗖声）
// 为什么是现在
M.bloom(S.alloc, [69, 76, 81], .8);
for (let i = 0; i < 12; i++) M.tick(Hh.alloc.head + i * .03, .6);
Hh.alloc.empties.forEach((t, i) => M.blip(t, 76 - i * 2, .7, -.4 + i * .16));
M.blip(Hh.alloc.source, 93, .6);
// DDR5
M.glide(S.ddr5, .5, 69, 81, .8);
for (let i = 0; i < 10; i++) M.tick(Hh.ddr5.boxes + i * .06, .55);
[0, 1, 2].forEach(i => M.blip(Hh.ddr5.fill + i * .25, 84 + i * 3, .8));
M.buzz(Hh.ddr5.fill + 1, .45, .6);
M.odo(Hh.ddr5.count, 1, .8); M.stab(Hh.ddr5.count + 1, [57, 60, 64, 69], .9);
// 检查 1：拍照
M.glitch(S.photo, .18, .6); M.softImpact(S.photo, .8);
for (let i = 0; i < 10; i++) M.tick(Hh.photo.head + i * .03, .5);
M.pop(Hh.photo.note, .7);
M.shutter(Hh.photo.shutter, 1);
M.buzz(Hh.photo.tag, .3, .5);
// 检查 2：日期码
M.glide(S.datecode, .55, 64, 76, .8);
M.odo(Hh.datecode.roll, 1.4, .9); M.stab(Hh.datecode.roll + 1.4, [64, 69, 72], .8);
M.blip(Hh.datecode.yy, 88, .7); M.blip(Hh.datecode.ww, 91, .7);
M.buzz(Hh.datecode.warn, .4, .6);
// 检查 3：标签
M.harp(S.label, .4, [69, 72, 76, 79, 84], .9, 1);
Hh.label.locks.forEach(t => M.lock(t + .35, .9));
M.bloom(Hh.label.maker, [72, 76, 79], .6);
// 检查 4：文件
M.hatRoll(S.paper, 4, .6);
M.glide(Hh.paper.thread, 1.0, 72, 84, .7); M.stab(Hh.paper.match, [69, 72, 76, 81], .9); M.blip(Hh.paper.match + .1, 96, .6);
M.buzz(Hh.paper.flag, .35, .6);
// 检查 5：拆解
M.bloom(S.teardown, [57, 64, 69, 76], .9);
M.glide(Hh.teardown.lift, .8, 57, 69, .6);
M.put(Hh.teardown.xray, 1.4, tt => .08 * Math.sin(2 * Math.PI * 110 * tt) * Math.sin(2 * Math.PI * 3 * tt) ** 2 * Math.exp(-tt * .8), { gain: .8, bus: 'mus' });   // X 光嗡声
M.impact(Hh.teardown.explode, 1.05); M.stab(Hh.teardown.explode, AM, .8);
Hh.teardown.labels.forEach((t, i) => M.blip(t, 84 + i * 3, .7, -.5 + i * .33));
M.stab(Hh.teardown.yes, [69, 72, 76, 81], .9);
// 回顾 + VERIFIED
M.swell(Hh.recap.verified, AM, 1.4, 1); M.impact(Hh.recap.verified, 1.1); M.stab(Hh.recap.verified, [57, 64, 69, 72, 76], 1);
// 片尾
M.swell(S.end, [53, 60, 65, 69], 1.0, .8); M.softImpact(Hh.end.name, .9);
M.bloom(Hh.end.mark, [69, 76, 81, 88], .9);
M.blip(Hh.end.chip, 93, .7);
M.pad(S.end, [57, 64, 69, 72], E.end - S.end - .5, .7);
M.glitch(Hh.end.glitch, .45, .6); M.softImpact(Hh.end.dot, .8);
M.put(Hh.end.dot, 1.2, tt => .25 * Math.sin(2 * Math.PI * 1760 * tt) * Math.exp(-tt * 4), { gain: .6, rev: .8, bus: 'mus' });

const peak = M.write(HERE + 'build/music.wav');
console.log(`music.wav: ${C.dur.toFixed(1)} s, peak ${peak.toFixed(2)} → normalized`);
