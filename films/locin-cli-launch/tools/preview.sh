#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
film=films/locin-cli-launch
export FFMPEG="$PWD/bin/ffmpeg"
mkdir -p "$film/out"

node "$film/tools/check.mjs" > "$film/out/check.json"
node films/tin-launch/tools/determinism.mjs "$film/src/index.html" \
  0 1 3.9 4 6 7.9 8 8.5 10 12 12.25 12.75 14 16 17 19.966 > "$film/out/determinism.log"
node films/tin-launch/tools/render.mjs video --page "$film/src/index.html" \
  --w 1280 --h 720 --fps 60 --sub 1 --workers 4 --out "$film/out/silent.mp4"
bash films/tin-launch/tools/mix.sh "$film/out/silent.mp4" \
  "$film/music-cut/music.wav" "$film/out/mixed.mp4" > "$film/out/mix.log"

# Keep the complete picture; the shared mixer's -shortest can drop its last frames.
"$FFMPEG" -y -v error -i "$film/out/silent.mp4" -i "$film/out/mixed.mp4" \
  -map 0:v:0 -map 1:a:0 -c copy -t 20 -movflags +faststart "$film/out/preview.mp4"
"$FFMPEG" -v error -i "$film/out/preview.mp4" -f null - -progress "$film/out/decode.log"
python3 - <<'PY'
from pathlib import Path
data = dict(line.split('=', 1) for line in Path('films/locin-cli-launch/out/decode.log').read_text().splitlines())
assert data['frame'] == '1200', data
assert data['out_time_us'] == '20000000', data
assert data['progress'] == 'end', data
print('PASS: 1200 frames, 20 seconds. Video: films/locin-cli-launch/out/preview.mp4')
PY
