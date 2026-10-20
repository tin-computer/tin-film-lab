"""Local review of an encoded film. Models stay warm across the four reports.

python tools/earshot/review.py film.mp4 out/earshot --cues out/cues.json
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

os.environ.setdefault("EARSHOT_THREADS", "3")
os.environ.setdefault("EARSHOT_OFFLINE", "1")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("out", type=Path)
    parser.add_argument("--cues", type=Path)
    args = parser.parse_args()
    if not args.video.is_file() or (args.cues and not args.cues.is_file()):
        parser.error("Video and optional cues must be local files")
    from earshot import api, __version__
    from earshot.report import to_json

    args.out.mkdir(parents=True, exist_ok=True)
    result = {"source": str(args.video.resolve()), "sha256": hashlib.sha256(args.video.read_bytes()).hexdigest(),
              "earshot": __version__, "status": "incomplete", "human_listening": False,
              "limits": "Sound labels are model estimates. The reference profile does not judge taste or story clarity."}

    def save(name, value):
        (args.out / (name + ".json")).write_text(to_json(value) + "\n")

    stage = "measure"
    try:
        measure = api.measure(str(args.video), music=True)
        save("measure", measure)
        stage = "timeline"
        timeline = api.timeline(str(args.video), cues=str(args.cues) if args.cues else None, detail="normal")
        save("timeline", timeline)
        (args.out / "timeline.txt").write_text(timeline["text"] + "\n")
        stage = "sheet"
        save("sheet", api.sheet(str(args.video), str(args.out / "sheet.png"), tl=timeline))
        stage = "critique"
        critique = api.critique(str(args.video))
        save("critique", critique)
        if hashlib.sha256(args.video.read_bytes()).hexdigest() != result["sha256"]:
            raise RuntimeError("Source changed during review; finish rendering and run the review again")
        result.update(status="complete", measure=measure, sync=timeline.get("sync"),
                      summary=timeline.get("summary"), critique=critique.get("summary"))
    except Exception as exc:
        result.update(failed_stage=stage, error=f"{type(exc).__name__}: {exc}")
        raise
    finally:
        save("review", result)
    print(json.dumps({"status": result["status"], "source": result["source"], "reports": str(args.out)}))


if __name__ == "__main__":
    main()
