package kr.or.bongrae.alumni.member;

public enum MemberRole {
    GUEST,         // 비로그인 방문자
    PENDING,       // 가입 후 관리자 승인 대기
    MEMBER,        // 승인된 일반 회원
    ADMIN,         // 관리자 (최고관리자가 지정, 회원 승인·관리 권한)
    SUPER_ADMIN    // 최고관리자 (관리자 지정 및 모든 권한)
}
