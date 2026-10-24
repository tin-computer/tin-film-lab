# Launch feedback, 22 October

## What changed

- Film flow now plans the final still before animation. No logo-only pause before more story, no stack of headline, subtitle, command and address at the end.
- Music selection uses saved listener descriptions: feeling, progression, suitable stories and contexts to avoid. No scores. A context search with no reviewed match returns no candidates.
- A local listening page compares four actions with three sounds each. Press and task completion have separate choices. Silence and unchosen states stay empty. Exports retain the listener; editing a description records the new listener.
- All source frames get layout checks. Code blocks are strict without extra tags. Authored dot-separated copy and production labels are flagged. Scene start/middle/end, transitions and the ending get comparison images.
- Product screens need an actual source and matching state. Official screenshots, supplied recordings or a safe local build come before a recreation. A model review can help find problems but cannot certify accuracy.

## Checks

See CHECKS.json. All 11 frame-review cases, 4 music tests, the effect-choice test and the browser import/export check passed. The page test uses synthetic data and does not need the private music archive.

```sh
python3 -m unittest discover -s music/tools -p test_shortlist.py
python3 -m unittest discover -s tools/sound-review -p test_notes.py
node test_review_frames.mjs
node tools/sound-review/test-page.mjs
```

Install the renderer's existing Playwright dependencies first, as described in the repository README. The new tools add no package dependency.

The local listening page contains 37 available music tracks and 10 effects in four contexts. Nobody's taste or choice has been filled in automatically. Full audio and private fonts are not included in this commit. See music/LISTENING_NOTES.md for rebuilding with your catalogue.

## Films checked

| Film | Change / result | Still open |
| --- | --- | --- |
| Tin old-team | Removed the middle logo pause. Final frame is Tin + address. Wrapped the terminal command. Shortened to 37.1 seconds, reused the existing voice/music without effects. All 1,113 source frames had no geometry errors; full MP4 decode passed. Inspected 15 encoded frames, including the final hold | One missing real Tin review-screen reference. Voice/music listening remains human review |
| Cheatcode | Removed the duplicated address and “free in open beta” dot label. Used the Apple system font and blue outgoing messages. Rendered the changed film and inspected six encoded frames | Full review still fails repeated-seek pixel comparisons. Chat clipping, incomplete Messages chrome and the signed-in week layout remain unverified. This is not a finished interface fix |
| Claw | Compared the existing 24-second frame with Apple's Messages reference | Bubble tails, back control and composer are missing. Its landscape crop and sender details need a matching Messages reference. No fidelity percentage or full-film pass |

The Cheatcode live homepage showed a daily grid. It does not establish the film's signed-in weekly grid. No source for that exact state was available during this check.

Sources inspected:
- https://www.cheat-code.cc/ (public page, read only)
- https://support.apple.com/guide/iphone/send-and-reply-to-messages-iph82fb73ba3/26/ios/26 (official Messages example)

## Local evidence

Generated files are under `out/launch-feedback/`: Tin and Cheatcode MP4 previews, encoded-frame contact sheets, scene reports and `interface-comparison.png`. These contain private assets and are not committed. The Tin report keeps its missing-reference warning; the Cheatcode report keeps its failures. Sound measurements are not a listening review. No API was called.

The two film sources were uncommitted work in the separate Claude checkout. This commit includes focused patches and before/after SHA-256 values in patch-sources.json, not the other agent's whole unfinished films. To apply a patch, first check the source hash against the manifest, then run `git apply --unidiff-zero --check` before `git apply --unidiff-zero`. Do not apply to a different source version. This is not a clean-checkout rendering package for those private films; the shared tools and tests are portable.

## 24 October tool review

The music form now has five multi-select questions, optional notes and visible imports of older free-text reviews. Partial reviews keep working with the music shortlist. Effect candidates can come from the wider source catalogue; each action gets up to twelve choices. Stereo previews use the same samples for level measurement and playback.

| Check | Working copy | Clean source copy |
|---|---|---|
| Music selection | 4 tests passed | 4 tests passed |
| Effect selection, stereo timing and catalogue builder | 4 tests passed | 4 tests passed |
| Frame review | 11 cases passed | 11 cases passed |
| Browser form | Import/export, partial reviews, listener attribution and mobile layout passed | The same checks passed with synthetic data |

The clean copy used the committed sources plus this diff, with the existing Playwright and ffmpeg dependencies installed separately. No private music archive was needed for those fixture checks. The catalogue expansion test replaces audio normalisation; the stereo test runs real ffmpeg. The local 46-track, 40-effect page also passed the form checks. Its generated page, raw audio and personal notes are not committed. Rebuild with your available files as described in music/LISTENING_NOTES.md; the available count depends on those files.

These checks did not produce a new film or test the hosted Tin workflow. Human listening, the missing interface references and the Cheatcode frame failures above remain open. The new onboarding rules still need a full independent film trial.
