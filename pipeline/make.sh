#!/usr/bin/env bash
# 一条命令做完一期：配音 → 配乐 → 联系表 → 成片 → 压缩到 deliverables/
# 用法：
#   bash pipeline/make.sh episodes/<id>            全流程
#   bash pipeline/make.sh episodes/<id> --sheet    只做到联系表（先看画面，不渲染成片）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EP="$(cd "$1" && pwd)"; ID="$(basename "$EP")"; MODE="${2:-}"
cd "$ROOT/pipeline"

echo "▶ 1/4 配音"
python3 tts.py "$EP"

echo "▶ 2/4 配乐"
FMT="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('format',''))" "$EP/episode.json")"
if [ -n "$FMT" ]; then node "formats/$FMT/music.mjs" "$EP"; else node "$EP/music.mjs"; fi

echo "▶ 3/4 联系表（每段场景 60% 处一帧）"
TIMES="$(python3 -c "import json,sys;t=json.load(open(sys.argv[1]));print(','.join(f\"{s['start']+(s['end']-s['start'])*.6:.2f}\" for s in t['scenes']))" "$EP/build/timeline.json")"
node render.mjs "$EP" --sheet "$TIMES" --cols 6
echo "  联系表：$EP/build/sheet.jpg"
[ "$MODE" = "--sheet" ] && exit 0

echo "▶ 4/4 成片（约 20–30 分钟）"
node render.mjs "$EP"
mkdir -p "$ROOT/deliverables"
ffmpeg -v error -y -i "$EP/$ID.mp4" -c:v libx264 -preset slow -b:v 2400k -maxrate 3200k -bufsize 6000k -pix_fmt yuv420p -c:a copy -movflags +faststart "$ROOT/deliverables/$ID.mp4"
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$ROOT/deliverables/$ID.mp4")"
LUFS="$(ffmpeg -i "$ROOT/deliverables/$ID.mp4" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | awk '{print $2}')"
echo "✔ deliverables/$ID.mp4 · ${DUR%.*} 秒 · ${LUFS} LUFS（目标 60–90 秒、约 −14）"
