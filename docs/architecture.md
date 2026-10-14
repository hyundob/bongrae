# 현재 프로젝트 구조

## 실행 구조

```text
브라우저 -> HTTPS / Nginx
           |-- /         -> Next.js 16.4 / React 19
           |-- /api/     -> Spring Boot 3.3 / Java 21 -> PostgreSQL 16
           +-- /uploads/ -> 기존 공개 파일 폴더 (새 첨부파일에는 사용 안 함)
```

브라우저는 같은 출처의 /api만 사용한다. 로컬 Next 직접 실행에서는 rewrite가 백엔드로 전달한다.
운영 Nginx가 HTTPS를 종료하며 세션 쿠키는 HttpOnly, SameSite=Lax, Secure(운영)로 전달한다.

## 코드 경계

| 영역 | 앱 폴더 아래 경로 | 역할 |
| --- | --- | --- |
| 페이지 | frontend/src/app | 소개·학교 자료, 가입·로그인·내 정보, 검색, 게시판, 관리자, 약관 |
| 공통 UI | frontend/src/components | AuthProvider, PageShell, BoardPage, AdminWorkspace, HomePosts |
| API 클라이언트 | frontend/src/lib/api.ts, useRemote.ts | 세션/CSRF 요청, 오류 처리, 목록 조회 |
| 인증 | backend/.../auth | 가입, 로그인, CSRF, 현재 회원 |
| 접근 정책 | backend/.../config | Spring Security, 매 요청 DB 권한 갱신 |
| 회원 | backend/.../member | 회원·프로필 JPA, 선택 동의, 탈퇴 |
| 관리자 | backend/.../admin | 최초 SUPER_ADMIN 생성, 회원 목록, ADMIN 부여·회수 |
| 검색 | backend/.../directory | JPA 회원 + JDBC 명부, 공개 범위 강제 |
| 게시판 | backend/.../board | Controller/Service/JDBC Repository, 글·사진·영상 |
| 마이그레이션 | backend/src/main/resources/db/migration | Flyway V1 회원/세션, V2 명부/게시판 |
| 정적 자료 API | backend/.../content | 학교·회칙 등 초기 자료 |
| 검증 | 저장소 scripts/verify.mjs | 빌드, 단위/DB/브라우저/배포 모의 검사 |

축약 backend/... 는 backend/src/main/java/kr/or/bongrae/alumni/를 뜻한다.

## 소개 페이지

- 상단 총동문회 소개는 `/about/greeting`, 모교소개는 `/school/history`, 알림마당은 `/notice/announcements`로 바로 이동한다.
- 기존 `/about`, `/school` 주소도 각각 첫 하위 페이지로 이동한다.
- 소개의 모든 하위 페이지는 `PageShell`의 공통 사이드 메뉴를 사용하며 현재 항목을 표시한다. 모바일에서는 가로 하위 메뉴가 된다.
- 소개 전용 표현은 `frontend/src/app/introduction.css`, 사진·준비 중 안내·다음 페이지 링크는 `components/Introduction.tsx`에 있다. 게시판 레이아웃은 유지한다.
- 학교 연혁은 시기별 연대표, 회칙은 장별 바로가기, 임원은 직책별 명부로 구성한다. 학교 현황의 긴 역사 자료는 펼침 영역에서 읽는다.
- 회장 인사말은 사용자가 제공한 초대 회장 원문을 게시한다. 원문의 총동창회 명칭을 보존하며, 총동문회 연혁과 역대 회장 자료는 준비 중이다.
- 실제 사무실 주소와 후원 계좌는 `site.ts`의 `associationContact`에서 관리하고 공통 푸터에 표시한다. 모교 위치와 회칙의 역사적 원문은 별개로 유지한다.

## 권한

| 작업 | 방문자 | 로그인 회원/PENDING | ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- | --- |
| 게시글 읽기 | 허용 | 허용 | 허용 | 허용 |
| 동문 검색 | 불가 | 허용 | 허용 | 허용 |
| 자유게시판 작성 | 불가 | 허용 | 허용 | 허용 |
| 자유게시판 수정·삭제 | 불가 | 본인 글 | 모든 글 | 모든 글 |
| 알림마당 작성·수정·삭제 | 불가 | 불가 | 허용 | 허용 |
| 동문 명부 관리 | 불가 | 불가 | 허용 | 허용 |
| ADMIN 지정·회수 | 불가 | 불가 | 불가 | 허용 |

신규 회원은 바로 MEMBER이다. GUEST는 로그인 대상이 아니며 기존 PENDING은 로그인 회원으로 처리한다.
SUPER_ADMIN은 DB 부분 유일 인덱스로 최대 1명, 명시적 환경변수로 초기화한다.
모든 쓰기는 세션과 CSRF 검사 후 서비스에서 권한·소유권을 확인한다.

## 데이터

- users: 로그인·회원정보, 역할, 동의 여부·문서 버전·일시.
- alumni_profiles: 검색 공개 선택 및 동의 일시.
- alumni_records: 미가입 동문 이름·기수·동의 근거, 확인 후 회원 계정 연결.
- board_posts: 게시판 종류, 제목·본문, 작성자, 수정 버전.
- board_media: 임시/게시 첨부파일, 크기/형식과 바이너리. 글당 5개, 파일당 16MB.
- spring_session, spring_session_attributes: 서버 세션.
- admin_audit: 권한 변경자·대상·변경 내용.

검색 결과는 이름/기수/졸업연도/가입 여부만 반환한다. 공개 동의 없는 회원은 제외한다.
연결되지 않은 명부는 당사자 동의가 확인된 경우만 표시한다.
기존 schema-draft.sql 및 seed-data.sql은 실행 마이그레이션이 아니다.

## API

- GET /api/auth/csrf, /api/auth/me
- POST /api/auth/signup, /api/auth/login, /api/auth/logout
- GET /api/account, PATCH /api/account/preferences, DELETE /api/account
- GET /api/alumni?name=&classNo=&page=
- GET /api/admin/members, PATCH /api/admin/members/{id}/role
- GET/POST /api/admin/directory, PUT/DELETE /api/admin/directory/{id}
- GET/POST /api/boards/{board}/posts, GET/PUT/DELETE /api/boards/{board}/posts/{id}
- POST /api/media, GET/DELETE /api/media/{uuid}

board는 announcements, events, gallery, affairs, free 중 하나이다.
목록은 items/total/page/size/pages 구조, page는 0부터 시작하며 페이지당 20건이다.
오류는 HTTP 상태와 message를 반환한다.

## 남은 운영 준비

장학사업은 추진 중, SMS/이메일 발송은 미구현이다. 비밀번호 재설정·연락처 본인확인·댓글은 이번 범위에 없다.
개인정보 담당자 및 문의처가 미정이며 법적 문안과 실제 위탁/보유 정책 확정이 필요하다.
운영 전환과 관리자 생성: [member-release.md](member-release.md).
자동 배포는 이미지 교체만 하며 서버 Compose/Nginx/환경변수는 별도 반영한다.
DB 변경은 이미지 롤백으로 복구되지 않는다. 검증 및 로컬 변경만으로 원격에 배포하지 않는다.
