// Market Pulse 的时间表：画面（format.js）和配乐（music.mjs）共用。
// 场景按 type 取（每期每种场景只出现一次），每句台词的起止来自配音生成的 timeline.json。
export const ORDER = ['open', 'intro', 'spot', 'contract', 'street', 'actions', 'outro'];

export function cues(EP, TL) {
  const S = {}, E = {}, L = {}, LE = {};
  EP.scenes.forEach((sc, i) => {
    const k = sc.type;
    S[k] = TL.scenes[i].start; E[k] = TL.scenes[i].end;
    const ls = TL.lines.filter(l => l.scene === i);
    L[k] = ls.map(l => l.start); LE[k] = ls.map(l => l.end);
  });
  // 某场景第 n 句台词进行到 frac 处的时间；没有这句就退回场景起点
  const at = (k, n = 0, frac = 0) => L[k]?.[n] != null ? L[k][n] + frac * (LE[k][n] - L[k][n]) : S[k];
  return { S, E, L, LE, at, dur: TL.duration };
}
