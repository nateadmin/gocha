#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_HOST="${GOCHA_DEPLOY_HOST:-212.47.68.106}"
REMOTE_USER="${GOCHA_DEPLOY_USER:-root}"
REMOTE_PATH="${GOCHA_DEPLOY_PATH:-/var/www/html/gocha}"
SSH_KEY="${GOCHA_SSH_KEY:-}"
APP_HOST="${GOCHA_APP_HOSTNAME:-app.gocha.ai}"

if [[ -z "$SSH_KEY" ]]; then
  echo "Set GOCHA_SSH_KEY to the Contabo private key path" >&2
  exit 1
fi

SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
RSYNC_SSH="ssh -i ${SSH_KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

echo "Configuring nginx and TLS for ${APP_HOST} on ${REMOTE_USER}@${REMOTE_HOST}"

rsync -az -e "$RSYNC_SSH" \
  "$ROOT/deploy/nginx/app.gocha.ai.http.conf" \
  "$REMOTE_USER@$REMOTE_HOST:/etc/nginx/sites-available/app.gocha.ai"

ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" bash -s "$APP_HOST" <<'REMOTE'
set -euo pipefail
APP_HOST="$1"
ln -sf /etc/nginx/sites-available/app.gocha.ai /etc/nginx/sites-enabled/app.gocha.ai
nginx -t
systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/${APP_HOST}/fullchain.pem" ]]; then
  CERTBOT_EMAIL="$(grep -m1 '^email' /etc/letsencrypt/renewal/gocha.ai.conf 2>/dev/null | awk '{print $3}' || true)"
  if [[ -z "$CERTBOT_EMAIL" ]]; then
    CERTBOT_EMAIL="admin@${APP_HOST#app.}"
  fi
  certbot --nginx -d "$APP_HOST" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect
fi

if [[ -f "/etc/letsencrypt/live/${APP_HOST}/fullchain.pem" ]]; then
  echo "tls_cert_present=yes"
else
  echo "tls_cert_present=no" >&2
  exit 1
fi
REMOTE

if [[ -f "$ROOT/deploy/nginx/gocha.ai.redirect.conf.template" ]]; then
  rsync -az -e "$RSYNC_SSH" \
    "$ROOT/deploy/nginx/gocha.ai.redirect.conf.template" \
    "$REMOTE_USER@$REMOTE_HOST:/etc/nginx/sites-available/gocha.ai"
  ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" 'nginx -t && systemctl reload nginx'
fi

echo "Host setup complete: https://${APP_HOST}/"
