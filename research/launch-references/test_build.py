import copy
import unittest

from build import QUESTIONS, UI_GROUPS, catalog, coverage, table, validate


class ReviewChecks(unittest.TestCase):
    def setUp(self):
        self.source = {"id": 1, "duration_seconds": 20}
        self.review = {
            "id": 1, "reviewer_model": "gpt-6-astra",
            "viewed_evidence": ["sheet.jpg"], "product_clear_time": None,
            "categories": [{"id": q, "status": "not checked", "finding": "Unknown",
                            "reason": "No audio input", "evidence": "A01"} for q in QUESTIONS],
            "scenes": [{"id": "V01", "start": 0, "end": 20}],
            "sound": [{"id": "A01", "start": 0, "end": 20}],
            "elements": [{"kind": "ui", "name": "terminal", "events": ["V01"]}],
            "lessons": {"try": ["First experiment", "Second experiment"]},
        }

    def test_valid_and_overlapping_audio_layers(self):
        validate(self.review, self.source)
        self.review["sound"].append({"id": "A02", "start": 3, "end": 8})
        validate(self.review, self.source)

    def test_missing_category_gap_and_unanchored_element(self):
        for field, replacement in [
            ("categories", self.review["categories"][:-1]),
            ("scenes", [{"id": "V01", "start": 1, "end": 20}]),
            ("sound", [{"id": "A01", "start": 0, "end": 19}]),
            ("elements", [{"kind": "ui", "name": "terminal", "events": ["V02"]}]),
            ("product_clear_time", 21),
            ("product_clear_time", float('nan')),
            ("closer_windows", [{"start": 0, "end": 21, "rate_fps": 4, "evidence": ['frame.jpg'], "resolved": "visible"}]),
            ("reviewer_model", "different model"),
        ]:
            bad = copy.deepcopy(self.review)
            bad[field] = replacement
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate(bad, self.source)

    def test_invalid_numeric_and_duplicate_scene(self):
        self.review["scenes"] = [{"id": "V01", "start": 0, "end": float("nan")}]
        with self.assertRaises(ValueError):
            validate(self.review, self.source)
        self.review["scenes"] = [{"id": "V01", "start": 0, "end": 10}, {"id": "V01", "start": 10, "end": 20}]
        with self.assertRaises(ValueError):
            validate(self.review, self.source)

    def test_markdown_cell_escape(self):
        result = table(["A", "B"], [["one|two", "line\nbreak"]])
        self.assertIn(r"one\|two", result)
        self.assertIn("line break", result)
        self.assertEqual(len(result.splitlines()), 3)

    def test_duplicate_counts_and_canonical_dependency(self):
        sources = {1: {"id": 1, "canonical_id": 1}, 2: {"id": 2, "canonical_id": 1}}
        unique, summary = coverage(sources, [{"id": 2, "closer_windows": []}])
        self.assertEqual(unique, [])
        self.assertEqual(summary['pending_ids'], [1, 2])
        unique, summary = coverage(sources, [{"id": 1, "closer_windows": []}, {"id": 2, "closer_windows": []}])
        self.assertEqual(len(unique), 1)
        self.assertEqual(summary['source_entries_covered'], 2)
        self.assertEqual(summary['unique_edits_after_known_duplicates'], 1)
        self.assertEqual(summary['pending_ids'], [])
        sources[1]['canonical_id'] = 9
        with self.assertRaises(ValueError):
            coverage(sources, [])

    def test_ui_aliases_have_one_group(self):
        names = [name for group in UI_GROUPS.values() for name in group]
        self.assertEqual(len(names), len(set(names)))

    def test_catalog_counts_each_film_once_and_keeps_original_comments(self):
        sources = {1: {"id": 1, "title": "<Example>", "source_url": "https://example.com",
                       "duration_seconds": 20},
                   2: {"id": 2, "canonical_id": 1}}
        review = {**self.review, "product_type": "Tool", "scenario": "Input to result",
                  "comparison": {"lesson": "Keep the same object"},
                  "elements": [{"kind": "ui", "name": "chat", "events": ["V01"]},
                               {"kind": "ui", "name": "chat bubbles", "events": ["V01"]}]}
        comments = [{"id": 2, "comment": "Original comment"}]
        result = catalog(sources, [review], {}, comments)
        self.assertEqual(result["ui"], [{"name": "Chat / messages", "count": 1}])
        self.assertEqual(result["films"][0]["hamit_notes"], comments)
        self.assertEqual(result["films"][0]["title"], "<Example>")


if __name__ == "__main__":
    unittest.main()
