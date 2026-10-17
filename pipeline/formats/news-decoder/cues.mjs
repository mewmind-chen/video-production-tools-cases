// News Decoder 的时间表：画面（format.js）和配乐（music.mjs）共用。场景按 type 取，每期每种场景最多一次。
export function cues(EP, TL) {
  const S = {}, E = {}, L = {}, LE = {};
  EP.scenes.forEach((sc, i) => {
    const k = sc.type;
    S[k] = TL.scenes[i].start; E[k] = TL.scenes[i].end;
    const ls = TL.lines.filter(l => l.scene === i);
    L[k] = ls.map(l => l.start); LE[k] = ls.map(l => l.end);
  });
  const at = (k, n = 0, frac = 0) => L[k]?.[n] != null ? L[k][n] + frac * (LE[k][n] - L[k][n]) : S[k];
  return { S, E, L, LE, at, dur: TL.duration };
}
