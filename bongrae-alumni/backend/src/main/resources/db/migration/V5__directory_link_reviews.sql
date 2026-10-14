CREATE TABLE alumni_link_reviews (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('MULTIPLE_RECORDS','MULTIPLE_MEMBERS','RECORD_IN_USE','EXISTING_MEMBER')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','LINKED','DISMISSED')),
    record_id BIGINT REFERENCES alumni_records(id) ON DELETE SET NULL,
    reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
CREATE INDEX alumni_link_reviews_queue ON alumni_link_reviews(status, created_at, user_id);

-- Existing members are reviewed, never silently linked during deployment.
INSERT INTO alumni_link_reviews(user_id, reason)
SELECT u.id, CASE WHEN (SELECT count(*) FROM alumni_records r WHERE r.name=u.name AND r.class_no=u.class_no)>1
    THEN 'MULTIPLE_RECORDS' ELSE 'EXISTING_MEMBER' END
FROM users u
WHERE u.enabled AND u.role<>'GUEST' AND u.class_no IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM alumni_records r WHERE r.user_id=u.id)
    AND EXISTS (SELECT 1 FROM alumni_records r WHERE r.name=u.name AND r.class_no=u.class_no);
