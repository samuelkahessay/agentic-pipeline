#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: log-decision.sh [options]

Options:
  --output-dir PATH
  --timestamp ISO8601_UTC
  --event-id ID
  --actor-type TYPE
  --actor-name NAME
  --workflow NAME
  --requested-action ACTION
  --policy-result MODE
  --policy-reason TEXT
  --target-type TYPE
  --target-id ID
  --target-path PATH
  --target-display TEXT
  --evidence TEXT
  --outcome VALUE
  --summary TEXT
  --human-owner NAME
USAGE
  exit 1
}

OUTPUT_DIR="drills/decisions"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EVENT_ID=""
ACTOR_TYPE=""
ACTOR_NAME=""
WORKFLOW_NAME=""
REQUESTED_ACTION=""
POLICY_RESULT=""
POLICY_REASON=""
TARGET_TYPE=""
TARGET_ID=""
TARGET_PATH=""
TARGET_DISPLAY=""
OUTCOME=""
SUMMARY=""
HUMAN_OWNER=""
EVIDENCE=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output-dir) OUTPUT_DIR="$2"; shift 2 ;;
    --timestamp) TIMESTAMP="$2"; shift 2 ;;
    --event-id) EVENT_ID="$2"; shift 2 ;;
    --actor-type) ACTOR_TYPE="$2"; shift 2 ;;
    --actor-name) ACTOR_NAME="$2"; shift 2 ;;
    --workflow) WORKFLOW_NAME="$2"; shift 2 ;;
    --requested-action) REQUESTED_ACTION="$2"; shift 2 ;;
    --policy-result) POLICY_RESULT="$2"; shift 2 ;;
    --policy-reason) POLICY_REASON="$2"; shift 2 ;;
    --target-type) TARGET_TYPE="$2"; shift 2 ;;
    --target-id) TARGET_ID="$2"; shift 2 ;;
    --target-path) TARGET_PATH="$2"; shift 2 ;;
    --target-display) TARGET_DISPLAY="$2"; shift 2 ;;
    --evidence) EVIDENCE+=("$2"); shift 2 ;;
    --outcome) OUTCOME="$2"; shift 2 ;;
    --summary) SUMMARY="$2"; shift 2 ;;
    --human-owner) HUMAN_OWNER="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; usage ;;
  esac
done

required_vars=(
  ACTOR_TYPE
  ACTOR_NAME
  WORKFLOW_NAME
  REQUESTED_ACTION
  POLICY_RESULT
  TARGET_TYPE
  OUTCOME
  SUMMARY
)

for required_var in "${required_vars[@]}"; do
  if [ -z "${!required_var:-}" ]; then
    echo "Missing required value: ${required_var}" >&2
    exit 1
  fi
done

if [ "${#EVIDENCE[@]}" -eq 0 ]; then
  echo "At least one --evidence value is required" >&2
  exit 1
fi

case "$ACTOR_TYPE" in
  workflow|agent|human|service) ;;
  *)
    echo "Invalid --actor-type: ${ACTOR_TYPE}" >&2
    exit 1
    ;;
esac

case "$POLICY_RESULT" in
  autonomous|human_required) ;;
  *)
    echo "Invalid --policy-result: ${POLICY_RESULT}" >&2
    exit 1
    ;;
esac

case "$OUTCOME" in
  acted|blocked|queued_for_human|escalated) ;;
  *)
    echo "Invalid --outcome: ${OUTCOME}" >&2
    exit 1
    ;;
esac

if [ "$POLICY_RESULT" = "human_required" ] && [ -z "$POLICY_REASON" ]; then
  echo "--policy-reason is required when --policy-result is human_required" >&2
  exit 1
fi

if [ -z "$TARGET_DISPLAY" ]; then
  if [ -n "$TARGET_PATH" ]; then
    TARGET_DISPLAY="$TARGET_PATH"
  elif [ -n "$TARGET_ID" ]; then
    TARGET_DISPLAY="${TARGET_TYPE}:${TARGET_ID}"
  else
    TARGET_DISPLAY="$TARGET_TYPE"
  fi
fi

sanitize_slug() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//'
}

if [ -z "$EVENT_ID" ]; then
  EVENT_ID="$(sanitize_slug "${TIMESTAMP}")-$(sanitize_slug "${REQUESTED_ACTION}")-$(sanitize_slug "${OUTCOME}")"
fi

mkdir -p "$OUTPUT_DIR"

EVIDENCE_FILE=$(mktemp)
cleanup() {
  rm -f "$EVIDENCE_FILE"
}
trap cleanup EXIT

printf '%s\n' "${EVIDENCE[@]}" > "$EVIDENCE_FILE"

OUTPUT_PATH="${OUTPUT_DIR}/${EVENT_ID}.json"

ruby - "$OUTPUT_PATH" "$TIMESTAMP" "$EVENT_ID" "$ACTOR_TYPE" "$ACTOR_NAME" "$WORKFLOW_NAME" "$REQUESTED_ACTION" "$POLICY_RESULT" "$POLICY_REASON" "$TARGET_TYPE" "$TARGET_ID" "$TARGET_PATH" "$TARGET_DISPLAY" "$OUTCOME" "$SUMMARY" "$HUMAN_OWNER" "$EVIDENCE_FILE" <<'RUBY'
require "json"

output_path = ARGV[0]
timestamp = ARGV[1]
event_id = ARGV[2]
actor_type = ARGV[3]
actor_name = ARGV[4]
workflow_name = ARGV[5]
requested_action = ARGV[6]
policy_result = ARGV[7]
policy_reason = ARGV[8]
target_type = ARGV[9]
target_id = ARGV[10]
target_path = ARGV[11]
target_display = ARGV[12]
outcome = ARGV[13]
summary = ARGV[14]
human_owner = ARGV[15]
evidence_file = ARGV[16]

evidence = File.readlines(evidence_file, chomp: true).reject(&:empty?)

payload = {
  "schema_version" => 1,
  "event_id" => event_id,
  "timestamp" => timestamp,
  "actor" => {
    "type" => actor_type,
    "name" => actor_name
  },
  "workflow" => workflow_name,
  "requested_action" => requested_action,
  "policy_result" => {
    "mode" => policy_result,
    "reason" => policy_reason.empty? ? nil : policy_reason
  },
  "target" => {
    "type" => target_type,
    "id" => target_id.empty? ? nil : target_id,
    "path" => target_path.empty? ? nil : target_path,
    "display" => target_display
  },
  "evidence" => evidence,
  "outcome" => outcome,
  "summary" => summary,
  "human_owner" => human_owner.empty? ? nil : human_owner
}

File.write(output_path, JSON.pretty_generate(payload) + "\n")
puts output_path
RUBY
