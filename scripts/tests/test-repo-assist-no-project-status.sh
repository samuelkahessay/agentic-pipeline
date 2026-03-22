#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SOURCE="$ROOT_DIR/.github/workflows/repo-assist.md"
LOCK="$ROOT_DIR/.github/workflows/repo-assist.lock.yml"

if rg -n "create-project-status-update|create_project_status_update|projects/2|GH_AW_PROJECT_URL|GH_AW_PROJECT_GITHUB_TOKEN" "$SOURCE" "$LOCK" >/dev/null; then
  echo "FAIL: repo-assist workflow should not depend on GitHub Project status updates" >&2
  exit 1
fi

grep -F '/tmp/gh-aw/repo-memory/default/status/pipeline-status.md' "$SOURCE" >/dev/null || {
  echo "FAIL: repo-assist must persist pipeline status to repo-memory markdown" >&2
  exit 1
}

grep -F '/tmp/gh-aw/repo-memory/default/status/pipeline-status.json' "$SOURCE" >/dev/null || {
  echo "FAIL: repo-assist must persist pipeline status to repo-memory JSON" >&2
  exit 1
}

echo "repo-assist no-project-status tests passed"
