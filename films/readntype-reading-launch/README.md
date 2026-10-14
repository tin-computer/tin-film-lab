# ReadnType reading launch

A 19.67-second film: read by typing, answer a question about the passage, then keep reading. This packages the selected v5 study, including the book ending with Wippy. The picture and music direction are unchanged.

[Saved brief](BRIEF.md) → [story and three frames](STORY.md). For a new film, use the repo's [guided flow](../../FILM_FLOW.md).

## Render from a fresh checkout

Needs Node.js, npm, Python 3 and uv. Run from the repository root:

```bash
npm ci --ignore-scripts --prefix films/tin-launch/tools
films/tin-launch/tools/node_modules/.bin/playwright install chromium

uv run --no-project --python 3.12 \
  --with imageio-ffmpeg==0.6.0 --with numpy==2.2.6 \
  python films/readntype-reading-launch/tools/prepare.py

bash films/readntype-reading-launch/tools/preview.sh
```

The film includes its images, Roboto Mono font and a frozen copy of the product's word renderer. It reuses the open Geist fonts in `films/locin-cli-launch/refs/fonts/`. Earlier local studies, a ReadnType checkout and private fonts are not needed.

`prepare.py` downloads **House Vibez #745**, Lily J, and checks the existing source checksum. The lab's cut tool restores ten bars, with the drop on film bar 8 and a one-bar fade. `preview.sh` uses the existing renderer and mixer; downloaded music and outputs stay outside Git.

Output: **`films/readntype-reading-launch/out/preview.mp4`**, 960 × 540, 30 fps. This keeps the selected preview's size and frame rate. Seven scene samples check the real word renderer, text fit, answer, assets and music timing. Fourteen repeat-frame samples check that playback does not depend on earlier frames. The full file is decoded and its frame count and duration are checked.

| Time | Scene |
|---|---|
| 0–3.93 s | Tenniel's rabbit, a short typewriter cut and “Read by typing.” |
| 3.93–9.84 s | An Alice passage advances through the real word renderer. |
| 9.84–13.77 s | A question about the same passage. |
| 13.77–15.74 s | The answer expands on the music drop. |
| 15.74–19.67 s | A book spread, Wippy and “Keep reading.” |

## Limits

Verified on macOS from a fresh GitHub clone on 14 October 2026, with new browser and Python caches. Music was downloaded again and matched the selected study's cut. All seven scene samples, 14 repeat-frame samples and 590 decoded frames passed. Linux and Windows have not been tested.

The question and answer are authored examples. This is not a live quiz, saved progress or a score test. Wippy is an existing QA character; official mascot adoption is not confirmed. Georgia uses the system font, so its appearance can vary on other systems. Small notes need a larger view.

[Sources and licences](refs/SOURCES.md).
