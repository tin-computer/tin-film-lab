# Reviewed film and tool additions · 20 October

Selected from the separate Codex and Claude film-lab checkouts. Local Claude Code messages and the two Codex film chats were read for context; tests and files were checked separately. No conversation logs, keys, model weights, standalone music or proprietary font files are included.

| Included | What it does | Checked result |
| --- | --- | --- |
| Cinetic tools and shared timeline | Export the same named picture events for rendering and review; select motion techniques; inspect encoding and audio offset | 273 technique records validated. Same-seed selection repeats; avoid selection excludes prior IDs. A good mux passes; wrong fps and an 80ms delay fail. Existing mixer calls and the optional pre-AAC WAV work. |
| Earshot wrapper | Run offline sound reports against the actual MP4 and record incomplete results | Missing, no-audio and replaced-source cases fail clearly. The rebuilt Tin MP4 produced all four reports with its final hash. Model sound labels remain uncertain. |
| Claude's short-form tools | Music-based typing, DOM copy checks, preview guides, waveform plots and final encoding | Short quiet typing windows now keep every character in order. A deliberately bad DOM fixture is detected. Both input colour ranges are checked and AAC packets survive unchanged. Preview frame stepping and overlay hiding passed; the event exporter and waveform plot ran on an existing Claude reading film. |
| Tin vibe marketing recut | Follow one recipe app from a growth prompt to a blog draft, approval and a PR | Rebuilt in the separate review checkout: 21.583s, 1920×1080, 60fps. 1,295 frames; zero failed scan checks and 15 warnings. Three sampled audio windows have zero measured lag; -14.1 LUFS / -1.9 dBTP. |

## Failures fixed in this review

- Typing in a very short quiet window could run out of timing points. A bounded fallback keeps every group inside the selected window; these fallback points are not claimed as detected transients.
- The old final encoder treated every input as full-range. It now detects the source range. The colour check fails with the old behaviour and passes with both full- and limited-range inputs.
- Encoding an already mixed AAC track again raised the Tin film's true peak to -0.5 dBTP. Keeping that AAC stream restores -1.9 dBTP and avoids another lossy generation. The packet-preservation test fails on the old encoder.
- The short-form scripts used a root Playwright dependency that was not declared. They now use the lab's existing renderer installation.

## What remains open

The compact [film checks](films/tin-vibe-marketing-recut-20261020/CHECKS.json) include its hash, probe results, warning times and audio lag measurements. The picture scan's 15 warnings need a human look. Automated checks do not prove visual quality, soundtrack taste, viewer understanding or retention. No new human listening or new-viewer test is claimed.

The example rebuild used existing installed dependencies and locally supplied licensed inputs identified in [local-inputs.json](films/tin-vibe-marketing-recut-20261020/local-inputs.json). A fresh dependency install and automatic restoration of those inputs are not verified. Read the film's [setup and credits](films/tin-vibe-marketing-recut-20261020/README.md) before rebuilding.

Claude's separate **Tin service** branch, `codex/launch-video-workflow`, was also inspected. Its five focused test files gave **41 passed / 8 skipped** when NumPy was provided. No hosted/staging run is established in this review, so that service change is kept local. It is not part of this film-lab push.

Other earlier film experiments remain local until their required assets and individual rebuilds are checked. The research library, its browser, 46 saved user comments and the corrected 78-film measurement set are already on this branch; their counts remain separate.
