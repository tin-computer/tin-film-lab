"""Find contrasting mapped music candidates; this is metadata search, not a listening review."""

import argparse
import json
from math import isfinite
from pathlib import Path
import re


def words(value):
    return set(re.findall(r"\w+", value.casefold()))


def direction(track):
    if track.get("timing_mode") == "free":
        return "source seconds; no reliable beat grid"
    if "build" in words(track.get("structure", "")):
        return "mapped build section"
    return "mapped pulse; no build section labelled"


def shortlist(tracks, query, seconds, avoid=(), limit=3, notes=(), context=""):
    if not isfinite(seconds) or seconds <= 0 or limit < 1:
        raise ValueError("Seconds and limit must be positive")
    terms, pool = words(query), []
    avoid_ids = {str(value) for value in avoid}
    context_words = words(context)
    descriptions = {str(note['id']): note for note in notes}
    for track in tracks:
        if str(track["id"]) in avoid_ids or track["duration"] < seconds:
            continue
        note = descriptions.get(str(track['id']))
        # These are saved human descriptions, not model-inferred feelings or ratings.
        if context_words and not note:
            continue
        if note and any(words(label) <= context_words for label in note['avoid_with']):
            continue
        description = " ".join([note['feeling'], note['progression'], *note['use_with']]) if note else ""
        hits = terms & words(" ".join([track["title"], *track.get("tags", []), description]))
        if terms and not hits:
            continue
        context_hits = context_words & words(description)
        if context_words and not context_hits:
            continue
        pool.append((track, hits, context_hits))
    pool.sort(key=lambda item: (-len(item[2]), -len(item[1]), str(item[0]["id"])))
    selected, directions = [], set()
    # Offer different labelled structures before repeating one; the agent still chooses by story and sound.
    for item in pool:
        label = direction(item[0])
        if label not in directions:
            selected.append(item)
            directions.add(label)
            if len(selected) == limit:
                break
    for item in pool:
        if len(selected) == limit:
            break
        if item not in selected:
            selected.append(item)
    return [{
        **{key: track.get(key) for key in ("id", "dir", "title", "author", "tags", "duration", "timing_mode",
                                      "bpm", "grid", "ear_review", "structure", "first_drop_t")},
        "listening_note": descriptions.get(str(track['id'])),
        "matched_context": sorted(context_hits),
        "direction": direction(track), "matched_terms": sorted(hits),
        "map": f"music/library/{track['dir']}/MAP.md",
        "source": track.get("source", {"provider": "Mixkit", "track_id": track["id"],
                                        "license": "Mixkit Stock Music Free License"}),
    } for track, hits, context_hits in selected]


def load_notes(path):
    notes = json.loads(path.read_text())
    if not isinstance(notes, list):
        raise ValueError('Listening notes must be a list')
    seen = set()
    for note in notes:
        if not isinstance(note, dict) or type(note.get('id')) not in (str, int):
            raise ValueError('Each listening note needs a catalogue ID')
        key = str(note['id'])
        if not key.strip() or key in seen:
            raise ValueError('Listening note IDs must be nonempty and unique')
        seen.add(key)
        for field in ('listener', 'feeling', 'progression'):
            if not isinstance(note.get(field), str) or not note[field].strip():
                raise ValueError(f'{key}: missing {field}')
        for field in ('use_with', 'avoid_with'):
            if not isinstance(note.get(field), list) or any(not isinstance(v, str) or not words(v) for v in note[field]):
                raise ValueError(f'{key}: {field} must contain nonempty context labels')
    return notes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", help="Short English music words from the catalogue; not a product name")
    parser.add_argument("--seconds", type=float, required=True)
    parser.add_argument("--avoid", nargs="+", default=[], help="Rejected or recently used track IDs")
    parser.add_argument("--previous", type=Path, nargs="+", default=[], help="Previous films' music-cut/cue.json files")
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument('--notes', type=Path, help='Human listening descriptions exported from the sound review page')
    parser.add_argument('--context', default='', help='Brand/story words, in the same language as the notes')
    parser.add_argument('--index', type=Path, default=Path(__file__).resolve().parents[1] / 'library/index.json')
    args = parser.parse_args()
    try:
        if not args.query.strip():
            raise ValueError("Supply music search words")
        avoid = set(args.avoid)
        for path in args.previous:
            previous = json.loads(path.read_text())
            track_id = previous["track"]["id"]
            if type(track_id) not in (int, str) or not str(track_id).strip():
                raise ValueError(f"{path}: expected a track ID")
            avoid.add(str(track_id))
        if args.context and not args.notes:
            raise ValueError('--context needs --notes; do not invent listening descriptions')
        notes = load_notes(args.notes) if args.notes else []
        candidates = shortlist(json.loads(args.index.read_text()), args.query, args.seconds, avoid, args.limit, notes, args.context)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f"Cannot select music: {error}\n")
    warnings = []
    if len(candidates) < args.limit:
        warnings.append("Too few matching tracks; change the search words or find a licensed new source. No rejected track was reintroduced.")
    if len({row["direction"] for row in candidates}) < len(candidates):
        warnings.append("Some candidates have the same labelled structure; compare actual cuts before claiming variety.")
    print(json.dumps({
        "query": args.query, "seconds": args.seconds, "excluded_track_ids": sorted(avoid),
        "context": args.context,
        "instructions": "Matches use catalogue words and supplied human descriptions, not a taste score. Explain the brand/story fit from the returned notes. Empty results are not permission to ignore avoid_with or invent a feeling. Do not fill quiet results with a rejected track. Read the map and compare the actual cut. Timing does not prove emotional fit. Preserve an explicit user track. Rights and listening remain separate.",
        "warnings": warnings, "candidates": candidates,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
