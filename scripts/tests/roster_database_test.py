"""Exercise generated imports against an isolated PostgreSQL, never the app DB."""

from pathlib import Path
import subprocess
import time
import unittest
import uuid

from scripts.import_roster import render_sql


class RosterDatabaseTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.container = "bongrae-roster-test-" + uuid.uuid4().hex[:12]
        started = subprocess.run([
            "docker", "run", "--detach", "--rm", "--network", "none", "--name", cls.container,
            "-e", "POSTGRES_USER=harness", "-e", "POSTGRES_PASSWORD=harness-only",
            "-e", "POSTGRES_DB=roster_harness", "postgres:16-alpine",
        ], capture_output=True, text=True)
        if started.returncode:
            raise RuntimeError("Unable to start disposable PostgreSQL: " + started.stderr)
        cls.addClassCleanup(subprocess.run, ["docker", "rm", "--force", cls.container], capture_output=True)
        for attempt in range(60):
            ready = subprocess.run(["docker", "exec", cls.container, "pg_isready", "-h", "127.0.0.1", "-U", "harness", "-d", "roster_harness"], capture_output=True)
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError("Disposable PostgreSQL did not become ready")
        migrations = Path(__file__).resolve().parents[2] / "bongrae-alumni/backend/src/main/resources/db/migration"
        for migration in sorted(migrations.glob("V*.sql"), key=lambda path: int(path.name.split("__")[0][1:])):
            result = cls.execute(migration.read_text(encoding="utf-8"))
            if result.returncode:
                raise RuntimeError(result.stderr)

    @classmethod
    def execute(cls, sql):
        return subprocess.run([
            "docker", "exec", "-i", cls.container, "psql", "-X", "-v", "ON_ERROR_STOP=1",
            "-U", "harness", "-d", "roster_harness", "-At",
        ], input=sql, capture_output=True, encoding="utf-8")

    def query(self, sql):
        result = self.execute(sql)
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout.strip()

    def setUp(self):
        self.query("TRUNCATE users, spring_session CASCADE;")

    def entries(self):
        return [{"source_key": "synthetic:20:0001", "class_no": 20, "graduation_year": 1947,
                 "graduation_date": "1947-06-29", "name": "가상가", "hometown": "가상마을",
                 "raw_entry": "가상가(가상마을)", "correction": "", "status": "ready", "issue": ""}]

    def imported(self, entries=None, consent="Synthetic operator confirmation"):
        return self.query(render_sql(entries or self.entries(), "synthetic.hwpx", consent))

    def test_repeat_import_is_idempotent_and_never_creates_accounts(self):
        entries = self.entries()
        entries.append({**entries[0], "source_key": "synthetic:20:0002"})
        self.assertIn("2|2|0", self.imported(entries))
        self.assertIn("2|0|2", self.imported(entries))
        self.assertEqual(self.query("SELECT count(*) FROM alumni_records;"), "2")
        self.assertEqual(self.query("SELECT count(*) FROM users;"), "0")

    def test_revoked_publication_is_not_overwritten_by_repeat_import(self):
        self.imported()
        self.query("UPDATE alumni_records SET consent_confirmed=false;")
        self.imported()
        self.assertEqual(self.query("SELECT consent_confirmed FROM alumni_records;"), "f")

    def test_deleted_records_are_not_resurrected(self):
        self.imported()
        self.query("DELETE FROM alumni_records;")
        self.assertIn("1|0|1", self.imported())
        self.assertEqual(self.query("SELECT count(*) FROM alumni_records;"), "0")
        self.assertEqual(self.query("SELECT count(*) FROM alumni_import_keys WHERE record_id IS NULL;"), "1")

    def test_conflicting_reimport_rolls_back_the_whole_batch(self):
        self.imported()
        entries = self.entries()
        entries[0]["name"] = "가상나"
        entries.append({**entries[0], "source_key": "synthetic:20:0002"})
        result = self.execute(render_sql(entries, "synthetic.hwpx", "Synthetic confirmation"))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Source keys conflict", result.stderr)
        self.assertEqual(self.query("SELECT name FROM alumni_records;"), "가상가")
        self.assertEqual(self.query("SELECT count(*) FROM alumni_import_keys;"), "1")

    def test_unknown_regions_remain_null_and_unconfirmed_entries_remain_private(self):
        entries = self.entries()
        entries[0]["hometown"] = None
        self.imported(entries, consent="")
        self.assertEqual(self.query("SELECT hometown IS NULL,consent_confirmed,graduation_year FROM alumni_records;"), "t|f|1947")

    def test_source_text_cannot_escape_sql_literals(self):
        entries = self.entries()
        entries[0]["raw_entry"] = "'); DELETE FROM users; --"
        self.imported(entries)
        self.assertIn("DELETE FROM users", self.query("SELECT source_note FROM alumni_records;"))
        self.assertEqual(self.query("SELECT count(*) FROM alumni_import_keys;"), "1")


if __name__ == "__main__":
    unittest.main()
