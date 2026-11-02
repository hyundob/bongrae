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

### 회원가입 재개 승인 및 적용 절차

- 가입 중지 기능과 탈퇴 시 명부 보호는 커밋 `1850344`의 자동 검증·배포가 완료됐다. Nginx 임시 차단은 별도로 유지됐다.
- 2026-11-02 사용자가 문의처 정리를 보류하고 회원가입 재개를 승인했다. 이 변경은 prod의 `app.signup.enabled=true`만 적용하며 문의처·약관·동의 버전·권한·DB 구조는 변경하지 않는다. 아래 절차 완료 전에는 운영 재개로 간주하지 않는다.

1. 기존 Nginx 차단과 백업을 유지한 채 로컬 검증을 마친다. 가입 허용·중지 및 기존 로그인·권한 검사는 임시 DB에서 수행한다.
2. GitHub main에 push하고 해당 커밋의 자동 검증·배포 성공을 확인한다. 실패하면 Nginx 임시 차단을 제거하지 않는다.
3. 운영 `/api/health` 정상 응답, `/api/auth/registration`의 enabled=true와 no-store, 배포 이미지 리비전 일치를 확인한다. 이때 `/signup`은 아직 Nginx 차단 상태여야 한다.
4. 당시 서버의 `/home/ubuntu/bongrae-alumni/nginx/site-locations.conf`를 별도 백업한다. `BEGIN/END BONGRAE SIGNUP PAUSE 2026-11-02` 표식이 각각 1개인지 확인하고 그 블록만 제거한다. 과거 전체 파일로 덮어쓰지 않으며 파일 바인드 마운트가 유지되도록 기존 파일에 반영한다.
5. `sudo docker exec bongrae-nginx nginx -t`가 성공할 때만 `sudo docker exec bongrae-nginx nginx -s reload`를 실행한다. 실패하면 이번 백업으로 즉시 복원한다. 이미지 배포만으로 이 서버 설정 작업은 실행되지 않는다.
6. Cloudflare를 경유하는 HTTPS에서 가입 화면의 폼, 가입 가능 상태, 홈페이지·로그인·상태 확인 경로를 점검한다. 운영에 테스트 계정을 만들거나 운영 DB를 통합 테스트에 사용하지 않는다. 이상이 있으면 백업한 차단 설정을 복원하고 문법 검사 후 reload한다.

이 1회 차단 제거 후에는 `application-prod.yml`의 `app.signup.enabled`를 변경하는 코드 검토와 승인된 push로 중지·재개한다. 백업은 유지하며 Cloudflare SSL/TLS·방화벽·문의처 설정은 이번 재개 범위에 포함하지 않는다.

### 별도 확인된 기존 문제

Nginx 컨테이너는 작업 전부터 unhealthy 표시였다. 검사 명령의 `localhost`가 `::1`로 연결되지만 현재 HTTP 리스너는 IPv4만 사용하여 연결이 거절된다. `127.0.0.1/nginx-health` 및 외부 HTTPS 홈페이지/API는 정상 응답한다. 이번 가입 차단·백업 작업에서는 건강 점검 설정을 변경하지 않았다.
