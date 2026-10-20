# Cinetic checks for film-lab

Vendored from Leonxlnx/cinetic at ecfa6605de1adb9345ce937724810dc32267d068 (MIT). The licence is beside these files. `probe.py`, `check-sync.py` and `forensics.py` are upstream tools; local changes let them use `FFMPEG` and `FFPROBE` environment variables and load adjacent macOS libraries for an explicitly supplied FFprobe binary. `films/tin-launch/tools/lib/timeline.js` adapts the shared frame/cue pattern to the lab's existing HTML renderer and measured music grid.

The existing Music runtime still supplies measured beats and energy. No fixed tempo, visual style bans, sound generator or second renderer was added. Picture, music-event review and the Cinetic cue export read the same named times.

## Story and movement choices

`pick.py` and `library/techniques.json` are unchanged upstream files from the recorded commit. Draw a small plan before designing new moves, then keep only what the product story can carry. Record rejected picks and the reason. Use `--avoid <earlier-picks.json>` to exclude a previous film's selections. A random draw cannot choose the story or prove originality. Supplied brand colours and fonts win over upstream style defaults.

```sh
python3 tools/cinetic/pick.py --validate
python3 tools/cinetic/pick.py --format launch --energy medium --seconds 22 --seed 20261020 --brand-supplied orange,beige --json films/example/out/picks.json
```

The shared timeline now exports named frame events for both Cinetic and [Earshot](../earshot/README.md). They are visual anchors, not a requirement to add a sound to every action. Deliberate quiet sections stay quiet.

Use the existing Python environment, with numpy, scipy, soundfile and opencv-python. FFmpeg and FFprobe must be installed or provided through the two environment variables. The Python scripts are independent of Remotion and Cinetic installations.

```sh
node tools/cinetic/test-timeline.cjs
node films/tin-launch/tools/render.mjs cues --page films/locin-voice-press/src/index.html > films/locin-voice-press/out/cues.json
.venv/bin/python tools/cinetic/probe.py films/locin-voice-press/out/preview.mp4 --spec 1920x1080@60 --dur 22
.venv/bin/python tools/cinetic/check-sync.py films/locin-voice-press/out/preview.mp4 films/locin-voice-press/out/mix-reference.wav
.venv/bin/python tools/cinetic/forensics.py films/locin-voice-press/out/preview.mp4 --cues films/locin-voice-press/out/cues.json --json films/locin-voice-press/out/qa/forensics.json
```

For a new film, reuse the small `Timeline` helper with its own events and reading windows. `cues` exports the same data for pixel checks; `events` remains compatible with `music/tools/review_cut.py`. The mixer can save the audio before AAC in its optional fifth argument. Compare the delivered MP4 against that WAV, rather than an audio file extracted from the same MP4.

Warnings need a visual review. A passing scan does not establish product clarity or good music. Do not hide failures with large freeze or ignore ranges.
