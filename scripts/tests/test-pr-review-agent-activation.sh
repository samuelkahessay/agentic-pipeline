#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
WORKFLOW="$ROOT_DIR/.github/workflows/pr-review-agent.lock.yml"

grep -F "      - name: Activate same-repo pull request without membership gate" "$WORKFLOW" >/dev/null
grep -F "steps.activate_pull_request.outputs.activated == 'true' || steps.check_membership.outputs.is_team_member == 'true'" "$WORKFLOW" >/dev/null
grep -F "if: steps.activate_pull_request.outputs.activated != 'true'" "$WORKFLOW" >/dev/null

echo "pr-review-agent.lock.yml activation tests passed"
