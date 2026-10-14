#!/usr/bin/env sh
set -eu

UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$UPLOAD_DIR" .

find "$BACKUP_DIR" -name "uploads-*.tar.gz" -type f -mtime +"$RETENTION_DAYS" -delete

echo "Uploads backup saved: $BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
