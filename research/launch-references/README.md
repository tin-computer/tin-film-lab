# Launch reference review

The sampled visual and story review covers all 460 source entries: 458 distinct edits after two known same-edit copies. Three GPT-6 Astra agents used the 25-question guide, chronological frames and 107 closer motion windows. Audio listening and new-viewer tests remain open. See [coverage.json](coverage.json) for the exact counts.

Start here:

- [Reference browser](index.html): search films, filter recorded UI elements, and read scene notes alongside Hamit's original comments
- [Comparison table](COMPARISON.md): the story, product clarity and useful choices in each reviewed film
- [Observed elements](ELEMENTS.md): UI, motion and texture examples with source scenes
- [Feature-film rules](WORKFLOW_RULES.md): specific choices to try in the film-lab workflow
- [Method and limits](METHOD.md): what was inspected, how sound uncertainty is handled, and what the counts mean
- [Review instructions](INSTRUCTIONS.md): the 25 questions used for each report
- [Claude's earlier study](claude-measurements/README.md): 78 saved measurements, recalculated aggregates and a correction to the old speech claim

## Open the browser

From this directory, run `python3 -m http.server 8766 --bind 127.0.0.1`, then open `http://127.0.0.1:8766`.
It is a local, read-only page, with no build step or external service. GitHub displays the Markdown tables; it does not run the HTML page.

[hamit-notes.json](hamit-notes.json) preserves 46 earlier user comments in their original language. They are separate from Astra's observations. Claude's corpus is also separate; its overlap with this archive is unknown, so the counts must not be added.

Every individual report has a short summary followed by timed tables. Notes are written in English. Source films, third-party assets, API keys and raw private work files are not bundled. Use the public source URLs and hashes in [sources.json](sources.json) to identify the reference.

## Use this for a new film

1. Find a similar **task** in the comparison table, then read two or three linked reports. A matching product category alone is not enough.
2. Pick a specific scene mechanism: what stays the same, what changes and what the viewer learns. Check the source moment before copying its timing.
3. Use the feature-film rules to write the brief and review the new render. The archive's sound gaps stay open; choose and listen to the new film's actual music and effects.

Rebuild from this directory after editing an authored JSON report:

```bash
python3 -m unittest -q test_build.py
python3 build.py
```

These commands validate and format existing findings. They do not watch a film or generate creative observations.
