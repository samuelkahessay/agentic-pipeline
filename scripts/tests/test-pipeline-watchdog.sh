#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SCRIPT="$ROOT_DIR/scripts/pipeline-watchdog.sh"
WORKFLOW="$ROOT_DIR/.github/workflows/pipeline-watchdog.yml"

bash -n "$SCRIPT"

grep -F "run: bash scripts/pipeline-watchdog.sh" "$WORKFLOW" >/dev/null

echo "pipeline-watchdog.sh tests passed"
