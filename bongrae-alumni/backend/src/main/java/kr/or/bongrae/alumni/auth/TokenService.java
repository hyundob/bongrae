package kr.or.bongrae.alumni.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.or.bongrae.alumni.member.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Base64.Encoder BASE64_URL = Base64.getUrlEncoder().withoutPadding();

    private final String jwtSecret;

    public TokenService(@Value("${app.jwt.secret}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public String createToken(UserAccount user) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            String payload = encodeJson(Map.of(
                "sub", user.getUsername(),
                "name", user.getName(),
                "role", user.getRole().name(),
                "iat", Instant.now().getEpochSecond(),
                "exp", Instant.now().plusSeconds(60L * 60L * 12L).getEpochSecond()
            ));
            String signingInput = header + "." + payload;
            return signingInput + "." + sign(signingInput);
        } catch (Exception exception) {
            throw new IllegalStateException("JWT token creation failed", exception);
        }
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        byte[] json = OBJECT_MAPPER.writeValueAsBytes(value);
        return BASE64_URL.encodeToString(json);
    }

    private String sign(String input) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return BASE64_URL.encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
    }
}
