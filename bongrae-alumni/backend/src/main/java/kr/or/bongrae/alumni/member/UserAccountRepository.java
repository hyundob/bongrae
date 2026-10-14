package kr.or.bongrae.alumni.member;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<UserAccount> findByUsername(String username);
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByRole(MemberRole role);
    org.springframework.data.domain.Page<UserAccount> findByEnabledTrueAndNameContainingIgnoreCase(
        String name, org.springframework.data.domain.Pageable pageable);
}
