# Tin vibe marketing, Earshot/Cinetic recut

Preview: [21.6-second MP4](out/preview.mp4). This recut starts from Claude's Tin vibe marketing idea. The reviewed package keeps its own scene source, sound kit and checks.

## What changed

The same recipe cover now links the shipped app, a grow prompt, one blog draft and its reviewed pull request. Three large tasks replace the six small workflow rows. The install command and stacked closing copy were removed. Tin MCP, the agent prompt and the approval remain visible.

Noir Now is still the track. Removing two opening bars moves its main drop from 9.6s to 4.8s. The deliberate stop stays. A small Earshot kit replaces the many layered original effects: nine quiet placements, no extra riser, drop or logo impact.

Cinetic's selector offered nine techniques. STORY.md names four useful choices and the rejected options. The first render found frozen holds; these were revised with a moving opening, restrained camera pushes and beat-spaced prompt words. A morph also needed clipping so its Approve control could not appear outside its panel.

## Build

Use the root render dependencies and music Python environment. Provide the locally licensed music cut and three fonts listed in `local-inputs.json` before building; their hashes identify the tested inputs. Audio and font source files are not bundled. The finished MP4 includes their rendered result. Install the isolated Earshot environment using tools/earshot/README.md. FFmpeg and FFprobe must be on PATH. Commands below run at the film-lab root.

```sh
mkdir -p films/tin-vibe-marketing-recut-20261020/out/qa
node tools/cinetic/test-timeline.cjs
node films/tin-vibe-marketing-recut-20261020/review.mjs
.venv-earshot/bin/python -m earshot kit render films/tin-vibe-marketing-recut-20261020/audio-kit.json --out films/tin-vibe-marketing-recut-20261020/out/kit
.venv-earshot/bin/python -m earshot kit check films/tin-vibe-marketing-recut-20261020/audio-kit.json --out films/tin-vibe-marketing-recut-20261020/out/kit
.venv-earshot/bin/python films/tin-vibe-marketing-recut-20261020/compose_audio.py
node films/tin-launch/tools/render.mjs video --page films/tin-vibe-marketing-recut-20261020/src/index.html --fps 60 --sub 2 --shutter 180 --workers 4 --out films/tin-vibe-marketing-recut-20261020/out/silent.mp4
bash films/tin-launch/tools/mix.sh films/tin-vibe-marketing-recut-20261020/out/silent.mp4 films/tin-vibe-marketing-recut-20261020/music-cut/music.wav films/tin-vibe-marketing-recut-20261020/out/mixed.mp4 films/tin-vibe-marketing-recut-20261020/out/sfx.wav films/tin-vibe-marketing-recut-20261020/out/mix-reference.wav
bash shortform/tools/deliver.sh films/tin-vibe-marketing-recut-20261020/out/mixed.mp4 films/tin-vibe-marketing-recut-20261020/out/preview.mp4 17
.venv-earshot/bin/python tools/earshot/review.py films/tin-vibe-marketing-recut-20261020/out/preview.mp4 films/tin-vibe-marketing-recut-20261020/out/earshot --cues films/tin-vibe-marketing-recut-20261020/out/audio-cues.json
```

On 20 October the film was rebuilt in the separate source-review checkout, with the existing pinned renderer dependency and the locally supplied licensed inputs above. All pictures, nine generated effects and the final mux were rebuilt. This does not verify a fresh dependency install or an automatic font/music download. Source and rights records are in CREDITS.md.

## Checks

Read REVIEW.md for measured results and remaining warnings. Source checks cover 35 states, 10 repeated seeks and four hard-cut subframe boundaries. They check that the draft appears before approval and that a pull request appears only afterward. Earshot's sheet and sound tags are local model analysis, not human listening. A first-time viewer review is still open. These scenes illustrate Tin's product behaviour; they do not create real drafts, publish content or open a PR.
