#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
WORKFLOW="$ROOT_DIR/.github/workflows/pr-review-submit.yml"

ruby -e 'require "yaml"; YAML.load_file(ARGV[0]); puts "yaml-ok"' "$WORKFLOW" >/dev/null

grep -F "scripts/check-autonomy-policy.sh" "$WORKFLOW" >/dev/null
grep -F "autonomy-policy.yml" "$WORKFLOW" >/dev/null
grep -F "policy_artifact_change" "$WORKFLOW" >/dev/null
grep -F "workflow_file_change" "$WORKFLOW" >/dev/null
grep -F "steps.policy.outputs.auto_merge_allowed == 'true'" "$WORKFLOW" >/dev/null
grep -F "AUTO_FOLLOW_UP_ALLOWED" "$WORKFLOW" >/dev/null
grep -F "Autonomous merge blocked by autonomy policy." "$WORKFLOW" >/dev/null

POLICY_STEP_COUNT=$(grep -c "id: policy" "$WORKFLOW")
if [ "$POLICY_STEP_COUNT" -lt 2 ]; then
  echo "FAIL: expected autonomy policy gate in both pr-review-submit jobs" >&2
  exit 1
fi

echo "pr-review-submit.yml policy gate tests passed"
