# 在自己电脑上用 Codex 桌面端做视频

Codex 会自动读仓库根目录的 [`AGENTS.md`](../AGENTS.md)，里面写了每期怎么做、哪些代码不能动、事实红线。你只需要装好环境，然后用中文告诉它做哪一期。

## 一次性安装

### Mac

```bash
# 1. 基础工具（没有 Homebrew 先装：https://brew.sh）
brew install node@22 python@3.12 ffmpeg git
# 2. Codex
npm install -g @openai/codex
# 3. 仓库
git clone https://github.com/mewmind-chen/video-production-tools-cases.git
cd video-production-tools-cases
git checkout content-system-001
# 4. 项目依赖：配音模型（约 340 MB）、Chromium、字体
bash pipeline/setup.sh
```

### Windows

Codex 和这套脚本都要在 **WSL（Ubuntu）** 里跑。

```bash
# 在 PowerShell（管理员）里：wsl --install，重启后打开 Ubuntu，然后：
sudo apt update && sudo apt install -y ffmpeg python3-pip git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
npm install -g @openai/codex
git clone https://github.com/mewmind-chen/video-production-tools-cases.git
cd video-production-tools-cases && git checkout content-system-001
bash pipeline/setup.sh
cd pipeline && sudo npx playwright install-deps chromium && cd ..   # Chromium 需要的系统库
```

### 检查装好了没有

```bash
bash pipeline/make.sh episodes/003-decoder-rare-earth-deadline --sheet
```

几分钟后打开 `episodes/003-decoder-rare-earth-deadline/build/sheet.jpg`，看到 10 张画面就说明环境没问题。

## 每次拉取更新后

```bash
git pull && bash pipeline/setup.sh
```

`setup.sh` 会在 `pipeline/.venv` 建一个 Python 3.12 的独立环境装配音库（系统是 Python 3.14 时配音库装不上，这就是你第一次安装时遇到的问题），`make.sh` 会自动用它。Codex 之前自己建的虚拟环境可以留着，不冲突。

## 在 Codex 桌面端打开项目

1. 打开 Codex 桌面端，用 ChatGPT 订阅账号登录。
2. 把 `video-production-tools-cases` 这个文件夹作为项目打开（之后都在这个项目里对话）。
3. Codex 会自动读取仓库根目录的 `AGENTS.md`，不用再交代规则。

不需要终端，也不需要 `start-codex.command`（那是启动命令行版用的，可以删掉）。

**查看结果**：在 Mac 上，`make.sh` 出完联系表会自动用"预览"打开 `sheet.jpg`，出完成片会自动打开视频。不想自动打开时，让 Codex 在命令前加 `NO_OPEN=1`。Codex 改了哪些文件，在对话里点"查看变更"就能看到，不对的点"撤销"。

## 每周怎么分工

| 步骤 | 谁做 | 为什么 |
|---|---|---|
| 周日：收集信号、打分、写 3 张选题卡 | Claude | 要判断新闻的轻重、核实来源 |
| 你拍板选题 | 你 | |
| 事实核对（`FACTS.md`） | Claude | 这周 003 就是靠核实才发现截止日已经延期 |
| 写 `episode.json`、出联系表、改画面问题、渲染 | **Codex** | 照着模板填数据，按 AGENTS.md 检查 |
| 审片、发布 | 你 | |

## 给 Codex 的话怎么说

**做新的一期**（选题和事实已经定好）：

```
按 AGENTS.md 做 004。栏目 News Decoder，发布日 10 月 26 日。
选题卡在 episodes/_weekly/2026-10-24-cards.md 的卡 B，事实在 episodes/004-xxx/FACTS.md。
先出联系表给我看，不要直接渲染成片。
```

**改联系表里看到的问题**：

```
episodes/004-xxx/build/sheet.jpg 第 3 张，标题压住了图。只改 episode.json 里的文字长度，不要改 format.js。
```

**出成片**：

```
联系表没问题了，出成片。
```

## 可能遇到的问题

| 现象 | 处理 |
|---|---|
| Codex 渲染时报浏览器启动失败 | Codex 默认在沙箱里执行命令，可能拦住 Chromium。Codex 请求权限时选允许；如果仍然不行，让 Codex 只改数据，渲染你在终端跑一条命令：`bash pipeline/make.sh episodes/<id>` |
| 联系表或视频没有自动打开 | 沙箱可能拦住了 `open`。到 Finder 里打开 `episodes/<id>/build/sheet.jpg` 或 `deliverables/<id>.mp4` |
| `pip install kokoro-onnx` 失败 | `brew install python@3.12`，删掉 `pipeline/.venv` 后重新跑 `bash pipeline/setup.sh` |
| 渲染很慢 | 正常一期 15–30 分钟；电脑有独立显卡会快一些 |
| Codex 改了 `format.js` 或 `brand.js` | 这两个不该改。让它撤销：`git checkout -- pipeline/` |
| `make.sh` 停在"检查没通过" | 正常，说明 `episode.json` 有错。把提示原样发给 Codex 让它改 |

## 做完怎么交

```bash
git add -A && git commit -m "Episode 004" && git push
```

推上去之后，Claude 那边可以直接看到成片和文件。
