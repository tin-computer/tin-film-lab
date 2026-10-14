# Sources

| File / material | Source |
|---|---|
| `white-rabbit.jpg` | John Tenniel, circa 1865. [Source and public-domain record](https://commons.wikimedia.org/wiki/File:Alice-white-rabbit.jpg). Unchanged source image. |
| `typewriter.jpg` | S. J. Perelman's typewriter, NYPL. [Source and CC0 record](https://commons.wikimedia.org/wiki/File:S_J_Perelman%27s_typewriter_(NYPL).jpg). Unchanged source image; the film crops it. |
| `readntype-tin-character.svg` | Tin Files: `characters/readntype-qa-character-20261011.svg`, ReadnType project `4f444825-3431-524f-9c66-e54358b20c17`, revision `37a05c8f1f174bd52baf932e6b8b3d8cb0712c6d`. Copied unchanged. |
| `word-renderer.js` | Frozen browser bundle of ReadnType's `apps/web/src/reading-engine/word-renderer.ts` at commit `133621a055e919e5ee6f47e85ea41e148a405278`. The entry exposes `mountWords` on `window`; no app backend or account is used. |
| `fonts/RobotoMono-Regular.woff2` | Unchanged ReadnType font at the same commit, `apps/web/static/fonts/RobotoMono-Regular.woff2`, version 3.000. Copyright 2015 The Roboto Mono Project Authors. Its embedded licence URL points to Apache 2.0; [licence included](fonts/RobotoMono-LICENSE.txt). |
| Geist regular and bold | Reused from `../../locin-cli-launch/refs/fonts/`; its SIL OFL licence is included there. |
| Book passage | Lewis Carroll, [Alice's Adventures in Wonderland](https://www.gutenberg.org/cache/epub/11/pg11-images.html). The comprehension question and selected answer were written for this film. |
| Music | House Vibez #745 by Lily J, from the existing [track map](../../../music/library/745-house-vibez/MAP.md). Source bytes are checked against `music/audio-manifest.json`. Audio is downloaded by `prepare.py`, not committed. |

The film uses the word renderer directly. Its sizes, theme styles, caret and quiz layout are film choices. No customer data or reference-video footage is included.
