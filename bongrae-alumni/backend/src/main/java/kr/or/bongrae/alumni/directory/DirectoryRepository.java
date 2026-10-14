package kr.or.bongrae.alumni.directory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import kr.or.bongrae.alumni.common.PageResponse;

@Repository
public class DirectoryRepository {
    private final JdbcTemplate db;
    public DirectoryRepository(JdbcTemplate db) { this.db = db; }

    public PageResponse<Map<String, Object>> search(String name, Integer classNo, int page, boolean admin) {
        String source = admin
            ? "SELECT r.id, r.name, r.class_no, 1926+r.class_no graduation_year, r.user_id, r.source_note, r.consent_confirmed, (r.user_id IS NOT NULL) registered FROM alumni_records r"
            : "SELECT u.name, u.class_no, u.graduation_year, true registered FROM users u JOIN alumni_profiles p ON p.user_id=u.id WHERE u.enabled AND p.public_profile UNION ALL SELECT r.name, r.class_no, 1926+r.class_no graduation_year, false registered FROM alumni_records r WHERE r.user_id IS NULL AND r.consent_confirmed";
        String query = " FROM (" + source + ") d WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (!name.isBlank()) {
            query += " AND name ILIKE ? ESCAPE '!'";
            args.add("%" + name.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%");
        }
        if (classNo != null) { query += " AND class_no=?"; args.add(classNo); }
        long total = db.queryForObject("SELECT count(*)" + query, Long.class, args.toArray());
        args.add(20); args.add(page * 20);
        List<Map<String, Object>> rows = db.queryForList("SELECT *" + query + " ORDER BY class_no, name LIMIT ? OFFSET ?", args.toArray());
        return new PageResponse<>(rows, total, page, 20, (int) Math.ceil(total / 20.0));
    }

    public long create(String name, int classNo, String source, boolean consent, Long userId) {
        return db.queryForObject("INSERT INTO alumni_records(name,class_no,source_note,consent_confirmed,user_id) VALUES (?,?,?,?,?) RETURNING id", Long.class, name, classNo, source, consent, userId);
    }
    public int update(long id, String name, int classNo, String source, boolean consent, Long userId) {
        return db.update("UPDATE alumni_records SET name=?,class_no=?,source_note=?,consent_confirmed=?,user_id=? WHERE id=?", name, classNo, source, consent, userId, id);
    }
    public int delete(long id) { return db.update("DELETE FROM alumni_records WHERE id=?", id); }
}
