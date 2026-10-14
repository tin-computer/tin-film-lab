# Tin MCP · question-flow study

The user chose MCP-based marketing work, product makers, and a 20-second horizontal X film with more product visuals and less text. [Saved brief](BRIEF.md) → [story / three frames](STORY.md). This is the first interactive trial of [FILM_FLOW.md](../../FILM_FLOW.md) after it was added to the repo.

## Render from a fresh checkout

Needs Node.js, npm, Python 3 and uv. Run from the repo root. Tin product styles and brand assets, and the open Geist fonts from the LocIn example, are already included. No private fonts, keys or account login are needed.

```bash
npm ci --ignore-scripts --prefix films/tin-launch/tools
films/tin-launch/tools/node_modules/.bin/playwright install chromium

uv run --no-project --python 3.12 \
  --with imageio-ffmpeg==0.6.0 --with numpy==2.2.6 \
  python films/tin-mcp-launch/tools/prepare.py

bash films/tin-mcp-launch/tools/preview.sh
```

Output: **`films/tin-mcp-launch/out/preview.mp4`**. Downloaded music, rendered frames and logs stay outside Git. The existing downloader checks the music source checksum before cutting the chosen track.

To render the three story frames:

```bash
FFMPEG="$PWD/bin/ffmpeg" node films/tin-launch/tools/render.mjs stills \
  --page films/tin-mcp-launch/src/index.html --at 2,10,18 \
  --w 1280 --h 720 --outdir films/tin-mcp-launch/out/story

node films/tin-mcp-launch/tools/check.mjs
```

The page uses the lab's existing motion/music runtime, committed Tin product CSS, brand assets and open fonts. It loads no Tin application JavaScript or server connection. States are controlled by `seek(t)` with example data. No publication controls are activated.

Hamit approved the three-frame direction. No new Tin workflow is implemented here.

## Frame review

The first check failed because the app CSS uses server font URLs. The film now uses separate font names and the packaged open fonts. The four scene samples, source command, draft-reader controls, images and ending layout passed. Three 1280 × 720 frames were rendered and inspected. Post copy was shortened to two paragraphs, and command spacing was increased for readability.

## Music preview

After preparing music, run from the repo root:

```bash
bash films/tin-mcp-launch/tools/preview.sh
```

[Watch the preview](out/preview.mp4): 20 seconds, 1280 × 720, 60 fps, with Swish Swed #201. The result opens at the 8-second music drop. The ending enters on successive beats and holds through the fade. The approved copy is unchanged.

Two renders were reviewed. The first mixed the old System heading with the new reader during the transition. The second hides the old heading and opens the reader from the top. The cursor points to Edit / Preview without submitting an action.

- Four scene checks and 24 repeat-frame checks passed.
- The whole video decoded: 1,200 frames, no dropped frames.
- Audio mix measured −14.1 LUFS and −1.8 dBTP.
- Contact sheet, phone sheet and transition strips were inspected.

Verified on macOS from a fresh GitHub clone on 14 October 2026, with new browser and Python caches. Only this film's candidate sources and root documentation were added to the clone. Music was downloaded again; four scene checks, 24 repeat-frame checks and the full 1,200-frame decode passed. The music and final video are byte-identical to the reviewed local preview. Three story frames were also rendered and inspected.

This is an example product scene, not a live MCP recording. Final picture and sound feedback is still open. Linux and Windows have not been tested.

[Product and asset sources](BRIEF.md) · [Font licence](../locin-cli-launch/refs/fonts/Geist-OFL.txt) · [Music source and licence](../../music/README.md).
