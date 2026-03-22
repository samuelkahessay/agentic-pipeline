#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "codex OpenAI lock patch skipped: no workflows specified"
  exit 0
fi

for workflow in "$@"; do
  [ -f "$workflow" ] || continue
  echo "codex OpenAI lock patch skipped: $workflow"
done
