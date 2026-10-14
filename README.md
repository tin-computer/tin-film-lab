# tin-film-lab

Launch and feature films made in code by coding agents: a `seek(t)` HTML page per film, rendered
with Playwright and ffmpeg, cut to a vetted and bar-mapped music library, reviewed frame by frame before the final.

Start with [HANDOFF.md](HANDOFF.md): what we did, how it works, what's left.

For a new film with your coding agent, start with [FILM_FLOW.md](FILM_FLOW.md): brief questions → saved choices → story and three frames → direction review → music preview → selected render. The repo's `AGENTS.md` and `CLAUDE.md` point agents to this flow.

| Folder | What |
|---|---|
| `music/` | The vetted track library with bar-by-bar maps, the cut tool and the film runtime. See `music/README.md`. |
| `films/tin-launch/` | Product demo film (32 s, 16:9). Final: `out/tin-launch.mp4`. |
| `films/tin-art/` | Art film in the style of Fable 5 (21.6 s, square). Share copy: `out/tin-art-share.mp4`. |
| `films/locin-cli-launch/` | 20 s CLI feature film; [brief](films/locin-cli-launch/BRIEF.md), story and clean-checkout render commands. |
| `films/readntype-reading-launch/` | 19.67 s reading/comprehension film; [brief](films/readntype-reading-launch/BRIEF.md), story and clean-checkout render commands. |
| `films/tin-mcp-launch/` | 20 s MCP feature film; [brief](films/tin-mcp-launch/BRIEF.md), product example and clean-checkout render commands. |

## Setup

The LocIn, ReadnType and Tin MCP examples have smaller setup commands in their READMEs and use included open fonts. The full original Tin film setup below also needs the private brand fonts and archive inputs.

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
