import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import shortlist


class MusicChoices(unittest.TestCase):
    def setUp(self):
        self.tracks = [{"id": i, "dir": f"{i}-track", "title": f"Track {i}", "author": "Artist",
                        "tags": ["Piano"], "duration": 90, "timing_mode": "beat", "bpm": 100,
                        "grid": "solid", "ear_review": "pending", "structure": "main 1–8",
                        "first_drop_t": None} for i in range(1, 5)]
        self.tracks[2]["structure"] = "intro 1–4 → build 5–8 → drop 9–20"
        self.tracks[3].update(timing_mode="free", bpm=None, grid="no reliable grid", structure="")

    def test_contrasting_structures_preserve_pending_listening_and_sources(self):
        before = copy.deepcopy(self.tracks)
        result = shortlist.shortlist(self.tracks, "piano", 20)
        self.assertEqual([row["id"] for row in result], [1, 3, 4])
        self.assertEqual(len({row["direction"] for row in result}), 3)
        self.assertEqual(result[2]["bpm"], None)
        self.assertTrue(all(row["ear_review"] == "pending" for row in result))
        self.assertEqual(self.tracks, before)

    def test_excluded_short_or_unmatched_tracks_do_not_return(self):
        self.tracks[1]["duration"] = 8
        self.assertEqual([row["id"] for row in shortlist.shortlist(self.tracks, "piano", 20, {1, 3})], [4])
        self.assertEqual(shortlist.shortlist(self.tracks, "nonexistent", 20), [])
        self.tracks[3]["id"] = "openverse-id"
        self.assertEqual(shortlist.shortlist(self.tracks, "piano", 20, {"1", "3", "openverse-id"}), [])
        for seconds, limit in [(0, 3), (-1, 3), (float("nan"), 3), (20, 0)]:
            with self.assertRaises(ValueError):
                shortlist.shortlist(self.tracks, "piano", seconds, limit=limit)

    def test_human_descriptions_control_context_and_exclusions(self):
        notes = [{"id": 1, "listener": "Hamit", "feeling": "quiet curious", "progression": "soft then percussion",
                  "use_with": ["calm technology"], "avoid_with": ["holiday"]}]
        self.assertEqual([r['id'] for r in shortlist.shortlist(self.tracks, 'percussion', 20, notes=notes, context='calm technology')], [1])
        self.assertEqual(shortlist.shortlist(self.tracks, 'percussion', 20, notes=notes, context='holiday calm'), [])
        self.assertEqual(shortlist.shortlist(self.tracks, 'piano', 20, notes=[], context='calm'), [])
        self.assertEqual(shortlist.shortlist(self.tracks, 'piano', 20, notes=notes, context='urgent'), [])
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'notes.json';path.write_text(json.dumps(notes))
            self.assertEqual(shortlist.load_notes(path), notes)
            path.write_text(json.dumps(notes+notes))
            with self.assertRaises(ValueError):shortlist.load_notes(path)
            partial={**notes[0], 'feeling':'', 'progression':'', 'use_with':['feature launch'], 'avoid_with':[]}
            path.write_text(json.dumps([partial]))
            self.assertEqual(shortlist.load_notes(path), [partial])
            self.assertEqual([r['id'] for r in shortlist.shortlist(self.tracks, 'feature', 20, notes=[partial], context='launch')], [1])
            path.write_text(json.dumps([{**partial, 'use_with':[]}]))
            with self.assertRaises(ValueError):shortlist.load_notes(path)

    def test_real_cli_excludes_previous_track_and_fails_on_missing_cue(self):
        script = Path(__file__).with_name("shortlist.py")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "cue.json"
            path.write_text(json.dumps({"track": {"id": 698217811}}))
            command = [sys.executable, str(script), "electronic", "--seconds", "20", "--previous", str(path)]
            run = subprocess.run(command, capture_output=True, text=True, check=True)
            result = json.loads(run.stdout)
            self.assertEqual(result["excluded_track_ids"], ["698217811"])
            self.assertNotIn(698217811, [row["id"] for row in result["candidates"]])
            path.unlink()
            failed = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(failed.returncode, 0)
            self.assertIn("Cannot select music", failed.stderr)


if __name__ == "__main__":
    unittest.main()
