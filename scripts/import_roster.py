"""Prepare a private, reviewable HWPX alumni import. Never connects to a database."""

import argparse
from collections import Counter, defaultdict
import csv
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile


HP = "{http://www.hancom.co.kr/hwpml/2011/paragraph}"
HEADER = re.compile(r"(\d+)회\((\d{4})년(\d{1,2})월(\d{1,2})일자?\)")
UNKNOWN_REGIONS = {"", "ㅇㅇ", "미상", "불명", "?", "??"}


def compact(value):
    return re.sub(r"\s+", "", value)


def text_of(element):
    return "".join("".join(node.itertext()) for node in element.iter(HP + "t"))


def parse_hwpx(path, source_id="bongrae-roster", corrections=None):
    if not re.fullmatch(r"[a-z0-9-]{1,60}", source_id):
        raise ValueError("source-id must contain 1-60 lowercase letters, digits or hyphens")
    corrections = corrections or {}
    used_corrections = set()
    entries, cohorts, excluded = [], {}, set()
    with zipfile.ZipFile(path) as archive:
        sections = sorted(name for name in archive.namelist() if re.fullmatch(r"Contents/section\d+\.xml", name))
        if not sections or len(sections) > 32 or len(sections) != len(set(sections)):
            raise ValueError("Invalid HWPX sections")
        if sum(archive.getinfo(name).file_size for name in sections) > 32 * 1024 * 1024:
            raise ValueError("HWPX text exceeds the size limit")
        for section in sections:
            payload = archive.read(section)
            if b"<!DOCTYPE" in payload.upper() or b"<!ENTITY" in payload.upper():
                raise ValueError("DTD and entity declarations are not supported")
            root = ET.fromstring(payload)
            for row in root.iter(HP + "tr"):
                cells = row.findall(HP + "tc")
                if len(cells) != 2:
                    continue
                header = compact(text_of(cells[0]))
                if not re.match(r"\d+회\(", header):
                    continue
                class_no = int(re.match(r"\d+", header)[0])
                if class_no < 20:
                    excluded.add(class_no)
                    continue
                match = HEADER.fullmatch(header)
                if not match or class_no in cohorts:
                    raise ValueError(f"Invalid or repeated cohort header: class {class_no}")
                graduated = date(*map(int, match.groups()[1:]))
                if not 1927 <= graduated.year <= date.today().year:
                    raise ValueError(f"Invalid graduation year: class {class_no}")
                tokens = [part.strip() for part in re.findall(r"[^)]+\)|[^)]+$", text_of(cells[1])) if part.strip()]
                if not tokens:
                    raise ValueError(f"Empty roster: class {class_no}")
                cohorts[class_no] = {"class_no": class_no, "graduation_date": graduated.isoformat(), "source_entries": len(tokens)}
                for position, raw in enumerate(tokens, 1):
                    key = f"{source_id}:{class_no}:{position:04d}"
                    parsed = raw
                    correction = corrections.get(key)
                    if correction:
                        if correction.get("original") != raw or not correction.get("reason"):
                            raise ValueError(f"Correction does not match its source: {key}")
                        parsed = correction["replacement"]
                        used_corrections.add(key)
                    parts = re.fullmatch(r"([^()]+)\(([^()]*)\)", parsed)
                    name = compact(parts[1]) if parts else ""
                    region = compact(parts[2]) if parts else ""
                    issue = ""
                    if not parts:
                        issue = "malformed_parentheses"
                    elif not re.fullmatch(r"[가-힣]{2,6}", name):
                        issue = "incomplete_or_unrecognized_name"
                    elif len(region) > 80:
                        issue = "region_too_long"
                    entries.append({
                        "source_key": key, "class_no": class_no, "graduation_year": graduated.year,
                        "graduation_date": graduated.isoformat(), "name": name,
                        "hometown": None if region in UNKNOWN_REGIONS else region,
                        "raw_entry": raw, "correction": correction.get("reason", "") if correction else "",
                        "status": "held" if issue else "ready", "issue": issue,
                    })
    if not cohorts or set(cohorts) != set(range(20, max(cohorts) + 1)):
        raise ValueError("Expected a continuous roster starting at class 20")
    if set(corrections) != used_corrections:
        raise ValueError("Unused correction keys; check the document version")
    return entries, sorted(cohorts.values(), key=lambda item: item["class_no"]), sorted(excluded)


def sql_string(value):
    if value is None:
        return "NULL"
    if "\x00" in value:
        raise ValueError("NUL characters are not supported")
    return "'" + value.replace("'", "''") + "'"


def render_sql(entries, source_name, consent_note=""):
    ready = [entry for entry in entries if entry["status"] == "ready"]
    if not ready:
        raise ValueError("No verified entries to import")
    values = []
    for item in ready:
        note = f"{source_name}; {item['class_no']}회 {item['graduation_date']}; 원문: {item['raw_entry']}"
        if item["correction"]:
            note += "; 정정: " + item["correction"]
        note += "; " + (consent_note or "검색 공개 미확인")
        if len(note) > 300:
            raise ValueError("Source and consent note exceeds 300 characters")
        values.append("(" + ",".join([
            sql_string(item["source_key"]), sql_string(item["name"]), str(item["class_no"]),
            str(item["graduation_year"]), sql_string(item["hometown"]), sql_string(note),
            "true" if consent_note else "false",
        ]) + ")")
    # Source-position keys preserve homonyms. Re-import never changes consent or account links.
    return """\\set ON_ERROR_STOP on
BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
CREATE TEMP TABLE roster_import (
    source_key VARCHAR(160) PRIMARY KEY, name VARCHAR(50) NOT NULL,
    class_no INTEGER NOT NULL CHECK (class_no >= 20), graduation_year INTEGER NOT NULL,
    hometown VARCHAR(80), source_note VARCHAR(300) NOT NULL, consent_confirmed BOOLEAN NOT NULL
) ON COMMIT DROP;
INSERT INTO roster_import(source_key,name,class_no,graduation_year,hometown,source_note,consent_confirmed) VALUES
""" + ",\n".join(values) + """;
LOCK TABLE alumni_records IN SHARE ROW EXCLUSIVE MODE;
DO $check$
BEGIN
    IF EXISTS (
        SELECT 1 FROM roster_import i JOIN alumni_records r USING (source_key)
        WHERE ROW(i.name,i.class_no,i.graduation_year,i.hometown)
            IS DISTINCT FROM ROW(r.name,r.class_no,r.graduation_year,r.hometown)
    ) THEN
        RAISE EXCEPTION 'Source keys conflict with existing records. Review the source or previous edits; no changes applied.';
    END IF;
END;
$check$;
WITH inserted AS (
    INSERT INTO alumni_records(source_key,name,class_no,graduation_year,hometown,source_note,consent_confirmed)
    SELECT source_key,name,class_no,graduation_year,hometown,source_note,consent_confirmed FROM roster_import i
    WHERE NOT EXISTS (SELECT 1 FROM alumni_import_keys k WHERE k.source_key=i.source_key)
    ON CONFLICT (source_key) DO NOTHING RETURNING id,source_key
), remembered AS (
    INSERT INTO alumni_import_keys(source_key,record_id)
    SELECT source_key,id FROM inserted RETURNING source_key
)
SELECT (SELECT count(*) FROM roster_import) AS source_records, count(*) AS inserted_records,
       (SELECT count(*) FROM roster_import) - count(*) AS skipped_records FROM remembered;
COMMIT;
"""


def write_artifacts(path, output, entries, cohorts, excluded, consent_note):
    output.mkdir(parents=True, exist_ok=True)
    exact = defaultdict(list)
    names = defaultdict(list)
    for item in entries:
        if item["status"] == "ready":
            exact[(item["class_no"], item["name"], item["hometown"])].append(item["source_key"])
            names[(item["class_no"], item["name"])].append(item["source_key"])
    counts = Counter(item["status"] for item in entries)
    for cohort in cohorts:
        cohort["ready"] = sum(item["class_no"] == cohort["class_no"] and item["status"] == "ready" for item in entries)
        cohort["held"] = cohort["source_entries"] - cohort["ready"]
    with path.open("rb") as source:
        checksum = hashlib.file_digest(source, "sha256").hexdigest()
    report = {
        "source_file": path.name, "sha256": checksum,
        "source_entries": len(entries), "ready": counts["ready"], "held": counts["held"],
        "corrected": sum(bool(item["correction"]) for item in entries),
        "excluded_classes": excluded, "publication_confirmed": bool(consent_note),
        "unknown_region": sum(item["status"] == "ready" and item["hometown"] is None for item in entries),
        "cohorts": cohorts,
        "identical_entry_groups_preserved": [keys for keys in exact.values() if len(keys) > 1],
        "same_name_groups_preserved": [keys for keys in names.values() if len(keys) > 1],
        "held_entries": [item for item in entries if item["status"] == "held"],
    }
    sql = render_sql(entries, path.name, consent_note)
    (output / "import.sql").write_text(sql, encoding="utf-8")
    (output / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    with (output / "review.csv").open("w", encoding="utf-8-sig", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=list(entries[0]))
        writer.writeheader()
        writer.writerows(entries)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--source-id", default="bongrae-roster")
    parser.add_argument("--corrections", type=Path)
    parser.add_argument("--publication-confirmed", action="store_true")
    parser.add_argument("--consent-note", default="")
    args = parser.parse_args()
    if args.publication_confirmed != bool(args.consent_note.strip()):
        parser.error("Publication requires both --publication-confirmed and a non-empty --consent-note")
    corrections = json.loads(args.corrections.read_text(encoding="utf-8-sig")) if args.corrections else {}
    entries, cohorts, excluded = parse_hwpx(args.source, args.source_id, corrections)
    output = Path(__file__).resolve().parents[1] / ".harness" / "roster-import"
    report = write_artifacts(args.source, output, entries, cohorts, excluded, args.consent_note.strip())
    print(json.dumps({key: report[key] for key in ("source_entries", "ready", "held", "corrected", "unknown_region", "publication_confirmed")}, indent=2))
    print(f"Private artifacts: {output}")
    print("Database unchanged. Apply import.sql with psql only after V3 and V4 have been deployed.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, zipfile.BadZipFile, ET.ParseError) as error:
        print(f"Import preparation failed: {error}", file=sys.stderr)
        sys.exit(1)
