# 制作工具

一条视频 = 配音时间表 + 逐镜头动效脚本 + 合成配乐，最后由无头浏览器逐帧渲染、ffmpeg 合成。全部在本地运行，不依赖在线服务。

```
episode.json（旁白）
   │  tts.py（Kokoro 本地配音）
   ▼
build/narration.wav + build/timeline.json（每个场景、每句台词的起止时间，字幕切分，音量包络）
   │
   ├─► cues.mjs（本期时间表：场景起点 + 命中点）──┬─► reel.js（逐镜头画面）──┐
   │                                              └─► music.mjs（配乐与音效）─┤
   ▼                                                                        ▼
render.mjs：无头 Chromium 逐帧调用 renderAt(t) → ffmpeg（配乐在人声下自动避让，−14 LUFS）→ <编号>.mp4
```

## 一次性安装

```bash
pipeline/setup.sh        # Kokoro 模型（约 350 MB，从 GitHub 下载）+ npm 依赖（playwright、three、字体）
```

需要：Node 20+、Python 3.11+、ffmpeg、Chromium（Playwright）。

## 做一期

```bash
EP=episodes/002-xxx
python3 pipeline/tts.py $EP                                    # 1. 配音 → build/timeline.json
node pipeline/render.mjs $EP --sheet 1,5,10,20,30 --cols 5     # 2. 写 reel.js 时反复看联系表 → build/sheet.jpg
node $EP/music.mjs                                              # 3. 配乐 → build/music.wav
node pipeline/render.mjs $EP --range 0:15                      # 4. 先渲染一段样片
node pipeline/render.mjs $EP                                    # 5. 全片 → $EP/<编号>.mp4
```

改了旁白就要重跑第 1 步，时间表变了，`cues.mjs` 里的命中点会自动跟着变。

## 每期文件夹

| 文件 | 内容 |
|---|---|
| `episode.json` | 旁白（每句 `text` 字幕 / `say` 念法）、配音音色、语速、`"engine": "reel"` |
| `TREATMENT.md` | 分镜方案 |
| `FACTS.md` | 事实核对表 |
| `cues.mjs` | 本期时间表（画面和配乐共用） |
| `reel.js` | 逐镜头画面脚本，调用 `pipeline/reel/engine.js` 的工具 |
| `music.mjs` | 配乐编曲，调用 `pipeline/synth.mjs` 的乐器 |
| 其他 `.js` | 本期专用的 3D 模型等（例如 001 的 `mlcc.js`） |
| `build/` | 生成文件，不进 git |

## 引擎提供什么（`reel/engine.js`）

- **排版**：`dropWord`（字母落下）、`stackWord`（重锤词加描边回声）、`letters`（逐字自定义动画）、`odometer`（数字滚动）、`chip`（标签）、`tape`（斜向滚动胶带）
- **图形**：`line`、`circle`、`rrect`、`arrow`、`starburst`、`asterisk`、`barcode`、`redacted`（用色块代替文字，不编内容）、`thread`（连线）、`mark`（频道标识）
- **GL 层**：`terrain`（粒子地形）；每期可以加自己的 3D 层（共用 `R.RA` 渲染器，返回画布后用 `glShot` 合成）
- **转场**：`trIris`、`trZoom`、`trPush`、`trWipe`、`trSlats`、`trGrid`
- **HUD**：四角细字、时间码、分章节进度条；**字幕和 AI 主播**每帧自动绘制
- **后期**：RGB 错位、故障切片、颗粒、暗角、闪白（场景里写 `R.FX.flash = …`）

## 性能

无 GPU 环境用 SwiftShader 软件渲染，约 0.35 秒一帧；80 秒的片子（2400 帧）约 14 分钟。有 GPU 的机器快一个数量级。
