// 风格样片 01 配乐：16 秒，120 BPM，Am F C G。画面与配乐共用 cues.mjs 的时间点。
import { createSynth } from '../../pipeline/synth.mjs';
import { T } from './cues.mjs';

const HERE = new URL('.', import.meta.url).pathname;
const M = createSynth(T.dur), BEAT = .5;
const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], ROOT = [33, 29, 36, 31];
const AM = [57, 64, 69, 72];

// 小节 1：黑场，绿点随底鼓跳
for (let t = 0; t < T.reelPop; t += BEAT) M.kick(t, .55);
M.pad(0, [57, 64], 2, .6);
M.pop(T.reelPop, 1); M.bloom(T.reelPop, [69, 76, 81], .7);
// 小节 2：拉远 + 料盘墙弹出 → 4,000 重锤
for (let i = 0; i < 24; i++) M.tick(T.pullBack + i * .045, .4 + .4 * (i / 24));
M.riser(T.pullBack - .2, T.slam - T.pullBack + .2, .7);
M.impact(T.slam, 1); M.stab(T.slam, [57, 60, 64, 69], 1);
M.blip(T.slam + .5, 88, .7); M.blip(T.slam + 1.0, 93, .7);
// 俯冲：反向铺底收进 drop
M.swell(T.drop, AM, T.drop - T.dive, 1);
M.glide(T.dive, 1.0, 81, 57, .6);
// 律动：drop 到 MLCC 升起前；拆解段半速；层间近乎静音
for (let t = T.drop; t < T.snap + 1; t += BEAT) {
  const b = Math.round(t / BEAT), beatIn = b % 4, ch = Math.floor(t / 2) % 4;
  if (t >= T.lift && t < T.lift + .5) continue;                 // 停在口袋上的一口气
  if (t >= T.inside - .1 && t < T.snap) continue;              // 层间：静
  const calm = t >= T.lift && t < T.snap;
  if (calm) {
    if (beatIn === 0) { M.kick(t, .65); M.sub(t, ROOT[ch] + 12, 1.6, .9); M.pad(t, CH[ch].map(m => m + 12), 1.9, .5); }
    if (beatIn === 2) M.clap(t, .3);
    M.hat(t + BEAT / 2, .28);
    continue;
  }
  M.kick(t, beatIn === 0 ? 1 : .85);
  if (beatIn === 1 || beatIn === 3) M.clap(t, .7);
  for (let e = 0; e < 4; e++) M.hat(t + e * BEAT / 4, e % 2 ? .75 : .35);
  M.bass(t, ROOT[ch] + 12, BEAT * .45, .85); M.bass(t + BEAT / 2, ROOT[ch] + (beatIn === 3 ? 19 : 12), BEAT * .4, .7);
  for (let s2 = 0; s2 < 4; s2++) M.pluck(t + s2 * BEAT / 4, CH[ch][(b * 4 + s2) % 3] + 12 + (s2 === 3 ? 12 : 0), .38, s2 % 2 ? .35 : -.35);
  if (beatIn === 0) M.pad(t, CH[ch].map(m => m + 12), 1.9, .55);
}
M.impact(T.drop, .9); M.glitch(T.drop, .14, .5);
// 每拍一个巨字
T.words.forEach(([, t], i) => M.stab(t, [[69, 72], [71, 74], [72, 76], [64, 67, 70]][i], .9));
M.buzz(T.words[3][1] + .05, .35, .7);
// MLCC
M.glitch(T.lift, .12, .4); M.glide(T.lift + .2, .8, 57, 69, .7);
M.put(T.xray, 1.2, tt => .09 * Math.sin(2 * Math.PI * 110 * tt) * Math.sin(2 * Math.PI * 3 * tt) ** 2 * Math.exp(-tt * .8), { gain: .8, bus: 'mus' });
M.impact(T.explode, 1.05); M.harp(T.explode, .9, [57, 60, 64, 69, 72, 76, 81, 84], 1, 1);
[0, 1, 2, 3].forEach(i => M.blip(T.explode + .3 + i * .12, 84 + i * 3, .6, -.5 + i * .33));
M.riser(T.explode + 1.2, T.inside - T.explode - 1.2, .6);
M.sub(T.inside, 45, 1.2, .8); M.bloom(T.inside, [72, 76, 79], .5);
// 急速拉回 → VERIFIED
M.glide(T.snap, .9, 84, 57, .8); M.glitch(T.snap, .14, .5);
M.swell(T.verified, AM, .9, 1); M.impact(T.verified, 1.1); M.stab(T.verified, [57, 64, 69, 72, 76], 1);
M.bloom(T.verified + .5, [69, 76, 81, 88], .8);
M.pad(T.verified, AM, .8, .7);

const peak = M.write(HERE + 'build/music.wav');
console.log(`music.wav: ${T.dur} s, peak ${peak.toFixed(2)}`);
