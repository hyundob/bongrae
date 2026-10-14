package kr.or.bongrae.alumni.directory;

import java.util.List;
import java.util.Map;
import kr.or.bongrae.alumni.common.PageResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DirectoryLinkRepository {
    private final JdbcTemplate db;
    public DirectoryLinkRepository(JdbcTemplate db) { this.db=db; }

    public void lockRecords() {
        // Match roster import's lock: signup, review and manual edits must not claim the same record.
        db.execute("LOCK TABLE alumni_records IN SHARE ROW EXCLUSIVE MODE");
    }
    public List<Map<String,Object>> matches(String name, int classNo) {
        return db.queryForList("SELECT r.id,r.name,r.class_no,r.graduation_year,r.hometown,r.user_id,u.username linked_username "
            + "FROM alumni_records r LEFT JOIN users u ON u.id=r.user_id WHERE r.name=? AND r.class_no=? ORDER BY r.id",name,classNo);
    }
    public long matchingMembers(String name,int classNo) {
        return db.queryForObject("SELECT count(*) FROM users WHERE enabled AND role<>'GUEST' AND name=? AND class_no=?",Long.class,name,classNo);
    }
    public boolean linked(long userId) {
        return Boolean.TRUE.equals(db.queryForObject("SELECT EXISTS(SELECT 1 FROM alumni_records WHERE user_id=?)",Boolean.class,userId));
    }
    public int link(long recordId,long userId,String name,int classNo) {
        return db.update("UPDATE alumni_records SET user_id=? WHERE id=? AND user_id IS NULL AND name=? AND class_no=?",userId,recordId,name,classNo);
    }
    public void enqueue(long userId,String reason) {
        db.update("INSERT INTO alumni_link_reviews(user_id,reason) VALUES (?,?) ON CONFLICT(user_id) DO NOTHING",userId,reason);
    }
    private static final String REVIEW = "SELECT q.user_id,u.name,u.username,u.class_no,q.reason,q.status,q.record_id,q.created_at,q.reviewed_at,"
        + "(SELECT count(*) FROM alumni_records r WHERE r.name=u.name AND r.class_no=u.class_no) candidate_count "
        + "FROM alumni_link_reviews q JOIN users u ON u.id=q.user_id WHERE u.enabled AND u.role<>'GUEST'";
    public PageResponse<Map<String,Object>> reviews(String status,String name,int page) {
        String filter=" AND q.status=? AND u.name ILIKE ? ESCAPE '!'";
        String pattern="%"+name.replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        long total=db.queryForObject("SELECT count(*) FROM ("+REVIEW+filter+") results",Long.class,status,pattern);
        var rows=db.queryForList(REVIEW+filter+" ORDER BY q.created_at,q.user_id LIMIT 20 OFFSET ?",status,pattern,page*20);
        return new PageResponse<>(rows,total,page,20,(int)Math.ceil(total/20.0));
    }
    public Map<String,Object> review(long userId) {
        var rows=db.queryForList(REVIEW+" AND q.user_id=?",userId);
        return rows.isEmpty()?null:rows.get(0);
    }
    public void resolve(long userId,String status,Long recordId,long actorId) {
        db.update("UPDATE alumni_link_reviews SET status=?,record_id=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE user_id=?",
            status,recordId,actorId,userId);
    }
    public void syncManualLink(long recordId,Long oldUserId,Long userId,long actorId) {
        if (oldUserId!=null && !oldUserId.equals(userId)) {
            resolve(oldUserId,"DISMISSED",null,actorId);
            audit(actorId,"UNLINK_DIRECTORY",oldUserId,recordId);
        }
        if (userId!=null && !userId.equals(oldUserId)) {
            resolve(userId,"LINKED",recordId,actorId);
            audit(actorId,"LINK_DIRECTORY",userId,recordId);
        }
    }
    public void audit(Long actorId,String action,long userId,Long recordId) {
        db.update("INSERT INTO admin_audit(actor_id,action,target_id,detail) VALUES (?,?,?,?)",
            actorId,action,userId,recordId==null?"not linked":"record_id="+recordId);
    }
}
