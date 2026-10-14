import csv
from pathlib import Path
import tempfile
import unittest
from xml.sax.saxutils import escape
import zipfile

from scripts.import_roster import parse_hwpx, render_sql, sql_string, write_artifacts


class RosterImportTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "synthetic.hwpx"

    def document(self, rows):
        body = []
        for header, names in rows:
            cells = [f"<hp:tc><hp:p><hp:run><hp:t>{escape(text)}</hp:t></hp:run></hp:p></hp:tc>" for text in (header, names)]
            body.append("<hp:tr>" + "".join(cells) + "</hp:tr>")
        xml = '<root xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"><hp:tbl>' + "".join(body) + "</hp:tbl></root>"
        with zipfile.ZipFile(self.path, "w") as archive:
            archive.writestr("Contents/section0.xml", xml.encode("utf-8"))
        return self.path

    def basic(self, names="가상가(가상마을)"):
        return self.document([("20회(1947년 06월 29일자)", names)])

    def test_excludes_early_classes_before_validating_their_dates(self):
        self.document([("19회(1946년 00월 00일자)", "가상나(가상마을)"), ("20회(1947년 6월 29일자)", "가상가(가상마을)")])
        entries, cohorts, excluded = parse_hwpx(self.path)
        self.assertEqual(len(entries), 1)
        self.assertEqual(excluded, [19])
        self.assertEqual(cohorts[0]["graduation_date"], "1947-06-29")
        self.assertEqual(entries[0]["graduation_year"], 1947)

    def test_separates_names_from_hometowns_and_preserves_unknown_text(self):
        entries, _, _ = parse_hwpx(self.basic("가  상(가상마을) 가상나(ㅇㅇ)"))
        self.assertEqual(entries[0]["name"], "가상")
        self.assertEqual(entries[0]["hometown"], "가상마을")
        self.assertIsNone(entries[1]["hometown"])
        self.assertEqual(entries[1]["raw_entry"], "가상나(ㅇㅇ)")

    def test_incomplete_entries_are_held_without_shifting_source_positions(self):
        entries, _, _ = parse_hwpx(self.basic("가상가가상마을) 가상ㅇ(가상마을) 가상다(가상마을)"))
        self.assertEqual([item["status"] for item in entries], ["held", "held", "ready"])
        self.assertEqual(entries[-1]["source_key"], "bongrae-roster:20:0003")

    def test_explicit_correction_requires_exact_original_and_reason(self):
        path = self.basic("가상가가상마을)")
        correction = {"bongrae-roster:20:0001": {"original": "가상가가상마을)", "replacement": "가상가(가상마을)", "reason": "Synthetic operator confirmation"}}
        entries, _, _ = parse_hwpx(path, corrections=correction)
        self.assertEqual(entries[0]["status"], "ready")
        self.assertEqual(entries[0]["raw_entry"], "가상가가상마을)")
        correction["bongrae-roster:20:0001"]["original"] = "different"
        with self.assertRaises(ValueError):
            parse_hwpx(path, corrections=correction)

    def test_unused_correction_fails_closed(self):
        with self.assertRaises(ValueError):
            parse_hwpx(self.basic(), corrections={"bongrae-roster:21:0001": {"original": "missing"}})

    def test_homonyms_are_not_merged(self):
        entries, _, _ = parse_hwpx(self.basic("가상가(가상마을) 가상가(가상마을) 가상가(가상지역)"))
        self.assertEqual(len(entries), 3)
        self.assertEqual(len({item["source_key"] for item in entries}), 3)

    def test_missing_cohort_is_not_silently_skipped(self):
        path = self.document([("20회(1947년 6월 29일)", "가상가(가상마을)"), ("22회(1949년 6월 29일)", "가상나(가상마을)")])
        with self.assertRaises(ValueError):
            parse_hwpx(path)

    def test_duplicate_cohort_and_invalid_date_are_rejected(self):
        row = ("20회(1947년 6월 29일)", "가상가(가상마을)")
        with self.assertRaises(ValueError):
            parse_hwpx(self.document([row, row]))
        with self.assertRaises(ValueError):
            parse_hwpx(self.document([("20회(1947년 2월 30일)", row[1])]))

    def test_entities_and_invalid_source_ids_are_rejected(self):
        with zipfile.ZipFile(self.path, "w") as archive:
            archive.writestr("Contents/section0.xml", '<!DOCTYPE root [<!ENTITY x "secret">]><root/>')
        with self.assertRaises(ValueError):
            parse_hwpx(self.path)
        with self.assertRaises(ValueError):
            parse_hwpx(self.basic(), source_id="bad'key")

    def test_import_is_private_by_default_and_does_not_contain_held_names(self):
        entries, _, _ = parse_hwpx(self.basic("가상가(가상마을) 가상ㅇ(가상마을)"))
        sql = render_sql(entries, "synthetic.hwpx")
        self.assertIn(",false)", sql)
        self.assertNotIn("가상ㅇ", sql)
        self.assertIn("ON CONFLICT (source_key) DO NOTHING", sql)
        self.assertIn("WHERE NOT EXISTS (SELECT 1 FROM alumni_import_keys", sql)
        self.assertIn("IS DISTINCT FROM", sql)
        self.assertNotIn("UPDATE users", sql)
        self.assertNotIn("DELETE FROM", sql)
        self.assertTrue(sql.startswith("\\set ON_ERROR_STOP on\nBEGIN;"))
        self.assertTrue(sql.endswith("COMMIT;\n"))

    def test_publication_requires_explicit_evidence_and_sql_strings_are_escaped(self):
        entries, _, _ = parse_hwpx(self.basic())
        sql = render_sql(entries, "operator's synthetic.hwpx", "Synthetic publication confirmation")
        self.assertIn("operator''s", sql)
        self.assertIn(",true)", sql)
        with self.assertRaises(ValueError):
            sql_string("bad\0value")
        with self.assertRaises(ValueError):
            render_sql(entries, "synthetic.hwpx", "x" * 301)

    def test_review_report_reconciles_counts_and_keeps_raw_entries(self):
        self.basic("가상가(가상마을) 가상가(가상마을) 가상ㅇ(ㅇㅇ)")
        entries, cohorts, excluded = parse_hwpx(self.path)
        output = Path(self.temp.name) / "output"
        report = write_artifacts(self.path, output, entries, cohorts, excluded, "")
        self.assertEqual(report["source_entries"], report["ready"] + report["held"])
        self.assertEqual(report["ready"], 2)
        self.assertEqual(len(report["identical_entry_groups_preserved"]), 1)
        with (output / "review.csv").open(encoding="utf-8-sig", newline="") as source:
            self.assertEqual(len(list(csv.DictReader(source))), 3)


if __name__ == "__main__":
    unittest.main()
