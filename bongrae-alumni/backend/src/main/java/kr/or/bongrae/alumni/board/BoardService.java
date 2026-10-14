package kr.or.bongrae.alumni.board;

import java.util.*;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import kr.or.bongrae.alumni.auth.CurrentUser;
import kr.or.bongrae.alumni.member.UserAccount;
import kr.or.bongrae.alumni.common.PageResponse;

@Service
public class BoardService {
    public record PostInput(@NotBlank @Size(max=200) String title,@NotBlank @Size(max=30000) String body,
        @NotNull @Size(max=5) List<UUID> mediaIds,@Min(0) long version) {}
    private final BoardRepository posts;
    private final CurrentUser current;
    private final MediaService media;
    public BoardService(BoardRepository posts,CurrentUser current,MediaService media) { this.posts=posts; this.current=current; this.media=media; }
    public static String board(String slug) {
        return switch(slug) {
            case "announcements" -> "ANNOUNCEMENTS";
            case "events" -> "EVENTS";
            case "gallery" -> "GALLERY";
            case "affairs" -> "AFFAIRS";
            case "free" -> "FREE";
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND,"게시판이 없습니다.");
        };
    }
    @Transactional(readOnly=true)
    public PageResponse<Map<String,Object>> list(String slug,String q,int page) {
        if (page<0 || page>5000 || q.length()>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        return posts.list(board(slug),q.trim(),page);
    }
    @Transactional(readOnly=true)
    public Map<String,Object> detail(String slug,long id) {
        var post=find(slug,id);
        boolean editable=false;
        var auth=SecurityContextHolder.getContext().getAuthentication();
        if (auth!=null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) editable=canEdit(post,current.require());
        post.remove("author_id");
        post.put("canEdit",editable); post.put("media",posts.media(id));
        return post;
    }
    @Transactional
    public long save(String slug,Long id,PostInput input) {
        var user=current.require();
        String board=board(slug);
        if (!"FREE".equals(board) && !CurrentUser.isAdmin(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (id==null) id=posts.create(board,input.title().trim(),input.body().trim(),user.getId());
        else {
            if (!canEdit(find(slug,id),user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
            if (posts.update(id,input.title().trim(),input.body().trim(),input.version())==0) conflict();
        }
        media.attach(id,input.mediaIds(),user.getId());
        return id;
    }
    @Transactional public void delete(String slug,long id,long version) {
        if (!canEdit(find(slug,id),current.require())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (posts.delete(id,version)==0) conflict();
    }
    private Map<String,Object> find(String slug,long id) {
        var post=posts.find(board(slug),id);
        if (post==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"게시글이 없습니다.");
        return post;
    }
    private boolean canEdit(Map<String,Object> post,UserAccount user) {
        return CurrentUser.isAdmin(user) || ("FREE".equals(post.get("board")) && Objects.equals(post.get("author_id"),user.getId()));
    }
    private void conflict() { throw new ResponseStatusException(HttpStatus.CONFLICT,"다른 변경이 있습니다. 새로고침 후 다시 시도해 주세요."); }
}
