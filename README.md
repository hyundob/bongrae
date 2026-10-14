# Bongrae Alumni

봉래초등학교 총동문회 웹사이트 개발 프로젝트입니다.

프로젝트 소스와 실행 설정은 [`bongrae-alumni/`](bongrae-alumni/)에 있습니다.
자세한 실행 및 배포 안내는 [프로젝트 README](bongrae-alumni/README.md)를 확인하세요.

```bash
cd bongrae-alumni
```

- Frontend: Next.js / TypeScript
- Backend: Spring Boot / Java 21
- Database: PostgreSQL
- Deployment: Docker Compose / Nginx / Let's Encrypt

회원 인증·동문 검색·게시판·관리자 권한을 구현했으며 운영 공개를 준비 중입니다.
관리자 최초 생성, DB 전환 및 개인정보 문서 확정 사항은 [운영 전환 안내](docs/member-release.md)를 확인하세요.
실제 환경변수, 업로드 파일, DB 백업, 인증서는 저장소에 포함하지 않습니다.

## 개발 하네스

개발 작업 규칙은 [AGENTS.md](AGENTS.md), 현재 구현 구조는
[architecture.md](docs/architecture.md), 자동 검증 사용법은
[harness.md](docs/harness.md)에 정리했습니다.

저장소 루트에서 전체 검증:

```text
node scripts/verify.mjs
```

PR과 main push에서 같은 검증을 실행하며, main의 검증이 통과해야 자동 배포로 이어집니다.
