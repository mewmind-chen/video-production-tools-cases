# 来源笔记 04：Hypit（hypit-ai/hypit）——语义视频标记语言（SVML）与爆款复刻流水线（2026-10-19，源码实测）

## 1. 项目概览
- **仓库地址**：https://github.com/hypit-ai/hypit （官网：https://hypit.ai）
- **开源数据**：2026-07-29 创建，截至 2026-10-19 已有 **23,822 Stars / 2,825 Forks**，曾登顶 Trendshift 日榜/周榜第 1。
- **安装方式**：`npx skills add hypit-ai/hypit -g`（作为 Claude Code / Codex 等 Coding Agent 的全局 Skill 安装）。
- **开源协议**：`Apache-2.0 with conditions`（附加商业 SaaS 限制条款，自用与内容创作免费）。
- **核心定位**：为 Coding Agent 提供一套**声明式视频制作领域语言（SVML + SVS + SVRun）与 DAG 编译渲染系统**。把生成式模型（A-roll 口播、B-roll 配图、TTS 配音）与纯代码确定性渲染（HTML/Chromium 动效组件、卡拉 OK 字幕、排行榜）统一在同一套语义时间轴上。

---

## 2. 为什么需要 Hypit？（官方对“AI 做视频两条路”的痛点拆解）

在官方中文科普示例 `examples/complex-explainer/productions/explainer/authors/script.svml` 中，团队总结了当前 AI 视频制作的两条死胡同及 Hypit 的解法：

1. **第一条路：让 AI 操作剪辑软件（剪映 / Premiere / DaVinci 脚本）**
   - **痛点**：AI 先生成素材再贴到时间轴上，“贴素材还可以，做动效就不行”。想让一个数字弹出或一张图飞入，要么让 AI 在时间轴标二十几个关键帧（烧掉几十万 Token），要么用视频大模型直出（效果不稳定且无法改样式）。
2. **第二条路：让 AI 写纯前端代码（Remotion / HyperFrames / 原生 HTML）**
   - **痛点**：动效自由度极高，但**每条视频只能用一次**。下次做同款变体，得让 AI 把几千行 HTML 重新抄一遍（再烧几十万 Token）；更致命的是**每条视频配音时长不同**，为了对齐口播节奏，每次改词都得让 AI 重新计算并硬编码所有秒数时间戳。
3. **Hypit 的合成解法（保留两条路最值钱的部分，扔掉最烧钱的部分）**
   - **空间上（画布组件化）**：把字幕、Tier 排行榜、图表、弹窗卡片封装成参数化 Author Package 组件，AI 只需写一次，换文案/换图/换配色一行组件代码不用重写。
   - **时间上（词级语义锚定 Semantic Time）**：**把稿子当作时间线**，所有画面切换、B-roll 弹出、音效、动效全部绑定在“说的话（词）”上而非“秒”上。由 WhisperX 自动完成逐词时间戳对齐（Word-level Alignment），哪怕重写台词、换配音或翻译成 10 种外语，所有动效依然精准卡点触发，无需修改任何时间点。

---

## 3. 核心架构与三层 DSL 设计

Hypit 仓库采用 pnpm monorepo 架构（Node.js 22.15+，TypeScript 5.9），共包含 **86 个内置模块包**，核心工程由三类声明式文件构成：

### 3.1 `.svml`（Semantic Video Markup Language，语义视频标记语言）
负责声明剧本（Script）、生成素材（Asset/Model）、词级时间投影（Semantic Projection）与轨道合成（Film/Track）。
核心语法亮点：
- **断句控制 `||`**：在 `<script>` 中用 `||` 显式指定字幕断句（Cue boundary），避免竖屏长句折行混乱。
- **发音注音 `<显示词|发音词>`**：例如 `<claude|cloud>`、`<D | Dee>`、`<Github|Git Hub>`，字幕显示前者，TTS/口播生成读取后者，解决专有名词误读。
- **瞬时锚点 `@{event!}`（Moment）与区间锚点 `@{id} ... @{/id}`（Selection）**：
  ```xml
  <ronaldo>
    <HOST>Ronaldo is <D | Dee> tier. || Bro has @{hair-gel} more || hair gel than @{trophy} trophies || at this point.@{/trophy}@{/hair-gel}
  </ronaldo>
  ```
  当主播念到 `more hair gel than trophies` 时，`whisperx:Alignment` 与 `semantic:Projection` 会自动将该词组区间映射为精确的帧时间窗口 `selection-hair-gel`，驱动对应的搞笑 B-roll 卡片弹出。

### 3.2 `.svs`（Semantic Video Sheet，样式与导演配方表）
类似 CSS，将视觉样式与导演设定从业务逻辑中剥离：
- **口播导演配方**（如 `speaker.host`）：声明 `composition-stability: strict-locked; edit-rhythm: pause-trim-jump-cuts; performance: high-energy-ugc;`。
- **卡拉 OK 字幕样式**（如 `caption.primary`）：声明字号、描边、阴影，以及逐词高亮色块动画（`karaoke: current; active-box-background: #008FC7; active-response: pop;`）。
- **业务组件样式**（如 `ranking.football`）：定义 S/A/B/C/D 五档排行榜配色、入场帧数与音效增益。

### 3.3 `.svrun` 与 `hypit.runtime.json`（DAG 执行计划与模型路由）
- 编译器将 `.svml` 编译为有向无环图（DAG），支持增量构建：修改字幕样式或单个 B-roll 时，已生成的口播视频（A-roll）和语音对齐结果直接从本地缓存复用，不重复花钱。
- 支持 `hypit studio` 在浏览器中实时预览时间轴、打时间戳批注（写入 `FEEDBACK.json` 供 Agent 自动读取修改），最后通过多进程无头 Chromium（`@hypit/browser-capture` / `@hypit/provider-html-local`）并发渲染帧并合成 MP4。

---

## 4. 内置生态与真实制作成本（基于官方 Benchmark）

### 4.1 86 个内置 Packages 覆盖的模型与工具链
- **视频生成（A-roll / B-roll）**：`@hypit/seedance`（即梦 Seedance 2 Mini 等，支持人物参考图+参考音色音画同出）、`@hypit/wan`（阿里万相）、`@hypit/pixverse`、`@hypit/grok-imagine`。
- **图像生成**：`@hypit/gpt-image`（GPT Image 2 + 手机 UGC 提示词套件 `@hypit/gpt-image-kits`）、`@hypit/seedream`（即梦生图）、`@hypit/nano-banana`。
- **语音合成与对齐**：`@hypit/fishaudio-speech`（Fish Audio 音色设计与合成）、`@hypit/elevenlabs-speech`、`@hypit/minimax-h3`、`@hypit/mimo-speech`、`@hypit/whisperx`（逐词对齐）。
- **视觉智能与后期操作**：`@hypit/volcengine-matting`（火山引擎抠图）、`@hypit/region-evidence`（Google Video Intelligence + YOLOv8 AnimeFace 人脸框追踪，用于让字幕实时跟随说话人脸部移动）、`@hypit/yt-dlp`（拉取参考视频）。

### 4.2 官方实测单条复刻成本（破除营销号“完全零成本”误区）
虽然 Hypit 框架与本地 Chromium 渲染完全免费，但生成 A-roll/B-roll 需调用外部模型 API。官方 3 个经典复刻案例的真实账单如下：
1. **UGC 排行榜（`examples/ranking-football`，20 秒，1 条主片 + 3 个变体）**：
   - 用料：2 段 Seedance 2 Mini 720p 口播 + 1 张 2K 角色图 + 10 张 1K 搞笑配图（GPT Image 2）+ WhisperX 对齐 + 64 进程无头 Chromium 渲染。
   - **总成本：$1.15**（约 ¥8.2）。
2. **双人分屏播客（`examples/podcast`，18 秒，1 条主片 + 3 个变体）**：
   - 用料：3 段 Seedance 2 Mini 720p 镜头 + 2 张 2K 角色肖像 + 3 张 1K 蒙太奇（GPT Image 2）+ WhisperX 对齐。
   - **总成本：$1.07**（约 ¥7.6）。
3. **街头采访（`examples/interview`，26 秒，1 条主片 + 3 个变体）**：
   - 用料：3 段 Seedance 2 Mini 720p 镜头 + 1 张 2K 肖像 + WhisperX + YOLOv8 人脸追踪动态字幕。
   - **总成本：$1.09**（约 ¥7.8）。

---

## 5. 对我们自身视频项目的借鉴价值
1. **词级锚定语法（`@{cue}` + WhisperX）**：相比手写固定秒数的 Three.js / GSAP 时间轴，先在台词稿里埋入 `@{event!}` 标记，配音生成后跑一次强制对齐（Forced Alignment）导出 JSON 时间表驱动动画，能彻底解决改词重调时间轴的痛点。
2. **发音与字幕解耦（`<显示|发音>`）**：在中文+英文技术名词混杂的脚本（如 `Claude`、`Three.js`、`V8`）中极其有用。
3. **本仓库已归档示例源码**：见 [`examples/hypit-samples/`](../examples/hypit-samples/)。
