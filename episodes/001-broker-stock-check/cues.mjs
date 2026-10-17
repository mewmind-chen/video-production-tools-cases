// 本期时间表：画面（reel.js）和配乐（music.mjs）都从这里取时间，保证每个动作落在同一帧。
// 场景起点和每句台词的起点来自配音生成的 timeline.json，其余命中点相对它们定义。
export const KEYS = ['open', 'intro', 'alloc', 'ddr5', 'photo', 'datecode', 'label', 'paper', 'teardown', 'recap', 'end'];

export function cues(TL) {
  const S = {}, E = {}, L = {};
  KEYS.forEach((k, i) => {
    S[k] = TL.scenes[i].start; E[k] = TL.scenes[i].end;
    L[k] = TL.lines.filter(l => l.scene === i).map(l => l.start);
  });
  const hits = {
    open: { dot: S.open + .05, bubble: L.open[0], text: L.open[0] + .7, slam: L.open[1], bait: L.open[1] + .75, chips: L.open[1] + 1.7 },
    intro: { land: S.intro + .55 },
    alloc: { head: S.alloc + .08, tape: S.alloc + .35, empties: [0, 1, 2, 3, 4, 5].map(i => L.alloc[0] + 1.2 + i * .5), source: L.alloc[1] + .2 },
    ddr5: { head: S.ddr5 + .08, boxes: S.ddr5 + .5, fill: S.ddr5 + 2.4, count: S.ddr5 + 4.4 },
    photo: { head: S.photo + .08, finder: S.photo + .9, note: S.photo + 1.7, shutter: S.photo + 3.2, tag: L.photo[1] },
    datecode: { head: S.datecode + .08, roll: S.datecode + 1.1, yy: S.datecode + 3.2, ww: S.datecode + 3.7, warn: L.datecode[1] },
    label: { head: S.label + .08, card: S.label + .5, locks: [L.label[0] + 2.4, L.label[0] + 3.4, L.label[0] + 4.6], maker: L.label[1] },
    paper: { head: S.paper + .08, cards: S.paper + .4, thread: S.paper + 2.3, match: S.paper + 3.3, flag: L.paper[1] },
    teardown: { head: S.teardown + .08, chip: S.teardown + .3, lift: S.teardown + 1.0, xray: S.teardown + 2.0, explode: S.teardown + 3.0, labels: [3.9, 4.35, 4.8, 5.25].map(d => S.teardown + d), yes: L.teardown[1] },
    recap: { tapes: S.recap + .05, verified: S.recap + 1.9 },
    end: { name: S.end + .2, mark: S.end + .9, chip: S.end + 1.6, glitch: E.end - 1.0, dot: E.end - .55 },
  };
  return { S, E, L, hits, dur: TL.duration };
}
