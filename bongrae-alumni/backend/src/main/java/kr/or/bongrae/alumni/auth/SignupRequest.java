package kr.or.bongrae.alumni.auth;
import jakarta.validation.constraints.*;
public record SignupRequest(
    @NotBlank @Pattern(regexp = "[a-zA-Z0-9_.-]{4,30}") String username,
    @NotBlank @Size(min = 10, max = 72) String password,
    @NotBlank @Size(max=72) String passwordConfirm,
    @NotBlank @Size(min = 2, max = 50) String name,
    @NotBlank @Email @Size(max = 120) String email,
    @NotBlank @Pattern(regexp = "01[016789]-?[0-9]{3,4}-?[0-9]{4}") String phone,
    @Size(max = 50) String regionProvince,
    @Size(max = 50) String regionCity,
    @NotNull @Min(1) @Max(200) Integer classNo,
    @AssertTrue boolean termsAgreed,
    @AssertTrue boolean privacyAgreed,
    boolean smsAgreed, boolean emailAgreed, boolean directoryAgreed,
    @AssertTrue boolean ageConfirmed,
    @NotBlank String policyVersion
) { }
