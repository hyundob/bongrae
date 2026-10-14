package kr.or.bongrae.alumni.directory;

import java.time.Year;
import java.util.Map;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import kr.or.bongrae.alumni.auth.CurrentUser;
import kr.or.bongrae.alumni.common.PageResponse;
import kr.or.bongrae.alumni.member.UserAccountRepository;
import kr.or.bongrae.alumni.member.GraduationYears;

@Service
public class DirectoryService {
    public record RecordInput(@NotBlank @Size(max=50) String name, @NotNull @Min(1) @Max(200) Integer classNo,
        @NotBlank @Size(max=300) String sourceNote, boolean consentConfirmed, Long userId,
        @Size(max=80) String hometown, @Min(1927) @Max(2100) Integer graduationYear) {}
    private final DirectoryRepository records;
    private final CurrentUser current;
    private final UserAccountRepository users;
    public DirectoryService(DirectoryRepository records, CurrentUser current, UserAccountRepository users) {
        this.records=records; this.current=current; this.users=users;
    }
    @Transactional(readOnly=true)
    public PageResponse<Map<String, Object>> search(String name, Integer classNo, int page, boolean admin) {
        var user=current.require();
        if (admin && !CurrentUser.isAdmin(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        name=name.trim();
        if (page<0 || page>5000 || name.length()>50 || (classNo!=null && (classNo<1 || classNo>GraduationYears.latestClass())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색 조건을 확인해 주세요.");
        if (!admin && classNo==null && name.length()<2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기수 또는 두 글자 이상의 이름을 입력해 주세요.");
        return records.search(name,classNo,page,admin);
    }
    @Transactional
    public long save(Long id, RecordInput input) {
        if (!CurrentUser.isAdmin(current.require())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (input.classNo()>GraduationYears.latestClass() || input.name().trim().isEmpty()
            || (input.graduationYear()!=null && input.graduationYear()>Year.now().getValue()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름과 기수를 확인해 주세요.");
        if (input.userId()!=null) {
            var user=users.findById(input.userId()).filter(u->u.isEnabled()).orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST, "연결할 회원이 없습니다."));
            if (!user.getName().equals(input.name().trim()) || !input.classNo().equals(user.getClassNo()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원의 이름과 기수가 일치하지 않습니다. 본인 확인 후 연결해 주세요.");
        }
        String hometown = input.hometown()==null ? null : input.hometown().trim();
        if (id==null) return records.create(input.name().trim(),input.classNo(),input.sourceNote().trim(),input.consentConfirmed(),input.userId(),
            hometown, input.graduationYear()==null ? GraduationYears.forClass(input.classNo()) : input.graduationYear());
        if (records.update(id,input.name().trim(),input.classNo(),input.sourceNote().trim(),input.consentConfirmed(),input.userId(),hometown,input.graduationYear())==0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return id;
    }
    @Transactional public void delete(long id) {
        if (!CurrentUser.isAdmin(current.require())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (records.delete(id)==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
}
