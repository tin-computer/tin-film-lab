#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../.."
film=films/readntype-reading-launch
export FFMPEG="$PWD/bin/ffmpeg"
mkdir -p "$film/out"

node "$film/tools/check.mjs" > "$film/out/check.json"
node films/tin-launch/tools/determinism.mjs "$film/src/index.html" \
  0.5 3.8 4 5 8.9 9.9 12 13.7 13.8 14.5 15.8 16 18 19.6 > "$film/out/determinism.log"
node films/tin-launch/tools/render.mjs video --page "$film/src/index.html" \
  --w 960 --h 540 --fps 30 --sub 1 --workers 4 --out "$film/out/silent.mp4"
bash films/tin-launch/tools/mix.sh "$film/out/silent.mp4" \
  "$film/music-cut/music.wav" "$film/out/mixed.mp4" > "$film/out/mix.log"

# Keep the complete picture; the shared mixer's -shortest can drop its last frames.
"$FFMPEG" -y -v error -i "$film/out/silent.mp4" -i "$film/out/mixed.mp4" \
  -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart "$film/out/preview.mp4"
"$FFMPEG" -v error -i "$film/out/preview.mp4" -f null - -progress "$film/out/decode.log"
python3 - <<'PY'
import json
from pathlib import Path
film = Path('films/readntype-reading-launch')
duration = json.loads((film / 'music-cut/cue.json').read_text())['length']
data = dict(line.split('=', 1) for line in (film / 'out/decode.log').read_text().splitlines())
assert int(data['frame']) == round(duration * 30), data
assert abs(int(data['out_time_us']) / 1_000_000 - duration) < 1 / 30, data
assert data['progress'] == 'end', data
print(f"PASS: {data['frame']} frames, {duration:.3f} s music. Video: {film}/out/preview.mp4")
PY
