"""由 timeline.json 推导所有画面/音效触发点 → build/cues.json。画面和混音读同一份，保证对齐。"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, "build/timeline.json"), encoding="utf-8"))
S = {s["id"]: s for s in T["shots"]}
g = lambda k, i: S[k]["segments"][i]
c = {}
# 镜 1：主页 → 圈 0 粉丝 → 圈 4 获赞 → 新访客 2 个溜走
c["markFans"] = 0.12
c["markLikes"] = g(1, 0)["start"] + 0.72
c["panVisitors"] = g(1, 1)["start"] - 0.12
c["visitorsLeave"] = g(1, 2)["start"] - 0.05
# 镜 2：拉远滚到活动卡 → 点「去发布」→ 卡片展开成研究课题
c["pullOut"] = S[2]["start"] - 0.05
c["markBanner"] = g(2, 0)["start"] + 1.15
c["tapPublish"] = g(2, 0)["end"] + 0.02
c["expand"] = c["tapPublish"] + 0.15
c["titleIn"] = c["expand"] + 0.35
c["counter"] = c["titleIn"] + 0.35
c["progressIn"] = g(2, 1)["end"] - 0.35
# 镜 3：问 AI → 18 条 → 圈出真人出镜 → 静音一拍
c["aiIn"] = S[3]["start"]
c["typeQStart"] = S[3]["start"] + 0.25
c["typeQEnd"] = g(3, 0)["end"]
c["sendQ"] = c["typeQEnd"] + 0.05
c["streamStart"] = c["sendQ"] + 0.25
c["streamEnd"] = g(3, 1)["end"] + 0.1
c["badge18"] = g(3, 1)["start"] + 0.55
c["highlight"] = g(3, 2)["start"] + 0.55
c["silenceStart"] = g(3, 2)["end"] + 0.02
c["silenceEnd"] = g(3, 3)["start"]
# 镜 4：打开相机 → 3-2-1 → 开录 → 破音 → 摔机 → 报错
c["camIn"] = S[4]["start"] - 0.12
c["cd3"], c["cd2"], c["cd1"] = S[4]["start"] + 0.05, S[4]["start"] + 0.45, S[4]["start"] + 0.85
c["rec"] = S[4]["start"] + 1.25
c["crack"] = g(4, 0)["start"] + 0.28
c["fall"] = g(4, 0)["end"] + 0.06
c["toast"] = c["fall"] + 0.38
c["stamp"] = c["fall"] + 0.85
c["redStart"] = c["fall"] + 0.38
c["redEnd"] = g(4, 1)["end"]
# 镜 5：实验报告
c["reportIn"] = S[5]["start"]
c["bar1"] = g(5, 0)["start"] + 1.25
c["bar2"] = g(5, 1)["start"] + 0.05
c["footnote"] = g(5, 1)["end"] + 0.05
# 镜 6：你出题我研究 → 结尾卡
c["ctaIn"] = S[6]["start"]
c["exStart"] = g(6, 0)["start"] + 0.35
c["exEnd"] = g(6, 1)["end"] + 0.1
c["endCard"] = g(6, 2)["start"] - 0.3
c["slogan1"] = g(6, 2)["start"]
c["slogan2"] = g(6, 3)["start"]
c["freeze"] = g(6, 3)["end"] + 0.1
c["endDing"] = T["duration"] - 0.55
c = {k: round(v, 3) for k, v in c.items()}
json.dump(c, open(os.path.join(ROOT, "build/cues.json"), "w"), indent=2)
print(json.dumps(c))
