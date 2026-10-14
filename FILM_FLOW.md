# Make a short film with the user

Use this flow for a product launch, a feature launch or a short marketing film. The agent asks questions in its coding client, saves the brief and makes the film with the lab's existing tools.

To start, ask your coding agent:

> Follow FILM_FLOW.md to make a short feature film for my product. Read the product and brand files I provided, then ask me only for the missing choices.

## 1. Read, then ask

Read the supplied product source, feature notes, brand files and reference. List the supported features before recommending one. Use the actual product purpose, not a generic software story.

Ask the missing parts of these three questions together. Use the client's question tool if it has one. Give short choices based on the product, and allow a free answer. Without a question tool, ask in chat and wait.

| Question | What to ask |
|---|---|
| What are we showing? | Product launch, one feature or marketing. Offer two or three real features and recommend one. |
| Who is it for, and what should they do? | One viewer group and one next action: try a command, open the product, sign up, or another clear action. |
| How should it look and sound? | Art, product visuals or a mix; platform, length and shape. Ask for a reference, music or mascot only when it is missing and matters to this film. Offer a compact package such as “X, 20 seconds, horizontal, art + short product example.” |

Reuse choices the user already gave. Suggest defaults for open style choices, but wait for answers needed to pick the feature, audience and action. If the user explicitly asks for an unattended run, save the assumptions in the brief and use that run mode. Never record a guessed choice as a user's answer.

## 2. Save the brief

Create `films/<film-name>/BRIEF.md` before writing animation code. Keep it short:

| Field | Save |
|---|---|
| Product / feature | The single promise shown by this film. |
| Viewer / action | Who watches and what they should do next. |
| Format | Platform, seconds, aspect ratio and preview size. |
| Look / sound | Style, reference, music choice and character choice. |
| Facts / assets | Sources for claims, commands, UI and images; which parts are authored examples. |
| Review | User choices, approved direction and later changes; assumptions marked separately. |

Pick music from `music/library/LIBRARY.md`, using the user's track when supplied. Read the track map and use `music/tools/cut.py` to produce `music-cut/CUE.md` and `cue.js`. Plan the largest result on a suitable music hit. Record the choice in the brief; do not force every film onto the same track or style.

## 3. Show the story and three real frames

Write `STORY.md`: one short story and a table of shots, their music bars, action and on-screen words. Link every factual claim to the brief. Keep text short and let the pictures carry the feature.

Build `src/index.html` with `window.FILM` and a pure `window.seek(t)`. Reuse `films/tin-launch/tools/lib/motion.js` and `music/tools/music.js`.

Render three frames with `films/tin-launch/tools/render.mjs stills`: the opening, the product result and the ending. Put them in `out/story/`, inspect them and link them from `STORY.md`.

Show the story and frames together. Ask whether the feature and visual direction are right. Wait before making the full preview, unless that direction was already approved or the user chose an unattended run. Carry existing approval forward; do not ask for it twice.

## 4. Make and review a music preview

After direction approval, render a small full-motion preview with the existing renderer and mixer. Use the music grid for main reveals and state changes. Reuse real product material when useful, and mark authored examples.

Use `tools/sheets.sh` from `films/tin-launch/` for a contact sheet, a phone sheet and strips around fast transitions. Inspect the pictures. Check missing assets, text fit, repeated-frame behaviour, audio mix and the complete video decode. Save the results and the few issues worth fixing in the film's README.

Share the actual music preview. The user's visual and sound feedback is separate from the automated checks. Fix the reported issues, render the affected parts again and update the brief when the direction changes.

## 5. Deliver the selected film

After the user accepts the preview, render at the agreed size and frame rate. Keep the whole picture when adding audio. Check the full decode and final transitions. Save setup/render commands, source records, test results and limits in the README.

Verify a fresh checkout can restore the inputs and render. Commit only the selected sources and redistributable assets; keep downloaded music, intermediate frames and logs out of Git. Commit, push or open a PR when requested.

## Working examples

- [LocIn CLI brief](films/locin-cli-launch/BRIEF.md) → [story / three frames](films/locin-cli-launch/STORY.md) → [render commands](films/locin-cli-launch/README.md). Three user answers chose the feature, action and art direction.
- [ReadnType reading brief](films/readntype-reading-launch/BRIEF.md) → [story / three frames](films/readntype-reading-launch/STORY.md) → [render commands](films/readntype-reading-launch/README.md). Existing feedback chose reading and comprehension, then the book ending with Wippy.
- [Tin MCP brief](films/tin-mcp-launch/BRIEF.md) → [story / three frames](films/tin-mcp-launch/STORY.md) → [render commands](films/tin-mcp-launch/README.md). Three user answers chose MCP work, product makers and a product-focused film. Direction review came before the music preview.

These films show different stories and music choices. Reuse the render contract and tools; choose the next film's story from its own brief.
