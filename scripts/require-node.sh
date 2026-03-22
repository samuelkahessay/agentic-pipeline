#!/usr/bin/env bash
set -euo pipefail

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "scripts/require-node.sh must be sourced, not executed." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PIN_FILE="${REPO_NODE_PIN_FILE:-$ROOT_DIR/.nvmrc}"

if [[ ! -f "$PIN_FILE" ]]; then
  echo "Missing Node pin file: $PIN_FILE" >&2
  return 1
fi

REQUIRED_VERSION="$(tr -d '[:space:]' < "$PIN_FILE")"
REQUIRED_MAJOR="${REQUIRED_VERSION%%.*}"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but not installed." >&2
  return 1
fi

CURRENT_VERSION="$(node -p 'process.versions.node' 2>/dev/null || echo "")"
CURRENT_MAJOR="${CURRENT_VERSION%%.*}"

if [[ "$CURRENT_MAJOR" == "$REQUIRED_MAJOR" ]]; then
  return 0
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  if nvm use "$REQUIRED_VERSION" >/dev/null 2>&1 || nvm use "$REQUIRED_MAJOR" >/dev/null 2>&1; then
    CURRENT_VERSION="$(node -p 'process.versions.node' 2>/dev/null || echo "")"
    CURRENT_MAJOR="${CURRENT_VERSION%%.*}"
    if [[ "$CURRENT_MAJOR" == "$REQUIRED_MAJOR" ]]; then
      return 0
    fi
  fi
fi

echo "Node ${REQUIRED_MAJOR}.x is required by this repo, but the current shell is ${CURRENT_VERSION:-unknown}." >&2
echo "Run 'nvm use ${REQUIRED_MAJOR}' or install the pinned runtime before running repo scripts." >&2
return 1
