package kr.or.bongrae.alumni.member;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final AccountService service;
    public AccountController(AccountService service) { this.service = service; }
    public record Preferences(boolean smsAgreed, boolean emailAgreed, boolean directoryAgreed) { }
    public record Withdrawal(@NotBlank String password) { }
    @GetMapping public AccountService.Account get() { return service.get(); }
    @PatchMapping("/preferences") public AccountService.Account preferences(@RequestBody Preferences body) {
        return service.preferences(body.smsAgreed(), body.emailAgreed(), body.directoryAgreed());
    }
    @DeleteMapping @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void withdraw(@Valid @RequestBody Withdrawal body, HttpServletRequest request) {
        service.withdraw(body.password());
        SecurityContextHolder.clearContext();
        if (request.getSession(false) != null) request.getSession(false).invalidate();
    }
}
