package kr.or.bongrae.alumni.directory;

import java.util.Map;
import java.util.Set;
import jakarta.validation.constraints.*;
import kr.or.bongrae.alumni.auth.CurrentUser;
import kr.or.bongrae.alumni.common.PageResponse;
import kr.or.bongrae.alumni.member.UserAccount;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DirectoryLinkService {
    public record Decision(@NotNull @Pattern(regexp="LINK|DISMISS") String decision, @Min(1) Long recordId) {}
    private final DirectoryLinkRepository records;
    private final CurrentUser current;
    public DirectoryLinkService(DirectoryLinkRepository records,CurrentUser current) { this.records=records; this.current=current; }

    @Transactional
    public void onSignup(UserAccount user) {
        records.lockRecords();
        var matches=records.matches(user.getName(),user.getClassNo());
        if (matches.isEmpty() || records.linked(user.getId())) return;
        String reason;
        if (matches.size()>1) reason="MULTIPLE_RECORDS";
        else if (matches.get(0).get("user_id")!=null) reason="RECORD_IN_USE";
        else if (records.matchingMembers(user.getName(),user.getClassNo())>1) reason="MULTIPLE_MEMBERS";
        else {
            long recordId=((Number)matches.get(0).get("id")).longValue();
            if (records.link(recordId,user.getId(),user.getName(),user.getClassNo())!=1) throw conflict();
            records.audit(null,"AUTO_LINK_DIRECTORY",user.getId(),recordId);
            return;
        }
        records.enqueue(user.getId(),reason);
    }
    @Transactional(readOnly=true)
    public PageResponse<Map<String,Object>> list(String status,String name,int page) {
        requireAdmin();
        if (!Set.of("PENDING","LINKED","DISMISSED").contains(status) || name.length()>50 || page<0 || page>5000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"검색 조건을 확인해 주세요.");
        return records.reviews(status,name.trim(),page);
    }
    @Transactional(readOnly=true)
    public Map<String,Object> detail(long userId) {
        requireAdmin();
        var review=find(userId);
        return Map.of("review",review,"candidates",records.matches((String)review.get("name"),((Number)review.get("class_no")).intValue()));
    }
    @Transactional
    public void decide(long userId,Decision decision) {
        long actorId=requireAdmin();
        records.lockRecords();
        var review=find(userId);
        if (!"PENDING".equals(review.get("status")) || records.linked(userId)) throw conflict();
        if ("LINK".equals(decision.decision())) {
            if (decision.recordId()==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"연결할 명부를 선택해 주세요.");
            if (records.link(decision.recordId(),userId,(String)review.get("name"),((Number)review.get("class_no")).intValue())!=1) throw conflict();
            records.resolve(userId,"LINKED",decision.recordId(),actorId);
            records.audit(actorId,"LINK_DIRECTORY",userId,decision.recordId());
        } else {
            records.resolve(userId,"DISMISSED",null,actorId);
            records.audit(actorId,"DISMISS_DIRECTORY_LINK",userId,null);
        }
    }
    private Map<String,Object> find(long userId) {
        var review=records.review(userId);
        if (review==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"확인할 회원이 없습니다.");
        return review;
    }
    private long requireAdmin() {
        var actor=current.require();
        if (!CurrentUser.isAdmin(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return actor.getId();
    }
    private static ResponseStatusException conflict() {
        return new ResponseStatusException(HttpStatus.CONFLICT,"이미 처리되었거나 연결 정보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.");
    }
}
