#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Run with sudo bash setup-https.sh EMAIL" >&2
    exit 1
fi
if [ "$#" -ne 1 ] || [[ "$1" != *@* ]]; then
    echo "Usage: bash setup-https.sh admin@example.com" >&2
    exit 1
fi

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"
docker compose version >/dev/null

if [ -f docker-compose.override.yml ] && ! cmp -s docker-compose.https.yml docker-compose.override.yml; then
    echo "An existing docker-compose.override.yml needs to be reviewed before HTTPS setup." >&2
    exit 1
fi

apt-get update
apt-get install -y certbot curl
mkdir -p /var/lib/letsencrypt /etc/letsencrypt

if [ -s /etc/letsencrypt/live/bongrae.co.kr/fullchain.pem ]; then
    cp nginx/https.conf nginx/https-active.conf
else
    cp nginx/http-acme.conf nginx/https-active.conf
fi
cp docker-compose.https.yml docker-compose.override.yml
docker compose config --quiet
docker compose up -d --no-deps --force-recreate nginx

for attempt in {1..30}; do
    if curl --fail --silent --max-time 2 http://127.0.0.1/nginx-health >/dev/null; then
        break
    fi
    if [ "$attempt" -eq 30 ]; then
        docker compose logs --tail=50 nginx
        exit 1
    fi
    sleep 2
done

certbot certonly --webroot -w /var/lib/letsencrypt \
    --cert-name bongrae.co.kr -d bongrae.co.kr \
    --email "$1" --agree-tos --non-interactive --keep-until-expiring

cp nginx/https.conf nginx/https-active.conf
if ! docker compose exec -T nginx nginx -t; then
    cp nginx/http-acme.conf nginx/https-active.conf
    echo "HTTPS config validation failed; HTTP config has been restored." >&2
    exit 1
fi
docker compose exec -T nginx nginx -s reload

install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/bash\nset -e\ncd %q\ndocker compose exec -T nginx nginx -t\ndocker compose exec -T nginx nginx -s reload\n' \
    "$project_dir" > /etc/letsencrypt/renewal-hooks/deploy/bongrae-nginx.sh
chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/bongrae-nginx.sh
systemctl enable --now certbot.timer

curl --fail --silent --show-error --resolve bongrae.co.kr:443:127.0.0.1 \
    https://bongrae.co.kr/api/health
printf '\nHTTPS is configured. Next: certbot renew --dry-run --run-deploy-hooks\n'
