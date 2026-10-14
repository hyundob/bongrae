# GitHub Push Deployment

`main`에 push하면 GitHub Actions가 프론트와 백엔드 이미지를 빌드합니다.
이미지는 SSH로 전송되므로 별도 컨테이너 레지스트리나 서버 Git 인증이 필요 없습니다.
배포는 저장소 변수 `DEPLOY_ENABLED=true`인 경우에만 실행됩니다.

## 최초 서버 설정

현재 서버 기준: Ubuntu, SSH `ubuntu@1.201.112.33:22`,
프로젝트 경로 `/home/ubuntu/bongrae-alumni`, 기존 HTTPS 설정 완료 상태.

1. WinSCP로 이 `deploy` 폴더를 서버의 `/home/ubuntu/bongrae-alumni/deploy`에 업로드합니다.
2. 서버 root 터미널에서 실행합니다.

```bash
cd /home/ubuntu/bongrae-alumni
bash deploy/setup-server.sh
```

서버의 기존 SSH 키는 유지하고 배포 전용 키를 하나 추가합니다.
새 키에는 포트포워딩/PTY를 금지하고 고정 배포 명령만 실행하도록 제한합니다.
서버는 `/usr/local/sbin/bongrae-deploy`와 별도의 이미지 선택용 Compose 설정을 사용합니다.
스크립트를 나중에 수정하면 업로드 후 위 설치 명령을 다시 실행합니다.

## GitHub 설정

저장소: https://github.com/hyundob/bongrae/settings/secrets/actions

Settings > Secrets and variables > Actions > Secrets에서 아래 두 항목을 만듭니다.

| Secret | 값 |
| --- | --- |
| `DEPLOY_SSH_KEY` | 서버 `/root/.ssh/bongrae-actions`의 전체 내용 |
| `DEPLOY_KNOWN_HOSTS` | 설치 스크립트가 출력한 `1.201.112.33 ssh-ed25519 ...` 한 줄 |

개인키는 서버 터미널에서 아래 명령으로 확인하고 GitHub Secret에 직접 입력합니다.
채팅, 코드, 로그 또는 일반 저장소 변수에는 넣지 않습니다.

```bash
cat /root/.ssh/bongrae-actions
```

Variables 탭에 저장소 변수 `DEPLOY_ENABLED`를 값 `true`로 추가합니다.
`DEPLOY_HOST`는 선택 항목이며 기본값은 `1.201.112.33`입니다.
호스트/IP를 변경하면 서버 호스트 키도 신뢰할 수 있는 경로에서 확인해
`DEPLOY_KNOWN_HOSTS`를 새 호스트 이름에 맞게 갱신합니다.

서버 클라우드 방화벽에서 GitHub-hosted runner의 SSH 연결이 허용되어 있어야 합니다.
현재 SSH가 특정 PC IP에만 허용된 경우 해당 정책을 먼저 조정해야 합니다.
이미 열려 있는 SSH 규칙을 삭제하거나, 접속 가능한지 확인 없이 변경하지 않습니다.

## 최초 실행과 이후 사용

GitHub > Actions > Deploy Bongrae > Run workflow > main에서 최초 실행합니다.
이후 `main`에 프로젝트 변경사항을 push하면 같은 작업이 자동 실행됩니다.
기능 브랜치 push는 배포하지 않습니다.

서버에서는 빌드하지 않고 두 이미지를 로드한 뒤 해당 컨테이너만 교체합니다.
교체 뒤 Nginx를 reload하여 새 컨테이너 IP를 반영하고 HTTPS 홈페이지/API를 확인합니다.
기존 PostgreSQL 컨테이너, 볼륨, uploads, `.env`, 인증서는 재생성하지 않습니다.
컨테이너 교체 중 잠깐 연결이 끊길 수 있으므로 무중단 배포는 아닙니다.

현재 리비전은 `/home/ubuntu/bongrae-alumni/.deploy/current-revision`에 기록됩니다.
실패하면 바로 이전 앱 이미지로 복구를 시도하고 GitHub 작업은 실패로 표시됩니다.
DB 스키마 변경까지 되돌리는 기능은 아니므로 파괴적인 DB 변경은 자동 배포에 넣지 않습니다.

서버 소스 파일은 동기화하지 않습니다. 배포 후 서버에서 예전 소스로
`docker compose up --build`하면 이전 코드로 돌아갈 수 있으니 이후 앱 배포는 Actions를 사용합니다.
Compose/Nginx/환경변수 변경은 서버 설정 작업으로 따로 반영합니다.
이전 이미지는 복구를 위해 보관하므로 디스크 사용량을 주기적으로 확인합니다.

일시 중지는 `DEPLOY_ENABLED=false`로 설정합니다. 사이트 자체는 계속 실행됩니다.
