# Describe music before selecting it

Keep one project/owner's listening notes in a JSON file outside the shared catalogue. Do not apply Hamit's taste to every customer. No ratings are needed. Ask the listener to describe the feeling, the progression, suitable stories/brands and contexts to avoid. Empty notes mean unknown, not approved.

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

`python3 tools/sound-review/build.py --index path/to/sfx/index.json --out out/sound-review --ffmpeg bin/ffmpeg` builds a local page with four actions and three candidates each. Use an existing source catalogue with `id`, `audio`, `peak_time` and `source`. Files are only read, and source/licence details are saved beside the previews. The current Kenney-based starter catalogue is supported.

Open the page and export `effect-choices.json`. The listener names the feeling and context in a short reason. `selected_effect()` in the builder resolves only an exact context and available asset. A missing choice or explicit silence returns no effect. Missing files never cause an automatic substitute. Record the selected source range, audible anchor and gain in the film's sound events. A press is not a completed task.

Add `--music-index music/library/index.json --music-root music/catalogue/mp3` to the listening-page command to include the locally downloaded tracks. The page exports descriptions directly in the shortlist format. Full tracks stay local; do not publish the generated listening folder or raw licensed audio. Missing downloads are skipped, not fetched or purchased.
