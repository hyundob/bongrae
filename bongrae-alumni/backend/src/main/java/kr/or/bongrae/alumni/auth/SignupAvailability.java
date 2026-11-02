package kr.or.bongrae.alumni.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SignupAvailability {
    public static final String MESSAGE = "운영 준비를 위해 회원가입을 잠시 중단했습니다. 준비가 완료되면 다시 안내드리겠습니다.";
    private final boolean enabled;

    public SignupAvailability(@Value("${app.signup.enabled:false}") boolean enabled) {
        this.enabled = enabled;
    }
    public record Status(boolean enabled, String message) { }
    public Status status() { return new Status(enabled, enabled ? "" : MESSAGE); }
    public void requireOpen() {
        if (!enabled) throw new ClosedException();
    }
    public static class ClosedException extends ResponseStatusException {
        public ClosedException() { super(HttpStatus.SERVICE_UNAVAILABLE, MESSAGE); }
    }
}
