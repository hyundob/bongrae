ALTER TABLE alumni_records
    ADD COLUMN hometown VARCHAR(80),
    ADD COLUMN graduation_year INTEGER CHECK (graduation_year BETWEEN 1927 AND 2100),
    ADD COLUMN source_key VARCHAR(160) UNIQUE;

-- The source register has no 1929 graduating cohort: class 3 is 1930.
UPDATE alumni_records
SET graduation_year = class_no + CASE WHEN class_no <= 2 THEN 1926 ELSE 1927 END;

UPDATE users SET graduation_year = class_no + 1927
WHERE class_no >= 3 AND graduation_year = class_no + 1926;
