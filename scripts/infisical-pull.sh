#!/usr/bin/env bash
set -euo pipefail

# Pull secrets from Infisical into the environment. See personal-playbook secrets-management and alerts.
PROJECT_ID="${INFISICAL_PROJECT_ID:-e8bb8347-d16d-4614-930a-94912a2b354e}"
ENVIRONMENT="${INFISICAL_ENVIRONMENT:-prod}"
INFISICAL_HOST="${INFISICAL_HOST:-https://app.infisical.com}"
SECRET_PATH="${INFISICAL_SECRET_PATH:-/}"
MAX_ATTEMPTS="${INFISICAL_PULL_MAX_ATTEMPTS:-3}"
RETRY_SECONDS="${INFISICAL_PULL_RETRY_SECONDS:-30}"

if ! command -v infisical >/dev/null 2>&1; then
  echo "infisical CLI is required" >&2
  exit 1
fi

attempt=1
while [[ "$attempt" -le "$MAX_ATTEMPTS" ]]; do
  if infisical export \
    --domain="$INFISICAL_HOST" \
    --projectId="$PROJECT_ID" \
    --env="$ENVIRONMENT" \
    --path="$SECRET_PATH" \
    --format=dotenv \
    > /tmp/gocha-infisical.env; then
    set -a
    # shellcheck disable=SC1091
    source /tmp/gocha-infisical.env
    set +a
    rm -f /tmp/gocha-infisical.env
    exit 0
  fi

  echo "infisical export attempt $attempt failed" >&2
  if [[ "$attempt" -eq "$MAX_ATTEMPTS" ]]; then
    echo "infisical pull failed after $MAX_ATTEMPTS attempts" >&2
    exit 1
  fi
  sleep "$RETRY_SECONDS"
  attempt=$((attempt + 1))
done
