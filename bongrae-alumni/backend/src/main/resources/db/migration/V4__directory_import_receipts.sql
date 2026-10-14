-- Keep a non-identifying import receipt after deletion, so reruns cannot republish it.
CREATE TABLE alumni_import_keys (
    source_key VARCHAR(160) PRIMARY KEY,
    record_id BIGINT UNIQUE REFERENCES alumni_records(id) ON DELETE SET NULL
);
