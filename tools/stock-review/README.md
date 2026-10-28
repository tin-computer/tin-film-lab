# Stock review — 28 October 2026

Open `index.html` locally. The existing product-asset gallery links here too.

## Result

| Group | Total | Shortlisted | Rejected | Visual review blocked |
|---|---:|---:|---:|---:|
| Original candidates | 12 | 1 | 4 | 7 |
| New robot/phone searches | 8 | 2 | 4 | 2 |
| Existing modern clips rechecked | 2 | 2 | 0 | 0 |
| New modern context clips | 4 | 4 | 0 | 0 |
| Existing CC0 textures surfaced | 2 | 2 | 0 | 0 |
| Total | 28 | 11 | 8 | 9 |

Three new shortlisted candidates show printing machinery, a pick-and-place robot and phone quality inspection. Two existing clips show laptop typing and a person messaging on a phone. These are scene candidates, not generic footage to insert into every film.

Five chronological frames per downloaded search candidate were inspected. Two saved frames per existing Mixkit clip were inspected again. This is not continuous viewing or audio listening. All five shortlisted files passed complete FFmpeg decoding and loaded in the gallery. Source pages were saved/read for the original 12 and eight new candidates. Nine visual reviews could not finish because Commons downloads returned HTTP 429 with its robot-policy notice; no bypass was attempted. They remain blocked.

The four original Archive results were rejected: two advertising compilations contain brands/characters, a skateboarding safety film contains children and accidents, and a youth documentary has a specific social/political context. Public Domain metadata alone is not full promotional-use clearance.

## Licence correction

The existing MK32085 pottery record claimed the Mixkit Free License. Its current source page says the free 720p version is **Personal Use only / Restricted License**. It is excluded from commercial selection. The full checkout's existing asset catalogue was narrowly corrected; a pre-edit copy is saved in this local cache. The file was not deleted and its old provenance remains available.

- https://mixkit.co/free-stock-video/molding-clay-pottery-wheel-close-up-32085/
- https://mixkit.co/free-stock-video/typing-on-a-laptop-close-up-1781/
- https://mixkit.co/free-stock-video/young-man-on-the-street-typing-on-his-cell-phone-4837/

CC BY sources require author/source/licence credit and an edit notice. Their brand or person rights still depend on the chosen scene. Mixkit raw clips stay local; this gallery is not permission to redistribute a stock library or automate bulk collection. Coverr was considered but not added: its stock/API terms need clarification for our reusable video service. An ink/water search returned zero eligible candidates.

## Files and checks

- `catalogue.json`: selection, visual observations, source links, licence notes, sampled times and download errors
- `cache/`: ignored local media, source-page copies and review frames
- `build.py`: generates local gallery from reviewed records
- `check.mjs`: counts, unique IDs, filters, search, video metadata loading, mobile overflow and page errors
- `checks.json`: successful local check results

Run from this checkout: `python3 tools/stock-review/build.py` then `node tools/stock-review/check.mjs`.

No human approval is recorded. Before a final film, watch the exact cut, confirm its source credit and use an adequate-resolution rendition. Current shortlist previews include 480p files, not final 1080p masters.

## Modern additions

Four individually selected Mixkit clips add a developer desk (41637), a keyboard-to-phone action (1814), a notebook workspace (49922) and coloured light through acrylic (101714). Their individual pages explicitly state free commercial use; source URLs and exact licence text are in `modern-sources.json`. Four chronological frames per clip were inspected and each complete file decoded without errors. This does not claim continuous viewing or audio listening. The light clip is vertical; the other three show context, not our product UI.

Paper001 and Fabric030 are existing ambientCG textures, now visible here. Both stills were inspected. The official CC0 page covers commercial use and preview renders: https://docs.ambientcg.com/license/

All 22 earlier entries remain, including factory footage. Raw Mixkit videos stay in the ignored local cache, not a redistributed stock service. These 720p previews need a suitable master before a full-resolution film.

Git includes the review records and gallery, not the raw stock cache. On another machine, use each card’s original-source link; local playback checks require the recorded files in cache. The collector and retry scratch files are local research helpers, not part of this delivery.
