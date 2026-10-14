# LocIn CLI launch

A 20-second, 16:9 feature film for developers and indie hackers. Code → CLI → language files → try the CLI. Paper shapes, Loci and a short code example carry the story.

The brief came from three questions: what feature to show, who should watch and act, and which format/style to use. [Saved brief](BRIEF.md) → [story and three frames](STORY.md). For a new film, use the repo's [guided flow](../../FILM_FLOW.md).

## Render from a fresh checkout

Needs Node.js, npm, Python 3 and uv. Run from the repository root. The three Geist font files and their OFL licence are included. No private Tin fonts, API keys or account login are needed.

```bash
npm ci --ignore-scripts --prefix films/tin-launch/tools
films/tin-launch/tools/node_modules/.bin/playwright install chromium

uv run --no-project --python 3.12 \
  --with imageio-ffmpeg==0.6.0 --with numpy==2.2.6 \
  python films/locin-cli-launch/tools/prepare.py

bash films/locin-cli-launch/tools/preview.sh
```

`prepare.py` downloads only the chosen Mixkit track, checks the existing source checksum, and uses `music/tools/cut.py` to recreate the music and timing files. The small Python environment is enough because the music map already exists; this film does not run beat detection or image models.

`preview.sh` uses the lab's existing renderer, scene checks, repeat-frame check and mixer. It preserves all 1,200 picture frames when adding audio, then decodes the complete file and checks its duration.

Output: **`films/locin-cli-launch/out/preview.mp4`**, 1280 × 720, 60 fps, stereo audio. The `out/` folder also contains `check.json`, `determinism.log`, `mix.log` and `decode.log`. Outputs and downloaded music stay outside Git.

Run the scene check again with `node films/locin-cli-launch/tools/check.mjs`. It also works from outside the repository because paths are based on the script location.

## Music and scenes

**Funkee Monkeee #1140**, Michael Ramir C., from the existing Mixkit library. Ten bars at about 120 BPM, drop at 8 seconds, two-second ending fade.

| Time | Scene |
|---|---|
| 0–4 s | Source string on a code page; Loci. |
| 4–8 s | `locin flow --full`; string becomes a translation key. |
| 8–12 s | Three language files unfold on the beats. |
| 12–16 s | Files move into the locale folder; show their values. |
| 16–20 s | `npm install -g locinai`, locin.dev and the output files. |

## Checks and limits

Eight scene samples check order, example data, fonts and images. Sixteen repeat-frame samples check that rendering does not depend on earlier frames. Main changes follow the music grid. The video is checked for 1,200 decoded frames and 20.000 seconds.

Verified on macOS from a fresh GitHub clone on 14 October 2026, with new browser and Python caches. Music was downloaded again; all checks passed. Linux and Windows have not been tested.

The code and translations are authored examples, not a recorded translation run. Setup and login are outside the film. Loci is an existing QA character; official mascot adoption is not confirmed. Small code labels need a larger view. Human review of the art and music feel is still open.

[Asset sources and licence](refs/SOURCES.md). Earlier local experiments are not required to render this film.
