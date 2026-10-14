package kr.or.bongrae.alumni.member;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(length = 30)
    private String phone;

    // 거주 지역: 도/특별시/광역시, 시/군/구
    @Column(length = 50)
    private String regionProvince;

    @Column(length = 50)
    private String regionCity;

    // 졸업 기수 (1~99), 졸업연도 = 1926 + classNo
    @Column
    private Integer classNo;

    @Column
    private Integer graduationYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MemberRole role;

    // 가입 약관 동의
    @Column(nullable = false)
    private boolean termsAgreed;

    @Column(nullable = false)
    private boolean privacyAgreed;

    @Column(nullable = false)
    private boolean smsAgreed;

    @Column(nullable = false)
    private boolean emailAgreed;

    // 승인 이력
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private UserAccount approvedBy;

    @Column
    private LocalDateTime approvedAt;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column(length = 30)
    private String termsVersion;
    @Column(length = 30)
    private String privacyVersion;
    private LocalDateTime consentedAt;
    private LocalDateTime preferencesUpdatedAt;
    @Column(nullable = false)
    private boolean ageConfirmed;

    protected UserAccount() {
    }

    public UserAccount(String username, String passwordHash, String name, String email,
                       String phone, String regionProvince, String regionCity,
                       Integer classNo, boolean termsAgreed, boolean privacyAgreed,
                       boolean smsAgreed, boolean emailAgreed) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.regionProvince = regionProvince;
        this.regionCity = regionCity;
        this.classNo = classNo;
        this.graduationYear = (classNo != null) ? 1926 + classNo : null;
        this.termsAgreed = termsAgreed;
        this.privacyAgreed = privacyAgreed;
        this.smsAgreed = smsAgreed;
        this.emailAgreed = emailAgreed;
        this.role = MemberRole.PENDING;
        this.enabled = true;
        this.createdAt = LocalDateTime.now();
    }

    public void approve(UserAccount approver) {
        this.role = MemberRole.MEMBER;
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void promoteToAdmin(UserAccount superAdmin) {
        this.role = MemberRole.ADMIN;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void completeSignup(String policyVersion) {
        role = MemberRole.MEMBER;
        ageConfirmed = true;
        termsVersion = policyVersion;
        privacyVersion = policyVersion;
        consentedAt = LocalDateTime.now();
        preferencesUpdatedAt = consentedAt;
    }
    public void changeRole(MemberRole role) {
        this.role = role;
        updatedAt = LocalDateTime.now();
    }
    public void updatePreferences(boolean sms, boolean email) {
        smsAgreed = sms;
        emailAgreed = email;
        preferencesUpdatedAt = LocalDateTime.now();
    }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getRegionProvince() { return regionProvince; }
    public String getRegionCity() { return regionCity; }
    public Integer getClassNo() { return classNo; }
    public Integer getGraduationYear() { return graduationYear; }
    public MemberRole getRole() { return role; }
    public boolean isTermsAgreed() { return termsAgreed; }
    public boolean isPrivacyAgreed() { return privacyAgreed; }
    public boolean isSmsAgreed() { return smsAgreed; }
    public boolean isEmailAgreed() { return emailAgreed; }
    public UserAccount getApprovedBy() { return approvedBy; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public boolean isEnabled() { return enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getTermsVersion() { return termsVersion; }
    public String getPrivacyVersion() { return privacyVersion; }
}
