# 来源笔记 03：Claude Opus 5.5 写代码做视频（2026-10-16，index）

## 核心原理（一句话）
Opus 5.5 不会原生渲染像素，它"写渲染代码"——HTML/Canvas/SVG/Three.js/p5.js/GSAP——驱动无头浏览器逐帧渲染，再用 ffmpeg 合成 MP4。导演→分镜→写代码→逐帧画→配音配乐→合成，全由 agent 完成。

## 工作流标准链路
1. 需求→分镜（Opus 写分镜表，含每句旁白的时间点）
2. 配音先行（kokoro 本地 / edge-tts 免费 / MiniMax TTS / ElevenLabs），音频时长决定画面时长
3. 写动画代码（Canvas/Three.js/GSAP/Remotion），HTML 场景暴露 window.DURATION + window.seek(t)
4. 无头浏览器逐帧渲染（Playwright/Chromium），PNG 序列经 ffmpeg → MP4
5. 字幕按配音时间轴逐句对齐；BGM 人声时自动压低
6. 渲染后抽帧自查→修 bug→重渲染

## 关键开源项目与 Skills
| 项目 | 说明 | 安装/地址 |
|---|---|---|
| heygen-com/hyperframes（HeyGen 开源） | "Write HTML. Render video." 11 个 skills；GSAP/Anime.js/CSS/Lottie/Three.js/WAAPI；`npx hyperframes init/preview/render`；支持 1080×1920 竖屏 | `npx skills add heygen-com/hyperframes`；github.com/heygen-com/hyperframes |
| lemomo-ai/lemo-opuscar（Lemomo） | 43 种影片风格，每种配一支纯代码短片样片；Claude Code skill/plugin；代表作 OPUSCAR 98（6:31，98 部奥斯卡最佳影片，纯代码）| `claude plugin marketplace add lemomo-ai/lemo-opuscar`；github.com/lemomo-ai/lemo-opuscar；样片站 lemomo-ai.github.io/lemo-opuscar |
| tuzhechen2005/opus-video-skills | painted-animation（手绘动画）+ kinetic-reel（动态排版竖屏 reel）两种 skill；需 Node/Chrome/ffmpeg | `/plugin marketplace add tuzhechen2005/opus-video-skills` |
| yihui-dev/awesome-opus5-5-videos | 513 个病毒视频 + prompts 合集，Skillry 可看原片与复刻对比；MIT | github.com/yihui-dev/awesome-opus5-5-videos |
| zhuyansen/awesome-opus-5.5-video | 1697 个作品（Opus 5.5: 1584），每个原帖 5000+ 播放，435 个带 prompt，中英双语 | github.com/zhuyansen/awesome-opus-5.5-video；jasonzhu.ai |
| zhuyansen/awesome-claude-video-skills | 290 个视频 skills 仓库索引，每个做安全评级，实测 16 个端到端 | github.com/zhuyansen/awesome-claude-video-skills |
| ismoshushi/awesome-opus-video-skills | 110 个 skills 索引，分类 code-to-video/产品视频/剪辑/外部视频模型调用 | github.com/ismoshushi/awesome-opus-video-skills |
| egnake/anything2explainer | 主题→带 TTS 配音+字幕的讲解视频，Remotion 渲染，支持中文（edge-tts）；目前仅 16:9 横屏 | github.com/egnake/anything2explainer |
| HuggingFace 教程 | Playwright + ffmpeg 确定性渲染管线，scene.html + render.mjs 模板 | huggingface.co/blog/karmen-beatapi/how-to-make-videos-with-claude-opus-5-5 |

## 爆款案例（均有播放量出处）
1. @donaldjewkes：口述 5 分钟需求，Claude 连续工作约 12 小时，完整动画，X 144 万次观看（163.com"AI范儿" 2026-09-26）
2. @deedydas：给推理初创公司的发布视频，26 秒，用时约 1 分钟，成本约 $2，32 万播放（同上）
3. Deedy：单篇论文→8 分钟 3Blue1Brown 风格讲解视频，25 万播放（同上）
4. "Opus 5.5 的一生"（从第 0 天画到现在）：35.8 万播放（同上）
5. 宝玉（@dotey）：three.js《桃花源记》3D 交互动画，19.6 万播放（同上）；另有 12:12《What is a Transformer》讲解视频（zhuyansen 仓库收录）
6. 马斯克点赞的 5 分钟 MV：被马斯克称为"神作""史诗级大作"（新浪 2026-09-29）
7. Justin：一句话提示"做一个你自己最令人印象深刻的演示"，跑约 5 小时、烧约 6.97 亿 token，demoscene 风格片头，画面声音全由代码生成，打包成 280KB 单个 HTML（163.com）
8. Addy Osmani：40 秒"浏览器是怎么工作的"科普动画（163.com）；另有 three.js 鹈鹉骑单车 1:31（zhuyansen 仓库）
9. Chubby：3 分钟 AI 简史（Attention Is All You Need→AGI），带配音配乐（163.com）
10. Vox《小字》29 秒短片：作者称自己一行代码没写（163.com）
11. Pivi：给 Dictus 的 32.5 秒手绘风宣传片，一句话提示词，agent 全包（163.com）
12. YouTube《I asked Claude Opus 5.5 to make this video. It coded every frame.》：HyperFrames+GSAP+Three.js 渲染，ElevenLabs 配音（youtube.com/watch?v=TwNSEHU0pPc）
13. lemo-opuscar OPUSCAR 98：6:31，98 年奥斯卡最佳影片纯代码重绘（github.com/lemomo-ai/lemo-opuscar）

## 代码生成视频代表案例（Manim/Remotion 系）
- 3Blue1Brown：Manim 的创造者，数学可视化科普鼻祖（Manim Community 为其延续维护，docs.manim.community）
- Deedy 论文→3B1B 风格 8 分钟讲解视频：25 万播放，Opus 5.5 时代"论文→视频"范式
- anything2explainer：Remotion 开源流水线，中文 TTS+字幕+章节进度条
- OPUSCAR 98：长片（6:31）纯代码可行性证明

## Opus 5.5 价格（成本估算用）
- 发布价：输入 $4/百万 token，输出 $20/百万 token（Opus 5 为 $5/$25）；长片可烧掉周额度的 1%–7%，放手自由发挥可达数亿 token（163.com/Youtube 描述）
- Claude Code 在大陆需翻墙+外币支付；代码渲染本身（ffmpeg/Chromium）免费

## 大陆可用性关键点
- Claude/Claude Code：大陆不可直接用（需翻墙）
- 即梦/可灵/剪映/MiniMax：大陆可直接用
- HyperFrames/Remotion/Manim/ffmpeg：开源免费，大陆可用；但驱动它们的 Opus 5.5 需境外可用
- 国产替代思路：即梦 Seedance 做画面 + 剪映剪辑；或用 Kimi/豆包写文案分镜
