# 봉래초등학교 총동문회 웹사이트

봉래초등학교 총동문회 공식 웹사이트 신규 개발 초안입니다. Next.js 프론트엔드, Spring Boot 백엔드, PostgreSQL, Nginx Reverse Proxy를 Docker Compose로 함께 실행하는 최소 실행 가능 구조입니다.

참고 사이트: [순천중·고등학교 총동창회](https://www.sungo.org/)

## 첨부자료 활용 안내

다음 자료의 텍스트와 이미지를 초기 콘텐츠로 반영했습니다.

- `홈피 자료.hwpx`: 학교 전경, 100주년 기념석, 학교 상징, 학교 현황, 학교 연혁, 교가 자료
- `홈피 자료 1.hwpx`: 총동문회 정식 명칭, 회칙, 임원진, 역대 회장, 학교 연혁
- `봉래초등학교 총동문회 임원진 명단.hwp`: 현 임원진 명단
- `봉래초등학교 총동문회 회칙.hwp`: 총동문회 회칙

반영된 핵심 정보:

- 정식 명칭: 봉래초등학교 총동문회
- 목적: 모교 발전 및 후원사업에 기여하고 동문 상호 간의 친목 도모
- 회원 구분: 정회원, 명예회원
- 정회원: 봉래초등학교 졸업생과 3년 이상 재학하다가 전학을 간 사람
- 명예회원: 전·현직 교직원 및 모교 발전에 공헌한 사람 중 이사회 추대를 받은 사람
- 학교 상징: 교목 비자나무, 교화 동백, 교색 파랑색

## 기술 스택

- Frontend: Next.js, TypeScript
- Backend: Spring Boot, Java 21, Gradle, Spring Security, JPA
- Database: PostgreSQL
- Web Server: Nginx Reverse Proxy
- Deploy: Docker Compose
- Server 기준: Ubuntu 24.04 LTS, 2vCore / 4GB RAM, Asia/Seoul

## 폴더 구조

```text
bongrae-alumni/
├─ docker-compose.yml
├─ .env.example
├─ .gitignore
├─ README.md
├─ nginx/
│  └─ default.conf
├─ frontend/
│  ├─ Dockerfile
│  └─ Next.js 프로젝트 파일
├─ backend/
│  ├─ Dockerfile
│  └─ Spring Boot 프로젝트 파일
├─ uploads/
└─ backups/
```

## GitHub Push 자동 배포

`main` push 시 GitHub에서 이미지를 빌드하고 기존 Ubuntu 서버에 SSH로 배포하는
워크플로가 `.github/workflows/deploy.yml`에 있습니다. 최초 서버 설정과 GitHub
Secret/Variable 등록 절차는 [자동 배포 안내](deploy/README.md)를 확인하세요.
`DEPLOY_ENABLED=true`로 활성화하기 전에는 배포하지 않습니다.

## 최초 실행 방법

```bash
cp .env.example .env
docker compose up -d --build
```

Windows PowerShell에서는:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

주요 접속 URL:

- 웹사이트: `http://localhost/`
- 백엔드 API health: `http://localhost/api/health`
- 샘플 API: `http://localhost/api/sample`
- Nginx health: `http://localhost/nginx-health`

## 실시간 개발용 실행

운영용 `docker-compose.yml`은 이미지를 빌드한 뒤 실행하므로, 소스 수정이 컨테이너에 즉시 반영되지 않습니다. 개발 중에는 `docker-compose.dev.yml`을 사용합니다.

```bash
docker compose -f docker-compose.dev.yml up -d
```

Windows PowerShell:

```powershell
docker compose -f docker-compose.dev.yml up -d
```

개발용 접속 URL:

- 통합 개발 사이트(Nginx): `http://localhost:8088/`
- 프론트 직접 접속(Next dev): `http://localhost:3001/`
- 백엔드 직접 접속: `http://localhost:18080/api/health` (DEV_BACKEND_PORT로 변경 가능)
- PostgreSQL 로컬 접속: `localhost:5433`

개발용 특징:

- 프론트엔드는 `frontend` 폴더를 컨테이너에 마운트하고 `npm run dev`로 실행합니다. 저장하면 화면에 바로 반영됩니다.
- 백엔드는 `backend` 폴더를 컨테이너에 마운트하고 `dev-entrypoint.sh`가 2초 간격으로 소스 변경을 감지합니다. Java, yml, sql, Gradle 파일이 바뀌면 Spring Boot를 자동 재시작합니다.
- 백엔드 재시작은 프론트 HMR처럼 즉시가 아니라 보통 몇 초 정도 걸립니다.
- 프론트 `package.json` 또는 `package-lock.json` 변경 후에는 `docker compose -f docker-compose.dev.yml restart frontend`를 실행합니다.
- 운영 배포 확인은 여전히 `docker compose up -d --build --force-recreate`로 합니다.

개발용 로그:

```bash
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f backend
```

개발용 중지:

```bash
docker compose -f docker-compose.dev.yml down
```

## .env 설정

`.env.example`을 `.env`로 복사한 뒤 운영 비밀번호를 변경합니다.

```env
POSTGRES_DB=alumni_db
POSTGRES_USER=alumni_user
POSTGRES_PASSWORD=change_this_password
SPRING_PROFILES_ACTIVE=prod
BOOTSTRAP_ADMIN_USERNAME=
BOOTSTRAP_ADMIN_PASSWORD=
BOOTSTRAP_ADMIN_EMAIL=
DOMAIN=localhost
TZ=Asia/Seoul
FILE_UPLOAD_PATH=/app/uploads
```

실제 DB 비밀번호와 관리자 초기 비밀번호는 `.env` 또는 별도 secret 관리 도구에서만 관리합니다. 인증은 JWT가 아닌 HttpOnly 세션 쿠키를 사용합니다.

## Docker Compose 명령어

```bash
docker compose up -d --build
docker compose logs -f
docker compose logs -f backend
docker compose restart backend
docker compose down
```

PostgreSQL은 외부 포트를 열지 않습니다. 백엔드 컨테이너만 내부 Docker network에서 `postgres:5432`로 접근합니다.

## 도메인 연결

아직 실제 도메인이 정해지지 않았으므로 다음 placeholder를 사용합니다.

- `.env`: `DOMAIN=localhost`
- `nginx/default.conf`: `server_name _;`

도메인이 정해지면 수정할 위치:

- `.env`의 `DOMAIN`
- `nginx/default.conf`의 `server_name`
- DNS A 레코드가 서버 공인 IP를 바라보도록 설정

예:

```nginx
server_name bongrae-alumni.kr www.bongrae-alumni.kr;
```

도메인 적용 전에는 서버 IP로 임시 접속할 수 있습니다.

```text
http://<server-public-ip>/
```

HTTPS는 아직 적용하지 않았습니다. 운영 도메인 확정 후 Let's Encrypt 또는 Certbot으로 443 server block과 인증서 경로를 추가합니다.

## bongrae.co.kr HTTPS 설정

Ubuntu 서버에 `setup-https.sh`, `docker-compose.https.yml`, `nginx/http-acme.conf`,
`nginx/https.conf`, `nginx/site-locations.conf`를 같은 상대 경로로 업로드합니다.
도메인이 서버 공인 IP를 가리키고 외부 TCP 80, 443 포트가 허용되어 있어야 합니다.
현재 스크립트는 `bongrae.co.kr`만 인증하며 `www`는 포함하지 않습니다.

```bash
cd /home/ubuntu/bongrae-alumni
sudo bash setup-https.sh 실제이메일주소
sudo certbot renew --dry-run --run-deploy-hooks
```

스크립트는 Certbot을 설치하고 HTTP webroot 방식으로 인증서를 발급합니다.
Nginx 컨테이너 재생성 중 잠시 연결이 끊길 수 있습니다. 인증서는 서버의
`/etc/letsencrypt`에 저장되며, 인증서 발급 후 HTTP 요청은 HTTPS로 이동합니다.
갱신은 `certbot.timer`가 수행하고 deploy hook으로 Nginx에 새 인증서를 반영합니다.

생성되는 `docker-compose.override.yml`은 기본 `docker compose` 명령에 자동으로
적용됩니다. 이후 배포는 기존처럼 `docker compose up -d --build`를 사용합니다.
생성된 override와 `nginx/https-active.conf`는 서버에 유지하고 덮어쓰지 않습니다.
명시적으로 `-f docker-compose.yml`만 지정하면 HTTPS 설정이 빠지므로,
필요한 경우 `-f docker-compose.yml -f docker-compose.override.yml`을 함께 지정합니다.
개발용 Compose에는 이 설정이 적용되지 않습니다.

## Ubuntu 24.04 LTS 배포 순서

1. 서버 패키지 업데이트
2. Docker Engine과 Docker Compose Plugin 설치
3. 프로젝트 업로드 또는 Git clone
4. `.env.example`을 `.env`로 복사
5. DB 비밀번호 변경 및 총괄 관리자 초기화 환경변수 설정
6. `docker compose up -d --build`
7. `docker compose ps`와 `docker compose logs -f`로 상태 확인
8. 도메인 DNS 연결
9. Nginx `server_name` 변경
10. Let's Encrypt 또는 Certbot으로 HTTPS 적용

2vCore / 4GB 서버 주의사항:

- Spring Boot는 `JAVA_OPTS=-Xms512m -Xmx1024m`로 제한했습니다.
- PostgreSQL, Next.js 빌드, Gradle 빌드를 한 서버에서 동시에 실행하면 빌드 순간 메모리 사용량이 높아질 수 있습니다.
- 운영에서는 이미지 빌드를 CI에서 수행하고 서버는 pull/up 중심으로 운용하는 편이 안정적입니다.

## 백업

DB 백업:

```bash
chmod +x backups/backup-db.sh
./backups/backup-db.sh
```

uploads 백업:

```bash
chmod +x backups/backup-uploads.sh
./backups/backup-uploads.sh
```

14일이 지난 백업 파일은 자동 삭제됩니다.

crontab 예시:

```cron
10 3 * * * cd /opt/bongrae-alumni && ./backups/backup-db.sh >> backups/backup.log 2>&1
30 3 * * * cd /opt/bongrae-alumni && ./backups/backup-uploads.sh >> backups/backup.log 2>&1
```

## DB 설계 초안

초안 SQL:

- `backend/src/main/resources/db/schema-draft.sql`
- `backend/src/main/resources/db/seed-data.sql`

포함 테이블:

- `users`
- `alumni_profiles`
- `alumni_graduation_classes`
- `executives`
- `rules`
- `school_histories`
- `school_symbols`
- `boards`
- `posts`
- `comments`
- `files`
- `donations`
- `scholarships`
- `events`
- `audit_logs`

위 목록은 초기 SQL 설계 초안입니다. 실제 DB는 `backend/src/main/resources/db/migration/`의 Flyway로 관리하며 Hibernate는 `validate`만 수행합니다. 현재 테이블과 API는 [구조 문서](../docs/architecture.md), 이번 전환 절차는 [회원·게시판 운영 안내](../docs/member-release.md)를 확인하세요.

## 보안 설계

- `.env`, uploads 런타임 파일, 백업 산출물은 git에 올리지 않습니다.
- PostgreSQL 포트는 외부에 공개하지 않습니다.
- 비밀번호는 BCrypt로 암호화합니다.
- 회원가입 직후 `MEMBER`이며 별도 승인 없이 검색과 자유게시판을 이용할 수 있습니다.
- 기존 `PENDING` 계정도 로그인 회원으로 이용합니다. `GUEST`는 로그인 대상이 아닙니다.
- 동문 검색은 로그인 회원 전용이며 공개 동의가 있는 이름·기수·졸업연도·가입 상태만 표시합니다.
- 게시물/명부 관리는 `ADMIN`, `SUPER_ADMIN`이며 관리자 권한 지정은 `SUPER_ADMIN` 1명만 가능합니다.
- 동문명부 원본 데이터는 공개 페이지에 직접 노출하지 않습니다.
- DB에는 공개 가능 정보와 비공개 정보를 구분할 수 있도록 `public_profile`, `public_access` 계열 필드를 둡니다.

## 샘플 API

- `GET /api/health`
- `GET /api/sample`
- `GET /api/site-info`
- `GET /api/executives`
- `GET /api/rules`
- `GET /api/school/history`
- `GET /api/boards`
- `POST /api/auth/signup`
- `POST /api/auth/login`

## 운영 전 점검 체크리스트

- `.env` DB 비밀번호와 총괄 관리자 초기화 값 확인
- `docker compose config` 유효성 확인
- `docker compose ps`에서 health 상태 확인
- `/api/health`가 Nginx를 통해 정상 응답하는지 확인
- `/uploads/`가 backend와 Nginx에서 같은 폴더를 바라보는지 확인
- 실제 도메인 확정 후 `nginx/default.conf`의 `server_name` 변경
- HTTPS 인증서 적용
- `ddl-auto: validate` 유지 및 Flyway 전환 로그 확인
- [총괄 관리자 초기화와 운영 필수 확인](../docs/member-release.md)
- 개인정보처리방침과 이용약관 문안 검수
- 동문명부 원본 업로드 전 공개/비공개 필드 검수
