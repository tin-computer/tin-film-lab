# Local sound review

Earshot 0.3.0 at commit `925ebe56a1b755e5d354ab642bb8f344440cfa9c` (MIT): https://github.com/Leonxlnx/earshot

Use an isolated environment so its model packages do not change the existing music environment. FFmpeg and FFprobe must be on PATH.

```sh
uv venv --python 3.12 .venv-earshot
uv pip install --python .venv-earshot/bin/python -r tools/earshot/requirements.txt
.venv-earshot/bin/python -m earshot doctor --fetch
node films/tin-launch/tools/render.mjs cues --page films/example/src/index.html > films/example/out/cues.json
.venv-earshot/bin/python tools/earshot/review.py films/example/out/preview.mp4 films/example/out/earshot --cues films/example/out/cues.json
```

The one-time doctor command downloads pinned open model weights. `review.py` defaults to offline CPU use and never calls the optional cloud/LLM tool. It writes actual-file levels, sound events and sections, sound/picture offsets, an annotated sheet, and the full upstream critique. Open the sheet and read the findings. Compare these reports before and after a mix change.

`status: complete` means all reports were produced, not that the film is good. Finish rendering before review. A changed source hash or other failure saves `status: incomplete`, its stage and error before exiting. Measurements such as loudness and audio lag differ from inferred sound labels. The built-in style profile comes from seven films and is not a universal quality score. A deliberate pause or unsounded visual cue is not automatically a defect. Keep human listening and a first-time viewer check separate.

No new audio generator or stock source is required. If extra effects serve the story, Earshot also has `sfx` and `kit` commands; do not add a sound on every cut just because a bank exists.
