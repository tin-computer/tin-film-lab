# Tin vibe marketing recut review

## Story and picture

The previous film's shipped-app / marketing-prompt idea is kept. The recipe cover now remains visible from app to the article and its pull request. Three large tasks replace six small workflow rows. Tin appears at 4.8s instead of 9.6s. The closing card lasts about 2.4s instead of 7.2s. The long install command and stacked closing copy are gone.

The first render had five frozen sections and undeclared intentional cuts. Camera pushes and an active opening replaced the freezes; actual cut frames are now declared. Prompt words land on quarter beats. Later picture checks caught an Approve control outside its resizing panel and a brief empty handoff. Clipping keeps the control inside, and the recipe cover now travels through that handoff.

Agent inspected 35 source states, 13 encoded frames plus the revised handoff strip, phone-sized sheets and the sound sheets. This is not a continuous human viewing or audience test. Product screens, the recipe app and the opened PR are authored illustrations.

## Final file

| Check | Result |
|---|---|
| Delivery | 1920x1080, 60 fps, 21.583s, H.264/AAC, BT.709 limited |
| Full decode / frame scan | 1295 frames; 0 scan failures, 15 warnings |
| Source states | 35 states, 10 repeat-seek hashes and 4 hard-cut subframe checks passed |
| Music map | 25 named events, worst 8.167ms from the mapped beat or quarter beat |
| Effects | 9 selected placements, measured kit onset within one sample of each target frame |
| Encoded audio | 0 samples lag in three sampled windows against the pre-AAC mix |
| Level | -14.1 LUFS, -1.9 dBTP, no clipped samples |

## Warnings and limits

Raw frame warnings remain: {'spike': 3, 'quiet': 4, 'judder': 4, 'banding': 4}. They include intentional reading pauses, named UI state changes, possible subpixel stepping and banding candidates. The source uses flat fills rather than gradient backdrops. Sampled encoded frames did not show a new broken state, but these warnings are kept for viewing rather than silently called fixed.

Earshot completed its full local timeline, sheet and critique. Its seven-film profile still flags the low-band share as below that small reference set. The source has strong sub-bass; no extra bass was added only to satisfy a score. Tags such as voice/breath are model guesses over an instrumental mix, not proof of speech. No narration track was added.

The independent music-map test, detected audio onsets and encoded-stream lag answer different questions. A grid pass does not mean every cut has a strong audible hit. Deliberate silence is kept. Human listening, first-time viewer feedback and a fresh dependency/licensed-input setup remain open. The source-review checkout rebuild passed with existing dependencies and supplied inputs.

## Technical proof

- Picture: out/qa/source-review.json, out/qa/forensics.json, out/encoded/final-handoff.jpg
- Sound: out/earshot/review.json, timeline.json, sheet.png, critique.json, measure.json
- Timing: out/music-review/sync.json, out/qa/sound-placement.json, out/qa/encoded-sync.json
- Original comparison: out/before/earshot. Earlier failed scans: out/qa/forensics-first-pass.json and forensics-second-pass.json
- Tool checks: Cinetic timeline and gate fixtures passed, including rejection of an 80ms delay and wrong frame rate. Existing cue exports from five other films still work. Earshot wrapper tests reject missing, silent and changed sources. Selector validation, same-seed repeat and excluding previous picks passed.
- SHA256: `bb003fe8dd3747882c3be8eb031aa66968967d855ebb552fe75db9bff87c3da5`

All rendering and review ran locally. The reviewed source and final MP4 are being shared on the film-lab branch; no live Tin workflow or publication was run.

## Source-review rebuild · 20 October

Regenerated all 1,295 pictures, the nine-effect kit, SFX placement and mix in the separate review checkout. Repeated the 35-state, ten repeat-seek and four cut-boundary checks. The final encode converts full/limited input pictures correctly and preserves the already mixed AAC audio. The earlier extra AAC encode raised true peak to -0.5 dBTP; preserving the stream brings it back to -1.9 dBTP. The probe and three-window sync check pass. Earshot produced all reports against the final file hash. Its sound tags and seven-film score remain estimates, not listening or audience approval.

The 15 picture warnings remain for human review; they are not silently called fixed. No full dependency reinstall, cloud model call or Tin staging run is claimed.
