# "AI 解决真实工作问题"竖屏短视频：制作工具与真实案例深度调研

> 调研日期：2026-10-16（2026-10-19 增补 Hypit 源码实测与案例归档） ｜ 目标读者：中文竖屏短视频（9:16，抖音类平台）内容创作者
> 结构：重点章节（Claude Opus 5.5 写代码做视频）＋ 工具总览表 ＋ 案例清单 ＋ 3 条行动建议
> 标注说明：【大陆直用】= 中国大陆无需翻墙可直接使用；【需翻墙】= 需境外网络/支付；价格为 2026 年 10 月公开口径，平台调价频繁，下单前请以官网为准。

## 〇 核心结论（先说答案）

1. **本轮最大变量是 Claude Opus 5.5 的 code-to-video 工作流**：它不生成像素，而是写动画代码（HTML/Canvas/Three.js/GSAP），用无头浏览器逐帧渲染、ffmpeg 合成。2026 年 9 月 22 日发布后引爆 X/Twitter，单条案例最高 144 万次观看；配套开源生态（HyperFrames、lemo-opuscar 等）在一个月内成型。
2. **对"AI 解决真实工作问题"这类知识型选题，代码渲染是比 AI 生视频更对的工具**：数字、流程图、对比表格"零幻觉"，风格可复用，竖屏 1080×1920 只需在提示词里指定。
3. **大陆可直接用的主力组合**：即梦（Seedance 模型）/可灵做视觉钩子 ＋ 剪映剪辑 ＋ MiniMax/edge-tts 配音，全部零翻墙。Opus 5.5 本体需翻墙，这是它唯一的硬门槛。

---

## 一、重点章节：Claude Opus 5.5 写代码做视频（code-to-video）

### 1.1 工作流原理：它不是"生成"视频，是"导演"视频

Opus 5.5 连一张图都画不出来。它的工作方式是（据"AI范儿" 2026-09-26 深度拆解）：

```
需求口述 → Opus 写分镜/旁白稿 → 配音先行（音频时长=画面时长）
→ 写动画代码（HTML+Canvas/Three.js/GSAP/p5.js）
→ 无头浏览器逐帧渲染（Playwright/Chromium）
→ ffmpeg 合成 MP4 → 抽帧自查 → 修 bug → 重渲染
```

- **配音先行是关键**：先用 kokoro（本地免费）/ edge-tts（免费）生成中文配音，再按每句话的实际时间点排画面和字幕，字幕逐句对齐，BGM 在人声出现时自动压低。
- **确定性渲染**：同一份代码每次渲染结果完全一致，错一帧改一处代码即可，不像视频生成模型要"抽卡"。
- **成本**：Opus 5.5 发布价输入 $4/百万 token、输出 $20/百万 token；两三分钟的科普片约花掉周额度的 1%–7%，放手让它自由发挥可达数亿 token——但仍比视频生成模型便宜。
- **边界**：几何、光影、粒子、卡通是强项；真实质感的产品照、有毛孔的人脸画不出来——这部分仍需视频生成模型（如即梦/可灵）补位。

### 1.2 工具链总览表

| 工具 | 一句话评价 | 价格 | 大陆直用 |
|---|---|---|---|
| **Hypit**（hypit-ai/hypit）| **23.8k Stars 爆款复刻与语义视频系统**：自创 SVML/SVS 语言，把动效/B-roll/卡拉 OK 字幕锚定在台词“词”上（WhisperX 对齐）而非秒上；支持 Seedance/GPT Image 生成素材 + 64 进程无头 Chromium 并发渲染，改词自动重排时间轴 | 引擎开源免费；生成 A/B-roll 按模型 API 计费（20 秒复刻片约 $1.07–$1.15）| 框架与本地渲染是；内置支持火山/即梦/MiniMax 等国产接口 |
| **HyperFrames**（HeyGen 开源）| "Write HTML. Render video."，11 个 agent skills，GSAP/Anime.js/Lottie/Three.js/WAAPI 全支持，`npx hyperframes init/preview/render` 三步出片，支持 1080×1920 竖屏 | 开源免费；TTS/转写等需 HeyGen 账号 | 框架本身是，但驱动它的 Claude Code 需翻墙 |
| **Remotion** | React/TS 写视频，信息图表/字幕讲解最强，`@remotion/captions` 字幕生态成熟，studio 实时预览 | 个人/非营利/≤3人团队免费；大公司按席位收费 | 是（npm 开源） |
| **Manim**（Python）| 3Blue1Brown 御用，数学/算法可视化天花板，公式变形无人能及 | 开源免费 | 是 |
| **Motion Canvas**（TS）| 可视化编辑器实时预览的动画库，介于手写代码和 AE 之间 | 开源免费 | 是 |
| **GSAP / Three.js / p5.js** | 浏览器动画三件套：GSAP 管时间轴、Three.js 管 3D、p5.js（含水彩笔刷）管创意绘画 | 全部开源免费 | 是 |
| **Playwright + ffmpeg** | 穷人版渲染管线：Chromium 逐帧截图 → ffmpeg 合成，HuggingFace 有完整 `scene.html` + `render.mjs` 模板 | 免费 | 是 |
| **anything2explainer** | 开源一键流水线：输入主题→输出带中文 TTS 配音+字幕+章节进度条的讲解视频（Remotion 渲染，默认 edge-tts 中文音）| 开源免费（PolyForm 非商业许可，商用需作者授权）| 是；⚠️目前仅 16:9 横屏 |

### 1.3 开源仓库与 Agent Skills 清单（重点）

| 仓库 | 收录内容 | 一句话评价 | 链接 |
|---|---|---|---|
| **hypit-ai/hypit** | **SVML 语义视频标记语言＋86 个内置模块包＋7 套完整工程**（含 137 秒中文科普片、足球 Tier List、播客、街头采访）；`npx skills add hypit-ai/hypit -g` 一键装入 Claude Code/Codex | **爆款克隆与批量变体天花板**：把“AI 生视频/配音”与“HTML 组件动效”用词级锚定（`@{cue}`）焊死，一份工作流一键出 100 个变体（本库已归档源码见 `examples/hypit-samples/`）| https://github.com/hypit-ai/hypit |
| **lemomo-ai/lemo-opuscar** | 43 种影片风格，每种配一支纯代码样片＋风格提示词＋导演/技术指南；Claude Code plugin 一键安装；代表作 OPUSCAR 98（6 分 31 秒，98 部奥斯卡最佳影片纯代码重绘）| "选风格、带故事，让 agent 当导演"，知识类创作者的**风格字典**，中英双语 | https://github.com/lemomo-ai/lemo-opuscar |
| **yihui-dev/awesome-opus5-5-videos** | 513 个病毒视频＋背后 prompts，Skillry 站可左右对比原片与复刻 | **抄作业第一站**：每个案例都链回原帖，直接复制 prompt 改主题即用 | https://github.com/yihui-dev/awesome-opus5-5-videos |
| **zhuyansen/awesome-opus-5.5-video** | 1697 个作品（Opus 5.5 占 1584），入选门槛原帖 5000+ 播放，435 个带 prompt，中英双语，按动效/UI/广告/科普/叙事/3D/游戏/音乐分类 | 分类最细的案例库，找"科普讲解"类直接看 Explainers 分区 | https://github.com/zhuyansen/awesome-opus-5.5-video |
| **tuzhechen2005/opus-video-skills** | 两个 skill：painted-animation（手绘动画）、kinetic-reel（动态排版短视频）| 唯一主打"短视频 reel"形态的 skill，竖屏创作者优先试它 | https://github.com/tuzhechen2005/opus-video-skills |
| **zhuyansen/awesome-claude-video-skills** | 290 个视频 skills 索引，每个做安全评级，实测 16 个端到端；结论：简单 promo 不用 skill 也行，skill 的价值在"风格+工作流" | 选型指南：先看它的实测排名再装，避免 skill 泛滥 | https://github.com/zhuyansen/awesome-claude-video-skills |
| **ismoshushi/awesome-opus-video-skills** | 110 个 skills 索引，分 code-to-video / 产品视频 / 剪辑 / 外部视频模型调用四类 | 一句话点破本质：Opus 5.5 不渲染像素，它写渲染代码 | https://github.com/ismoshushi/awesome-opus-video-skills |

安装方式（通用）：`npx skills add hypit-ai/hypit -g`、`npx skills add heygen-com/hyperframes`，或 `claude plugin marketplace add lemomo-ai/lemo-opuscar` 后 `claude plugin install lemo-opuscar@lemolab`。

### 1.5 专项拆解：Hypit（hypit-ai/hypit）为什么能解决“纯写 HTML 视频”的痛点？

> 详细源码级拆解见 [`notes/source-04-hypit.md`](notes/source-04-hypit.md)，官方示例源码与 Skill 归档见 [`examples/hypit-samples/`](examples/hypit-samples/)。

在 Hypit 官方中文科普工程（[`examples/hypit-samples/complex-explainer/authors/script.svml`](examples/hypit-samples/complex-explainer/authors/script.svml)）中，一针见血地指出了当前 AI 做视频的两条死胡同：
- **死胡同 A（让 AI 操作剪映/PR 时间轴）**：贴素材可以，做动效要在时间轴标几十个关键帧，狂烧几十万 Token 且样式死板。
- **死胡同 B（让 AI 直接写几千行 Remotion / HTML）**：动效虽强，但**每条视频只能用一次**；换个产品或改句台词，配音时长一变，AI 就得把几千行 HTML 和所有秒数时间戳重新抄写重算一遍。

**Hypit 的核心解法（三层 DSL + DAG 增量编译）**：
1. **词级语义锚定（`.svml`）**：把剧本本身当作时间线，用 `||` 控制字幕断句，用 `<显示词|发音词>`（如 `<claude|cloud>`）修正 TTS 读音，用 `@{event!}` 或 `@{id}...@{/id}` 将 B-roll 弹出、榜单掉落、音效直接绑在台词词组上，由 `@hypit/whisperx` 自动算出帧级时间窗口。**改台词或翻译多语言，时间轴自动重排，一行时间代码不用改。**
2. **样式与组件解耦（`.svs` + Author Packages）**：把卡拉 OK 逐词高亮字幕、S-D 级排行榜、弹窗卡片做成可复用组件，通过类似 CSS 的 `.svs` 配方表调参。
3. **生成与渲染混合管线（`.svrun`）**：A-roll 口播（Seedance 2 Mini）与 B-roll 配图（GPT Image 2）走 API 生成并本地缓存，画面合成与动效走 64 进程无头 Chromium 并发渲染。单条 20 秒爆款复刻（含 3 个变体）实测 API 总成本仅 **$1.07–$1.15**。

### 1.4 给竖屏创作者的关键提示

- **竖屏要显式指定**：HyperFrames 实测支持 1080×1920（已有"文章→视频号竖屏短视频"完整案例）；其余仓库默认多为 16:9，prompt 里必须写清"9:16 竖屏、1080×1920"。
- **字幕安全区**：竖屏字幕放画面下方安全区，代码里写死即可，一次写好永久复用。
- **中文配音**：kokoro 本地模型（`zf_xiaoxiao` 等中文音色）或 edge-tts，零成本；MiniMax TTS 中文表现力更强（见第三章）。

---

## 二、案例清单

### 2.1 用 Opus 5.5（非真人出镜）做出的爆款视频案例

| # | 案例 | 工具链 | 题材 | 数据表现 | 链接 |
|---|---|---|---|---|---|
| 1 | @donaldjewkes 口述 5 分钟需求，Claude 连续工作约 12 小时交出完整动画 | Opus 5.5 代码渲染 | 叙事动画 | **X 144 万次观看** | https://www.163.com/dy/article/L7NE1UAF0556703U.html（"AI范儿" 2026-09-26 深度报道） |
| 2 | @deedydas 给推理初创公司的发布视频（26 秒）| Opus 5.5 | 产品发布/广告 | **32 万播放，用时约 1 分钟，成本约 $2** | 同上 |
| 3 | Deedy：单篇研究论文→8 分钟 3Blue1Brown 风格讲解视频 | Opus 5.5 | 论文科普 | **25 万播放** | 同上 |
| 4 | 《Opus 5.5 的一生》：从第 0 天画到现在 | Opus 5.5 | 自传式叙事 | **35.8 万播放** | 同上 |
| 5 | 宝玉（@dotey）：three.js《桃花源记》3D 交互动画，可在线"走进"桃花源 | Opus 5.5 + three.js（让 Opus 自搜免费 3D 模型省去建模）| 中文文化 3D | **19.6 万播放** | 同上；另见 https://github.com/zhuyansen/awesome-opus-5.5-video（收录其 12:12《What is a Transformer》讲解） |
| 6 | 马斯克点赞的 5 分钟 MV | Opus 5.5，12 小时自动生成 | 音乐 MV | 马斯克称为"神作""史诗级大作" | https://finance.sina.cn/stock/jdts/2026-09-29/detail-initphzx6106784.d.html |
| 7 | Justin：提示词只有一句"做一个你自己最令人印象深刻的演示" | Opus 5.5，零素材 | demoscene 炫技 | 跑约 5 小时、烧约 6.97 亿 token，画面声音全代码生成，打包成 **280KB 单个 HTML** | https://www.163.com/dy/article/L7NE1UAF0556703U.html |
| 8 | YouTube《I asked Claude Opus 5.5 to make this video. It coded every frame.》| HyperFrames + GSAP + Three.js，ElevenLabs 配音/音乐 | 6 种风格混剪科普 Opus 5.5 本身 | 长视频案例，像素艺术/方块世界/卡通/3D 全代码 | https://www.youtube.com/watch?v=TwNSEHU0pPc |

另：Pivi 给 Dictus 的 32.5 秒手绘风宣传片（一句话提示词，agent 全包拆帧/找 logo/作曲）、Addy Osmani 40 秒《浏览器是怎么工作的》、Chubby 3 分钟 AI 简史、Vox 29 秒《小字》（作者称一行代码没写），均出自同一深度报道。

### 2.2 代码生成视频的代表案例（Manim / Remotion 系）

| 案例 | 工具 | 一句话评价 | 链接 |
|---|---|---|---|
| **3Blue1Brown** | Manim（Grant Sanderson 原创，Manim Community 延续维护）| 数学可视化科普的鼻祖，"论文→8 分钟讲解视频"范式的源头 | https://docs.manim.community/ |
| **OPUSCAR 98**（lemo-opuscar）| Canvas/WebGL 逐帧渲染＋免费采样库配乐＋本地 TTS | 6 分 31 秒纯代码长片，证明代码流也能扛长叙事 | https://github.com/lemomo-ai/lemo-opuscar |
| **anything2explainer** | Remotion＋edge-tts 中文配音＋字幕＋章节进度条 | 开源一键"主题→讲解视频"流水线，知识类创作者可直接 fork 改竖屏 | https://github.com/egnake/anything2explainer |
| **水彩风 MV**（GitHub @JohnHeibel《I'm Upping My P(doom)》)| p5.js＋p5.brush，9 章节分段渲染，ffmpeg 合成 | 歌词逐句分镜＋逐秒抽帧验收，是"配音先行"流程的音乐版 | https://today.line.me/tw/v3/article/wJv97Rr（案例整理） |

### 2.3 "AI＋真实工作场景"题材的代表创作者

> 说明：本轮未能验证到公开粉丝量/更新节奏均可查的抖音"AI 办公"账号（多为营销号通稿，数据不可采信），以下收录的是**用 AI 做真实工作产出、有可验证作品**的创作者，粉丝量与更新节奏标为"未验证"，请勿引用为定论。

| 创作者 | 内容形式 | 数据/节奏 |
|---|---|---|
| **Lemomo**（@lemomo_ai，X）| lemo-opuscar 作者：43 种纯代码影片风格，每支样片＝一次"真实接单式"交付（含配乐混音）| 仓库 2400+ stars（2026-10）；更新节奏未验证 |
| **宝玉**（@dotey，X/中文技术圈）| 用 Opus 5.5 做 3D 交互（桃花源记）＋ 长篇技术讲解（12 分钟 Transformer）| 单案例 19.6 万播放；节奏未验证 |
| **"AI范儿"**（网易号/微信，上海）| 中文深度拆解 AI 视频案例（Opus 5.5 工作流全复盘＋竖屏实战）| 单篇引爆中文圈讨论；粉丝量未验证 |

- 链接：https://github.com/lemomo-ai/lemo-opuscar ｜ https://www.163.com/dy/article/L7NE1UAF0556703U.html

---

## 三、通用 AI 视频工具总览（压缩版）

### 3.1 AI 视频生成工具

| 工具 | 强项（一句话）| 画质/时长 | 价格与免费额度 | 中文提示词 | 大陆直用 |
|---|---|---|---|---|---|
| **可灵**（快手，kling.ai）| 真人/人体主体表现最好，Kling 3.0 单次 15 秒＋原生多机位剪辑＋原生音频 | 1080p | 国际版：免费 66 credits/天；Standard $10/月（660 credits）；国内版按灵感值计费（5 秒视频 20–50 灵感值）| 原生支持 | **是** |
| **即梦**（字节，Seedance 模型）| 中文语义理解最强，"做同款"＋一键进剪映＋直发抖音，Seedance 2.0 音画同出 | 1080p | 免费积分已砍至每天 10–30；标准会员 ¥199/月（4000 积分，首月 ¥119）；15 秒视频成本 ¥0.65–5 | 原生支持 | **是** |
| **海螺 Hailuo**（MiniMax）| 物理运动＋动漫/水墨/游戏 CG 风格，约 $0.30/10 秒 1080p，性价比突出 | 1080p，单次最长 10 秒 | 免费每天约 2–3 条 720p（水印）；Standard $14.99/月起 | 支持 | 国际版需翻墙；MiniMax 国内开放平台可直用 |
| **Veo 3.1**（Google）| 画质标杆＋原生音频，Flow  credits 体系 | 720p/1080p/4K，8 秒 | API：$0.05–0.60/秒；Google AI Pro $19.99/月；免费 50 Flow credits/天 | 弱 | **否** |
| **Runway**（Gen-4.5）| 生成＋编辑一体（inpainting、lipsync、放大），聚合 20+ 第三方模型 | 4K 导出 | 免费 125 credits（一次性）；Standard $15/月（625 credits≈52 秒 Gen-4.5）| 弱 | **否** |
| Sora 2（OpenAI）| ⚠️ 已实质退出：App 2026-04-26 下线，API 2026-09-24 关停 | — | — | — | 否 |

- 来源：https://www.cloudzero.com/blog/kling-ai-pricing/ ｜ https://www.yunyingpai.com/news/1065207.html ｜ https://www.163.com/dy/article/KMND59RS0550B1DU.html ｜ https://framesurfer.com/blogs/veo-3-pricing ｜ https://www.eesel.ai/blog/runway-ai-pricing ｜ http://news.indianaheadlines.com/story/621087/hailuo-ai-video-generator-review-july-2026-how-minimaxs-physicsleading-model-is-winning-over-creators-on-speed-and-value.html ｜ https://queststudio.io/blog/sora-2-pricing-limits-prompt-tips

### 3.2 剪辑与后期

| 工具 | AI 功能（一句话）| 价格 | 大陆直用 |
|---|---|---|---|
| **剪映**（国内版）| 自动字幕、文本朗读、智能剪口播，抖音生态直连 | 免费版可用；会员解锁 AI 功能与模板（价以 App 内为准）| **是** |
| **CapCut**（国际版）| 同源：4K 导出、动态追踪、人声分离、AI 配音/数字人、说话人识别字幕，Pro 每月 1200 AI credits | 免费 / Standard ~$9.99/月 / Pro $19.99/月（年付约 $179.99）| 国际版需外区账号 |
| **Descript** | 文本剪视频鼻祖：一键去口癖（嗯/啊）、Studio Sound、Underlord AI 协编 | 免费（1 小时/月，水印）；Hobbyist $24/月（年付 $16）；Creator $35/月 | **否** |
| **DaVinci Resolve** | 专业调色剪辑，免费版功能完整，Studio 一次性买断 | 免费 / Studio $295 一次性 | **是** |

- 来源：https://www.linkedin.com/pulse/capcut-pro-worth-okulu-ebubechukwu-wvwfe ｜ https://shade.inc/blog/descript-pricing-2026-plans-media-minutes-ai-credits-alternatives

### 3.3 配音 TTS

| 工具 | 中文自然度（一句话）| 价格 | 大陆直用 |
|---|---|---|---|
| **MiniMax TTS**（Speech 2.8）| 国产情感表现力第一梯队，10 秒克隆，WebSocket 流式 | Turbo $60/百万字符，HD $100/百万字符；音频订阅 $5/月起 | **是**（开放平台）|
| **edge-tts**（微软）| 晓晓/云希等中文音色自然，anything2explainer 默认中文配音方案 | **免费** | **是** |
| **Azure Speech**（微软）| 企业级 Neural 语音 | 约 $16/百万字符（云大厂公开价目量级）| Azure 中国可直用 |
| **ElevenLabs** | 行业自然度标杆（v4），中文可用但情感细腻度不如英文 | 免费 1 万字符/月；Starter $6/月（3 万字符）；Creator $22/月 | **否** |
| **智谱 GLM-TTS** | 国产大模型语音 | 按量计费（具体单价未在本轮验证）| **是**（bigmodel.cn）|

- 来源：https://aireiter.com/blog/best-text-to-speech-api ｜ https://dev.to/stimlau/elevenlabs-pricing-explained-free-starter-creator-and-pro-in-2026-4p6b

### 3.4 一站式 AI 短视频工作流（文案→分镜→配音→成片）

| 工具 | 覆盖环节（一句话）| 价格 | 大陆直用 |
|---|---|---|---|
| **HeyGen** | 文本→数字人播报视频，1100+ 数字人，175+ 语言唇形同步 | 免费（3 条水印视频/月）；Creator $24/月 | **否** |
| **invideo** | 文本→混剪成片（素材库＋配音＋字幕）| 约 $60/人/月起 | **否** |
| **即梦＋剪映**（国产实际最优解）| 即梦（文案→分镜→Seedance 成片）→一键进剪映（字幕/配音/剪辑）→直发抖音 | 见 3.1 | **是** |

- 来源：https://dev.to/stimlau/best-ai-video-generator-for-marketing-in-2026-7-tools-tested-157c ｜ https://www.yunyingpai.com/news/1065207.html
- 一句话评价：**真"全自动文案→成片"且中文好用的只有"即梦＋剪映"这条国产链**；HeyGen/invideo 强在数字人与营销混剪，但需翻墙且中文配音弱于 MiniMax。

---

## 四、给竖屏知识类创作者的 3 条行动建议

### 建议 1：用"国产零翻墙链路"先跑通选题与完播，再谈画质
**做法**：即梦（Seedance 出视觉钩子）→ 剪映（自动字幕＋去口癖）→ MiniMax TTS / edge-tts（配音），全程大陆直用、零翻墙。选题只做"真实工作痛点＋AI 解法"（如 5 分钟会议纪要、Excel 自动清洗、周报一键生成），每条验证完播率后再谈连载。**依据**：即梦"做同款"＋直发抖音是最短的创作—发布闭环；但注意即梦 2026 年三轮涨价、免费积分砍至每天 10–30，**不要把全部产能押在单一平台**（见来源 https://post.smzdm.com/p/awwzqqw2/）。

### 建议 2：把 Opus 5.5 代码渲染作为你的"差异化武器"，专攻信息图表类视频
**做法**：凡是"流程图、数据对比、时间轴、原理拆解"类选题，改用 HyperFrames（`npx skills add heygen-com/hyperframes`）或抄 `awesome-opus5-5-videos` 的 prompt，prompt 首行写死"9:16 竖屏、1080×1920、字幕在下方安全区"。数字零幻觉、风格可复用，是 AI 生视频做不到的。**依据**：Deedy"论文→8 分钟 3B1B 风格视频"25 万播放、Justin 280KB 单文件 demoscene，证明知识密度与代码流是绝配；lemo-opuscar 的 43 种风格就是你的风格库。

### 建议 3：建立"配音先行、字幕对齐"的工业化流程，一份内容吃两个平台
**做法**：kokoro/edge-tts 先出中文配音 → 按配音时间轴排画面（代码渲染或即梦片段）→ 剪映自动对齐字幕 → 同一工程输出 9:16（抖音）与 16:9（B站/YouTube）两版。**依据**：HyperFrames 竖屏实战案例（"AI范儿"把文章变成视频号 40 秒短视频仅用 1 小时）证明该流程可压缩到小时级；anything2explainer 的"旁白驱动画面"方法论是同一原理的开源实现。

---

## 五、未能验证 / 开放问题

1. **抖音"AI＋办公"垂类账号**：未找到粉丝量、更新节奏均可公开验证的代表账号（中文搜索结果多为营销通稿），2.3 节创作者数据请勿直接引用。
2. **智谱 GLM-TTS、剪映会员、Premiere/Final Cut** 的精确单价未在本轮验证，已在表中标注，请以官网/App 内为准。
3. **lemo-opuscar 等仓库的竖屏（9:16）适配程度**未逐一实测，仅 HyperFrames 有明确竖屏实战案例；其余建议按 1.4 节方法在 prompt 中显式指定。
4. **Opus 5.5 在大陆的合规使用方式**超出本轮调研范围；其 API 与 Claude Code 均需境外网络与支付。

## 六、来源清单

**Opus 5.5 与代码/语义视频专项**
- https://github.com/hypit-ai/hypit（Hypit 官方仓库，SVML 语义视频语言与爆款复刻系统；官网 https://hypit.ai）
- https://www.163.com/dy/article/L7NE1UAF0556703U.html（"AI范儿" 2026-09-26，Opus 5.5 视频现象深度拆解，含 HyperFrames 竖屏实战）
- https://github.com/lemomo-ai/lemo-opuscar（43 种纯代码影片风格＋OPUSCAR 98）
- https://github.com/yihui-dev/awesome-opus5-5-videos（513 病毒视频＋prompts）
- https://github.com/zhuyansen/awesome-opus-5.5-video（1697 作品案例库，中英双语）
- https://github.com/zhuyansen/awesome-claude-video-skills（290 skills 索引＋实测排名）
- https://github.com/ismoshushi/awesome-opus-video-skills（110 skills 索引）
- https://github.com/tuzhechen2005/opus-video-skills（painted-animation＋kinetic-reel）
- https://github.com/heygen-com/hyperframes（HyperFrames 官方仓库）
- https://github.com/egnake/anything2explainer（Remotion 中文讲解流水线）
- https://huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5（Playwright＋ffmpeg 确定性渲染教程）
- https://www.youtube.com/watch?v=TwNSEHU0pPc（全代码长视频案例）
- https://finance.sina.cn/stock/jdts/2026-09-29/detail-initphzx6106784.d.html（马斯克点赞 MV）
- https://today.line.me/tw/v3/article/wJv97Rr（10 种风格 prompt 范本整理）

**通用工具**
- https://www.cloudzero.com/blog/kling-ai-pricing/（Kling 价格）｜ https://finance.sina.com.cn/stock/hkstock/marketalerts/2026-01-05/doc-inhfffrw6899581.shtml（可灵灵感值）
- https://www.yunyingpai.com/news/1065207.html（即梦生态）｜ https://www.163.com/dy/article/KMND59RS0550B1DU.html（即梦会员涨价，科创板日报）｜ https://post.smzdm.com/p/awwzqqw2/（即梦积分规则变动）
- https://framesurfer.com/blogs/veo-3-pricing（Veo 3.1 价格）｜ https://www.eesel.ai/blog/runway-ai-pricing（Runway 价格）
- http://news.indianaheadlines.com/story/621087/hailuo-ai-video-generator-review-july-2026-how-minimaxs-physicsleading-model-is-winning-over-creators-on-speed-and-value.html（Hailuo 价格）
- https://queststudio.io/blog/sora-2-pricing-limits-prompt-tips（Sora 关停时间线）
- https://www.linkedin.com/pulse/capcut-pro-worth-okulu-ebubechukwu-wvwfe（CapCut 价格体系）
- https://shade.inc/blog/descript-pricing-2026-plans-media-minutes-ai-credits-alternatives（Descript 价格）
- https://aireiter.com/blog/best-text-to-speech-api（MiniMax TTS 价格）｜ https://dev.to/stimlau/elevenlabs-pricing-explained-free-starter-creator-and-pro-in-2026-4p6b（ElevenLabs 价格）
- https://dev.to/stimlau/best-ai-video-generator-for-marketing-in-2026-7-tools-tested-157c（HeyGen/invideo 横评）
- https://github.com/weihaoqu/learnaidoc/blob/HEAD/_wiki/teaching-videos-manim-remotion.md（Manim vs Remotion 选型）

*工作笔记见 `notes/source-01-video-gen.md`、`notes/source-02-edit-code-tts.md`、`notes/source-03-opus55.md`、`notes/source-04-hypit.md`；Hypit 关键示例与 Skill 源码归档见 `examples/hypit-samples/`。2026-10-16 内容经网页索引（index）核验，2026-10-19 新增的 Hypit 章节经 GitHub 源码克隆与文件实测核验；价格类信息请以下单页为准。*
