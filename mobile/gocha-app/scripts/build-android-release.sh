#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT/android"
PROPS_FILE="$ANDROID_DIR/keystore.properties"

export GOCHA_ANDROID_KEYSTORE="${GOCHA_ANDROID_KEYSTORE:-}"
export GOCHA_ANDROID_KEYSTORE_PASSWORD="${GOCHA_ANDROID_KEYSTORE_PASSWORD:-}"
export GOCHA_ANDROID_KEY_ALIAS="${GOCHA_ANDROID_KEY_ALIAS:-gocha-upload}"
export GOCHA_ANDROID_KEY_PASSWORD="${GOCHA_ANDROID_KEY_PASSWORD:-}"

if [[ -z "$GOCHA_ANDROID_KEYSTORE" && -f "$PROPS_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$PROPS_FILE"
  GOCHA_ANDROID_KEYSTORE="${storeFile:-}"
  GOCHA_ANDROID_KEYSTORE_PASSWORD="${storePassword:-}"
  GOCHA_ANDROID_KEY_ALIAS="${keyAlias:-gocha-upload}"
  GOCHA_ANDROID_KEY_PASSWORD="${keyPassword:-}"
  if [[ "$GOCHA_ANDROID_KEYSTORE" != /* ]]; then
    GOCHA_ANDROID_KEYSTORE="$ANDROID_DIR/$GOCHA_ANDROID_KEYSTORE"
  fi
  export GOCHA_ANDROID_KEYSTORE GOCHA_ANDROID_KEYSTORE_PASSWORD GOCHA_ANDROID_KEY_ALIAS GOCHA_ANDROID_KEY_PASSWORD
fi

if [[ -z "$GOCHA_ANDROID_KEYSTORE" || ! -f "$GOCHA_ANDROID_KEYSTORE" ]]; then
  echo "Release keystore not found. Set GOCHA_ANDROID_KEYSTORE or create android/keystore.properties" >&2
  echo "See android/keystore.properties.example" >&2
  exit 1
fi

cd "$ANDROID_DIR"
./gradlew bundleRelease

echo "AAB: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
