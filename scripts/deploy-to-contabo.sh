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

INJECT_ENV_FILE=""
if [[ -x "$ROOT/scripts/infisical-pull.sh" ]] && command -v infisical >/dev/null 2>&1; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/infisical-pull.sh"
  INJECT_ENV_FILE="$(mktemp)"
  chmod 600 "$INJECT_ENV_FILE"
  OPENAI_VALUE="${OPENAI_API_KEY:-${OPEN_AI_API_KEY:-}}"
  if [[ -n "$OPENAI_VALUE" ]]; then
    printf 'OPENAI_API_KEY=%s\n' "$OPENAI_VALUE" >> "$INJECT_ENV_FILE"
  else
    echo "Infisical pull succeeded but OPENAI_API_KEY / OPEN_AI_API_KEY was empty" >&2
  fi
  if [[ -n "${GOOGLE_PLACES_API_KEY:-}" ]]; then
    printf 'GOOGLE_PLACES_API_KEY=%s\n' "$GOOGLE_PLACES_API_KEY" >> "$INJECT_ENV_FILE"
  else
    echo "Infisical pull succeeded but GOOGLE_PLACES_API_KEY was empty" >&2
  fi
  if [[ -n "${FIREBASE_WEB_API_KEY:-}" ]]; then
    printf 'FIREBASE_WEB_API_KEY=%s\n' "$FIREBASE_WEB_API_KEY" >> "$INJECT_ENV_FILE"
  else
    echo "Infisical pull succeeded but FIREBASE_WEB_API_KEY was empty" >&2
  fi
  if [[ -n "${FIREBASE_PROJECT_ID:-}" ]]; then
    printf 'FIREBASE_PROJECT_ID=%s\n' "$FIREBASE_PROJECT_ID" >> "$INJECT_ENV_FILE"
  else
    echo "Infisical pull succeeded but FIREBASE_PROJECT_ID was empty" >&2
  fi
  if [[ -n "${FIREBASE_AUTH_DOMAIN:-}" ]]; then
    printf 'FIREBASE_AUTH_DOMAIN=%s\n' "$FIREBASE_AUTH_DOMAIN" >> "$INJECT_ENV_FILE"
  fi
  if [[ -n "${FIREBASE_APP_ID:-}" ]]; then
    printf 'FIREBASE_APP_ID=%s\n' "$FIREBASE_APP_ID" >> "$INJECT_ENV_FILE"
  fi
  unset OPENAI_VALUE
  if [[ -s "$INJECT_ENV_FILE" ]]; then
    scp -q -i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new \
      "$INJECT_ENV_FILE" "$REMOTE_USER@$REMOTE_HOST:/tmp/gocha-inject.env"
    ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" 'chmod 600 /tmp/gocha-inject.env'
    echo "Prepared Infisical secrets for server .env inject"
  fi
fi

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
if [[ -f /tmp/gocha-inject.env ]]; then
  GOCHA_REMOTE_PATH="$REMOTE_PATH" python3 - <<'PY'
from pathlib import Path
import os
remote = os.environ["GOCHA_REMOTE_PATH"]
env_path = Path(remote) / ".env"
incoming = Path("/tmp/gocha-inject.env")
updates = {}
for raw in incoming.read_text().splitlines():
    if not raw.strip() or "=" not in raw:
        continue
    key, value = raw.split("=", 1)
    if key in {"OPENAI_API_KEY", "GOOGLE_PLACES_API_KEY", "FIREBASE_WEB_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_AUTH_DOMAIN", "FIREBASE_APP_ID"}:
        updates[key] = value.strip()
lines = env_path.read_text().splitlines()
found = set()
out = []
for line in lines:
    key = line.split("=", 1)[0] if "=" in line else ""
    if key in updates:
        out.append(f"{key}={updates[key]}")
        found.add(key)
    else:
        out.append(line)
for key, value in updates.items():
    if key not in found:
        out.append(f"{key}={value}")
env_path.write_text("\n".join(out) + "\n")
incoming.unlink()
print("injected_env_keys=" + ",".join(sorted(updates)))
PY
fi
php artisan migrate --force
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
CRON_LINE="* * * * * cd $REMOTE_PATH && /usr/bin/php artisan schedule:run >> $REMOTE_PATH/storage/logs/scheduler.log 2>&1"
if ! crontab -l 2>/dev/null | grep -F "artisan schedule:run" >/dev/null; then
  (crontab -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -
  echo "scheduler_cron_installed=yes"
else
  echo "scheduler_cron_present=yes"
fi
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache
REMOTE

if [[ -n "$INJECT_ENV_FILE" ]]; then
  rm -f "$INJECT_ENV_FILE"
fi

echo "Deploy complete: $COMMIT_SHA"

WEB_DEPLOY_SCRIPT="$ROOT/scripts/deploy-web-preview-to-contabo.sh"
if [[ -x "$WEB_DEPLOY_SCRIPT" ]]; then
  echo "Publishing mobile web shell to gocha.ai ..."
  GOCHA_SSH_KEY="$SSH_KEY" bash "$WEB_DEPLOY_SCRIPT"
fi
