# 内容生产闭环

频道：**China Supply Chain Signal**（中国供应链信号）
一句话定位：把中国电子元器件供应链的一手信号，翻译成海外采购看得懂、用得上的 60–90 秒竖屏视频。

```
① 信号收集 → ② 选题评估 → ③ 事实核实 → ④ 分镜脚本 → ⑤ 制作渲染 → ⑥ 发布 → ⑦ 复盘
     ↑                                                                    │
     └──────────── 复盘结论调整 ① 的信息源和 ② 的打分权重 ─────────────────┘
```

## 目录

| 文件 | 用途 |
|---|---|
| [`audience.md`](audience.md) | 观众是谁、他们为什么发愁、我们的独特价值 |
| [`sources.md`](sources.md) | 每周固定扫描的信息源 |
| [`scoring.md`](scoring.md) | 选题打分标准 |
| [`persona.md`](persona.md) | 人设 LEO、每期固定模板（钩子 → 自我介绍 → 内容 → 片尾）、说话方式、找料入口、私信模板、红线 |
| [`research/`](research/) | 调研记录（人设与同类账号） |
| [`codex-local.md`](codex-local.md) | 在自己电脑上用 Codex 桌面端出片：安装、打开项目、分工 |
| [`codex-prompts.md`](codex-prompts.md) | 给 Codex 的提示词：第一次接手、做新一期、改问题、出片、发布前检查 |
| [`channel-setup.md`](channel-setup.md) | 账号设置：简介、头衔、横幅、头像（[`brand/`](brand/)），可直接粘贴 |
| [`style-guide.md`](style-guide.md) | 脚本写法、画面风格、声音规则、事实红线 |
| [`backlog.md`](backlog.md) | 选题池 |
| [`metrics.csv`](metrics.csv) | 每条视频的数据记录 |
| [`templates/`](templates/) | 选题卡、事实核对表、分镜方案、发布清单、复盘表 |
| [`../pipeline/`](../pipeline/) | 制作工具：配音、动效引擎、配乐合成、渲染 |
| [`../episodes/`](../episodes/) | 每期一个文件夹，所有过程文件留档 |

## 每周节奏：3 条

| 栏目 | 发布日 | 内容 | 例子 |
|---|---|---|---|
| **News Decoder**（新闻解读） | 周一 | 上周最重要的一条供应链新闻：发生了什么、对你的物料清单意味着什么、这周该做什么 | 苹果可能用长鑫的内存，长鑫是谁？ |
| **Market Pulse**（行情脉搏） | 周三 | 本周中国现货市场的价格和交期信号（华强北、国内分销报价、原厂通知） | 本周 DDR4/DDR5 现货价格走势 |
| **Buyer's Playbook**（采购实操） | 周五 | 一个可以直接照做的采购方法或清单 | 第 001 期：付款前判断贸易商库存真假的五项检查 |

Market Pulse 需要一线价格数据。拿不到可靠数据的那一周，换成一条 Buyer's Playbook 或一条"中国供应链 101"科普，**不编数据**。

**固定格式**：每个栏目有一套固定的结构和画面，每期只改 `episode.json` 里的数据和台词。已完成的格式：

| 栏目 | 格式说明 | 第一期 |
|---|---|---|
| Market Pulse | [`pipeline/formats/market-pulse/FORMAT.md`](../pipeline/formats/market-pulse/FORMAT.md) | `episodes/002-pulse-ddr5-spot` |
| News Decoder | [`pipeline/formats/news-decoder/FORMAT.md`](../pipeline/formats/news-decoder/FORMAT.md) | `episodes/003-decoder-rare-earth-deadline` |
| Buyer's Playbook | [`pipeline/formats/playbook/FORMAT.md`](../pipeline/formats/playbook/FORMAT.md) | 模板样例 `pipeline/formats/playbook/example`（001 是早期单独制作的） |

## 每一步怎么做

开一个 Claude Code 会话，进入本仓库，按下面说就行。每一步的产出都存进 `episodes/<编号>/`。

| 步骤 | 什么时候 | 你对 Claude 说 | 产出 | 你要做的 |
|---|---|---|---|---|
| ① 信号收集 | 周日 | "开始本周信号收集" | 本周信号清单（`episodes/_weekly/<日期>-signals.md`） | 补充你在工作中听到的一手消息 |
| ② 选题评估 | 周日 | "给本周信号打分，选 3 个" | 3 张选题卡（`templates/topic-card.md` 格式） | **拍板**：确认或换题 |
| ③ 事实核实 | 发布前 2 天 | "核实第 N 期" | `FACTS.md`，每条事实都有原始出处和状态 | 判断标记为 ⚠️ 的条目能不能用 |
| ④ 分镜脚本 | 发布前 2 天 | "写第 N 期的分镜方案和旁白" | `TREATMENT.md`、`episode.json`（旁白） | 改稿 |
| ⑤ 制作渲染 | 发布前 1 天 | "制作第 N 期" | `reel.js`、`music.mjs`、成片 MP4 | 审片，提修改意见 |
| ⑥ 发布 | 发布日 | "生成第 N 期的发布文案" | 标题、正文、标签、LinkedIn 文字帖（`templates/publish.md`） | **发布**（账号在你手里） |
| ⑦ 复盘 | 发布 3 天后 + 每周日 | "复盘本周数据" + 粘贴后台数据 | `metrics.csv` 更新、复盘结论 | 提供后台截图或数字 |

**你每周的时间**：周日拍板选题约 15 分钟，每条视频审稿加审片约 20 分钟，发布约 5 分钟，一周合计约 1.5 小时。

## 硬规则

1. **事实不过核实这一关，不进入制作。** 画面上和旁白里没有出处的数字一律删掉。
2. **不用真实品牌的标志和真实料号冒充实物**，示意内容在画面上标 `SCHEMATIC` / `EXAMPLE`。
3. **AI 配音和 AI 画面在片尾标注。**
4. **看询价和私信，不看播放量。** 复盘时第一个看的数字是目标人群带来的私信、询价和关注。
