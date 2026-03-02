#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SCRIPT="$ROOT_DIR/scripts/log-decision.sh"
LEDGER_DOC="$ROOT_DIR/docs/decision-ledger/README.md"
SEED_DIR="$ROOT_DIR/drills/decisions"

bash -n "$SCRIPT"
test -f "$LEDGER_DOC"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

OUTPUT_PATH=$(
  bash "$SCRIPT" \
    --output-dir "$TMPDIR" \
    --timestamp "2026-03-02T20:18:40Z" \
    --event-id "demo-autonomous-merge" \
    --actor-type workflow \
    --actor-name pr-review-submit \
    --workflow pr-review-submit \
    --requested-action auto_merge_pipeline_pr \
    --policy-result autonomous \
    --target-type pull_request \
    --target-id 284 \
    --target-display "[Pipeline] PR #284" \
    --evidence "Formal APPROVE review posted" \
    --evidence "Required checks green" \
    --outcome acted \
    --summary "Auto-merge armed after approval on PR #284."
)

test -f "$OUTPUT_PATH"

printf '%s' "$OUTPUT_PATH" | grep -F "$TMPDIR/demo-autonomous-merge.json" >/dev/null
jq -e '.schema_version == 1' "$OUTPUT_PATH" >/dev/null
jq -e '.event_id == "demo-autonomous-merge"' "$OUTPUT_PATH" >/dev/null
jq -e '.policy_result.mode == "autonomous"' "$OUTPUT_PATH" >/dev/null
jq -e '.policy_result.reason == null' "$OUTPUT_PATH" >/dev/null
jq -e '.evidence | length == 2' "$OUTPUT_PATH" >/dev/null
jq -e '.outcome == "acted"' "$OUTPUT_PATH" >/dev/null

if bash "$SCRIPT" \
  --output-dir "$TMPDIR" \
  --actor-type workflow \
  --actor-name pr-review-submit \
  --workflow pr-review-submit \
  --requested-action workflow_file_change \
  --policy-result human_required \
  --target-type file \
  --target-path ".github/workflows/auto-dispatch.yml" \
  --evidence "Workflow file touched" \
  --outcome blocked \
  --summary "Blocked workflow change" >/dev/null 2>&1; then
  echo "FAIL: human_required event should require --policy-reason" >&2
  exit 1
fi

SEED_COUNT=$(find "$SEED_DIR" -maxdepth 1 -name '*.json' | wc -l | tr -d ' ')
if [ "$SEED_COUNT" -lt 3 ]; then
  echo "FAIL: expected at least 3 seed decision events" >&2
  exit 1
fi

while IFS= read -r seed_file; do
  jq -e '.schema_version == 1' "$seed_file" >/dev/null
  jq -e '.actor.type | length > 0' "$seed_file" >/dev/null
  jq -e '.workflow | length > 0' "$seed_file" >/dev/null
  jq -e '.requested_action | length > 0' "$seed_file" >/dev/null
  jq -e '.policy_result.mode == "autonomous" or .policy_result.mode == "human_required"' "$seed_file" >/dev/null
  jq -e '.target.type | length > 0' "$seed_file" >/dev/null
  jq -e '.evidence | length > 0' "$seed_file" >/dev/null
  jq -e '.summary | length > 0' "$seed_file" >/dev/null
done < <(find "$SEED_DIR" -maxdepth 1 -name '*.json' | sort)

echo "log-decision.sh tests passed"
