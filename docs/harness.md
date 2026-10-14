# Level 2 개발 하네스

이 프로젝트에서 Level 2는 **사람이 개발 방향과 변경 내용을 결정하고, 빌드·테스트·검증은
반복 가능한 명령과 CI가 수행하는 단계**다. 자율 기능 개발, 자동 수정 반복, 자동 PR 생성은 포함하지 않는다.

## 시작

로컬 준비물: Node.js 22, JDK 21 (`JAVA_HOME`), Git, Docker Engine/Compose.
Windows는 Git Bash와 Python 3도 필요하다. Docker Desktop은 DB 통합 테스트 때 실행 중이어야 한다.
Git Bash가 기본 위치에 없다면 `BASH_PATH`를 지정한다.

저장소 루트에서 Windows PowerShell과 Ubuntu 모두 같은 명령을 사용한다.

```text
node scripts/verify.mjs
```

프론트 의존성은 잠금 파일로 설치하고 필요한 Chromium도 설치한다. 최초 실행에는 다운로드가 필요하다.
로컬 `.env`나 운영 서버 연결 정보는 필요하지 않다. Node/JDK는 별도로 설치해야 한다.
Linux에서 Chromium OS 라이브러리가 없다면 프론트 폴더에서
`npx playwright install --with-deps chromium`으로 준비한다. CI에서는 이 옵션을 자동 적용한다.

## 범위별 명령

| 명령 | 수행 내용 |
| --- | --- |
| `node scripts/verify.mjs` | 아래 전체 검사 |
| `node scripts/verify.mjs frontend` | npm ci, ESLint, 타입 검사, Next 운영 빌드, PC/모바일 Chromium 테스트 |
| `node scripts/verify.mjs backend` | Gradle clean, 단위 테스트, PostgreSQL 통합 테스트, bootJar |
| `node scripts/verify.mjs infra` | 변경 공백 검사, Compose 설정 검증, 배포·롤백 모의 테스트 |
| `node scripts/verify.mjs backend-unit` | Docker 없이 단위 테스트와 bootJar만 실행; 전체 통과로 간주하지 않음 |

전체 실행은 영역별 실패를 모아 종료 코드 1을 반환한다. 한 영역 내부는 첫 실패에서 멈춘다.
이전 빌드 결과만으로 통과하지 않도록 백엔드는 clean, 프론트는 새 빌드를 실행한다.
3100 포트는 Playwright가 테스트 전용으로 열고 종료한다. 이미 사용 중이면 다른 서버에 붙지 않고 실패한다.
개발 서버와 같은 프론트 폴더의 `.next`를 공유하므로 직접 실행 중인 `next dev`는 검증 전에 종료한다.
Docker 개발 Compose는 별도 `.next` 볼륨을 사용한다.

## 현재 자동 검사

- 프론트: 홈 제목·실제 이미지, 주 메뉴, 구형 URL redirect, DB 게시물 목록의 오류·재시도.
- 소개 화면: 첫 하위 페이지로 바로 이동, 소개 10개 화면의 사이드 메뉴·현재 항목·사진·가로 넘침, 회칙 목차, 원본 연혁·임원·교장·회칙 항목 수 보존.
- 브라우저: Desktop Chrome, Pixel 7 Chromium. 회원가입, 약관 새 탭, 선택 동의, 로그인 오류, 검색, 게시판 편집, 관리자 역할 UI를 모의 API로 검사한다. 주요 화면 캡처를 test-results에 저장한다.
- 백엔드 단위: 비밀번호 해시, 가입 즉시 MEMBER·검색 비공개, 중복 아이디·이메일, 잘못된 로그인 거부.
- 백엔드 통합: 실제 HTTP·쿠키·CSRF와 임시 PostgreSQL로 가입·로그인·로그아웃, 동의, 이름/기수 검색과 연락처 비노출, 권한 즉시 회수, 게시글 소유권·동시 수정, 첨부파일 접근/범위 요청, 탈퇴, 총괄 관리자 유일성, 기존 DB 전환을 검사한다.
- 인프라: 운영·개발·HTTPS 이미지 Compose 구성, 배포 성공, 앱/HTTPS 실패 시 복구, 잘못된 아카이브 거부.

ESLint의 오류는 실패로 처리한다. 기존 `<img>` 최적화 권고 등 경고는 출력하며, 규칙을 끄지 않는다.
자동 브라우저 테스트는 모의 API이며 실제 백엔드 권한은 별도 HTTP 통합 테스트가 검증한다.
이 검사는 운영 서버의 설정, 실사용 DB의 모든 데이터 상태, 모든 화면의 외관,
법률 준수, 실제 Nginx 컨테이너 기동이나 DB 마이그레이션 복구를 보증하지 않는다.
기능을 구현할 때 해당 기능의 테스트를 함께 추가한다. 준비 중 화면을 완성된 기능으로 테스트하지 않는다.

## 데이터 격리

통합 테스트는 Testcontainers가 새 PostgreSQL 16 컨테이너를 생성하고 임의 포트를 할당한다.
운영/개발 DB URL 대신 컨테이너 접속 정보를 직접 주입한다. 실제 Flyway 마이그레이션을 적용하고
`ddl-auto: validate`로 확인한다. 각 테스트는 임시 DB만 초기화하며 종료 후 컨테이너를 정리한다. Docker가 없으면 skip하지 않고 실패한다.
테스트에 공유 DB의 주소나 운영 Secret을 넣지 않는다.

## GitHub 흐름

```text
PR -> Verify Bongrae -> frontend / backend / infra -> quality-gate
main push -> Deploy Bongrae -> 동일 검증 -> DEPLOY_ENABLED 확인 -> 이미지 빌드 -> 기존 SSH 배포
```

`verify.yml`은 pull_request, workflow_dispatch, workflow_call을 받는다.
`deploy.yml`은 main push 또는 수동 실행 때 이를 호출한다. PR이 없는 작업 브랜치는 로컬 검증을 사용한다.
검증 job에는 배포 Secret을 전달하지 않는다. 하나라도 실패하거나 건너뛰면 quality-gate와 배포가 통과하지 않는다.
문서·하네스 변경도 main push에서는 전체 검증한다. 중복 실행 없이 동일 commit을 검사한 다음 배포한다.

PR 병합 자체를 막으려면 GitHub 저장소의 Rulesets에서 main에 `quality-gate`를 필수 검사로 지정해야 한다.
하네스 파일 추가만으로 저장소의 원격 보호 설정이 바뀌지는 않는다.
필수 검사 이름은 첫 PR 실행 후 GitHub에 표시되는 실제 이름을 선택한다.

## 결과와 문제 해결

| 산출물 | 위치 |
| --- | --- |
| 실행 단계와 통과/실패 JSON | `.harness/verify-<범위>.json` |
| 브라우저 HTML 보고서 | `bongrae-alumni/frontend/playwright-report/index.html` |
| 실패 화면·trace | `bongrae-alumni/frontend/test-results/` |
| Java HTML 보고서 | `bongrae-alumni/backend/build/reports/tests/` |
| Java JUnit XML | `bongrae-alumni/backend/build/test-results/` |

CI는 프론트·백엔드 보고서를 Actions artifacts로 7일 보관한다. 테스트 산출물은 Git에 넣지 않는다.
JSON의 `running`은 중단된 실행일 수 있으므로 통과로 해석하지 않는다. 해당 범위 실행 때 보고서는 교체된다.

- Java 관련 실패: `JAVA_HOME`이 JDK 21인지 확인한다. Windows PATH의 다른 Java와 혼동하지 않는다.
- Docker 연결 실패: Docker Desktop/Engine을 시작하고 backend 검증을 재실행한다.
- 프론트 실패: lint, typecheck, build, test:e2e 중 처음 실패한 단계부터 고친다.
- 3100 포트 충돌: 점유 중인 프로세스를 확인하고 테스트와 무관한 서버를 임의로 종료하지 않는다.
- 권한·네트워크 때문에 검사하지 못했으면 미검증으로 기록한다. Secret이나 운영 DB로 우회하지 않는다.

구성 참고: [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint),
[Playwright 웹 서버](https://playwright.dev/docs/test-webserver),
[Testcontainers JUnit](https://java.testcontainers.org/test_framework_integration/junit_5/).
