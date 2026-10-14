package kr.or.bongrae.alumni.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import kr.or.bongrae.alumni.auth.CurrentUser;
import kr.or.bongrae.alumni.member.*;
import kr.or.bongrae.alumni.common.PageResponse;

@Service
public class AdminService {
    public record Member(long id,String username,String name,Integer classNo,MemberRole role) {}
    private final UserAccountRepository users;
    private final CurrentUser current;
    private final JdbcTemplate db;
    public AdminService(UserAccountRepository users, CurrentUser current, JdbcTemplate db) { this.users=users; this.current=current; this.db=db; }
    @Transactional(readOnly=true)
    public PageResponse<Member> members(String name,int page) {
        if (!CurrentUser.isAdmin(current.require())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (page<0 || page>5000 || name.length()>50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var result=users.findByEnabledTrueAndNameContainingIgnoreCase(name.trim(),PageRequest.of(page,20,Sort.by("id").descending()));
        return PageResponse.from(result.map(u->new Member(u.getId(),u.getUsername(),u.getName(),u.getClassNo(),u.getRole())));
    }
    @Transactional
    public void role(long id,MemberRole role) {
        var actor=current.require();
        if (actor.getRole()!=MemberRole.SUPER_ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (role!=MemberRole.MEMBER && role!=MemberRole.ADMIN) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"회원 또는 관리자 권한만 지정할 수 있습니다.");
        var user=users.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (user.getRole()==MemberRole.SUPER_ADMIN) throw new ResponseStatusException(HttpStatus.CONFLICT,"총괄 관리자 권한은 변경할 수 없습니다.");
        var previous=user.getRole();
        user.changeRole(role);
        db.update("INSERT INTO admin_audit(actor_id,action,target_id,detail) VALUES (?,?,?,?)",actor.getId(),"CHANGE_ROLE",id,previous+" -> "+role);
    }
}
