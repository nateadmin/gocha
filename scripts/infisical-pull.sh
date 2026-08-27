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

# Cloud shells sometimes inject a placeholder INFISICAL_TOKEN that breaks export.
if [[ "${INFISICAL_TOKEN:-}" == *"You can use this access token"* ]]; then
  unset INFISICAL_TOKEN
fi

if [[ -z "${INFISICAL_TOKEN:-}" && -n "${INFISICAL_CLIENT_ID:-}" && -n "${INFISICAL_CLIENT_SECRET:-}" ]]; then
  INFISICAL_TOKEN="$(
    infisical login \
      --method=universal-auth \
      --client-id="$INFISICAL_CLIENT_ID" \
      --client-secret="$INFISICAL_CLIENT_SECRET" \
      --plain \
      --silent
  )"
  export INFISICAL_TOKEN
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
    if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
      return 0
    fi
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
