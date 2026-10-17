# AGENTS.md

给 AI 编程助手（Codex CLI、Claude Code 等）看的工作说明。人看的说明在 `content-system/README.md`。

## 这个仓库是什么

一个每周 3 条竖屏短视频的生产线：频道 **China Supply Chain Signal**，主播是化名 **LEO**（深圳做元器件的业内人），观众是海外中小企业的采购。视频全部由代码生成：Kokoro 本地配音 + 浏览器逐帧绘制 + ffmpeg 合成。

| 周几 | 栏目 | 固定格式 |
|---|---|---|
| 周一 | News Decoder（新闻解读） | `pipeline/formats/news-decoder/FORMAT.md` |
| 周三 | Market Pulse（行情脉搏） | `pipeline/formats/market-pulse/FORMAT.md` |
| 周五 | Buyer's Playbook（采购实操） | `pipeline/formats/playbook/FORMAT.md`（新一期从 `pipeline/formats/playbook/example/` 复制；001 是早期单独制作的，不要照它改代码） |

## 做一期新视频：只改数据，不改代码

1. 复制同栏目上一期的文件夹：`episodes/<编号>-<短名>/`，例如 `cp -r episodes/003-decoder-rare-earth-deadline episodes/004-decoder-xxx`，删掉其中的 `build/` 和 `*.mp4`。Buyer's Playbook 从 `pipeline/formats/playbook/example/` 复制（再补上 `FACTS.md`、`PUBLISH.md`）。
2. 只改这几个文件：
   - `episode.json`：`id`、`week`（ISO 周，例：10 月 19–25 日是 WK 43）、`date`、每个场景的 `visual` 数据和 `lines` 台词（`text` 是字幕，`say` 是念法：数字写成英文单词，缩写拆开念，例如 `M-L-C-C`）
   - `FACTS.md`：每个数字、每句事实的出处和状态（✅ / ⚠️ / ❌）
   - `PUBLISH.md`：YouTube / TikTok 标题、描述、置顶评论
3. 先跑检查：`node pipeline/check.mjs episodes/<id>`。✗ 错误必须改完；⚠ 警告逐条看，能改就改（例如念法里的数字写成英文单词）。
4. 出联系表看画面：`bash pipeline/make.sh episodes/<id> --sheet`（会自动先跑检查），然后**打开 `episodes/<id>/build/sheet.jpg` 检查**：文字有没有互相压住、有没有超出画面、有没有进入字幕区（y > 1420）。如果你看不了图片，告诉用户自己打开看。
5. 没问题再出成片：`bash pipeline/make.sh episodes/<id>`，约 20–30 分钟，结果在 `deliverables/<id>.mp4`，脚本最后会打印时长和响度。

场景的 `type` 和 `visual` 字段必须符合对应栏目的 `FORMAT.md`。元素出现时间用 `line`（第几句台词，从 0 开始）和 `at`（这句进行到几成，0–1）指定，不写秒数。

## 和 Claude 的分工（每次对话都适用）

用户在 Codex 桌面端里让你做视频，选题和事实核对由另一位助手 Claude 在云端完成，通过 git 交接。

**每次对话开始先做：** `git pull`。如果拉下来的改动里有 `pipeline/package.json`、`pipeline/setup.sh` 或 `pipeline/tts.py`，再跑一次 `bash pipeline/setup.sh`。

| 你（Codex）负责 | 不归你（交给 Claude，告诉用户） |
|---|---|
| 按选题卡和 `FACTS.md` 写 `episode.json`、`PUBLISH.md` | 收集信号、打分、写选题卡 |
| 跑检查、出联系表、修排版问题、渲染成片 | 新增或修改 `FACTS.md` 里的事实、找来源 |
| 提交并推送 | 修改模板代码（`format.js`、`brand.js`、`engine.js`） |

**必须停下来问用户的情况：**

- 要写进视频的数字或说法在 `FACTS.md` 里找不到，或标着 ❌。**不要自己上网找来源补进去，不要编。** 告诉用户"这条需要 Claude 补进 FACTS.md"。
- `FACTS.md` 里有"发布前再查一次"之类的提醒：做完后提醒用户。
- 只改数据解决不了的画面问题（例如需要新的画面类型）：说明情况，不要改模板代码。
- 渲染时浏览器被沙箱拦住：告诉用户在终端运行 `bash pipeline/make.sh episodes/<id>`。

**每做完一步，用这个格式汇报：**

```
完成：<做了什么>
检查：<check.mjs 的结果，✗ 几个 / ⚠ 几个，⚠ 逐条列出>
需要你看：<联系表路径，或成片路径 + 时长 + 响度>
需要你决定：<没有就写"无">
```

## 不要动的东西

除非用户明确要求，不要修改：

- `pipeline/reel/engine.js`、`pipeline/reel/brand.js`（频道人设：LEO 胸牌、自我介绍、片尾卡）
- `pipeline/formats/*/format.js`、`music.mjs`（栏目的固定画面和配乐）
- 每期固定台词：第二个场景 `intro` 只有一句 `I'm Leo. I trade components in Shenzhen.`；最后一句是 `<栏目>. Every <星期>. Sources in the caption.`

## 内容规则（违反任何一条都不能发布）

- **事实不过核实，不进视频。** 每个数字要在 `FACTS.md` 里有链接；只有一个来源或二手转述的标 ⚠️，旁白里说 *reportedly*。官方没说的不替它说。
- **不预测价格**，只引用机构预测并标 F。
- **不推销**，不出现任何公司名做广告；不发政治观点。
- 示意内容在画面上标 `EXAMPLE` / `SCHEMATIC` / `ILLUSTRATION`。
- 时长 60–90 秒。超了就删台词，不要加快语速。
- 详细规则：`content-system/persona.md`（人设、模板、红线）、`content-system/style-guide.md`。

## 选题流程（每周日）

按 `content-system/README.md` 的步骤：收集信号 → `content-system/scoring.md` 打分 → 写 3 张选题卡（`episodes/_weekly/<日期>-cards.md`）→ **等用户拍板**再做。

## 环境

- 需要：Node 22、Python 3.11–3.13（setup.sh 会在 `pipeline/.venv` 建独立环境，系统是 3.14 也没关系）、ffmpeg、Chromium（Playwright）。第一次运行、以及每次 `git pull` 之后运行 `bash pipeline/setup.sh`。
- 没有 GPU 也能跑，3D 场景会慢一些。
- 渲染要启动 Chromium。如果沙箱拦住了浏览器，不要绕过沙箱，告诉用户在终端自己运行 `bash pipeline/make.sh episodes/<id>`。

## Git

- 在工作分支上提交，不要直接推 `main`。
- 不要提交 `episodes/*/build/`、`episodes/*/*.mp4`（已在 `.gitignore`）；成片只提交压缩后的 `deliverables/*.mp4`。
