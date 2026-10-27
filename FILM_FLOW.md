# Make a short film with the user

Use this flow for a product launch, a feature launch or a short marketing film. The agent asks questions in its coding client, saves the brief and makes the film with the lab's existing tools.

To start, ask your coding agent:

> Follow FILM_FLOW.md to make a short feature film for my product. Read the product and brand files I provided, then ask me only for the missing choices.

## 1. Read, then ask

Identify the product first. With Tin MCP, use the selected project and its product, feature and brand files; ask which project only when the selection is unclear. Locally, read the supplied project folder, wiki/INDEX.md, brand/BRAND.md, DESIGN.md and relevant product sources when available. Do not search unrelated personal folders. If no product or usable source is available, ask for the product URL or project folder before recommending features. Do not ask for facts already in the available sources.

Read the actual product purpose and supported features before recommending one. Examples elsewhere in this repo show craft, not this user's feature, audience or preferences. Reuse answers only when they belong to this product and request. Past QA scores, old plan limits and test accounts are not marketing claims; verify any claim needed for the film against current product evidence. Do not rank a feature only because it has more QA notes.

Distinguish a website claim, a feature implemented in source and a result actually seen in use. Check relevant supplied source when old notes conflict with it. A feature need not have a previous QA run to be considered, but an untested illustration must not be presented as a live result.

Read the request and sources, then start a new interactive brief with four short questions in one round, using the client's question tool when available. Tailor the wording and suggestions to this product:

1. The feature or customer moment the viewer should understand; include an unknown audience or purpose only when it matters.
2. The story: two concrete alternatives and a short recommendation, with room for the user's own idea.
3. The filming approach and delivery: a relevant visual choice, with unknown platform, format or duration when needed.
4. The sound: how speech, music or practical sound carries the story; include a conditional caption preference when speech is considered.

Reuse known answers. If one area is settled, use its question for another meaningful creative choice rather than asking for the same facts again. A completed brief, a revision with clear feedback or a delegated one-shot needs no repeated onboarding. Do not invent filler questions to reach four when all decisions are already supplied.

Ask for an owner's insight the sources cannot provide: a recognisable customer moment, a common misunderstanding, a real example or the feeling the film should leave. Use the product's words. If choices help, offer two genuinely different story ideas, not a list of features or “art / UI / mixed” packages. Allow a free answer. Choose only the relevant question; these examples are not a script:

- Tone-aware translation: “Should the story turn on a translation that is correct but sounds unlike your brand, or on recognising the same voice across languages?” A real phrase can make either direction more specific.
- A reading challenge: “Is the moment worth showing the dare from a friend, or the surprise that reading faster is not enough to win?”
- Remote agent messaging: “What would you most want to ask your agent at the exact moment you have left your desk?”

Ask about the audience only if different plausible viewers would need different explanations. Ask about the platform only if an unknown delivery requirement would change the composition. Reuse supplied format, duration, references and previous answers for this request. A conversion action or CTA is optional; do not invent one for every film.

Do not ask users to direct every production detail. Avoid routine questions such as “Do you want effects?”, “What should we remove?” or a checklist of fonts, music, textures and transitions. A user may supply any of these preferences, and an explicit limit must be followed. Otherwise choose the sound, composition and pacing that serve this particular story. Music alone, effects alone, room sound and silence are all valid. Available effects do not mean effects are wanted.

Before coding a new film, resolve who or what carries the explanation. If it is unanswered and would change the story, include one sound question in the same short round: for example, “Should a person explain why this translation feels wrong, or should we discover it through the customer's reaction?” A narrator, dialogue, music-led action and practical sound are different story choices, not optional polish added after animation. Do not turn an omitted answer into “no voice”. If the user delegates direction or requests unattended work, choose and record the reason. Reuse a clear answer for revisions; do not ask again on every render. Use a supplied authorised recording when available; if a chosen voice needs unavailable tools or permission, report that before promising a voiced film. Do not buy voice generation or copy a reference speaker.

After the answers, continue through the finished preview. Save agent choices as agent choices, not user answers. For an explicit one-shot or unattended request, make reasonable creative choices and do not interrupt with a concept menu or three-frame approval. Stop only for missing product evidence, a true access problem or an action needing separate permission. Use staged approval when the user asks for it.

Keep the question round short. Leave audit history, source citations, QA tables and long brand descriptions in the brief. If the product itself is unknown, ask only for its URL or folder. State an access problem once and try an available read-only alternative before asking the user to supply the same source.

### Describe choices without archive knowledge

Read [story and scene directions](STORY_DIRECTIONS.md) before suggesting a direction or writing scenes. Keep the user's requested structure, including problem/solution, before/after and a direct feature demonstration. The eight story moves and six filming approaches are starting points; accept combinations and new ideas. A complete or delegated brief needs no extra menu.

When direction is open, offer two product-specific ideas with a short recommendation. Each option describes what happens, how we see it and how sound helps; keep it short enough for the four-question onboarding round. Choose routine camera, material and sound details as agent decisions. Ask about filming only when a missing preference would change the story. Do not send the pool's internal labels or ask customers to identify with a generation. Carry the chosen action and result into the brief, shot plan and rendered review.

Read the relevant [film lessons](FILM_LESSONS.md) and this product's previous feedback first. Form ideas from the actual product before looking for examples. Use the reference archive only when it can answer a specific story, movement or sound question. Do not make an archive clip or stock montage the default suggestion.

Keep reference brands, IDs and internal filenames out of onboarding choices. Describe the visible event and its meaning in everyday words. “The table gains a column, then the report uses it” is understandable without “Krea ref 011”. Product evidence still has to support the action. If the user asks for examples, offer a working source link or permitted preview with a short explanation; knowing the reference is never a prerequisite to answering.

When alternatives are useful, consider one built directly from the product with no archive template. Compare events, viewpoint and the order of discovery. Different textures on the same sequence are not different ideas. Choose the clearest fit, including a direct demonstration when appropriate. A complete brief does not need a new choice menu.

## 2. Save the brief

Create `films/<film-name>/BRIEF.md` before writing animation code. Keep it short:

| Field | Save |
|---|---|
| Product / feature | The single promise shown by this film. |
| Viewer / purpose | Who watches and what they should understand. Add a next action only when needed. |
| Format | Platform, seconds, aspect ratio and preview size. |
| Story | Who acts, what gets in the way or raises a question, what the product does and the visible result. Record who chose this direction and why. |
| Filming / sound | How framing, movement, materials, characters, speech and music support that story; include supplied style and reference choices. Record user choices separately from agent decisions. |
| Facts / assets | Sources for claims, commands, UI and images; which parts are authored examples. |
| Review | User choices, approved direction and later changes; assumptions marked separately. |

Pick music from `music/library/LIBRARY.md`, using the user's track when supplied. Follow [listening notes and effect choices](music/LISTENING_NOTES.md): human descriptions explain feeling and brand/story fit; they are not ratings. Resolve voice versus product action with music when it changes the story and the user has not answered or delegated it. Never silently omit requested narration. Read the track map and use `music/tools/cut.py` to produce `music-cut/CUE.md` and `cue.js`. Plan the largest result on a suitable music hit. Record the choice in the brief; do not force every film onto the same track or style.

Read any supplied owner listening notes before selecting sound. Record the note file in the brief. Pass explicit whole-track rejections through `--avoid`; a contextual word matcher cannot interpret every natural-language “do not use” note. A positive note makes a track a candidate for that owner, not an automatic choice for all films. Never import another customer's taste.

## 3. Show the story and three real frames

### Choose the ending before animating

Write what the viewer should remember and what stays on the final frame. Make the final frame readable as a still at 360 px wide. Keep one main focus: a useful result, the brand, or one short message. An address is optional. Do not stack a heading, subheading, subtitle, command and domain. There is no required end-card template or CTA.

A logo-only shot reads as a finish. Do not put it between completed product work and another important action. Carry the product action into its result, then finish. Keep the last few seconds intentional; do not pad a finished story to fill music bars.

Do not format authored promotional copy as disconnected words or claims separated by middle dots or bullets, such as “domain · free in open beta” or “Fast . Free”. Use one short natural sentence, or remove the extra claim. Remove decorative eyebrow labels such as “illustrated example” and “example session”. Preserve punctuation in code, URLs, real product controls and required disclosures.

### Use real interface evidence

For a recognisable interface such as YouTube, iMessage, WhatsApp or the product itself, verify its current appearance during this film's research. Use Google/web image search to find the relevant official product page, help page or recent screenshot, then open and inspect the source image. A search thumbnail, date filter or model memory alone does not establish the current UI. Prefer a current capture of the real application when available. Match the depicted device, web/app version, language, theme and signed-in state; do not mix mobile controls with a desktop layout. A platform mentioned only in dialogue or copy needs no UI capture unless its interface is shown. Record the source URL, capture/access date and depicted state with the local reference image. If needed, build the available product repo locally with safe test data and capture the real screen. Keep the UI version and source URL/commit with the image. A public landing screen does not prove the layout or behaviour of a signed-in feature.

Compare the same UI version and state side by side: layout, type, spacing, controls, icons, message direction, colour and state changes. For message apps, inspect the header, back control, sender identity, bubble shape/tail, delivery labels and composer. Cropping and staging may simplify a scene; changing product behaviour may not. No invented “95% accurate” score. A vision model can flag confusing states or layout problems from these same frames, but its judgement is another review, not proof. If evidence is missing, record that exact scene as unverified and ask for the missing view instead of inventing it. Do not add an on-screen disclaimer to cover a false action.


Write `STORY.md` from the brief's chosen story and filming decisions: one short story and a table of shots, their times/music bars, visible action and result, framing/movement, sound and on-screen words. Show how each handoff leads to the next action. Link every factual claim to the brief. Keep text short and let the pictures carry the feature. If the planned treatment is unavailable, choose a feasible treatment that preserves the user's intent; ask only when the change would alter an agreed direction.

Build `src/index.html` with `window.FILM` and a pure `window.seek(t)`. Reuse `films/tin-launch/tools/lib/motion.js` and `music/tools/music.js`.

Render three frames with `films/tin-launch/tools/render.mjs stills`: the opening, the product result and the ending. Put them in `out/story/`, inspect them and link them from `STORY.md`.

Inspect the story and frames internally. Show them and wait when the user asked for staged review; otherwise continue to the preview. Carry existing approval forward; do not ask for it twice.

## 4. Make and review a music preview

After the internal story check, or direction approval when requested, render a small full-motion preview with the existing renderer and mixer. Use the music grid for main reveals and state changes. Reuse real product material when useful, and record authored examples in the brief and delivery notes.

Use `tools/sheets.sh` from `films/tin-launch/` for a contact sheet, a phone sheet and strips around fast transitions. Inspect the pictures. Check missing assets, text fit, repeated-frame behaviour, audio mix and the complete video decode. Save the results and the few issues worth fixing in the film's README.

Run the shared review before delivery:

```sh
node review_frames.mjs --page films/example/src/index.html --fps 30 --outdir films/example/out/frame-review
```

New films declare ordered `FILM.scenes` with `name`, `from`, `to` covering the whole duration. Mark only the final scene `kind: "closing"`; use `kind: "product"` for real UI. Attach a reference as `{image: "refs/screen.png", source: "https://official-source/page", captured_at: "YYYY-MM-DD"}` relative to the HTML. The reference image must be local to this checkout. Events retain the existing named times and one `role: "result"`.

The review checks every source frame for text overflow, treats code/pre blocks as strict without opt-in, and catches invalid scene order. Mark authored prose with `data-film-copy`; dot-separated labels and known production labels are review warnings, not bans on real UI text. Intentional clipping needs a named reason with `data-film-review-ignore` and stays visible in the report.

Open the generated `index.html`. Inspect every scene's start, middle and end; event frames before/at/after; and the final two seconds at phone width. Reference images appear beside their scene. Repair overflow, overlaps, unsupported actions and confusing handoffs, then rerun. Use the existing contact-sheet tool on the encoded MP4 as well: source checks cannot prove the final encoding is correct. A technical check never approves the story, interface fidelity or listening. Keep those three results separate in the film README, with timestamps and remaining limits. Do not hide warnings to obtain a green report.

Compare the encoded preview with the brief and shot plan: does the opening invite attention, can a new viewer name the product action and result, and do movement and sound explain those events? Check that any joke or physical metaphor leads back to the supported product behaviour. Record what was actually inspected and any unresolved clarity or listening issue. Changing a style name or passing timing checks is not proof of a better story.

For sound, use the measured waveform and selected cut to align important actions. Do not place every action on a beat. Preserve silence and intelligible voice. Reuse existing Cinetic/Earshot reviews when installed; their metrics cannot choose emotional fit or replace human listening.

Share the actual music preview. The user's visual and sound feedback is separate from the automated checks. Fix the reported issues, render the affected parts again and update the brief when the direction changes.

## 5. Deliver the selected film

For staged review, render at the agreed size and frame rate after the user accepts the preview. For a one-shot request, include that output in the same run. Keep the whole picture when adding audio. Check the full decode and final transitions. Save setup/render commands, source records, test results and limits in the README.

Verify a fresh checkout can restore the inputs and render. Commit only the selected sources and redistributable assets; keep downloaded music, intermediate frames and logs out of Git. Commit, push or open a PR when requested.

## Learn from the trial

Treat each onboarding and preview as a chance to test the flow. Use the short feedback row in [FILM_LESSONS.md](FILM_LESSONS.md) inside the existing film review. Record what the user said, the exact question/scene changed and the next observed result. Keep a pending result pending until it has been checked. Read relevant unresolved feedback before starting another film. Save general lessons separately from owner-specific taste; do not reuse a personal rejection or preference for every customer.

## Working examples

- [LocIn CLI brief](films/locin-cli-launch/BRIEF.md) → [story / three frames](films/locin-cli-launch/STORY.md) → [render commands](films/locin-cli-launch/README.md). Three user answers chose the feature, action and art direction.
- [ReadnType reading brief](films/readntype-reading-launch/BRIEF.md) → [story / three frames](films/readntype-reading-launch/STORY.md) → [render commands](films/readntype-reading-launch/README.md). Existing feedback chose reading and comprehension, then the book ending with Wippy.
- [Tin MCP brief](films/tin-mcp-launch/BRIEF.md) → [story / three frames](films/tin-mcp-launch/STORY.md) → [render commands](films/tin-mcp-launch/README.md). Three user answers chose MCP work, product makers and a product-focused film. Direction review came before the music preview.

These films show different stories and music choices. Reuse the render contract and tools; choose the next film's story from its own brief.
