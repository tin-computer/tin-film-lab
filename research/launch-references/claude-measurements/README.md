# Claude's earlier measurements

This is a checked summary of Claude's saved 15 October study: **78 films**, with 55 horizontal and 23 vertical uploads. The source files came from `shortform/research/data/` in the separate Claude checkout. This import does not change that checkout.

The aggregate numbers below were recalculated on 20 October from [corpus.csv](corpus.csv) and [grid_lift.json](grid_lift.json). [audit.json](audit.json) records the source hashes and limits. The original films were not reprocessed in this check.

| Median measurement | Horizontal · 55 | Vertical · 23 |
| --- | ---: | ---: |
| Length | 55.8s | 27.4s |
| Candidate cuts per minute | 6.2 | 11.8 |
| First candidate cut | 4.80s | 2.88s |
| Large-text words per sampled frame | 2.28 | 0.34 |
| Sampled frames without large text | 45% | 83% |

## What these numbers mean

- Cuts use FFmpeg's scene score above 0.32 on a 320px copy. Flashes can count; gradual changes can be missed.
- OCR was sampled at 2 fps. A line at least 4.5% of frame height counted as large text. This does not reliably separate product text from a headline.
- The small-label-over-headline detector flagged 24 films in more than 5% of their sampled frames. These are candidates, not 24 confirmed design mistakes.
- The saved beat comparison covers 37 films with at least six candidate cuts. The median measured alignment relative to a random baseline is 0.86; four reach at least 1.5. Beat detection can select half or double tempo. This does not prove a film feels badly timed.

## Correction to the original report

The old exporter treated missing YouTube captions as zero spoken words. **Missing captions do not mean no speech.** We do not carry forward its “half the films use no voice” conclusion. The `speech_wpm` column is preserved as raw historical data, with that limitation.

We also do not claim that silent autoplay loses nothing, that one format is universally better, or that these styles cause more views. Audience, brand and length vary.

## Useful experiments

Try shorter copy and one clear product action. Compare the same action in two formats, then check readability and the actual soundtrack. These are ideas to test, not rules proved by the sample.

This set has not been deduplicated against the 460-entry Astra archive. **Do not add 78 to 460.** Source IDs in the CSV identify public YouTube pages: `https://www.youtube.com/watch?v={id}`. The shared package contains data and notes, not downloaded films or music.
