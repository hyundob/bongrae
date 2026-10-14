package kr.or.bongrae.alumni.auth;

public record AuthResponse(
    String tokenType,
    String accessToken,
    String username,
    String name,
    String role,
    String approvalStatus
) {
}
