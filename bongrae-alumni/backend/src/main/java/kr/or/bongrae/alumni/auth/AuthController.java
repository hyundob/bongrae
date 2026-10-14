package kr.or.bongrae.alumni.auth;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import kr.or.bongrae.alumni.member.UserAccount;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    private final CurrentUser current;
    private final SecurityContextRepository contexts;
    private final SessionAuthenticationStrategy sessions;
    public AuthController(AuthService service, CurrentUser current, SecurityContextRepository contexts,
                          SessionAuthenticationStrategy sessions) {
        this.service = service; this.current = current; this.contexts = contexts; this.sessions = sessions;
    }
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }
    @GetMapping("/me")
    public AuthResponse me() { return AuthResponse.from(current.require()); }
    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest body, HttpServletRequest request, HttpServletResponse response) {
        return signIn(service.signup(body), request, response);
    }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        return signIn(service.login(body), request, response);
    }
    private AuthResponse signIn(UserAccount user, HttpServletRequest request, HttpServletResponse response) {
        var auth = UsernamePasswordAuthenticationToken.authenticated(user.getUsername(), null,
            List.of(new SimpleGrantedAuthority(user.getRole().name())));
        sessions.onAuthentication(auth, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return AuthResponse.from(user);
    }
}
