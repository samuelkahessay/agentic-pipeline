#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

source "$ROOT/scripts/require-node.sh"

node "$ROOT/scripts/e2e/harness.js" "$@"
