# Bongrae Development Rules

## Start Here

- 실제 앱은 `bongrae-alumni/`, 검증 진입점은 `scripts/verify.mjs`다.
- 구조와 구현 현황: `docs/architecture.md`.
- Level 2 검증 범위와 사용법: `docs/harness.md`.
- 배포 운영: `bongrae-alumni/deploy/README.md`.
- 수정 전에 관련 코드와 `git status`를 확인하고 기존 사용자 변경을 보존한다.

## Working Rules

- UI는 Next.js App Router와 기존 CSS, API는 Spring Controller/Service/Repository 경계를 따른다.
- 회원 권한은 `MemberRole`이 기준이다. 문서·화면의 안내 문구를 실제 권한 구현으로 간주하지 않는다.
- 역할 검사와 개인정보 공개 여부는 서버에서 강제한다. 프론트에서 숨기는 것만으로 끝내지 않는다.
- `.env`, 개인키, 인증서, 실제 동문 연락처, 업로드 원본, DB 백업을 소스·로그·테스트 fixture에 넣지 않는다.
- 테스트 데이터는 가상 인물과 `example.invalid` 주소를 쓴다.
- `schema-draft.sql`은 설계 초안이다. 실행된 마이그레이션으로 취급하지 않는다.
- 회원 정보나 DB 구조 변경은 API 호환성과 마이그레이션 영향을 함께 검토한다.
- 기존 디자인과 자료의 명칭·회칙을 존중하고 임의로 내용을 만들어 채우지 않는다.
- 요청 범위 안에서 수정한다. CI를 통과시키려고 테스트 삭제·skip·권한 완화·오류 무시를 하지 않는다.

## Required Verification

저장소 루트에서 실행한다. 실패는 실패로 보고하고 실행하지 못한 검사는 통과로 표시하지 않는다.

| 변경 | 최소 로컬 검사 |
| --- | --- |
| 화면, CSS, 메뉴, 프론트 의존성 | `node scripts/verify.mjs frontend` |
| Java, 인증, 엔티티, API, Gradle | `node scripts/verify.mjs backend` |
| Compose, Dockerfile, CI, 배포 스크립트 | `node scripts/verify.mjs all` |
| 문서만 | 경로·명령의 실제 존재 확인, `git diff --check` |

- `backend-unit`은 Docker 없는 환경의 빠른 피드백용이다. 전체 검증을 대신하지 않는다.
- 버그 수정은 가능한 한 실패 재현 테스트를 먼저 추가한다.
- 새 동작에는 의미 있는 성공·실패 테스트를 추가한다. 단순 문구 수정에는 불필요한 테스트를 늘리지 않는다.
- 인증 변경은 비로그인·승인 대기·회원·관리자별 허용/거부를 검증한다.
- UI 변경은 PC와 모바일을 확인한다. 현재 브라우저 테스트는 외관 전체를 보증하지 않는다.
- 결과는 변경 내용, 실행한 검사, 미검증 항목과 남은 위험을 짧게 보고한다.

## Deployment Boundary

- PR 검증과 main push 검증은 같은 reusable workflow를 쓴다.
- 모든 검사가 통과해야 기존 자동 배포 단계로 진행한다.
- 이 하네스는 로컬·CI 검증 도구다. 자체적으로 push, merge, 운영 배포를 실행하지 않는다.
- `main`에 push하면 `DEPLOY_ENABLED=true`일 때 운영 배포가 시작된다는 점을 작업 범위에 반영한다.
- 운영 DB·uploads·인증서를 테스트에 사용하지 않는다. 검증 중 운영 컨테이너를 내리지 않는다.
- 서버 소스·Compose·Nginx 설정은 현재 이미지 배포로 동기화되지 않는다. 변경 시 별도 반영 절차를 명시한다.
