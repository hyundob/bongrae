#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-alumni_user}" "${POSTGRES_DB:-alumni_db}" \
  | gzip > "$BACKUP_DIR/alumni-db-$TIMESTAMP.sql.gz"

find "$BACKUP_DIR" -name "alumni-db-*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "DB backup saved: $BACKUP_DIR/alumni-db-$TIMESTAMP.sql.gz"
