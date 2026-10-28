# Fresh and archive stock discovery — 28 October 2026

## Initial search result

- Pexels MCP was cloned outside this repo and compiled. It was not registered or connected: new API keys are paused and no existing key was available. The initial dependency audit found eight advisories; compatible updates left one high Zod advisory. Do not enable this installation without resolving and testing it.
- Reused the existing `assets/tools/assets.mjs` from the full film-lab checkout. No new search service was written.
- Three live, keyless searches returned 12 candidates from Commons and Internet Archive. These are search candidates, not 12 approved stock clips. Some matches are unrelated; archive advertising clips need special care around brands and underlying material.
- One printing-press preview downloaded successfully (854×480, about 16 seconds). Full decoding was not checked: FFmpeg was not available on this shell PATH. This proves download access only, not visual quality or final-film approval. Source and credit are saved in the local download folder. Use a higher-resolution rendition for a final film.
- Historical footage is available, including The Book Witch (1905). The existing local stock catalogue stays available too. The launch-reference collection is for research, not automatic reuse.

The later visual and decode results are in [the stock review](../../tools/stock-review/README.md). They supersede the initial download-only status above.

## Selection steps for each film

1. Write the scene's action, purpose, framing and light. Search two or three concrete query variations, not a generic technology background.
2. Search new material with the existing tool. Use Commons for specific actions; use Archive when historical footage fits. Also search saved stock notes with `assets/tools/find.py`. If those files are missing in a sparse checkout, restore the tracked asset tools or use the full checkout; do not pretend that search ran.
3. Compare a few candidates by viewing the clip, not its title alone. A poster or sampled frames cannot establish every motion or sound.
4. Confirm the original file's licence, creator, attribution, edit rights and intended commercial use. Prefer CC0/public-domain or CC BY when its credit can be supplied. Reject unclear, restricted, noncommercial and unsuitable editorial material. Public-domain labels still need source review; logos and people can add restrictions.
5. Check source IDs and hashes against earlier film source records. Prefer an equally suitable unused clip; allow reuse when the user asks or it is clearly the better fit. This is an agent procedure, not a new automatic global reuse index.
6. Download only selected previews and originals. Record source URL, licence URL/date, creator, used range and hash in the film's asset notes. Keep raw media out of Git unless redistribution is permitted.
7. If no suitable free candidate exists, use real product capture or authored motion. Do not silently pay or use an unrelated stock clip.

## Reproduce

```sh
node assets/tools/assets.mjs 'printing press' --video --source commons --license pd,cc0,by --limit 4 --json
node assets/tools/assets.mjs 'reading book' --video --source commons --license pd,cc0,by --limit 4 --json
node assets/tools/assets.mjs 'city street' --video --source archive --license pd,cc0,by --limit 4 --json
```

## Candidates — metadata only, not cleared for a film

| Query | Candidate | Reported licence |
|---|---|---|
| city street | [Classic Television Commercials (Part VI)](https://archive.org/details/ClassicT1948_6) | public domain |
| city street | [Skateboard Sense](https://archive.org/details/skateboard_sense) | public domain |
| city street | [Classic Television Commercials (Part II)](https://archive.org/details/ClassicT1948_2) | public domain |
| city street | [Ask Me, Don't Tell Me](https://archive.org/details/AskMeDon1961) | public domain |
| printing press | [The 910 ton printing presses at the Las Vegas Review-Journal were the largest in the world when installed in 2000](https://commons.wikimedia.org/wiki/File:The_910_ton_printing_presses_at_the_Las_Vegas_Review-Journal_were_the_largest_in_the_world_when_installed_in_2000.webm) | CC BY 4.0 |
| printing press | [3D printing team collaborates with 8th SFS to build drones from scratch (1002197)](https://commons.wikimedia.org/wiki/File:3D_printing_team_collaborates_with_8th_SFS_to_build_drones_from_scratch_(1002197).webm) | public domain |
| printing press | [Teleprinter: automatic printing](https://commons.wikimedia.org/wiki/File:The_electric_teleprinter_Automatik_Lo_133.webm) | CC BY 3.0 |
| printing press | [Demonstration of printing press](https://commons.wikimedia.org/wiki/File:Demonstration_of_printing_press.webm) | CC0 |
| reading book | [Giuseppe Mazzini State Middle School Book Reading (992225)](https://commons.wikimedia.org/wiki/File:Giuseppe_Mazzini_State_Middle_School_Book_Reading_(992225).webm) | public domain |
| reading book | [Tim Hofman in Nijmegen voor dichtbundel](https://commons.wikimedia.org/wiki/File:Tim_Hofman_in_Nijmegen_voor_dichtbundel.webm) | CC BY 3.0 |
| reading book | [Vermin Supreme Crashes HillaryTour Concord 15-24](https://commons.wikimedia.org/wiki/File:Vermin_Supreme_Crashes_HillaryTour_Concord_15-24.webm) | CC BY 3.0 |
| reading book | [The Book Witch (1905)](https://commons.wikimedia.org/wiki/File:The_Book_Witch_(1905).webm) | public domain |

Official Pexels access status: https://help.pexels.com/hc/en-us/articles/900004904026-How-do-I-get-an-API-key
