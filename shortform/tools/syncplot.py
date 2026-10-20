"""Plot a film's events over its music waveform, and score how tightly they sit on the music.

    node shortform/tools/events.mjs --page films/x/src/index.html > films/x/out/events.json
    python shortform/tools/syncplot.py films/x/music-cut films/x/out/events.json films/x/out/sync.png

Top lane: the cut's waveform with bar lines (solid) and beats (dotted). Middle: the measured onset
envelope with the transients `sync.js` can land on. Bottom: one tick per film event, coloured by kind.
Prints, per kind, the median distance to the nearest beat and to the nearest transient. Timing
evidence only: the mix still needs a listening pass.
"""
import json, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

cut, ev_path, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
cue = json.loads((cut / "cue.json").read_text())
events = json.loads(ev_path.read_text())
y, sr = sf.read(cut / "music.wav")
if y.ndim > 1:
    y = y.mean(1)
t = np.arange(len(y)) / sr
env = cue["envelope"]; fps = env["fps"]
on = np.array(env.get("onset") or env["all"]); te = np.arange(len(on)) / fps
beats = np.array(cue["beats"]); bars = np.array(cue["downbeats"])

# transients: local maxima of the onset envelope that stand out (same idea as sync.js)
peaks = [i for i in range(1, len(on) - 1) if on[i] >= on[i - 1] and on[i] >= on[i + 1] and on[i] - on[max(0, i - 6):i + 7].min() > 0.08]
pt = te[peaks]

kinds = sorted({e["kind"] for e in events})
colors = dict(zip(kinds, plt.cm.tab10.colors))
fig, ax = plt.subplots(3, 1, figsize=(16, 6), sharex=True, gridspec_kw={"height_ratios": [3, 2, 1.4]})
step = max(1, len(y) // 20000)
ax[0].fill_between(t[::step], y[::step], -y[::step], color="#444", lw=0)
ax[1].plot(te, on, color="#5270FF", lw=1); ax[1].plot(pt, on[peaks], "o", ms=3, color="#5270FF")
for a in ax:
    for b in beats: a.axvline(b, color="#bbb", lw=0.5, ls=":")
    for b in bars: a.axvline(b, color="#888", lw=0.9)
for e in events:
    ax[2].axvline(e["t"], color=colors[e["kind"]], lw=2)
ax[2].set_yticks([]); ax[1].set_yticks([]); ax[0].set_yticks([])
ax[2].legend(handles=[plt.Line2D([], [], color=colors[k], lw=3, label=k) for k in kinds], ncol=len(kinds), loc="upper center", fontsize=8, frameon=False)
ax[0].set_title(f"{cue['track']['title']} · {cue['bpm']:.1f} BPM · {cue['length']:.2f} s", loc="left", fontsize=10)
ax[2].set_xlabel("film seconds"); ax[2].set_xlim(0, cue["length"])
fig.tight_layout(); fig.savefig(out, dpi=110)

grid = np.sort(np.concatenate([beats, beats + cue["beat"] / 2]))
print(f"{'kind':10s} {'n':>3s} {'to 8th grid ms':>15s} {'to transient ms':>16s}")
for k in kinds:
    ts = np.array([e["t"] for e in events if e["kind"] == k])
    dg = np.median([np.min(np.abs(grid - x)) for x in ts]) * 1000
    dp = np.median([np.min(np.abs(pt - x)) for x in ts]) * 1000 if len(pt) else float("nan")
    print(f"{k:10s} {len(ts):3d} {dg:15.1f} {dp:16.1f}")
print("wrote", out)
