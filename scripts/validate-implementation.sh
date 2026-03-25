#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

run_in_dir() {
  local dir="$1"
  shift
  echo "▸ ($dir) $*"
  (
    cd "$dir"
    "$@"
  )
}

PROFILE="$(tr -d '[:space:]' < "$ROOT_DIR/.deploy-profile" 2>/dev/null || true)"
[ -n "$PROFILE" ] || fail ".deploy-profile is missing or empty"

PROFILE_FILE="$ROOT_DIR/.github/deploy-profiles/$PROFILE.yml"
[ -f "$PROFILE_FILE" ] || fail "Deploy profile file not found: .github/deploy-profiles/$PROFILE.yml"

if [ -f "$ROOT_DIR/scripts/require-node.sh" ]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/scripts/require-node.sh"
fi

case "$PROFILE" in
  nextjs-vercel)
    ;;
  *)
    fail "Unsupported deploy profile '$PROFILE' in scripts/validate-implementation.sh"
    ;;
esac

APP_ROOT="$(bash "$ROOT_DIR/scripts/resolve-nextjs-app-root.sh" "$ROOT_DIR")"
APP_DIR="$ROOT_DIR"
if [ "$APP_ROOT" != "." ]; then
  APP_DIR="$ROOT_DIR/$APP_ROOT"
fi

[ -f "$APP_DIR/package.json" ] || fail "Resolved app root '$APP_ROOT' does not contain package.json"

run_in_dir "$APP_DIR" npm ci
run_in_dir "$APP_DIR" npm run build
run_in_dir "$APP_DIR" npm test

if [ -f "$ROOT_DIR/console/package.json" ]; then
  run_in_dir "$ROOT_DIR/console" npm ci
  run_in_dir "$ROOT_DIR/console" npm test
fi

echo "Implementation validation passed for profile '$PROFILE'"
