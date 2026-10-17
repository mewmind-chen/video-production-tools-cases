// Buyer's Playbook 的时间表：step 场景会重复，所以按场景序号取。S[i] / E[i] 是第 i 个场景的起止，at(i, n, frac) 是第 i 个场景第 n 句台词进行到 frac 处的时间。
export function cues(EP, TL) {
  const S = TL.scenes.map(s => s.start), E = TL.scenes.map(s => s.end);
  const L = EP.scenes.map((_, i) => TL.lines.filter(l => l.scene === i).map(l => l.start));
  const LE = EP.scenes.map((_, i) => TL.lines.filter(l => l.scene === i).map(l => l.end));
  const at = (i, n = 0, frac = 0) => L[i]?.[n] != null ? L[i][n] + frac * (LE[i][n] - L[i][n]) : S[i];
  return { S, E, L, LE, at, dur: TL.duration };
}
