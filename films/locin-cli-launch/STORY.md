# A code string becomes language files

Start with one app string. The CLI turns it into a key; the music drop opens three language files with the same key. End with those files and the install command. [Brief and sources](BRIEF.md).

| Music bars | Picture / words |
|---|---|
| 1–2 | Code page and Loci. “Code → languages.” |
| 3–4 | `locin flow --full`; the string becomes `project.create`. |
| 5–6 | Three locale files unfold on the drop. |
| 7–8 | Files move into a folder and show their values. |
| 9–10 | Files remain visible. “Try the CLI.” and the install command. |

## Three frames

After the [music setup](README.md), run from the repository root:

```bash
FFMPEG="$PWD/bin/ffmpeg" node films/tin-launch/tools/render.mjs stills \
  --page films/locin-cli-launch/src/index.html --at 1,10,18 \
  --w 1280 --h 720 --outdir films/locin-cli-launch/out/story
```

1. [Opening](out/story/t0001.000.png)
2. [Language-file result](out/story/t0010.000.png)
3. [Try the CLI](out/story/t0018.000.png)

Hamit approved this direction in the brief trial. These frames can be regenerated from the selected source. A new film waits for its own direction review before rendering the full preview.
