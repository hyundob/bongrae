package kr.or.bongrae.alumni.admin;

import java.nio.charset.StandardCharsets;
import kr.or.bongrae.alumni.member.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final UserAccountRepository users;
    private final AlumniProfileRepository profiles;
    private final PasswordEncoder passwords;
    private final String username, password, email;
    public BootstrapAdmin(UserAccountRepository users, AlumniProfileRepository profiles, PasswordEncoder passwords,
            @Value("${app.bootstrap.username:}") String username, @Value("${app.bootstrap.password:}") String password,
            @Value("${app.bootstrap.email:}") String email) {
        this.users = users; this.profiles = profiles; this.passwords = passwords;
        this.username = username; this.password = password; this.email = email;
    }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByRole(MemberRole.SUPER_ADMIN) || username.isBlank()) return;
        if (!username.matches("[a-z0-9_.-]{4,30}") || password.length() < 16 ||
            password.getBytes(StandardCharsets.UTF_8).length > 72 || !email.contains("@")) {
            throw new IllegalStateException("Configure a valid bootstrap username, email and 16+ character password.");
        }
        if (users.findByUsernameIgnoreCase(username).isPresent() || users.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("Bootstrap administrator must use a new account; existing accounts are not promoted automatically.");
        }
        var user = new UserAccount(username, passwords.encode(password), "총괄 관리자", email,
            null, null, null, null, false, false, false, false);
        user.changeRole(MemberRole.SUPER_ADMIN);
        users.saveAndFlush(user);
        profiles.save(new AlumniProfile(user));
    }
}
