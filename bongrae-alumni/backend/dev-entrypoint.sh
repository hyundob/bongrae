#!/usr/bin/env sh
set -eu

APP_PID=""
LAST_CHECKSUM=""

checksum_sources() {
  {
    find src -type f \( -name "*.java" -o -name "*.yml" -o -name "*.yaml" -o -name "*.properties" -o -name "*.sql" \) -exec sha1sum {} \;
    sha1sum build.gradle settings.gradle 2>/dev/null || true
  } | sort | sha1sum
}

stop_app() {
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  APP_PID=""
}

start_app() {
  echo "[dev] Starting Spring Boot..."
  gradle bootRun --no-daemon &
  APP_PID="$!"
}

trap 'stop_app; exit 0' INT TERM

while true; do
  CURRENT_CHECKSUM="$(checksum_sources)"

  if [ "$CURRENT_CHECKSUM" != "$LAST_CHECKSUM" ]; then
    echo "[dev] Source change detected. Restarting backend..."
    stop_app
    LAST_CHECKSUM="$CURRENT_CHECKSUM"
    start_app
  fi

  if [ -n "$APP_PID" ] && ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "[dev] Backend process stopped. Waiting for next source check..."
    wait "$APP_PID" 2>/dev/null || true
    APP_PID=""
    LAST_CHECKSUM=""
  fi

  sleep 2
done
