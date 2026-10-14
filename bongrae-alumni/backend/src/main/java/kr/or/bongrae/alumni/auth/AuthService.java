package kr.or.bongrae.alumni.auth;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import kr.or.bongrae.alumni.member.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    public static final String POLICY_VERSION = "2026-10-14";
    private final UserAccountRepository users;
    private final AlumniProfileRepository profiles;
    private final PasswordEncoder passwords;
    public AuthService(UserAccountRepository users, AlumniProfileRepository profiles, PasswordEncoder passwords) {
        this.users = users; this.profiles = profiles; this.passwords = passwords;
    }
    @Transactional
    public UserAccount signup(SignupRequest request) {
        if (!request.password().equals(request.passwordConfirm())) badRequest("비밀번호 확인이 일치하지 않습니다.");
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) badRequest("비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.");
        if (!POLICY_VERSION.equals(request.policyVersion())) badRequest("변경된 약관을 확인한 후 다시 동의해 주세요.");
        if (!request.termsAgreed() || !request.privacyAgreed() || !request.ageConfirmed()) badRequest("필수 동의 항목과 만 14세 이상 여부를 확인해 주세요.");
        if (request.classNo() > GraduationYears.latestClass()) badRequest("졸업 기수를 확인해 주세요.");
        if (request.name().trim().length() < 2) badRequest("이름을 확인해 주세요.");
        String username = request.username().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.findByUsernameIgnoreCase(username).isPresent() || users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디 또는 이메일입니다.");
        }
        UserAccount user = new UserAccount(username, passwords.encode(request.password()), request.name().trim(),
            email, request.phone().replace("-", ""), trim(request.regionProvince()), trim(request.regionCity()),
            request.classNo(), true, true, request.smsAgreed(), request.emailAgreed());
        user.completeSignup(POLICY_VERSION);
        users.saveAndFlush(user);
        var profile = new AlumniProfile(user);
        profile.setPublicProfile(request.directoryAgreed());
        profiles.save(profile);
        return user;
    }
    @Transactional(readOnly = true)
    public UserAccount login(LoginRequest request) {
        UserAccount user = users.findByUsernameIgnoreCase(request.username().trim())
            .filter(UserAccount::isEnabled).filter(account -> account.getRole() != MemberRole.GUEST)
            .orElseThrow(AuthService::unauthorized);
        if (!passwords.matches(request.password(), user.getPasswordHash())) throw unauthorized();
        return user;
    }
    public static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호를 확인해 주세요.");
    }
    private static void badRequest(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private static String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
