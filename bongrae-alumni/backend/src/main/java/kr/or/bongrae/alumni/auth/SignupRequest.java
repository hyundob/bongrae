package kr.or.bongrae.alumni.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank @Size(min = 4, max = 50) String username,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 50) String name,
    @NotBlank @Email @Size(max = 120) String email,
    @Size(max = 30) String phone,
    @Size(max = 40) String graduationType,
    @Size(max = 30) String graduationClass,
    @Size(max = 10) String graduationYear,
    @Size(max = 20) String birthDate,
    @Size(max = 80) String region,
    @Size(max = 120) String occupation,
    boolean smsConsent,
    boolean emailConsent,
    @AssertTrue boolean privacyConsent,
    @AssertTrue boolean termsConsent
) {
}
