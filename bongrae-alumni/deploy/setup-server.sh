#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Run with sudo bash deploy/setup-server.sh" >&2
    exit 1
fi

project_dir=/home/ubuntu/bongrae-alumni
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"
id ubuntu >/dev/null
docker compose version >/dev/null
docker inspect bongrae-backend bongrae-frontend >/dev/null
test -f .env
test -f docker-compose.override.yml
test -f nginx/https-active.conf
command -v python3 >/dev/null
command -v flock >/dev/null
command -v ssh-keygen >/dev/null
command -v visudo >/dev/null
if [ "$(uname -m)" != x86_64 ]; then
    echo "The workflow currently builds linux/amd64 images; configure it for this server architecture first." >&2
    exit 1
fi

install -D -m 0755 "$script_dir/deploy.sh" /usr/local/sbin/bongrae-deploy
install -D -m 0644 "$script_dir/docker-compose.images.yml" /usr/local/share/bongrae/docker-compose.images.yml
install -d -m 0700 /root/.ssh
key_path=/root/.ssh/bongrae-actions
if [ ! -f "$key_path" ]; then
    ssh-keygen -q -t ed25519 -N '' -C github-actions-bongrae -f "$key_path"
fi

install -d -o ubuntu -g "$(id -gn ubuntu)" -m 0700 /home/ubuntu/.ssh
authorized_keys=/home/ubuntu/.ssh/authorized_keys
touch "$authorized_keys"
chmod 0600 "$authorized_keys"
chown "ubuntu:$(id -gn ubuntu)" "$authorized_keys"
key_line="restrict,command=\"sudo -n /usr/local/sbin/bongrae-deploy\" $(< "$key_path.pub")"
if ! grep -qxF "$key_line" "$authorized_keys"; then
    printf '\n%s\n' "$key_line" >> "$authorized_keys"
fi

sudoers_file="$(mktemp)"
trap 'rm -f -- "$sudoers_file"' EXIT
printf 'ubuntu ALL=(root) NOPASSWD: /usr/local/sbin/bongrae-deploy ""\n' > "$sudoers_file"
visudo -cf "$sudoers_file"
install -o root -g root -m 0440 "$sudoers_file" /etc/sudoers.d/bongrae-deploy

printf '\nDeployment key installed. Keep the private key out of chat and Git.\n'
printf 'DEPLOY_SSH_KEY: copy the contents of %s to GitHub Actions secrets.\n' "$key_path"
printf '\nDEPLOY_KNOWN_HOSTS:\n'
printf '1.201.112.33 %s\n' "$(< /etc/ssh/ssh_host_ed25519_key.pub)"
printf '\nAfter adding both secrets, set repository variable DEPLOY_ENABLED=true.\n'
