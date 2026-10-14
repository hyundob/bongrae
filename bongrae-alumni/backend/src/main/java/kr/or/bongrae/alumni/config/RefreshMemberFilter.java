package kr.or.bongrae.alumni.config;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import kr.or.bongrae.alumni.member.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

// Read current DB roles so revocation applies to an already signed-in administrator.
final class RefreshMemberFilter extends OncePerRequestFilter {
    private final UserAccountRepository users;
    RefreshMemberFilter(UserAccountRepository users) { this.users = users; }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            var user = users.findByUsername(auth.getName()).filter(UserAccount::isEnabled)
                .filter(member -> member.getRole() != MemberRole.GUEST);
            if (user.isEmpty()) {
                SecurityContextHolder.clearContext();
                if (request.getSession(false) != null) request.getSession(false).invalidate();
            } else {
                var context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(auth.getName(), null,
                    List.of(new SimpleGrantedAuthority(user.get().getRole().name()))));
                SecurityContextHolder.setContext(context);
            }
        }
        chain.doFilter(request, response);
    }
}
