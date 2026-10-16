# 来源笔记 02：剪辑 / 代码视频 / TTS（2026-10-16，index）

## 剪辑与后期
- CapCut 国际版：免费 / Standard ~$9.99/月 / Pro $19.99/月（年付约 $179.99/年）；Pro 含 4K 导出、AI 工具包（动态追踪、人声分离/隔离、AI 配音、数字人、说话人识别字幕）、1200 AI credits/月。免费版有自动字幕、TTS、去背景等基础 AI 功能。
- 国内剪映：会员制（按国内定价，连续包月约 ¥20+ /月量级，AI 字幕、文本朗读等为会员功能）；大陆可直接用。CapCut 国际版在大陆应用商店情况需注明（国际版需外区账号）。
- Descript：文本剪视频；去口癖（filler-word removal）、Studio Sound、Underlord AI 协编；Free $0（1 小时/月，720p 水印）；Hobbyist $24/月（年付 $16）；Creator $35/月（年付 $24）；Business $65/月。美国公司，需翻墙。
- DaVinci Resolve：免费版功能全；Studio 一次性 $295。大陆可直接用（官网下载）。
- Premiere Pro：Adobe 订阅制（约 ¥888/年国内个人版量级——需核验，暂未验证，先不写具体数或标注待验证）；Final Cut Pro：Mac 一次性买断（$299.99 美区）。
- 来源：https://www.linkedin.com/pulse/capcut-pro-worth-okulu-ebubechukwu-wvwfe；https://shade.inc/blog/descript-pricing-2026-plans-media-minutes-ai-credits-alternatives

## 代码驱动视频
- Manim（Python，3Blue1Brown 御用）：数学/算法可视化最强；免费开源；需 Python 环境；字幕需手动或 manim-voiceover。
- Remotion（React/TS）：UI 演示、带字幕讲解、信息图表、图表动画；remotion studio 实时预览；字幕生态强（@remotion/captions）；免费给个人/非营利/≤3 人小团队，大公司按席位收费。
- Motion Canvas（TS）：可视化编辑器预览，适合做动画图解；开源免费。
- GSAP：Web 动画库，可录制为视频；免费（Webflow 收购后核心免费）。
- anything2explainer（GitHub 开源项目）：输入主题→输出带 TTS 配音+字幕的讲解视频，Remotion 渲染，支持中文（默认 edge-tts 中文语音）；注意目前仅横屏 16:9。
- 来源：https://github.com/weihaoqu/learnaidoc/blob/HEAD/_wiki/teaching-videos-manim-remotion.md；https://github.com/egnake/anything2explainer

## TTS 配音
- ElevenLabs：行业自然度标杆；Free $0（1 万字符/月，约 10 分钟）；Starter $6/月（3 万字符）；Creator $22/月（12.1 万字符）；Pro $99/月。中文支持有但情感表现不如英文母语级；需翻墙+外币卡。
- MiniMax TTS（Speech 2.8）：Turbo $60/百万字符，HD $100/百万字符；中文表现力强（国内公司）；有 $5/月起的音频订阅；大陆可用（MiniMax 开放平台）。
- 微软 TTS（Azure Speech）：Neural 语音按字符计费（约 $15–16/百万字符量级——待验证具体数字）；edge-tts 可免费调用；中文语音（如晓晓/云希）自然度好；大陆 Azure 可用。
- 智谱 GLM-TTS：智谱开放平台，按量计费（具体单价待验证）；大陆可直接用。
- 来源：https://dev.to/stimlau/elevenlabs-pricing-explained-free-starter-creator-and-pro-in-2026-4p6b；https://aireiter.com/blog/best-text-to-speech-api
