# Launch films with Opus 5.5: handoff

How we made Tin's launch films with Claude Code on Opus 5.5, what worked, what didn't, and how to pick it up.
Written 2026-10-13 for whoever builds the next creative workflows.

14 October addition: [FILM_FLOW.md](FILM_FLOW.md) gives new film requests an interactive start: ask for missing choices, save a brief, show a story and three frames, then continue after direction approval. `AGENTS.md` and `CLAUDE.md` route coding agents to it. LocIn and ReadnType are working examples with saved briefs and render commands; the original unattended prompts below keep their own run mode.

## Status in one paragraph

We built a lab (repo `tin-computer/tin-film-lab`, originally `~/projects/tin-film-lab` on Ege's machine) that makes launch films entirely in code:
Claude Code runs headless on Opus 5.5 at max effort, writes an HTML page whose `seek(t)` paints any frame, renders it
with Playwright and ffmpeg, cuts it to a vetted and mapped music track, and reviews its own frames before finishing.
Two films came out of it:
1. **Product demo film** (`films/tin-launch`): 32 s, 1920×1080, 60 fps. Done, a solid first cut.
2. **Art film** (`films/tin-art`): 21.6 s, 2160×2160, 24 fps, in the style of Anthropic's Fable 5 film. The board is
   done and the final is rendered, but the source moved on after that render (see "Art film status").

The point was to get the inputs right on Opus first (prompt, skills, script, gates, environment), then adapt them into a
Tin creative workflow. That adaptation hasn't started.

## Contents

1. Why and what
2. Research: how people make these videos
3. The two styles
4. The lab: layout and environment
5. Music: library, maps, cuts, sync
6. The film workspace: rules, brief, skills, tools, prompt with gates
7. Running headless and watching a run
8. Film 1: product demo
9. Film 2: art film
10. Lessons and gotchas
11. Turning this into a Tin workflow
12. Open items

---

## 1. Why and what

When Opus 5.5 shipped (2026-09-22), X filled with motion-graphics videos made by Claude: showreels, launch films, music
videos, all rendered from code. We wanted to know how they're made and whether Tin could offer it as a workflow in the
creative studio, next to the existing `creative.product_demo` (phone-size demo with voiceover) and `creative.character`.

Ground rules we kept throughout:
- Get the core right with Opus locally before touching Tin.
- Music first, with visuals synced to bars and beats. Avoid "slop motion" (the term X uses for the generic look).
- Every word and number on screen must be true; nothing invented.
- Use real material: real UI markup for the demo, real public-domain images for the art film. No image models.

## 2. Research: how people make these videos

We used the `bird` CLI (an X client; cookies in `~/.config/bird/env.sh`) to search about 520 posts and read the
how-to threads in full. The best sources:
- @0xMovez, "How to build motion design studio with Opus 5.5 (Full course)": https://x.com/0xMovez/status/2104216919033192746
- @rexan_wong, reverse-engineered workflow: https://x.com/rexan_wong/status/2103707054108299437
- @RaphaelAubryy, open-source pipeline (github.com/howseen-ai/claude-motion-design): https://x.com/RaphaelAubryy/status/2104502744010629269
- @twoclipping, XML prompt templates: https://x.com/twoclipping/status/2106526359589675085
- @euboid, the "slop motion" critique and a gated skill: https://x.com/euboid/status/2103929518868316413
- @neil_xbt, "Opus 5.5 as your marketing video director": search his posts from 2026-10-04
- Dataset of about 475 Opus 5.5 videos with prompts: github.com/athemeroy/awesome-opus-5-5-videos

What they all converge on:
- **The model writes a program, not a video.** One `index.html` with `window.seek(t)` that paints the exact frame for
  time t. A headless browser calls it for every frame, ffmpeg encodes. Because nothing depends on a clock, a fix is a
  one-line edit and a re-render. Left alone, Opus picks this zero-dependency route over Remotion or HyperFrames.
- **"One prompt" is mostly marketing.** Published costs ranged from 8 calls to a 12-hour unattended run. The brief and
  the harness are about 90% of the result.
- **Start from a reference.** Without one, Opus defaults to a centered title on a gradient with everything fading in.
  Naming a style beats describing one. Extract frames from a reference and write a style guide from them.
- **Write a banned list** of the default looks: corner labels, frame borders, glows, particle bursts, dark 3D.
- **Use the real product.** Real screenshots or markup, real numbers or a visible "example" label.
- **Spec, not vibe.** The most-copied prompts are XML: `<inputs>`, `<direction>`, `<structure>`, `<build>`,
  `<gotchas>`, `<start>`.
- **Gates before the full render:** script, storyboard options, one still per scene, animatic, final.
- **Make it watch its own frames:** a contact sheet (2 frames per second), frame strips around fast moves, a 360 px
  phone sheet. Score 1–10 on hook, readability, motion, variety, brand and sync, fix the worst three, repeat until 8+.
- **Craft:** closed-form springs instead of easing curves; motion blur by rendering subframes and averaging them;
  a measured beat grid with the drop found by ear or energy, not by an automatic tracker; real sound effects placed on
  their measured peak; -14 LUFS.
- **The criticism to design against:** pretty but generic, no story, won't convert. Know the buyer, the pain and what's
  different before any motion.

### Most-liked launch videos (for references)
| Likes | Launch | Link |
|---|---|---|
| 104k | Claude Fable 5 (art style) | https://x.com/claudeai/status/2064394146916229443 |
| 97k | Claude Opus 5.5 (art style) | https://x.com/claudeai/status/2102435511222890900 |
| 71k | Mac mini | https://x.com/tim_cook/status/2092253780532486557 |
| 46k | Perplexity Computer (product demo) | https://x.com/perplexity_ai/status/2026695550771540489 |
| 42k | Devin (product demo) | https://x.com/cognition/status/1767548763134964000 |
| 38k | OpenAI dots | https://x.com/OpenAI/status/2104984504133918973 |
| 27k | GitHub Copilot | https://x.com/github/status/1409883156333879300 |
| 13k | Cursor for iOS | https://x.com/cursor_ai/status/2071641103191998810 |
| 12k | Arc Boosts 2.0 | https://x.com/browsercompany/status/1661724147087450116 |
| 10k | Notion AI | https://x.com/NotionHQ/status/1592954174475337728 |
| 8.3k | HeyGen, made in Claude Code with HyperFrames | https://x.com/HeyGen/status/2044827454460871072 |
| 4k | Linear, "Issue tracking is dead" | https://x.com/linear/status/2036502198062821842 |

X search favours the last year and rate-limits after about 40 searches (HTTP 429, clears in roughly 15 minutes).
Videos download with `uvx yt-dlp --cookies <netscape cookie file>`; the copies are in `refs-videos/`.

## 3. The two styles

We sorted the top launches into three kinds and kept two:
- **Art style** (Fable 5, Opus 5.5): very visual, almost no text. One fixed shape rebuilt from many real materials,
  cut on the beat, then a quiet end card.
- **Product demo** (Perplexity, Devin): the product doing real things, with a lot of on-screen text.
- **Humans on camera** (OpenAI, Apple): out of scope.

## 4. The lab: layout and environment

```
tin-film-lab/                     (github.com/tin-computer/tin-film-lab, private; see README for setup)
  bin/ffmpeg                      static ffmpeg 7 (no system ffmpeg on this box)
  pyproject.toml, .venv           uv env: librosa 0.11, numba 0.61, numpy<2.3, beat-this (git),
                                  torch CPU, soundfile, matplotlib, opencv-headless, rembg[cpu]
  music/
    README.md                     how to use the library, cut and runtime
    catalogue/                    scrape, analysis, scoring, previews, 255 full mp3s (1.1 GB)
    library/                      the 19 vetted tracks, each with MAP.md, map.json, map.png, check.mp3
      LIBRARY.md, index.json      the model's track chooser
    tools/map_track.py            beat grid, sections, events, envelopes per track
    tools/cut.py                  cut a track to film bars; writes music.wav, cue.json, cue.js, CUE.md
    tools/music.js                seek(t) runtime: bar, beat, pulse, energy at any frame
    tools/index_library.py        rebuilds LIBRARY.md
  films/tin-launch/               film 1 (product demo)
  films/tin-art/                  film 2 (art film; 13 GB, mostly full-size archive masters)
  refs-videos/                    downloaded reference films
  HANDOFF.md                      this document
```

Environment notes:
- **librosa's beat tracker segfaults with the newest numba** (gufunc crash). Pin librosa 0.11 and numba 0.61, which
  needs numpy below 2.3.
- **beat_this** (CPJKU) is the beat and downbeat tracker. Its first run downloads a checkpoint to `~/.cache/torch`.
- **Playwright 1.63** with Chromium is installed per film folder (`tools/node_modules`).
- **rembg** with `isnet-general-use` cuts objects out of archival scans. The model downloads on first use.
- **yt-dlp** runs through `uvx`; it needs X cookies in Netscape format for X videos.
- **Runs use the Claude Code subscription**, not an API key (`apiKeySource: none` in the run log). The dollar figures in
  run logs are what the usage would cost at API prices; nothing is billed per token, but long max-effort runs eat the
  usage allowance.

## 5. Music: library, maps, cuts, sync

The music matters most: sync is what separates these films from screen recordings.

### Catalogue and vetting
1. Scraped Mixkit's listings (`catalogue/scrape_mixkit.py`): 654 tracks across technology, corporate, driving,
   electronic, house, hip-hop, cinematic and calm moods. Mixkit rate-limits listing pages (429) after about 80 pages.
2. Dropped kids, wedding, comedy, holiday and similar tags and anything outside 45 s to 5 min: 255 tracks, downloaded
   from `assets.mixkit.co/music/<id>/<id>.mp3`.
3. Measured each one (tempo, beat steadiness, intro length, the first bar where the bass jumps 6 dB or more) and kept
   the best 7 in each of six styles: 42 tracks.
4. Ege vetted the 42 by ear on a Keep/Maybe/No page with 32-second previews starting 16 s before each drop: **19 kept**.

The Mixkit Stock Music Free License allows social posts, online ads and YouTube with no attribution. It forbids
broadcast, games, CDs, remixing into music-only tracks and Content ID registration. Fine for a founder's launch film.
Whether Tin may ship these tracks to every customer needs Mixkit's user terms checked.

### Maps (`music/tools/map_track.py`)
For each kept track:
- **Beat grid.** beat_this detects beats and downbeats. Its detections sit on a 20 ms frame grid, so you can't
  round to a global period; that error accumulates (Razor Edge read 120 BPM, really 122). We fit one straight grid by
  phase coherence on 20-second windows where detection is confident, then nudge only the phase (±30 ms) onto the
  actual transients. Where downbeat detection is weak, bar 1 goes where the kick hits hardest. 16 of 19 tracks have
  92% or more of detected beats within 40 ms; R&B vibes 1, Drawing the Sky (3/4) and Dub Techno Groove are flagged
  "check by ear".
- **Bars, 4-bar phrases and sections** (intro, build, drop, main, breakdown, outro), with boundaries only on phrase
  starts.
- **Events:** bass in, bass out, one-bar breaks (bass drops out and slams back), risers, stops.
- **Hits** with a bar.beat position (`@10.2.5` = bar 10, halfway between beats 2 and 3).
- **Envelopes** at 60 fps: all, low, mid, high, kick, onset.
- **Outputs:** `MAP.md` for the model to read (a bar-by-bar sheet with ASCII energy bars), `map.json` for code,
  `map.png` as lanes for the model to look at, and `check.mp3`, 60 s with clicks on the grid and a bell at each section,
  for a human to verify by ear.

### Getting the audio
The repo has no Mixkit audio (the licence covers the music inside videos, not as files). Run
`uv run python music/fetch_audio.py` to download the sources, verify them against `music/audio-manifest.json` and
rebuild the cuts, check clips and the sound-effects stem.

### Cut and sync
```bash
uv run --project ../.. python music/tools/cut.py music/library/745-house-vibez music-cut --bars 11 --land drop --at 8 --fade-bars 1.5
```
- Takes whole bars so the drop lands on a chosen film bar. The film always starts on a downbeat and ends on a bar line.
- `CUE.md` is the bar sheet in film time, with sections, sync points, accents, phrase starts and the landing marked.
- `cue.js` sets `window.CUE` (file:// pages can't fetch JSON).
- In the page:
  ```js
  const M = Music(CUE);
  M.at(t)       // { bar, beat, beatPhase, phrase, section, energy }
  M.time(5, 1)  // film seconds of bar 5 beat 1
  M.pulse(t)    // 1 on each beat, decaying
  M.env(t, 'low')
  ```
- **The rule:** plan scenes in bars, not seconds. Scene changes on phrase starts, state changes on beats, the biggest
  moment on the drop.

## 6. The film workspace: rules, brief, skills, tools, prompt with gates

Each film folder is a self-contained Claude Code project. This is the part to reuse.

| File | Role |
|---|---|
| `CLAUDE.md` | House rules: the render contract (pure `seek(t)`, no timers, CSS transitions or Math.random), music rules, the look and its banned list, truth rules, the critique loop. |
| `BRIEF.md` | The director's brief: the film in one line, who it's for, what's different, a table of the only facts allowed on screen with their sources, the look as a named style, format, sound. |
| `PROMPT.md` | The run prompt in the XML shape from the research: inputs, direction, gates, working rules, start. |
| `.claude/skills/motion-film` | The engine: page contract, springs, continuous-take moves, render commands, deliverables. |
| `.claude/skills/music-sync` | Choose a track, cut it, plan in bars, read the music at render time, check sync. |
| `.claude/skills/critique` | Review sheets, the scoring rubric, what to hunt for, the log format. |
| `.claude/skills/materials` | Art film only: open-access archives, rights rules, cutouts, the asset log. |
| `tools/render.mjs` | Stills or video from a `seek(t)` page. Parallel workers, motion-blur subframes, `--shutter`, `--from/--to` partial renders. |
| `tools/sheets.sh` | Contact sheet, phone sheet and frame strips. |
| `tools/mix.sh` | Two-pass mix to -14 LUFS: one linear gain plus a limiter, so the drop keeps its dynamics. |
| `tools/determinism.mjs` | Proves every frame depends only on t (found real bugs twice). |
| `tools/lib/motion.js` | Closed-form springs (`sp(t, 'snappy' / 'base' / 'heavy' / 'playful')`), `track` for multi-target springs, `swapAlpha`, `typed`, seeded rng. |
| `tools/example/` | A tiny working film wired to the music; agents copy its shape. |
| `refs/` | Brand (DESIGN.md, mark, fonts), product facts, reference films, real dashboard markup. |

Gates for the product demo: three story concepts → music pick and cut → style guide and bar-by-bar shot list → stills
with at least two critique rounds → 960×540 animatic with at least two rounds → final at 60 fps with 4 subframes and
the mix → wrap-up README. In an unattended run nobody approves a gate; the agent writes each gate's file and checks it
against the brief and the rubric.

## 7. Running headless and watching a run

`run.sh` in each film folder:
```bash
claude -p "$(cat PROMPT.md)" --model claude-opus-5-5 --effort max \
  --dangerously-skip-permissions --output-format stream-json --verbose \
  > logs/run.jsonl 2> logs/run.err
echo "exit $?" >> logs/run.err
```
- Start it in tmux: `tmux new-session -d -s film_<name> -c <folder> ./run.sh`. tmux turns `:` in session names into `_`.
- **Set `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`** in `run.sh`. Without it, `claude -p` waits only 600 s for the
  agent's background tasks (subagents, renders) and then exits. That cut the art film's last review round short.
- Watch progress:
  - `ls docs out`
  - `jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="text") | .text' logs/run.jsonl | tail`
  - the `result` event at the end gives turns and duration.
- `--dangerously-skip-permissions` is why each film lives in its own folder and the prompt says to stay inside it.

Run sizes so far:
| Run | Duration | Turns |
|---|---|---|
| Product demo film | 91 min | 255 |
| Art film board | 152 min | 363 |
| Art film motion | about 185 min plus resumes | about 650 |

## 8. Film 1: product demo (`films/tin-launch`)

- **Brief:** for technical founders who ship with coding agents and have no marketing person. Facts only from Tin's
  README and workflow catalogue (60 workflows; Claude Code, Codex and Cursor; the MCP command). Named style: an AI-lab
  launch film crossed with an Apple keynote bumper, in Tin's paper-and-ink brand (`refs/brand/DESIGN.md` from tin-web).
- **Real UI:** the dashboard sits behind login, so the agent got the real `src/tin_lite/static` markup and CSS and
  rebuilt the screens from it, filled with Tin's own project as an example.
- **Result:** `out/tin-launch.mp4`, 32 s.
  - **Hook:** "Your agent ships the product. Tin lets it run the marketing."
  - The MCP command types into a terminal, the agent fills Tin's onboarding plan from a repo, and the plan opens into
    the dashboard.
  - **On the drop** (frame 960, the first frame of bar 9), workflow names fly into the System view under "A whole
    marketing system. 60 workflows."
  - "Running between sessions", then a decision is approved.
  - **End card:** a lime flood with the command and tin.computer.
  - **Track:** Swish Swed.
- **The agent fixed the toolkit along the way:** a one-pass loudnorm that missed -14 LUFS and flattened the drop
  (replaced by the two-pass mix), stepped ghosts on fast edges (`--shutter 180` plus analytic edge blur), and added the
  determinism check.
- **Our review:** on-brand, true and exactly in sync, but it reads more like a polished screen recording than motion
  design.
  - A caption over a UI panel repeats for about 22 s.
  - The drop isn't the biggest visual moment (the lime flood at 23 s is).
  - The UI is unreadable at phone size, and the terminal is a flat blue slab.
  - The agent scored itself 8 on everything; it was generous. That led to the independent critic below.

## 9. Film 2: art film (`films/tin-art`)

### Concept
Every era of marketing, made of the things marketing was made of, each forming the Tin mark, ending on the terminal
where "your agent runs it". The anchor is the name: pressed-tin signs were among the first mass advertising media.

### Reference breakdown (`docs/REFERENCE.md`, measured frame by frame)
- **Fable 5:** about 55 materials, not 22.
  - **Withhold:** 0–7 s, holds of 24, 26 and 24 frames, then shorter.
  - **Strobe:** 4.6 s at 3 frames per material (a 16th note at 120 BPM).
  - **Settle:** holds of 18, 20 and 25 frames.
  - **End:** a release into the title card, then the wordmark, then a loop.
  - **Four treatments:**
    - A: objects along the outline
    - B: material inside the shape
    - C: material with the shape cut out as paper
    - D: the shape built by the material

    It changes treatment almost every cut.
- **Opus 5.5:** about 25 textures on a horizon curve. Holds of 1–1.2 s at the open, then 0.5 s, then 0.2–0.3 s with
  three words on top, then a 4 s end card and a loop.

### Materials
- The Tin "TiN" mark exists only as a PNG; we traced it to `refs/brand/mark.svg`, and the agent later refit the n's
  arches as smooth curves.
- **Archives:** Library of Congress, Wikimedia Commons (public-domain or CC0 licences only), Cleveland Museum of Art
  (CC0), Smithsonian Open Access (CC0, DEMO_KEY is rate-limited) and Cooper Hewitt.
  - The Art Institute of Chicago's image server blocks scripted downloads.
  - The Met's API was down.
  - LoC and Commons throttle full-size files.
- **Rules:** public domain or CC0 only, rights field quoted verbatim in `materials/ASSETS.md`, no people, no modern
  brand logos. Code makes only what code is the honest medium for (the 1996 banner, the 2004 search page, the terminal).
- **About 1,000 lines of asset records.** We dropped El Cortez neon (the hotel still operates), a Golden Guernsey
  matchbook and a stamp for a company that still trades.

### Board (human gate)
- 20 stills plus 4 alternates. Reviewed with Ege, who handed the calls to us:
  - **Cut:** TV test card, poster stamps, biscuit tin.
  - **Opening:** the pressed-tin ceiling replaces the pale shop cards as a prologue.
  - **Rebuilt:** the search page, so the mark reads at 360 px, and the banner, to read as the web in 1996.
  - **Words:** "Your agent runs it."
  - **End card:** the ink mark on a hairline grid, then tin.computer with a lime cursor, the only lime in the film.

### Edit and music
- **Track:** House Vibez, song bars 25–35, 122 BPM, 11 bars, 21.6 s. It's the one library track with a stop and a drop
  back to back, and its breakdown accelerates by itself.
- **Cutting:** every 2 beats, then every beat, then 8ths and 16ths, a settle, the stop with "Your agent" over an idle
  terminal, "runs it." on the strongest hit, the terminal on the drop, the blue draining to the end card, and a loop
  into the first frame.
- 47 shots: 16 board stills plus 27 catalogue materials in the strobe. Every cut is on the music grid (at most 21 ms
  off at 24 fps). Cut list in `docs/EDIT.md`, generated from what the film renders.

### Critique change
- Every round, a fresh subagent that never saw the author's reasoning scores the sheets cold against Fable 5. The lower
  score counts.
- Self-scores ran 2–13 points above the cold reviews.
- The cold reviewer caught a real delivery risk: the strobe flashed about 4 times a second, over the broadcast and WCAG
  limit of 3. The agent added `scripts/flashcheck.py` and brought it to 2.

### Art film status
- `out/tin-art.mp4` (2160², 195 MB) and `out/tin-art-share.mp4` (47 MB) were rendered at 00:06 on 2026-10-06,
  **before** review round 7.
- After that the agent reworked the source:
  - **New strobe materials:** 24 trade tokens, a 1913 halftone ad, 1970s DOCUMERICA roadside photos, core memory, a
    floppy disk and CRT phosphors.
  - **New ending:** a full-bleed terminal, and the loop now turns the pressed tin inside out.
  - **Flashes:** the flash fix.
- Animatic 9 (`out/animatic/`) is the newest picture. The headless session then exited on the 600 s background-wait
  limit while the round-7 cold review ran, so the final was never re-rendered and `README.md` still has a `SCORES`
  placeholder.
- **To finish:** read the round-7 cold review in `docs/REVIEW_LOG.md`, fix what it found, then run
  `scripts/final.sh`.

## 10. Lessons and gotchas

- **References first.** The product demo had none and came out generic. The art film started by measuring Fable frame
  by frame, and its board looked right on the first pass.
- **Self-critique is generous.** Use a cold reviewer with fresh context and count the lower score.
- **A human gate where taste lives.** The materials board was the cheapest place for a person to steer.
- **Music first, in bars.** Planning in bars removed most sync problems. Mapping took more care than expected (20 ms
  quantisation, half-time detections, 3/4 time, weak downbeats).
- **Measure the delivery risks:** flashes per second, loudness, legibility at 360 px, determinism.
- **Headless background wait:** set `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`.
- **Render cost:**
  - 1080p, 60 fps, 4 subframes: about 22 subframe screenshots a second per worker.
  - A 30 s film at full quality: several minutes on 4–6 workers.
  - The 2160² art film is much heavier, and 13 GB of disk with archive masters.
- **Long-run usage:** each film run is 1.5 to 3+ hours at max effort on the subscription.

## 11. Turning this into a Tin workflow

What exists in Tin today:
- `creative.product_demo` is a `codex.procedure` on the `studio` sandbox profile: Camoufox phone capture, a
  Pillow/NumPy renderer, fal TTS and Whisper captions, 9:16 only, no music, no contact sheet. Its timeout is 3600 s
  and its ceiling $10 a run.
- See `docs/creative-studio.md` and `codex_procedures/creative.product_demo/`.

Gaps to decide before building:
- **Model.** Tin's procedures run Codex, not Opus. These results are Opus 5.5 at max effort. Either prove a Codex run
  is good enough on the same harness, or it's a model-route decision, not incidental work.
- **Time and render budget.** Our runs take 1.5–3 hours; the procedure limit is 1 hour. Options:
  - fewer critique rounds;
  - a shorter or square-only film;
  - half-size animatics only;
  - splitting the run into gated phases with a human review between them (the board pattern fits Tin's review policy
    well).
- **Music.** The vetted library and maps could ship as a read-only asset in the studio image, after checking Mixkit's
  terms for redistribution inside a product. Mapping needs beat_this, torch and librosa, but only offline, at library
  build time; the film run only reads the maps.
- **Images for the art style.** Archive downloads need egress through the run's proxy grant, and the archives
  rate-limit. Prefer a pre-built, rights-checked materials library over live searching.
- **Founder context.** The brief should come from what Tin already holds (onboarding, Code map, Feature map, brand
  capture, style guide), not pasted facts. The fact table pattern maps cleanly onto those.
- **Shape.** Probably two workflows, one per style, both `codex.procedure` with a review gate before the final render,
  and the critique loop as a skill.

## 12. Open items

1. **Finish the art film:** apply the round-7 cold review, re-render with `scripts/final.sh`, fill in the README
   scores.
2. **Second pass on the product demo:** a reference film (Devin or Perplexity), varied framing, the biggest visual on
   the drop, readable UI at phone size, the cold-review critique.
3. **Add `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0` to both `run.sh` files.**
4. **Large files live outside the repo.** The art film's archive masters and cutouts (about 8 GB) are not committed;
   ask Ege for a tarball to render the art film again.
5. **A 16:9 cut of the art film** (needs its own crops and a smaller mark).
6. **Check Mixkit's user terms** for shipping tracks inside Tin.
7. **Decide the model question** before writing the Tin workflow.

Review pages from this work are private claude.ai artifacts on Ege's account (the music catalogue, the track maps and
the first product film); ask Ege to share them if you need them.
