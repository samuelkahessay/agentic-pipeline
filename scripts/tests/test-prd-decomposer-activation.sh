#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
WORKFLOW="$ROOT_DIR/.github/workflows/prd-decomposer.lock.yml"

grep -F "if: >" "$WORKFLOW" >/dev/null
grep -F "activated: \${{ (steps.check_membership.outputs.is_team_member == 'true') && (steps.check_command_position.outputs.command_position_ok == 'true') }}" "$WORKFLOW" >/dev/null
grep -F "GH_AW_REQUIRED_ROLES: admin,maintainer,write" "$WORKFLOW" >/dev/null
grep -F "GH_AW_ALLOWED_BOTS: prd-to-prod-pipeline" "$WORKFLOW" >/dev/null
grep -F "      - name: Check team membership for command workflow" "$WORKFLOW" >/dev/null

echo "prd-decomposer.lock.yml activation tests passed"
