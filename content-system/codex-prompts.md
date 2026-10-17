# 给 Codex 桌面端的提示词

长期规则已经写在仓库根目录的 `AGENTS.md`，Codex 每次对话都会自动读。下面这些只在对应场景复制粘贴，把 `< >` 里的内容换掉。

## 1. 第一次接手（只用一次）

```
你接手这个项目的短视频制作。请按顺序做：
1. git pull，确认在 content-system-001 分支，然后运行 bash pipeline/setup.sh
2. 读 AGENTS.md、content-system/README.md、content-system/persona.md，以及 pipeline/formats/ 下三个栏目的 FORMAT.md
3. 对 episodes/001-broker-stock-check、episodes/002-pulse-ddr5-spot、episodes/003-decoder-rare-earth-deadline、pipeline/formats/playbook/example 各跑一次 node pipeline/check.mjs，告诉我结果
4. 运行 bash pipeline/make.sh pipeline/formats/playbook/example --sheet，确认联系表能生成
5. 最后用 5 句话告诉我：你负责什么、不负责什么、哪些文件不能动、一期视频的制作步骤、什么情况要停下来问我
```

## 2. 做新的一期

```
做 <编号>，栏目 <News Decoder / Market Pulse / Buyer's Playbook>，发布日 <10 月 26 日>。
选题卡：<episodes/_weekly/2026-10-24-cards.md 的卡 B>
事实：<episodes/004-xxx/FACTS.md>（Claude 已核实，只能用这里面的事实）
按 AGENTS.md 做：复制模板、写 episode.json 和 PUBLISH.md、跑检查、出联系表。
出完联系表先停下，打开 sheet.jpg 逐张告诉我有没有文字重叠或超出画面，等我确认再出成片。
```

## 3. 改联系表里的问题

```
联系表第 <3> 张：<标题压住了图>。只改 episode.json（缩短文字或调整 line / at），不要改 format.js。改完重新出联系表。
```

## 4. 出成片并提交

```
联系表没问题了。出成片，跑完告诉我时长和响度，然后提交并推送（只提交 episode.json、FACTS.md、PUBLISH.md 和 deliverables/ 里的成片）。
```

## 5. 检查没通过、或者报错

```
把完整的报错贴给我，说明你打算怎么改、改哪个文件。如果需要改模板代码或补事实，先别动，告诉我。
```

## 6. 发布前最后检查

```
检查 episodes/<id>：FACTS.md 里所有 ⚠️ 条目逐条列给我，以及有没有"发布前再查"的提醒；PUBLISH.md 里的标题、描述、置顶评论贴给我。
```
