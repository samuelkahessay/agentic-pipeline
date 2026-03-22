#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SCRIPT="$ROOT_DIR/scripts/e2e/disable-test-repo-workflows.sh"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

CALLS_FILE="$TMPDIR/calls.log"
STATE_FILE="$TMPDIR/disabled.log"
export CALLS_FILE
export STATE_FILE

cat > "$TMPDIR/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "$*" >> "$CALLS_FILE"

repo_arg() {
  local previous=""
  for arg in "$@"; do
    if [[ "$previous" == "--repo" ]]; then
      printf '%s\n' "$arg"
      return
    fi
    previous="$arg"
  done
}

if [[ "$1" == "repo" && "$2" == "list" ]]; then
  cat <<'OUT'
my-project-e2e-po-1111	samuelkahessay/my-project-e2e-po-1111
customer-portal	samuelkahessay/customer-portal
my-project-e2e-dc-2222	samuelkahessay/my-project-e2e-dc-2222
OUT
  exit 0
fi

if [[ "$1" == "run" && "$2" == "list" ]]; then
  case "$(repo_arg "$@")" in
    samuelkahessay/my-project-e2e-po-1111)
      cat <<'OUT'
101
102
OUT
      ;;
    samuelkahessay/my-project-e2e-dc-2222)
      :
      ;;
    *)
      echo "Unexpected repo for run list: $(repo_arg "$@")" >&2
      exit 1
      ;;
  esac
  exit 0
fi

if [[ "$1" == "run" && "$2" == "cancel" ]]; then
  exit 0
fi

if [[ "$1" == "api" && "$2" == "--method" && "$3" == "PUT" ]]; then
  printf '%s\n' "$4" >> "$STATE_FILE"
  exit 0
fi

if [[ "$1" == "api" && "$2" == "repos/samuelkahessay/my-project-e2e-po-1111/actions/permissions" ]]; then
  if grep -qFx "$2" "$STATE_FILE" 2>/dev/null; then
    echo "false"
    exit 0
  fi
  echo "true"
  exit 0
fi

if [[ "$1" == "api" && "$2" == "repos/samuelkahessay/my-project-e2e-dc-2222/actions/permissions" ]]; then
  echo "false"
  exit 0
fi

echo "Unexpected gh invocation: $*" >&2
exit 1
EOF

chmod +x "$TMPDIR/gh"

PATH="$TMPDIR:$PATH" bash "$SCRIPT" >/dev/null

if ! grep -qF "run cancel 101 --repo samuelkahessay/my-project-e2e-po-1111" "$CALLS_FILE"; then
  echo "FAIL: expected script to cancel in-progress or queued runs before disabling Actions" >&2
  exit 1
fi

if ! grep -qF "run cancel 102 --repo samuelkahessay/my-project-e2e-po-1111" "$CALLS_FILE"; then
  echo "FAIL: expected script to cancel every active run in the matched repo" >&2
  exit 1
fi

if ! grep -qF "api --method PUT repos/samuelkahessay/my-project-e2e-po-1111/actions/permissions -F enabled=false" "$CALLS_FILE"; then
  echo "FAIL: expected script to disable Actions for matched E2E repos that are still enabled" >&2
  exit 1
fi

if grep -qF "customer-portal/actions/permissions" "$CALLS_FILE"; then
  echo "FAIL: expected script to ignore non-E2E repos" >&2
  exit 1
fi

if grep -qF "api --method PUT repos/samuelkahessay/my-project-e2e-dc-2222/actions/permissions -F enabled=false" "$CALLS_FILE"; then
  echo "FAIL: expected script to skip repos that already have Actions disabled" >&2
  exit 1
fi

echo "disable-test-repo-workflows.sh tests passed"
