"""Place the small Earshot kit on named picture frames, using measured onsets."""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
kit = json.loads((HERE / "out/kit/kit.lock.json").read_text())
cues = json.loads((HERE / "out/audio-cues.json").read_text())
sr = kit["sr"]
assert sr == 48000 and cues["fps"] == 60
stem = np.zeros((round(cues["total"] / cues["fps"] * sr), 2), dtype=np.float32)
used, placements = {}, []
for event in cues["events"]:
    role = kit["roles"][event["kind"]]
    index = used.get(event["kind"], 0)
    take = role["takes"][index % len(role["takes"])]
    used[event["kind"]] = index + 1
    audio, rate = sf.read(HERE / "out/kit" / take["file"], always_2d=True, dtype="float32")
    assert rate == sr and len(audio) and not take["checks"]
    if audio.shape[1] == 1:
        audio = np.repeat(audio, 2, axis=1)
    target = round(event["f"] / cues["fps"] * sr)
    start = target - round(take["onset_s"] * sr)
    trim = max(0, -start)
    start = max(0, start)
    count = min(len(audio) - trim, len(stem) - start)
    assert count > 0
    stem[start:start + count] += audio[trim:trim + count] * 10 ** (role["level_db"] / 20)
    placed = start - trim + round(take["onset_s"] * sr)
    assert abs(placed - target) <= 1
    placements.append({**event, "file": take["file"], "measured_onset_s": take["onset_s"],
                       "target_sample": target, "placed_sample": placed})
sf.write(HERE / "out/sfx.wav", stem, sr, subtype="PCM_24")
(HERE / "out/qa/sound-placement.json").write_text(json.dumps(placements, indent=2) + "\n")
print(f"Placed {len(placements)} effects within one sample of named picture frames")
