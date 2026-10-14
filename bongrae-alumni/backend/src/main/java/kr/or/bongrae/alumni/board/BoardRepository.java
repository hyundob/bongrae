package kr.or.bongrae.alumni.board;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import kr.or.bongrae.alumni.common.PageResponse;

@Repository
public class BoardRepository {
    private final JdbcTemplate db;
    public BoardRepository(JdbcTemplate db) { this.db=db; }
    public PageResponse<Map<String,Object>> list(String board,String q,int page) {
        String pattern="%"+q.replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        String where=" FROM board_posts p LEFT JOIN users u ON u.id=p.author_id WHERE p.board=? AND p.title ILIKE ? ESCAPE '!'";
        long total=db.queryForObject("SELECT count(*)"+where,Long.class,board,pattern);
        var rows=db.queryForList("SELECT p.id,p.title,coalesce(u.name,'탈퇴 회원') author_name,p.created_at,p.updated_at,(SELECT '/api/media/'||m.id FROM board_media m WHERE m.post_id=p.id AND m.content_type LIKE 'image/%' ORDER BY m.created_at LIMIT 1) thumbnail"+where+" ORDER BY p.id DESC LIMIT 20 OFFSET ?",board,pattern,page*20);
        return new PageResponse<>(rows,total,page,20,(int)Math.ceil(total/20.0));
    }
    public Map<String,Object> find(String board,long id) {
        var rows=db.queryForList("SELECT p.*,coalesce(u.name,'탈퇴 회원') author_name FROM board_posts p LEFT JOIN users u ON u.id=p.author_id WHERE p.board=? AND p.id=?",board,id);
        return rows.isEmpty()?null:rows.getFirst();
    }
    public long create(String board,String title,String body,long author) {
        return db.queryForObject("INSERT INTO board_posts(board,title,body,author_id,created_at,updated_at) VALUES (?,?,?,?,now(),now()) RETURNING id",Long.class,board,title,body,author);
    }
    public int update(long id,String title,String body,long version) {
        return db.update("UPDATE board_posts SET title=?,body=?,updated_at=now(),version=version+1 WHERE id=? AND version=?",title,body,id,version);
    }
    public int delete(long id,long version) { return db.update("DELETE FROM board_posts WHERE id=? AND version=?",id,version); }
    public List<Map<String,Object>> media(long id) { return db.queryForList("SELECT id,filename,content_type,byte_size FROM board_media WHERE post_id=? ORDER BY created_at",id); }
}
