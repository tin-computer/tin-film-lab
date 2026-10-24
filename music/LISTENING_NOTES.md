# Describe music before selecting it

Keep one project/owner's listening notes in a JSON file outside the shared catalogue. Do not apply Hamit's taste to every customer. No ratings are needed. Ask the listener to describe the feeling, the progression, suitable stories/brands and contexts to avoid. Empty notes mean unknown, not approved.

The listening page offers multiple checkboxes for feeling, beginning, development, ending and launch type. All start unchecked; any group can stay unanswered. Extra feeling notes and exclusions are optional. Each track's choices open below its player.

Imported tracks open automatically. Old free-text notes appear first, above the checkbox groups, and the page moves to the first imported track. The import count/errors sit beside the music import field. Music-note files selected in the effect import field are routed to the music section too.

Exports keep `feeling`, `progression`, `use_with` and `avoid_with` for the existing shortlist. `selections` also preserves the five separate checkbox lists and `notes` preserves the optional text. Partial reviews are valid; a completely empty track is not exported. Original free-text exports import into a visible “Önceki serbest notların” area and export with their attribution. Never turn old prose into checked options automatically. A `legacy` object keeps that prose separate so repeated imports do not duplicate generated descriptions. Unrecognised saved checkbox values stay available as extra choices.

Format (the example below describes an imaginary track, not a library judgement):

```json
[
  {
    "id": "catalogue-track-id",
    "listener": "Person who listened",
    "feeling": "Quiet and curious, then confident",
    "progression": "Sparse opening, percussion arrives, short finish",
    "use_with": ["calm technology", "clear reveal"],
    "avoid_with": ["urgent warning", "holiday campaign"]
  }
]
```

Use the same language for the search and notes. `avoid_with` labels are explicit contexts: a matching phrase excludes the track. This is word matching, not an understanding of music. Review the returned description against the brand and story before choosing. Never interpret a negated phrase as permission to use a track. Seasonal/comic associations need an explicit fit with the brief.

```sh
python3 music/tools/shortlist.py "quiet percussion" --context "calm technology" --seconds 24 --notes path/to/listening-notes.json
```

With `--context`, tracks without human descriptions cannot fill the shortlist. If no track fits, request descriptions for new candidates. Without `--context`, results are discovery candidates only. The note file stays separate from generated timing maps, so rebuilding the music index does not erase human descriptions. Supplied track choices still win. Read the waveform and map after choosing a fitting track; neither BPM nor beat alignment proves emotional fit.

# Choose effects in context

`python3 tools/sound-review/build.py --index path/to/sfx/index.json --out out/sound-review --ffmpeg bin/ffmpeg` builds a local page with four actions and up to twelve candidates each. Use an existing source catalogue with `id`, `audio`, `peak_time` and `source`. Files are only read, and source/licence details are saved beside the previews. The current Kenney-based starter catalogue is supported.

Open the page and export `effect-choices.json`. The listener names the feeling and context in a short reason. `selected_effect()` in the builder resolves only an exact context and available asset. A missing choice or explicit silence returns no effect. Missing files never cause an automatic substitute. Record the selected source range, audible anchor and gain in the film's sound events. A press is not a completed task.

Add `--music-index music/library/index.json --music-root music/catalogue/mp3` to the listening-page command to include the locally downloaded tracks. The page exports descriptions directly in the shortlist format. Full tracks stay local; do not publish the generated listening folder or raw licensed audio. Missing downloads are skipped, not fetched or purchased.

To use the wider existing asset catalogue, add `--catalogue path/to/catalogue.json --asset-root path/to/its/repository`. Effect records use `kind: "effect"`, `id`, `family`, `source_file` and `source`. The starter IDs remain stable for earlier saved choices. New alternatives are grouped by source family and require listening before choosing.
