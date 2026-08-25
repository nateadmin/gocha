#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/app_gocha"
REMOTE_HOST="${GOCHA_DEPLOY_HOST:-212.47.68.106}"
REMOTE_USER="${GOCHA_DEPLOY_USER:-root}"
REMOTE_PATH="${GOCHA_DEPLOY_PATH:-/var/www/html/gocha}"
SSH_KEY="${GOCHA_SSH_KEY:-}"

if [[ -z "$SSH_KEY" ]]; then
  echo "Set GOCHA_SSH_KEY to the Contabo private key path" >&2
  exit 1
fi

SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)
COMMIT_SHA="$(git -C "$ROOT" rev-parse HEAD)"
RSYNC_SSH="ssh -i ${SSH_KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

echo "Deploying $COMMIT_SHA to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

rsync -az --delete -e "$RSYNC_SSH" \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude 'vendor' \
  --exclude 'storage/logs/*' \
  --exclude 'storage/framework/cache/data/*' \
  "$APP_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" bash -s "$REMOTE_PATH" "$COMMIT_SHA" <<'REMOTE'
set -euo pipefail
REMOTE_PATH="$1"
COMMIT_SHA="$2"
cd "$REMOTE_PATH"
export COMPOSER_ALLOW_SUPERUSER=1
if [[ ! -f .env ]]; then
  cp .env.example .env
fi
composer install --no-dev --optimize-autoloader --no-interaction
if ! grep -q '^APP_KEY=base64:' .env; then
  php artisan key:generate --force
fi
grep -q '^APP_BUILD_SHA=' .env && sed -i "s/^APP_BUILD_SHA=.*/APP_BUILD_SHA=$COMMIT_SHA/" .env || echo "APP_BUILD_SHA=$COMMIT_SHA" >> .env
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache
REMOTE

echo "Deploy complete: $COMMIT_SHA"
