#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
CI_WORKFLOW="$ROOT_DIR/.github/workflows/ci-node.yml"

grep -F 'run: bash scripts/validate-implementation.sh' "$CI_WORKFLOW" >/dev/null || {
  echo "FAIL: ci-node.yml must use the shared implementation validator" >&2
  exit 1
}

if grep -F 'npm ci && npm run build' "$CI_WORKFLOW" >/dev/null; then
  echo "FAIL: ci-node.yml must not inline build and test commands" >&2
  exit 1
fi

echo "ci-node layout tests passed"
