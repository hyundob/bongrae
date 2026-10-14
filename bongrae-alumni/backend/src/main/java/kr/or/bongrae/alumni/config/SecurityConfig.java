package kr.or.bongrae.alumni.config;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.session.*;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;
import kr.or.bongrae.alumni.member.UserAccountRepository;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean SecurityContextRepository contexts() { return new HttpSessionSecurityContextRepository(); }
    @Bean CsrfTokenRepository csrfTokens() { return new HttpSessionCsrfTokenRepository(); }
    @Bean SessionAuthenticationStrategy sessions(CsrfTokenRepository csrfTokens) {
        return new CompositeSessionAuthenticationStrategy(List.of(
            new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrfTokens)));
    }
    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, SecurityContextRepository contexts,
                                    CsrfTokenRepository csrfTokens, UserAccountRepository users, ObjectMapper json) throws Exception {
        http.securityContext(context -> context.securityContextRepository(contexts))
            .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf", "/api/health", "/api/sample", "/api/site-info",
                    "/api/executives", "/api/rules", "/api/school/history", "/api/boards", "/api/boards/**",
                    "/api/media/**", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/signup", "/api/auth/login").permitAll()
                .requestMatchers("/api/admin/**").hasAnyAuthority("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/**").authenticated().anyRequest().denyAll())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, error) -> {
                    response.setStatus(401); response.setContentType("application/json;charset=UTF-8");
                    json.writeValue(response.getWriter(), Map.of("message", "로그인이 필요합니다."));
                })
                .accessDeniedHandler((request, response, error) -> {
                    response.setStatus(403); response.setContentType("application/json;charset=UTF-8");
                    json.writeValue(response.getWriter(), Map.of("message", "권한이 없거나 요청이 만료되었습니다. 새로고침 후 다시 시도해 주세요."));
                }))
            .logout(logout -> logout.logoutUrl("/api/auth/logout").invalidateHttpSession(true)
                .clearAuthentication(true).deleteCookies("SESSION", "JSESSIONID")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)))
            .addFilterBefore(new RefreshMemberFilter(users), AnonymousAuthenticationFilter.class);
        return http.build();
    }
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
