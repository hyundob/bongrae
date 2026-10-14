package kr.or.bongrae.alumni.member;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// 기본 회원 정보(UserAccount)의 확장 프로필 — 공개 설정, 직업 등 추가 정보
@Entity
@Table(name = "alumni_profiles")
public class AlumniProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    @Column(length = 120)
    private String occupation;

    // 동문 검색 목록에 본인 정보 공개 여부
    @Column(nullable = false)
    private boolean publicProfile;

    @Column(length = 200)
    private String memo;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;
    private LocalDateTime directoryConsentAt;

    protected AlumniProfile() {
    }

    public AlumniProfile(UserAccount user) {
        this.user = user;
        this.publicProfile = false;
        this.createdAt = LocalDateTime.now();
    }

    public AlumniProfile(UserAccount user, String occupation) {
        this.user = user;
        this.occupation = occupation;
        this.publicProfile = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public UserAccount getUser() { return user; }
    public String getOccupation() { return occupation; }
    public boolean isPublicProfile() { return publicProfile; }
    public String getMemo() { return memo; }
    public void setPublicProfile(boolean value) {
        publicProfile = value;
        directoryConsentAt = value ? LocalDateTime.now() : null;
        updatedAt = LocalDateTime.now();
    }
}
