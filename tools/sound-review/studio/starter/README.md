# Shared sound review snapshot

Hamit supplied `ses-masasi (2).json` for this repository. `reviews.json` is that file unchanged, revision 170, saved on 28 October 2026 at 01:00:34 Europe/Istanbul (27 October 22:00:34 UTC).

SHA-256: `9922ec95026be2ad39e51c55562edaf0d8bc0a77479230805281b1d533816c29`

| Record | Count / meaning |
|---|---|
| Catalogue | 54 music entries, 52 effects |
| Saved reviews | 55: 54 music and one effect |
| Status in those reviews | 7 shortlist, 4 rejected, 44 unreviewed |
| Saved effect situations | 7; the desk supports 20 |
| Saved AI suggestions | 54 music entries; these are not human approval |
| Included audio | 40 Kenney CC0 effect previews, about 0.28 MB |
| Provider audio URLs | 44 music entries, played directly from the provider |
| Source page only | 8 Soundza music entries, 12 Soundza effects and 2 Scott Buckley tracks (direct playback blocked) |

The live desk had newer edits at packaging time. They were not replaced with this older export. The shared file is a dated handoff, not a claim to contain all later choices.

`catalogue.json` holds names, sources, licence records and measured waveform previews. No private machine paths or keys are needed. A waveform is not a full listening review. AI notes may be wrong; listen before approving a fit. Exported human choices stay owner-specific.

The included effects come from [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), licensed [CC0](https://creativecommons.org/publicdomain/zero/1.0/). These previews were normalized by the earlier local preview tool and encoded as Ogg for a small clone. [CREDITS.json](audio/CREDITS.json) records each source, original hash and conversion. Music and Soundza raw files are not redistributed; follow their source and licence links before using them in a film.

`npm run setup` initializes a private local copy. `npm test` checks the original export hash, clean initialization, preservation of later edits, situation choices and the save/import/export API. The desk exports a version-1 review document; this is not the legacy array accepted by `music/tools/shortlist.py --notes`.
