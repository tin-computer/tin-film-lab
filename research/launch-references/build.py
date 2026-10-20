"""Validate authored reviews and rebuild the readable tables. No model calls."""
import csv
import json
import math
import re
from collections import defaultdict
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATUSES = {"supported", "uncertain", "not checked", "not applicable"}
QUESTIONS = [f"Q{i:02}" for i in range(1, 26)]
AREA_NAMES = dict(re.findall(r"^\| (Q\d{2}) \| ([^|]+?) \|", (ROOT / "INSTRUCTIONS.md").read_text(), re.M))
assert list(AREA_NAMES) == QUESTIONS, "Instruction category table changed"
UI_GROUPS = {
    "Chat / messages": {"chat", "chat bubbles", "phone chat", "assistant chat", "chat cards", "chat prompt and response", "chat questions", "chatbot screen", "message card", "message thread", "message with action items", "messaging app", "phone messaging", "sourcing chat"},
    "Prompt input": {"prompt box", "prompt composer", "prompt input", "generation prompt", "prompt field", "assistant composer"},
    "Table / matrix": {"table", "data table", "comparison table", "data matrix", "account table", "ad table", "candidate table", "claim table", "database table", "order table", "payment table", "payroll table", "preview table", "product table", "transaction table", "visitor table"},
    "Chart": {"chart", "bar chart", "line chart", "comparison bar chart", "candlestick chart", "depth chart", "financial chart", "portfolio chart", "trading chart", "log histogram", "analytics chart", "benchmark chart", "investment chart", "market chart", "performance charts", "revenue chart", "signal chart"},
    "Timeline": {"timeline", "editing timeline", "activity timeline", "multitrack timeline", "video timeline"},
    "Form": {"form", "order form", "trade form", "trigger setup form", "approval form", "bet form", "booking form", "campaign form", "cancellation form", "connection form", "hearing test form", "login form", "payment form", "plan form", "request form", "swap form", "targeting form", "transfer form"},
    "Image / thumbnail grid": {"image grid", "thumbnail grid", "ad card grid", "media grid", "media thumbnail grid", "product gallery", "sample gallery"},
    "Progress bar": {"progress bar", "progress bars"},
    "Dialog": {"authorization modal", "error dialog", "confirmation dialog", "import dialog", "transfer dialog", "error dialog collage"},
    "Notification": {"notification", "notification card", "completion toast", "alert cards", "action notification", "activity notification", "introduction notification", "notification cards", "payment notification", "review notification", "sale notification", "status notification"},
    "Search": {"search", "search input"},
    "Code editor": {"code editor"},
    "Terminal": {"terminal"},
    "Leaderboard": {"leaderboard"},
    "Calendar": {"calendar"},
    "Map": {"map"},
    "Phone frame": {"phone shell", "phone mockup"},
    "Browser frame": {"browser shell", "browser window"},
    "Document / report": {"document", "document viewer", "report document", "spec document", "clinical note"},
    "Spreadsheet": {"spreadsheet"},
    "Video player / preview": {"video player", "video preview"},
    "Node graph": {"node graph", "node diagram", "knowledge graph"},
    "Email": {"email", "email composer"},
    "Settings": {"settings", "settings panel", "integration settings"},
    "Slider": {"slider", "budget slider"},
    "Audio waveform": {"audio waveform"},
}


def table(headers, rows):
    def cell(value):
        return str(value).replace("|", "\\|").replace("\n", " ")
    return "\n".join(
        ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
        + ["| " + " | ".join(cell(v) for v in row) + " |" for row in rows]
    )


def interval(row):
    return f"{row['start']:g}–{row['end']:g}s"


def validate(review, source):
    if review["id"] != source["id"] or review["reviewer_model"] != "gpt-6-astra":
        raise ValueError("Source/reviewer mismatch")
    if [q["id"] for q in review["categories"]] != QUESTIONS:
        raise ValueError("Expected Q01–Q25 exactly once in order")
    if not review["viewed_evidence"] or len(review["lessons"]["try"]) != 2:
        raise ValueError("Missing inspected evidence or two experiments")
    for q in review["categories"]:
        if q["status"] not in STATUSES or not all(q[k].strip() for k in ("finding", "reason", "evidence")):
            raise ValueError(f"Incomplete category {q['id']}")
    for key in ("scenes", "sound"):
        end = 0
        seen = set()
        if not review[key]:
            raise ValueError(f"Missing {key} coverage")
        previous_start = -1
        for row in review[key]:
            if (not all(isinstance(row[t], (int, float)) and math.isfinite(row[t]) for t in ("start", "end"))
                    or row["end"] <= row["start"] or row["start"] < 0
                    or row["start"] < previous_start or row["start"] > end + 0.1
                    or (key == "scenes" and abs(row["start"] - end) > 0.1)
                    or row["end"] > source["duration_seconds"] + 0.15
                    or row["id"] in seen):
                raise ValueError(f"Invalid or non-contiguous {key} interval {row}")
            end = max(end, row["end"])
            previous_start = row["start"]
            seen.add(row["id"])
        if abs(end - source["duration_seconds"]) > 0.15:
            raise ValueError(f"Incomplete {key} coverage: {end} / {source['duration_seconds']}")
    scene_ids = {r["id"] for r in review["scenes"]}
    for element in review["elements"]:
        if element["kind"] not in {"ui", "motion", "texture"} or not element["name"].strip():
            raise ValueError("Invalid element")
        if not element["events"] or not set(element["events"]) <= scene_ids:
            raise ValueError("Element needs a real scene reference")
    clear = review["product_clear_time"]
    if clear is not None and (not isinstance(clear, (int, float)) or not math.isfinite(clear) or not 0 <= clear <= source["duration_seconds"]):
        raise ValueError("Product-clear time outside film")
    for window in review.get('closer_windows', []):
        if not (0 <= window['start'] < window['end'] <= source['duration_seconds'] + 0.15
                and math.isfinite(window['rate_fps']) and window['rate_fps'] > 0
                and window['evidence'] and window['resolved'].strip()):
            raise ValueError("Invalid closer window")


def coverage(sources, reviews):
    for ident, source in sources.items():
        canonical = source.get("canonical_id", ident)
        if canonical not in sources or sources[canonical].get("canonical_id", canonical) != canonical:
            raise ValueError("Missing or chained canonical source")
    authored = {r['id'] for r in reviews}
    covered = {i for i, s in sources.items() if s.get('canonical_id', i) in authored}
    unique = [r for r in reviews if sources[r['id']].get('canonical_id', r['id']) == r['id']]
    return unique, {"sources": len(sources), "unique_edits_after_known_duplicates":
        len({s.get('canonical_id', i) for i, s in sources.items()}),
        "authored_sampled_reviews": len(reviews), "unique_edits_reviewed": len(unique),
        "source_entries_covered": len(covered), "pending_ids": sorted(set(sources) - covered),
        "validated_audio_listening_reviews": 0, "human_new_viewer_tests": 0,
        "closer_windows": sum(len(r['closer_windows']) for r in unique)}


def catalog(sources, reviews, summary, comments):
    """Small, deduplicated index for the read-only browser."""
    films, groups = [], defaultdict(set)
    for review in reviews:
        ident = review["id"]
        source = sources[ident]
        labels = set()
        for element in review["elements"]:
            if element["kind"] == "ui":
                labels.update(label for label, names in UI_GROUPS.items()
                              if element["name"].strip().lower() in names)
        for label in labels:
            groups[label].add(ident)
        films.append({
            "id": ident, "title": source["title"], "source": source["source_url"],
            "seconds": source["duration_seconds"], "product": review["product_type"],
            "scenario": review["scenario"], "lesson": review["comparison"]["lesson"],
            "elements": review["elements"], "ui": sorted(labels),
            "hamit_notes": [c for c in comments
                            if sources[c["id"]].get("canonical_id", c["id"]) == ident],
        })
    return {"coverage": summary, "films": films, "questions": AREA_NAMES,
            "ui": [{"name": name, "count": len(ids)}
                   for name, ids in sorted(groups.items(), key=lambda row: (-len(row[1]), row[0]))]}


def render(review, source):
    streams = source["media_probe"]["streams"]
    video = next(s for s in streams if s["codec_type"] == "video")
    audio = [s for s in streams if s["codec_type"] == "audio"]
    samples = source["visual_samples"]
    metadata = [
        ("Public source", f"[{source['title']}]({source['source_url']})"),
        ("Local archive file", f"videos/{source['file_name']} (not included in this repo)"),
        ("SHA256", source["sha256"]),
        ("Format", f"{source['duration_seconds']:g}s video timeline; {video['width']}×{video['height']}; {float(Fraction(video['avg_frame_rate'])):.3f} average fps; {video['codec_name']}; {len(audio)} audio stream(s)"),
        ("Review", f"20 October 2026; {review['reviewer_model']}; Watch index {source['watch_id']}"),
        ("Status", "Complete for the stated sampled picture/story scope; audio listening remains unverified"),
        ("Source check", "Recomputed file SHA256 matches Watch index"),
        ("Picture coverage", f"{samples['frame_count']} chronological 1 fps samples, {samples['first_seconds']:g}–{samples['last_seconds']:g}s; closer windows below; between-frame movement may be missed"),
        ("Audio coverage", "Local signal maps / ASR draft where present. No validated listening by this reviewer" if audio else "No audio stream in this downloaded file (ffprobe)"),
        ("Human review", "Not recorded for this pass; no new-viewer study"),
        ("Product-clear estimate", (f"About {review['product_clear_time']:g}s" if review['product_clear_time'] is not None else "Not established")
            + "; model interpretation: " + review['product_clear_basis']),
        ("Cost", "Astra host usage. Per-film billed cost unavailable; no new paid audio-analysis call in this pass"),
        ("Scope", review["scope"]),
    ]
    text = [f"# {source['id']:03} · {source['title']}",
            f"**Product from the film:** {review['product_from_film']}",
            f"**Explains well:** {review['explains_well']}",
            f"**Still unclear:** {review['unclear']}",
            "## Source and coverage", table(["Field", "Value"], metadata),
            "## Scene and motion",
            table(["Event", "Source time", "Action / motion / transition", "Text / UI / texture", "Story purpose", "Evidence / limits"],
                  [(r['id'], interval(r), r['action'], r['design'], r['purpose'], r['evidence']) for r in review['scenes']]),
            "## Sound and sync",
            table(["Event", "Source time", "Layer", "Finding", "Visual relation", "Evidence / limits"],
                  [(r['id'], interval(r), r['layer'], r['detail'], r['visual_relation'], r['evidence']) for r in review['sound']]),
            "## Category findings",
            table(["Question", "Finding", "Evidence", "Status / reason", "Experiment"],
                  [(f"{r['id']} {AREA_NAMES[r['id']]}", r['finding'], r['evidence'], f"{r['status']}: {r['reason']}", r['experiment']) for r in review['categories']]),
            "## Visible elements",
            table(["Kind", "Element", "Scenes"], [(r['kind'], r['name'], ', '.join(r['events'])) for r in review['elements']]),
            "## Lessons",
            f"- Keep: {review['lessons']['keep']}\n- Try: {review['lessons']['try'][0]}\n- Try: {review['lessons']['try'][1]}\n- Avoid: {review['lessons']['avoid']}\n- Still open: {review['lessons']['open']}",
            "## Inspected evidence",
            "Paths below are relative to the local research archive, unless stated otherwise. Images and downloaded films are not redistributed.",
            "\n".join(f"- `{p}`" for p in review['viewed_evidence'])]
    if review['closer_windows']:
        text.extend(["### Closer windows", table(["Range", "Sampling", "Finding", "Local evidence"],
            [(interval(r), f"{r['rate_fps']:g} fps", r['resolved'], ', '.join(r['evidence'])) for r in review['closer_windows']])])
    return "\n\n".join(text) + "\n"


def main():
    sources = json.loads((ROOT / "sources.json").read_text())
    source_map = {r["id"]: r for r in sources["records"]}
    reviews = []
    for path in sorted((ROOT / "data").glob("*.json")):
        review = json.loads(path.read_text())
        validate(review, source_map[review["id"]])
        reviews.append(review)
    if len({r['id'] for r in reviews}) != len(reviews):
        raise ValueError("Duplicate authored review ID")
    unique, summary = coverage(source_map, reviews)
    (ROOT / "reviews").mkdir(exist_ok=True)
    comparisons, elements = [], defaultdict(set)
    for review in reviews:
        ident = review['id']; source = source_map[ident]; c = review['comparison']
        (ROOT / f"reviews/{ident:03}.md").write_text(render(review, source))
    for ident, source in source_map.items():
        canonical = source.get('canonical_id', ident)
        if canonical == ident or canonical in summary['pending_ids']:
            continue
        path = ROOT / f"reviews/{ident:03}.md"
        independent = path.read_text() if ident in {r['id'] for r in reviews} else ''
        path.write_text(f"# {ident:03} · Same-edit copy of {canonical:03}\n\n"
            f"[Public source]({source['source_url']}) · [Canonical review]({canonical:03}.md)\n\n"
            f"This is a different encode of the same edit. See [duplicate checks](../duplicates.json). "
            f"It is counted once in the comparison and element totals. File SHA256: `{source['sha256']}`.\n\n"
            + ("An independent sampled review was already made before the duplicate was confirmed. It is kept below.\n\n" + independent if independent else
               "No separate authored review is claimed for this copy.\n"))
    for review in unique:
        ident = review['id']; c = review['comparison']
        comparisons.append([f"[{ident:03}](reviews/{ident:03}.md)", review['product_type'], review['scenario'], c['story'],
            review['product_clear_time'] if review['product_clear_time'] is not None else 'not established',
            c['motion'], c['sound'], c['texture'], c['lesson'], review['scope']])
        for item in review['elements']:
            elements[(item['kind'], item['name'].strip().lower())].add(ident)
    headers = ["Video", "Product type", "Scenario", "Story", "Product clear (s)", "Motion", "Sound", "Texture / assets", "Lesson", "Coverage"]
    (ROOT / "COMPARISON.md").write_text(
        f"# Reference comparison\n\n{len(unique)} distinct edits reviewed; {summary['source_entries_covered']} of {len(source_map)} source entries covered, including linked copies. "
        "These are creative observations, not retention results. Product-clear times are a model reading of sampled images. "
        "Audio unknowns are not absence counts.\n\n" + table(headers, comparisons) + "\n")
    with (ROOT / "comparison.csv").open('w', newline='') as f:
        writer = csv.writer(f, lineterminator="\n"); writer.writerow(headers); writer.writerows(comparisons)
    element_rows = [(kind, name, len(ids), ', '.join(f"[{i:03}](reviews/{i:03}.md)" for i in sorted(ids)))
                    for (kind, name), ids in sorted(elements.items(), key=lambda item: (item[0][0], -len(item[1]), item[0][1]))]
    common_ui = []
    for label, names in UI_GROUPS.items():
        ids = set().union(*(elements.get(('ui', name), set()) for name in names))
        if ids:
            common_ui.append((label, len(ids), ', '.join(f"[{i:03}](reviews/{i:03}.md)" for i in sorted(ids)[:8])))
    common_ui.sort(key=lambda row: (-row[1], row[0]))
    (ROOT / "ELEMENTS.md").write_text(
        f"# Observed elements\n\nCounts show films where a reviewer recorded this element, out of {len(unique)} distinct reviewed edits. "
        "Reviewers recorded useful examples, not every UI detail. An unlisted element is not proof that it was absent. Each review links to the scene. "
        "Different names are kept separate unless their meaning was checked.\n\n"
        "## Common UI elements\n\nSelected equivalent labels are grouped here; a film counts once in each row. Up to eight examples are linked per row. The exact tag list with all references remains below.\n\n"
        + table(["Element", "Films", "Example films"], common_ui)
        + "\n\n## All observed tags\n\n" + table(["Kind", "Element", "Films", "Examples"], element_rows) + "\n")
    (ROOT / "coverage.json").write_text(json.dumps(summary, indent=2) + "\n")
    comments = json.loads((ROOT / "hamit-notes.json").read_text())["records"]
    if len({c["id"] for c in comments}) != len(comments):
        raise ValueError("Duplicate user comment ID")
    for comment in comments:
        if source_map[comment["id"]]["source_url"] != comment["source_url"]:
            raise ValueError("User comment source mismatch")
    (ROOT / "catalog.json").write_text(json.dumps(
        catalog(source_map, unique, summary, comments), ensure_ascii=False) + "\n")
    print(json.dumps({**summary, "pending_ids":f"{len(summary['pending_ids'])} (see coverage.json)"}))


if __name__ == "__main__":
    main()
