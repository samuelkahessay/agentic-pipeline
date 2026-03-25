#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
PROMPT="$ROOT_DIR/.github/workflows/pr-review-agent.md"

grep -F 'Read `## Existing Contracts to Read` and `## Required Validation` from the linked issue.' "$PROMPT" >/dev/null || {
  echo "FAIL: pr-review-agent must read linked issue contract sections" >&2
  exit 1
}

grep -F 'Request changes if the PR body lacks a `## Validation` section' "$PROMPT" >/dev/null || {
  echo "FAIL: pr-review-agent must require validation evidence in the PR body" >&2
  exit 1
}

grep -F 'Request changes if DB writes use fields that do not match the current schema/migrations.' "$PROMPT" >/dev/null || {
  echo "FAIL: pr-review-agent must reject schema drift" >&2
  exit 1
}

grep -F 'Request changes if a new caller and route disagree on auth/session behavior.' "$PROMPT" >/dev/null || {
  echo "FAIL: pr-review-agent must reject auth boundary mismatches" >&2
  exit 1
}

grep -F 'lacks at least one real boundary test for the in-scope behavior' "$PROMPT" >/dev/null || {
  echo "FAIL: pr-review-agent must require a real boundary test for contract-heavy changes" >&2
  exit 1
}

echo "pr-review-agent validation review tests passed"
