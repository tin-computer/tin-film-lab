# Film-lab development inventory

This UI shows the tools, motion helpers, sound effects, music, skills and source checks behind the films. The reference-film browser stays a separate research view.

From the repo root:

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

Open `http://127.0.0.1:8767/inventory/`.

`inventory.json` is a dated metadata snapshot, not a live scan or an asset downloader. It compares this reviewed branch with the separate local Codex and Claude checkouts. Local-only rows name their source checkout and file; they do not claim that file was pushed. The UI loads this one local JSON file and has no third-party requests or write actions.

Counts: 19 existing music tracks plus 18 local Codex and 8 local Claude selections = 45 unique indexed tracks. The selected 20 recorded effects, 3 code-made Earshot roles and 6 old Mixkit effects remain separate. Six existing skill files have four distinct names. Cinetic's 273 technique descriptions and the 26 observed reference UI groups are not 299 implemented components.

Source files: `music/library/index.json` in each checkout; local `assets/sfx/index.json`, `assets/FREE_APIS.md` and `FILM_FLOW.md`; this branch's `tools/`, `shortform/`, skill files, `research/launch-references/catalog.json`, and the Tin recut's `audio-kit.json` / `CHECKS.json`. The separate local Tin workflow is listed with its own state.

[Next-work plan](PLAN.md) covers product clarity, source collection and editable revision files. It does not claim those future checks have passed.
