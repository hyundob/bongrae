package kr.or.bongrae.alumni.auth;
import kr.or.bongrae.alumni.member.UserAccount;
public record AuthResponse(Long id, String username, String name, String role, Integer classNo, Integer graduationYear) {
    public static AuthResponse from(UserAccount user) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getName(), user.getRole().name(),
            user.getClassNo(), user.getGraduationYear());
    }
}
