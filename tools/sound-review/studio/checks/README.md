# 28 October 2026 checks

Checked from a temporary folder copied from the Git index, with no original `out/` files, local audio paths or existing `node_modules`. These are local app checks, not Tin staging tests or a film-quality review.

| Check | Result |
|---|---|
| `npm ci`, `npm run setup`, `npm run build` | Passed; fresh dependencies and data |
| `npm test` | 3 passed: situations, save/import/export, clean setup and preservation |
| Browser | 13 checks passed; [results](clean-browser.json) |
| Shared records | 54 music entries, 52 effects; supplied revision 170 preserved |
| Direct audio URLs | 44 returned data; 2 returned HTTP 406 and were changed to source-page-only entries; [requests](provider-links.json) |
| Actual browser playback | Neon and a bundled Kenney effect played; not every provider file was played to its end |
| Screens | Desktop music/effects and 390px effect board inspected; no page overflow or browser JS errors |
| Original desk | Its newer notes were unchanged |

The browser check first caught numeric track links opening the first track instead of the requested track. The search validator now accepts a safe numeric ID as a string. Opening the same Neon link then selected Neon and played its audio. Five effect choices also saved in click order and survived reload; those edits were made only in the temporary copy.

Forty CC0 effects are included. Forty-four music entries use online provider audio. Twenty Soundza entries and two blocked Scott Buckley tracks open their source page. HTTP success is not a licence check, full audio review or promise that the URL will stay available.

The new story guide adds eight story moves and six ways to shoot them. No new film was rendered to validate those directions in this change.
