#!/usr/bin/env bash
set -euo pipefail

project_dir=${BONGRAE_PROJECT_DIR:-/home/ubuntu/bongrae-alumni}
image_config=${BONGRAE_IMAGE_CONFIG:-/usr/local/share/bongrae/docker-compose.images.yml}

if [ "$(id -u)" -ne 0 ] || [ "$#" -ne 0 ]; then
    echo "This deployment entry point must run as root without arguments." >&2
    exit 1
fi

cd "$project_dir"
test -f .env
test -f docker-compose.override.yml
test -f nginx/https-active.conf
test -f "$image_config"
command -v python3 >/dev/null
command -v curl >/dev/null

install -d -m 0700 .deploy
exec 9>.deploy/deploy.lock
flock -w 1800 9 || { echo "Another deployment is still running." >&2; exit 1; }

project_name="$(docker inspect --format '{{ index .Config.Labels "com.docker.compose.project" }}' bongrae-backend)"
previous_backend="$(docker inspect --format '{{.Image}}' bongrae-backend)"
previous_frontend="$(docker inspect --format '{{.Image}}' bongrae-frontend)"
test -n "$project_name"

incoming="$(mktemp -d "$project_dir/.deploy/incoming.XXXXXX")"
cleanup() {
    rm -f -- "$incoming/release.tar" "$incoming/revision" "$incoming/images.tar.gz"
    rmdir -- "$incoming"
}
trap cleanup EXIT

# Only the two data files are accepted; the SSH key cannot submit a shell script.
cat > "$incoming/release.tar"
python3 - "$incoming" <<'PY'
import pathlib
import re
import shutil
import sys
import tarfile

destination = pathlib.Path(sys.argv[1])
with tarfile.open(destination / "release.tar", "r:") as archive:
    members = archive.getmembers()
    if len(members) != 2 or {member.name for member in members} != {"revision", "images.tar.gz"}:
        raise SystemExit("Unexpected deployment archive members")
    if not all(member.isfile() for member in members):
        raise SystemExit("Deployment archive must contain regular files only")
    revision_member = archive.getmember("revision")
    if revision_member.size > 41:
        raise SystemExit("Invalid revision file size")
    revision = archive.extractfile(revision_member).read().decode("ascii").strip()
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise SystemExit("Invalid revision")
    (destination / "revision").write_text(revision, encoding="ascii")
    with archive.extractfile("images.tar.gz") as source, (destination / "images.tar.gz").open("wb") as target:
        shutil.copyfileobj(source, target)
PY

revision="$(< "$incoming/revision")"
echo "Loading release $revision"
docker image load --input "$incoming/images.tar.gz"
export BACKEND_IMAGE="bongrae-alumni-backend:$revision"
export FRONTEND_IMAGE="bongrae-alumni-frontend:$revision"
for image_name in "$BACKEND_IMAGE" "$FRONTEND_IMAGE"; do
    image_revision="$(docker image inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' "$image_name")"
    if [ "$image_revision" != "$revision" ]; then
        echo "Image revision does not match the release." >&2
        exit 1
    fi
done

compose_args=(--project-name "$project_name" --env-file "$project_dir/.env"
    -f "$project_dir/docker-compose.yml"
    -f "$project_dir/docker-compose.override.yml"
    -f "$image_config")
compose() {
    docker compose "${compose_args[@]}" "$@"
}
reload_nginx() {
    compose exec -T nginx nginx -t && compose exec -T nginx nginx -s reload
}
check_site() {
    local attempt
    for attempt in {1..15}; do
        if curl --noproxy '*' --fail --silent --max-time 10 \
            --resolve bongrae.co.kr:443:127.0.0.1 https://bongrae.co.kr/api/health >/dev/null \
            && curl --noproxy '*' --fail --silent --max-time 10 \
            --resolve bongrae.co.kr:443:127.0.0.1 https://bongrae.co.kr/ >/dev/null; then
            return 0
        fi
        sleep 2
    done
    return 1
}

compose config --quiet
if compose up -d --no-build --pull never --no-deps --wait --wait-timeout 240 backend frontend \
    && reload_nginx && check_site; then
    printf 'BACKEND_IMAGE=%s\nFRONTEND_IMAGE=%s\n' "$BACKEND_IMAGE" "$FRONTEND_IMAGE" > .deploy/current-images.env
    printf '%s\n' "$revision" > .deploy/current-revision
    echo "Deployment succeeded: $revision"
else
    echo "Deployment failed. Restoring previous application images." >&2
    compose logs --tail=50 backend frontend >&2 || true
    export BACKEND_IMAGE="$previous_backend" FRONTEND_IMAGE="$previous_frontend"
    if compose up -d --no-build --pull never --no-deps --wait --wait-timeout 240 backend frontend \
        && reload_nginx && check_site; then
        echo "Previous application images restored." >&2
    else
        echo "Rollback failed; check docker compose ps and application logs." >&2
    fi
    exit 1
fi
