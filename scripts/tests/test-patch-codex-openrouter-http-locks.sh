#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SCRIPT="$ROOT_DIR/scripts/patch-codex-openrouter-http-locks.sh"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

WORKFLOW="$TMPDIR/prd-decomposer.lock.yml"

cat > "$WORKFLOW" <<'YAML'
name: test
jobs:
  agent:
    steps:
      - name: Execute Codex CLI
        run: |
          codex exec test
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          RUST_LOG: trace
YAML

hash_file() {
  ruby -e 'require "digest"; print Digest::SHA256.file(ARGV[0]).hexdigest' "$1"
}

FIRST_HASH=$(hash_file "$WORKFLOW")
OUTPUT=$(bash "$SCRIPT" "$WORKFLOW")
SECOND_HASH=$(hash_file "$WORKFLOW")

[ "$FIRST_HASH" = "$SECOND_HASH" ]
printf '%s\n' "$OUTPUT" | grep -F "codex OpenAI lock patch skipped: $WORKFLOW" >/dev/null

echo "patch-codex-openrouter-http-locks.sh noop tests passed"
