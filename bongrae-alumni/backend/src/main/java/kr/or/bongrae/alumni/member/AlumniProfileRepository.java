package kr.or.bongrae.alumni.member;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, Long> {
    java.util.Optional<AlumniProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
