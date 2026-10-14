package kr.or.bongrae.alumni.auth;

import kr.or.bongrae.alumni.member.AlumniProfile;
import kr.or.bongrae.alumni.member.AlumniProfileRepository;
import kr.or.bongrae.alumni.member.MemberRole;
import kr.or.bongrae.alumni.member.UserAccount;
import kr.or.bongrae.alumni.member.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final AlumniProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserAccountRepository users, AlumniProfileRepository profiles,
                       PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.users = users;
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (users.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 사용 중인 아이디입니다.");
        }
        if (users.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 사용 중인 이메일입니다.");
        }

        String[] regionParts = splitRegion(request.region());
        Integer classNo = parseClassNo(request.graduationClass());

        UserAccount user = new UserAccount(
            request.username(),
            passwordEncoder.encode(request.password()),
            request.name(),
            request.email(),
            request.phone(),
            regionParts[0],
            regionParts[1],
            classNo,
            request.termsConsent(),
            request.privacyConsent(),
            request.smsConsent(),
            request.emailConsent()
        );
        users.save(user);

        profiles.save(new AlumniProfile(user, request.occupation()));

        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = users.findByUsername(request.username())
            .filter(UserAccount::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않습니다.");
        }

        return toResponse(user);
    }

    private AuthResponse toResponse(UserAccount user) {
        return new AuthResponse(
            "Bearer",
            tokenService.createToken(user),
            user.getUsername(),
            user.getName(),
            user.getRole().name(),
            user.getRole() == MemberRole.PENDING ? "관리자 승인 대기" : "승인 완료"
        );
    }

    private String[] splitRegion(String region) {
        if (region == null || region.isBlank()) {
            return new String[] { null, null };
        }

        String[] parts = region.trim().split("\\s+", 2);
        String province = parts[0];
        String city = parts.length > 1 ? parts[1] : null;
        return new String[] { province, city };
    }

    private Integer parseClassNo(String graduationClass) {
        if (graduationClass == null || graduationClass.isBlank()) {
            return null;
        }

        String digits = graduationClass.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
