#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/mobile/gocha-app"
REMOTE_HOST="${GOCHA_DEPLOY_HOST:-212.47.68.106}"
REMOTE_USER="${GOCHA_DEPLOY_USER:-root}"
REMOTE_PATH="${GOCHA_WEB_PREVIEW_PATH:-/var/www/html/gocha-preview}"
SSH_KEY="${GOCHA_SSH_KEY:-}"

if [[ -z "$SSH_KEY" ]]; then
  echo "Set GOCHA_SSH_KEY to the Contabo private key path" >&2
  exit 1
fi

RSYNC_SSH="ssh -i ${SSH_KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

echo "Building web preview..."
(
  cd "$APP_DIR"
  VITE_BASE_PATH=/ npm run build:web
)

echo "Publishing to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
rsync -az --delete -e "$RSYNC_SSH" \
  "$APP_DIR/web/dist/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"

echo "Web preview: http://${REMOTE_HOST}:8843/"
