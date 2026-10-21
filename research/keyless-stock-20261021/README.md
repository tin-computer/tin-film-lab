# Keyless stock source check · 21 October 2026

## Result

17 files downloaded and fully decoded: 8 Mixkit clips and 9 RawFilm meeting shots. The agent inspected 68 chronological frames. This was sampled image review, not continuous viewing or sound listening. Originals and source hashes are preserved.

Seven 1280×720 candidates are now in the shared local catalogue and text search: typing, phone use, reading, food preparation, running, medical paperwork and pottery. These are local film candidates, not user approvals or a hosted stock collection. The source shoot dates are not known.

| Decision | Files | Reason |
|---|---:|---|
| Candidate | 7 Mixkit clips | Clear human actions. Use only when the story needs that action |
| Not recommended | 1 Mixkit clip | Generic glowing cube tunnel. Does not explain a product |
| Not recommended | 9 RawFilm clips | All files are 500×280, despite the page's “Download HD” label. Keep for composition research, not full-screen launch output |

The nine RawFilm shots are angles from the same meeting, not nine different subjects. All rejected records remain in `catalogue.json`; the main recommendation catalogue omits this batch's rejected records.

## Access and rights

- [Mixkit Free Video License](https://mixkit.co/license/#videoFree) is recorded per clip. [Mixkit User Terms](https://mixkit.co/terms/) restrict mass downloads and making files available as stock/inventory. The discovery/download loop was removed after the terms check. `collect.py` now only validates saved page metadata. Do not treat it as an API or rerun bulk collection.
- [RawFilm's free business page](https://raw.film/free-business-footage) allows commercial edited use but prohibits raw redistribution, sale and relicensing. The public links delivered low-resolution files here. Do not guess higher-resolution URLs or bypass its signup.
- Media, page snapshots and review frames stay local and are ignored by Git. Do not copy this raw selection into Tin's shared sandbox image, a public repository or a user-facing stock service. Shared instructions can name sources and direct users to their own authorised downloads.
- Existing Dareful CC BY 4.0 clips and selected openly licensed photographs remain available. Preserve their required credits. A new Pexels key is not a prerequisite for using the local catalogue.

## What is in Git

This folder publishes source metadata, observed notes, decisions, checks and the saved-page validator. The combined 193-record gallery is a local working collection from other batches; it is not part of this source-note commit. `catalogue.json` can be read without media or API credentials. Its `candidate` entries are proposals, not approved assets.

The `media/`, `pages/` and `review/` paths describe local evidence and are deliberately not shipped. `finish.py` needs those local files to check hashes and rebuild the notes. It does not restore them or prove a new decode on another machine. Obtain an authorised clip through its provider before editing a film.

Run the standalone metadata checks with Python's standard library:

```bash
python3 -m unittest discover -s research/keyless-stock-20261021 -p 'test_*.py'
```

## Evidence

`download-results.json` has actual dimensions, durations, hashes and decode results. `catalogue.json` adds the observed actions, proposed use, limits and four sample times per file. `checks.json` records 17 decoded sources, 68 inspected frames, 7 candidates and 10 rejected records. `review/sheet-1.jpg` through `sheet-5.jpg` are the inspected contact sheets.

`finish.py` rebuilds these notes offline and asserts file/hash/frame coverage. Four parser tests reject restricted licences, wrong media hosts and ambiguous metadata. The main gallery and existing text search read the selected entries without a new dependency.

Source sound and final-film creative fit still need review. No new cloud inference calls or human hours were added by this collection step.
