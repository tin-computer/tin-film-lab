# Read, understand, keep reading

A book illustration becomes a passage typed in ReadnType. A question checks the same passage. The answer opens on the music drop and becomes a book spread with Wippy. [Brief and sources](BRIEF.md).

| Music bars | Picture / words |
|---|---|
| 1–2 | Rabbit and a short typewriter cut. “Read by typing.” |
| 3–5 | The Alice passage advances through the real word renderer. |
| 6–7 | “Who was Alice sitting beside?” and three options. |
| 8 | “Her sister” opens on the drop, with the passage as support. |
| 9–10 | A book spread, Wippy and “Keep reading.” |

## Three frames

After the [music setup](README.md), run from the repository root:

```bash
FFMPEG="$PWD/bin/ffmpeg" node films/tin-launch/tools/render.mjs stills \
  --page films/readntype-reading-launch/src/index.html --at 1,8.9,18 \
  --w 960 --h 540 --outdir films/readntype-reading-launch/out/story
```

1. [Art opening](out/story/t0001.000.png)
2. [Reading by typing](out/story/t0008.900.png)
3. [Book and Wippy ending](out/story/t0018.000.png)

The story came from the user's existing product feedback. These frames show the selected source and can be regenerated. Review the ending and music feel before treating the preview as final.
