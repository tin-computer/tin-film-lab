# Short-form tools

Selected from Claude's separate film-lab checkout and reviewed here. They reuse the lab's existing renderer and Playwright installation. Install that runtime with `npm ci` in `films/tin-launch/tools`, as the root setup describes.

| Tool | Use |
| --- | --- |
| `tools/sync.js` | Place typed groups and cuts using a measured music cue. A quiet section falls back to marked grid or evenly spaced times; it is not called a detected beat. |
| `tools/slopcheck.mjs` | Report possible small-label headings, text walls, tiny copy and platform-overlay collisions in DOM films. These are review candidates, not an artistic verdict. Canvas text is outside its scope. |
| `tools/guides.js` | Show approximate TikTok, Reels or Shorts overlay zones in a preview. Platform layouts can change. |
| `tools/stage.js` | Local preview controls for a fixed-size DOM stage and its music. |
| `tools/events.mjs` | Export an existing film's `SYNC_EVENTS` as JSON. New lab films can use the shared renderer's `events`/`cues` commands instead. |
| `tools/syncplot.py` | Draw events over the waveform and measured timing grid. Listening stays a separate check. |
| `tools/deliver.sh` | Encode H.264 with BT.709 limited-range pictures and preserve the mixed film's existing AAC audio. Detect the source range rather than converting an already limited-range file as full-range. |

Keep necessary product text. The `data-material` marker distinguishes the demonstrated content from added promotional copy. The checker cannot prove product clarity, originality or retention.

```sh
node shortform/tools/test.mjs
FFMPEG=bin/ffmpeg FFPROBE=ffprobe python3 shortform/tools/test-delivery.py
node shortform/tools/slopcheck.mjs --page films/example/src/index.html --platform shorts
```

The sync test covers a real saved cue, quiet short windows and an intentionally broken DOM fixture. The delivery test checks both input ranges: up to six RGB levels of change after lossy encoding, the two variants within three levels, all frames kept and byte-identical AAC packets. The earlier forced-full-range and audio-reencode versions fail these checks. This is an encoding test, not a calibrated display review. `deliver.sh` expects AAC audio from the mixer; it does not convert arbitrary audio codecs.

Claude's earlier measurements, with corrected limits, are in [the reference library](../research/launch-references/claude-measurements/README.md). A statistic from those samples is not a mandatory recipe for a new film.
