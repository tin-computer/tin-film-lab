# tin-film-lab

Launch films for Tin, made entirely in code by Claude Code on Opus 5.5: a `seek(t)` HTML page per film, rendered
with Playwright and ffmpeg, cut to a vetted and bar-mapped music library, reviewed frame by frame before the final.

Start with [HANDOFF.md](HANDOFF.md): what we did, how it works, what's left.

For the tools, motion elements, music, sound effects, skills and checked source paths, open the [development inventory](inventory/README.md). It separates existing code, reviewed branch additions and local-only work. [Next-work plan](inventory/PLAN.md).

For the 460-source sampled review and feature-film brief rules, see [launch references](research/launch-references/README.md). The tables count known duplicate edits once, and the reports keep sound uncertainty explicit.

| Folder | What |
|---|---|
| `tools/cinetic/` | Named picture cues, a 273-technique selector, encoded-file and audio-offset checks. [Guide](tools/cinetic/README.md) |
| `tools/earshot/` | Optional local sound measurements and model reports, with incomplete-result handling. [Guide](tools/earshot/README.md) |
| `shortform/` | Claude's selected waveform, preview, text-review and delivery tools, with quiet-window and encoding corrections. [Guide](shortform/README.md) |
| `films/tin-vibe-marketing-recut-20261020/` | Rebuilt 21.6s Tin feature example. [MP4](films/tin-vibe-marketing-recut-20261020/out/preview.mp4) · [source and setup](films/tin-vibe-marketing-recut-20261020/README.md) |
| `music/` | The vetted track library with bar-by-bar maps, the cut tool and the film runtime. See `music/README.md`. |
| `films/tin-launch/` | Product demo film (32 s, 16:9). Final: `out/tin-launch.mp4`. |
| `films/tin-art/` | Art film in the style of Fable 5 (21.6 s, square). Share copy: `out/tin-art-share.mp4`. |

[Reviewed additions and limits](REVIEWED_ADDITIONS.md) records what was selected from the Codex and Claude work, the failures caught, and what remains local.

## Setup

```bash
uv sync                                    # librosa 0.11 / numba 0.61 pins matter (newer numba segfaults)
mkdir -p bin && ln -sf "$(uv run python -c 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())')" bin/ffmpeg
(cd films/tin-launch/tools && npm ci && npx playwright install chromium)
(cd films/tin-art/tools && npm ci)
```

Licensed files are not in the repo. Restore them before rendering:
- **Mixkit audio:** `uv run python music/fetch_audio.py` (under a minute). It downloads the 19 library tracks and the six
  sound effects from Mixkit, checks each against `music/audio-manifest.json`, and rebuilds every file made from them:
  the films' `music-cut/music.wav` (byte-identical to the originals), the demo's `sfx/sfx.wav` (byte-identical) and
  each track's `check.mp3`. Add `--catalogue` for all 255 measured tracks (about 1.1 GB). Mixkit's free licence covers
  the music inside videos, which is why the audio itself isn't committed.
- **Fonts:** copy `FunktionalGrotesk-*.ttf` and `SFMono-Medium.otf` from tin-web's `public/fonts/` (private, Tin team
  access) into `films/*/refs/brand/fonts/` and `films/tin-art/src/fonts/`.

Also not in the repo (too large, regenerable or third-party): the full Mixkit catalogue mp3s (`music/fetch_audio.py --catalogue`),
the art film's archive masters and cutouts (every source URL and rights field is in
`films/tin-art/materials/assets.json`; ask Ege for a tarball rather than re-downloading 5 GB), intermediate renders,
run logs and the downloaded reference films.
