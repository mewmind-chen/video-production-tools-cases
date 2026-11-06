# APEC 深圳小主人 · 英语视频样片

样片：`Jonathan_平安大厦_样片.mp4`（1920×1080，2:13，网上素材 + AI 童声，仅作效果示意）。

- 孩子出镜位（片头后、结尾）为占位框，正式版替换为实拍画面与孩子原声。
- 图片：Wikimedia Commons（CC0 / CC BY / CC BY-SA），署名见 `src/credits.json` 与片尾。
- 音乐、音效：`build_audio.py` 程序合成，原创。

## 流程（src/）
1. `thumbs.py` / `getimg.py`：从 Commons 检索并下载图片
2. `script.json`：分段英文稿 + 中文翻译
3. `tts.py`：edge-tts（en-US-AnaNeural）生成配音和逐词时间
4. `build_audio.py`：排时间线 `timeline.json`，合成人声轨、BGM、音效
5. `index.html` + `render.js`：Playwright 逐帧渲染（`node render.js chunk <起帧> <止帧> out.mp4`），ffmpeg 拼接、BGM 闪避、响度标准化

`index.html` 依赖 `npm i @fontsource/fredoka @fontsource/zcool-kuaile`，并需要 `data.js`（由 timeline.json + credits.json 生成）和 `img/`。
