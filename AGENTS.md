# AGENTS.md

给 AI 编程助手（Codex CLI、Claude Code 等）看的工作说明。人看的说明在 `content-system/README.md`。

## 这个仓库是什么

一个每周 3 条竖屏短视频的生产线：频道 **China Supply Chain Signal**，主播是化名 **LEO**（深圳做元器件的业内人），观众是海外中小企业的采购。视频全部由代码生成：Kokoro 本地配音 + 浏览器逐帧绘制 + ffmpeg 合成。

| 周几 | 栏目 | 固定格式 |
|---|---|---|
| 周一 | News Decoder（新闻解读） | `pipeline/formats/news-decoder/FORMAT.md` |
| 周三 | Market Pulse（行情脉搏） | `pipeline/formats/market-pulse/FORMAT.md` |
| 周五 | Buyer's Playbook（采购实操） | 暂无固定格式，参考 `episodes/001-broker-stock-check/` |

## 做一期新视频：只改数据，不改代码

1. 复制同栏目上一期的文件夹：`episodes/<编号>-<短名>/`，例如 `cp -r episodes/003-decoder-rare-earth-deadline episodes/004-decoder-xxx`，删掉其中的 `build/` 和 `*.mp4`。
2. 只改这几个文件：
   - `episode.json`：`id`、`week`（ISO 周，例：10 月 19–25 日是 WK 43）、`date`、每个场景的 `visual` 数据和 `lines` 台词（`text` 是字幕，`say` 是念法：数字写成英文单词，缩写拆开念，例如 `M-L-C-C`）
   - `FACTS.md`：每个数字、每句事实的出处和状态（✅ / ⚠️ / ❌）
   - `PUBLISH.md`：YouTube / TikTok 标题、描述、置顶评论
3. 先出联系表看画面：`bash pipeline/make.sh episodes/<id> --sheet`，然后**打开 `episodes/<id>/build/sheet.jpg` 检查**：文字有没有互相压住、有没有超出画面、有没有进入字幕区（y > 1420）。
4. 没问题再出成片：`bash pipeline/make.sh episodes/<id>`，约 20–30 分钟，结果在 `deliverables/<id>.mp4`，脚本最后会打印时长和响度。

场景的 `type` 和 `visual` 字段必须符合对应栏目的 `FORMAT.md`。元素出现时间用 `line`（第几句台词，从 0 开始）和 `at`（这句进行到几成，0–1）指定，不写秒数。

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

- 需要：Node 22、Python 3、ffmpeg、Chromium（Playwright）。第一次运行 `bash pipeline/setup.sh`（下载 Kokoro 模型，约 340 MB）。
- 没有 GPU 也能跑，3D 场景会慢一些。

## Git

- 在工作分支上提交，不要直接推 `main`。
- 不要提交 `episodes/*/build/`、`episodes/*/*.mp4`（已在 `.gitignore`）；成片只提交压缩后的 `deliverables/*.mp4`。
