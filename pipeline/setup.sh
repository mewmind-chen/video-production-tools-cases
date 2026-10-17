#!/usr/bin/env bash
# 一次性安装：Kokoro 本地配音模型 + Playwright 渲染依赖
set -euo pipefail
cd "$(dirname "$0")"

pip3 install -q kokoro-onnx soundfile

mkdir -p models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s models/kokoro-v1.0.onnx ] || curl -sSL -o models/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
[ -s models/voices-v1.0.bin ]  || curl -sSL -o models/voices-v1.0.bin  "$base/voices-v1.0.bin"

PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --silent
# 本机第一次运行需要下载 Chromium；云端环境已预装时设置了 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD，会跳过
[ -n "${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-}" ] || npx playwright install chromium

echo "setup done"
