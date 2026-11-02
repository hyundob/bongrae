# 운영 작업 기록

## 2026-11-02 회원가입 임시 중지 및 수동 백업

- 사용자 승인에 따라 운영 `bongrae.co.kr`의 신규 회원가입만 일시 중지했다. 사이트 전체 종료, DB 초기화, 앱 이미지 교체는 하지 않았다.
- 서버 `/home/ubuntu/bongrae-alumni/nginx/site-locations.conf`에 `BEGIN/END BONGRAE SIGNUP PAUSE 2026-11-02` 블록을 추가했다. `/signup`은 안내 화면, `/api/auth/signup`은 `SIGNUP_PAUSED` JSON과 HTTP 503을 반환하며 `Cache-Control: no-store`를 설정한다. 끝 슬래시·세미콜론·인코딩·중복 슬래시 변형도 차단한다.
- 홈페이지·로그인 화면·상태 확인·CSRF 경로는 유지한다. 관리자 암호를 사용한 실제 로그인 검사는 수행하지 않았다. 앱 내부 가입 기능 자체를 제거한 것이 아니며, 프론트·백엔드 포트가 외부에 공개되지 않은 현재 서버 구성을 전제로 한 임시 Nginx 차단이다.
- 이 설정은 현재 이미지 전용 GitHub 배포로 덮어쓰이지 않는다. 향후 Nginx 파일을 서버에 전달할 때 차단 블록을 보존해야 한다. 로컬 개발용 Nginx 설정에는 적용하지 않았다.

### 백업 위치와 범위

- 시각: 2026-11-02 13:54 KST.
- 서버 원본: `/var/backups/bongrae/manual-20261102T045458Z-8tf49wix.tar` 및 같은 이름의 원본 디렉터리. root 전용 디렉터리와 제한된 파일 권한으로 보관한다.
- 서버 외부 사본: 작업 PC의 `C:/Users/USER/Documents/Bongrae-Backups/20261102-135458/` 아래 같은 tar 파일. USER 계정만 접근하도록 제한했다. 저장소·채팅·공개 저장소에 백업 내용을 넣지 않는다.
- 포함: PostgreSQL custom-format DB 덤프, 기존 uploads 폴더, 가입 차단 전후 Nginx 라우팅 설정, 앱 이미지 식별자, 내부 파일 SHA-256, 복구 유의사항.
- 신규 게시판 첨부파일은 DB에 포함된다. `.env`, SSH 개인키, TLS 인증서 키, Docker 이미지 및 전체 서버 설정은 포함하지 않는다. 완전한 서버 복구 이미지나 자동 정기 백업은 아니다.
- 서버에서 `pg_restore --file=/dev/null`로 덤프 전체를 읽고 tar 목록을 검증했다. PC 사본의 SHA-256은 서버 원본과 일치한다. 별도 DB로 실제 복원하는 리허설은 수행하지 않았다.

### 코드 기반 차단으로 전환 (배포 승인 대기)

1. 현재 Nginx 차단과 백업을 그대로 유지한 상태에서 로컬 코드·검증을 마친다.
2. 사용자 승인 후 GitHub main에 push하고 해당 커밋의 자동 검증·배포 성공을 확인한다. 이 코드에서는 prod의 app.signup.enabled=false이므로 새 백엔드도 가입을 차단한다.
3. 운영 `/api/health` 정상 응답, 신규 `/api/auth/registration`의 enabled=false와 no-store, 배포 이미지 리비전을 확인한다. `/api/auth/registration`은 현재 Nginx 가입 차단 블록과 경로가 달라 먼저 확인할 수 있다.
4. 당시 Nginx 설정을 별도로 백업하고 아래 표식 블록만 제거한 뒤 nginx -t가 성공할 때만 reload한다. 기존 원본 전체 파일을 덮어쓰지 않는다. 이 1회 인계는 서버 설정 작업이며 이미지 배포만으로 자동 실행되지 않는다.
5. 앱의 `/signup` 화면에서 중단 안내가 표시되고 상태 조회가 false인 것을 확인한다. 프론트·백엔드 검증에서는 유효한 가입 요청의 503/SIGNUP_PAUSED 차단까지 확인한다. 홈페이지·로그인 경로도 재확인한다. 실패 시 즉시 보관한 Nginx 차단을 복구한다.

아직 이 전환을 운영에 적용하지 않았다. 이후 중지·재개는 application-prod.yml의 app.signup.enabled를 변경하는 코드 검토와 승인된 push로 처리한다. 회원가입 재개를 위해 Nginx를 다시 수정하지 않는다.

### 기존 임시 차단 블록 제거 참고

1. 위 코드 기반 차단의 배포 확인 후에만 진행한다. 새 코드 배포 없이 제거하면 기존 가입 기능이 열리므로 제거하지 않는다.
2. 당시 서버 설정을 별도로 백업하고 위 BEGIN/END 표식 사이의 가입 차단 블록만 제거한다. 과거 전체 파일을 그대로 덮어써 후속 변경을 지우지 않는다.
3. `sudo docker exec bongrae-nginx nginx -t`가 성공한 경우에만 `sudo docker exec bongrae-nginx nginx -s reload`를 실행한다.
4. 앱의 가입 중단 안내, 가입 가능 상태와 API 차단, 홈페이지·로그인·관리자 권한을 점검한다. 문법 검사가 실패하면 원래 설정으로 복구하고 reload하지 않는다.

### 별도 확인된 기존 문제

Nginx 컨테이너는 작업 전부터 unhealthy 표시였다. 검사 명령의 `localhost`가 `::1`로 연결되지만 현재 HTTP 리스너는 IPv4만 사용하여 연결이 거절된다. `127.0.0.1/nginx-health` 및 외부 HTTPS 홈페이지/API는 정상 응답한다. 이번 가입 차단·백업 작업에서는 건강 점검 설정을 변경하지 않았다.
