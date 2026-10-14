#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
test_root="$(mktemp -d)"
cleanup_tests() {
    local result=$?
    if [ "$result" -ne 0 ] && [ -n "${scenario_dir:-}" ]; then
        echo "FAIL: ${scenario:-unknown}" >&2
        test ! -f "$scenario_dir/output.log" || cat "$scenario_dir/output.log" >&2
    fi
    rm -rf -- "$test_root"
    return "$result"
}
trap cleanup_tests EXIT
mkdir -p "$test_root/bin"
bash -n "$script_dir/deploy.sh"
bash -n "$script_dir/setup-server.sh"

# Git Bash lacks flock and may resolve python3 to a Windows Store launcher.
if [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]]; then
    printf '#!/usr/bin/env bash\nexit 0\n' > "$test_root/bin/flock"
    printf '#!/usr/bin/env bash\nexec python "$@"\n' > "$test_root/bin/python3"
    printf '#!/usr/bin/env bash\nmkdir -p "${@: -1}"\n' > "$test_root/bin/install"
fi

cat > "$test_root/bin/id" <<'SH'
#!/usr/bin/env bash
printf '0\n'
SH

cat > "$test_root/bin/docker" <<'SH'
#!/usr/bin/env bash
set -eu
printf '%s|%s|%s\n' "$*" "${BACKEND_IMAGE:-}" "${FRONTEND_IMAGE:-}" >> "$MOCK_LOG"
if [ "$1" = inspect ]; then
    if [[ "$*" == *com.docker.compose.project* ]]; then
        echo bongrae-alumni
    elif [[ "$*" == *bongrae-backend* ]]; then
        echo sha256:previous-backend
    else
        echo sha256:previous-frontend
    fi
elif [ "$1 $2" = 'image inspect' ]; then
    echo "$TEST_REVISION"
elif [ "$1" = compose ] && [[ "$*" == *' up '* ]]; then
    if [[ "$BACKEND_IMAGE" == sha256:previous-backend ]]; then
        echo previous > "$MOCK_STATE"
    else
        echo new > "$MOCK_STATE"
        if [ "$TEST_MODE" = unhealthy ]; then
            exit 1
        fi
    fi
fi
SH

cat > "$test_root/bin/curl" <<'SH'
#!/usr/bin/env bash
if [ "$TEST_MODE" = site-failure ] && [ "$(< "$MOCK_STATE")" = new ]; then
    exit 22
fi
SH

cat > "$test_root/bin/sleep" <<'SH'
#!/usr/bin/env bash
exit 0
SH

chmod +x "$test_root/bin/"*
export PATH="$test_root/bin:$PATH"
export TEST_REVISION=0123456789abcdef0123456789abcdef01234567

for scenario in success unhealthy site-failure invalid-revision traversal; do
    scenario_dir="$test_root/$scenario"
    export BONGRAE_PROJECT_DIR="$scenario_dir/project"
    export BONGRAE_IMAGE_CONFIG="$script_dir/docker-compose.images.yml"
    export MOCK_LOG="$scenario_dir/docker.log" MOCK_STATE="$scenario_dir/state" TEST_MODE="$scenario"
    mkdir -p "$BONGRAE_PROJECT_DIR/nginx" "$BONGRAE_PROJECT_DIR/uploads"
    printf 'DO_NOT_CHANGE\n' > "$BONGRAE_PROJECT_DIR/.env"
    printf 'DO_NOT_CHANGE\n' > "$BONGRAE_PROJECT_DIR/nginx/https-active.conf"
    printf 'DO_NOT_CHANGE\n' > "$BONGRAE_PROJECT_DIR/uploads/existing.txt"
    touch "$BONGRAE_PROJECT_DIR/docker-compose.yml" "$BONGRAE_PROJECT_DIR/docker-compose.override.yml"
    python3 - "$scenario_dir/release.tar" "$scenario" "$TEST_REVISION" <<'PY'
import io
import sys
import tarfile

archive_path, mode, revision = sys.argv[1:]
if mode == "invalid-revision":
    revision = "not-a-commit"
with tarfile.open(archive_path, "w") as archive:
    for name, content in [("revision", revision.encode()), ("images.tar.gz", b"mock image archive")]:
        if mode == "traversal" and name == "images.tar.gz":
            name = "../images.tar.gz"
        member = tarfile.TarInfo(name)
        member.size = len(content)
        archive.addfile(member, io.BytesIO(content))
PY
    result=0
    bash "$script_dir/deploy.sh" < "$scenario_dir/release.tar" > "$scenario_dir/output.log" 2>&1 || result=$?
    if [ "$scenario" = success ]; then
        test "$result" = 0
        test "$(< "$BONGRAE_PROJECT_DIR/.deploy/current-revision")" = "$TEST_REVISION"
        grep -q "Deployment succeeded" "$scenario_dir/output.log"
    else
        test "$result" != 0
        test ! -f "$BONGRAE_PROJECT_DIR/.deploy/current-revision"
        if [[ "$scenario" == unhealthy || "$scenario" == site-failure ]]; then
            test "$(< "$MOCK_STATE")" = previous
            grep -q "Previous application images restored" "$scenario_dir/output.log"
        else
            if grep -q 'image load\| up ' "$MOCK_LOG"; then
                echo "Rejected archive reached Docker deployment" >&2
                exit 1
            fi
        fi
    fi
    for preserved in .env nginx/https-active.conf uploads/existing.txt; do
        test "$(< "$BONGRAE_PROJECT_DIR/$preserved")" = DO_NOT_CHANGE
    done
    test -z "$(find "$BONGRAE_PROJECT_DIR/.deploy" -maxdepth 1 -type d -name 'incoming.*' -print)"
    printf 'PASS: %s\n' "$scenario"
done
