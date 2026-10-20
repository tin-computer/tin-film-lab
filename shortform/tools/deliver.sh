#!/usr/bin/env bash
# Re-encode a mixed film for social upload: H.264 High, yuv420p in TV range, BT.709 tags, AAC 48 kHz,
# faststart. Input is a mixed film with AAC audio, as written by mix.sh. Preserve that stream so
# a second lossy encode cannot add new peak overshoots. JPEG renders may be full-range; detect it.
# Usage: shortform/tools/deliver.sh <mixed.mp4> <out.mp4> [crf=18]
set -euo pipefail
FF="${FFMPEG:-$(cd "$(dirname "$0")/../.." && pwd)/bin/ffmpeg}"
"$FF" -y -loglevel error -i "$1" \
  -vf "scale=in_range=auto:out_range=tv:out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -preset slow -crf "${3:-18}" -profile:v high -level 4.2 \
  -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a copy -movflags +faststart "$2"
"$FF" -hide_banner -i "$2" 2>&1 | grep -E "Stream #0:0" | sed 's/^ */delivered: /' || true
