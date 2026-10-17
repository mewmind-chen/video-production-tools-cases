#!/usr/bin/env bash
# 自检：规格 + 每个镜头中点抽帧 + 第 0 帧 + 定格帧
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=out/ep01.mp4
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate -show_entries format=duration -of compact "$OUT"
rm -rf out/check && mkdir -p out/check
ffmpeg -v error -y -ss 0 -i "$OUT" -frames:v 1 out/check/frame0.png
python3 - <<'PY' | while read -r name t; do ffmpeg -nostdin -v error -y -ss "$t" -i "$OUT" -frames:v 1 "out/check/$name.png"; done
import json
T = json.load(open("build/timeline.json")); C = json.load(open("build/cues.json"))
for s in T["shots"]:
    print(f"shot{s['id']}_mid {(s['start'] + s['end']) / 2:.2f}")
print(f"freeze {T['duration'] - 0.3:.2f}")
PY
ls out/check
