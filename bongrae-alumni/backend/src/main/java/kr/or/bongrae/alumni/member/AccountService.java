package kr.or.bongrae.alumni.member;

import kr.or.bongrae.alumni.auth.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private final CurrentUser current;
    private final AlumniProfileRepository profiles;
    private final UserAccountRepository users;
    private final PasswordEncoder passwords;
    private final JdbcTemplate jdbc;
    public AccountService(CurrentUser current, AlumniProfileRepository profiles, UserAccountRepository users,
                          PasswordEncoder passwords, JdbcTemplate jdbc) {
        this.current = current; this.profiles = profiles; this.users = users; this.passwords = passwords; this.jdbc = jdbc;
    }
    public record Account(String username, String name, String email, String phone, String regionProvince,
                          String regionCity, Integer classNo, Integer graduationYear, boolean smsAgreed,
                          boolean emailAgreed, boolean directoryAgreed) { }
    @Transactional(readOnly = true)
    public Account get() {
        var user = current.require();
        boolean directory = profiles.findByUserId(user.getId()).map(AlumniProfile::isPublicProfile).orElse(false);
        return new Account(user.getUsername(), user.getName(), user.getEmail(), user.getPhone(), user.getRegionProvince(),
            user.getRegionCity(), user.getClassNo(), user.getGraduationYear(), user.isSmsAgreed(), user.isEmailAgreed(), directory);
    }
    @Transactional
    public Account preferences(boolean sms, boolean email, boolean directory) {
        var user = current.require();
        user.updatePreferences(sms, email);
        var profile = profiles.findByUserId(user.getId()).orElseGet(() -> new AlumniProfile(user));
        profile.setPublicProfile(directory);
        profiles.save(profile);
        return get();
    }
    @Transactional
    public void withdraw(String password) {
        var user = current.require();
        if (!passwords.matches(password, user.getPasswordHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호를 확인해 주세요.");
        if (user.getRole() == MemberRole.SUPER_ADMIN) throw new ResponseStatusException(HttpStatus.CONFLICT, "총괄 관리자 계정은 탈퇴할 수 없습니다.");
        jdbc.update("DELETE FROM alumni_records WHERE user_id = ?", user.getId());
        jdbc.update("UPDATE users SET approved_by = NULL WHERE approved_by = ?", user.getId());
        profiles.deleteByUserId(user.getId());
        profiles.flush();
        users.delete(user);
        users.flush();
        jdbc.update("DELETE FROM spring_session WHERE principal_name = ?", user.getUsername());
    }
}
