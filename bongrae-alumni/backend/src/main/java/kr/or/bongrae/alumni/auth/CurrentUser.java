package kr.or.bongrae.alumni.auth;

import kr.or.bongrae.alumni.member.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUser {
    private final UserAccountRepository users;
    public CurrentUser(UserAccountRepository users) { this.users = users; }
    public UserAccount require() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return users.findByUsername(auth.getName()).filter(UserAccount::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "다시 로그인해 주세요."));
    }
    public static boolean isAdmin(UserAccount user) {
        return user.getRole() == MemberRole.ADMIN || user.getRole() == MemberRole.SUPER_ADMIN;
    }
}
