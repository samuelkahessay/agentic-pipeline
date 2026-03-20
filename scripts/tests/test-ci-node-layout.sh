#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
CI_WORKFLOW="$ROOT_DIR/.github/workflows/ci-node.yml"

grep -F 'bash scripts/resolve-nextjs-app-root.sh' "$CI_WORKFLOW" >/dev/null || {
  echo "FAIL: ci-node.yml must resolve the Next.js app root before running app tests" >&2
  exit 1
}

grep -F 'working-directory: ${{ steps.app-root.outputs.path }}' "$CI_WORKFLOW" >/dev/null || {
  echo "FAIL: ci-node.yml must run app tests from the resolved app root" >&2
  exit 1
}

grep -F "hashFiles('console/package.json')" "$CI_WORKFLOW" >/dev/null || {
  echo "FAIL: ci-node.yml must skip console tests when console/package.json is absent" >&2
  exit 1
}

echo "ci-node layout tests passed"
