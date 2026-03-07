#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SCRIPT="$ROOT_DIR/scripts/patch-pr-review-agent-lock.sh"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

WORKFLOW="$TMPDIR/pr-review-agent.lock.yml"

cat > "$WORKFLOW" <<'YAML'
name: test
jobs:
  pre_activation:
    if: (github.event_name != 'pull_request') || (github.event.pull_request.head.repo.id == github.repository_id)
    runs-on: ubuntu-slim
    outputs:
      activated: ${{ steps.check_membership.outputs.is_team_member == 'true' }}
      matched_command: ''
    steps:
      - name: Setup Scripts
        uses: github/gh-aw/actions/setup@v0.53.3
        with:
          destination: /opt/gh-aw/actions
      - name: Check team membership for workflow
        id: check_membership
        uses: actions/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd # v8
        env:
          GH_AW_REQUIRED_ROLES: admin,maintainer,write
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const { setupGlobals } = require('/opt/gh-aw/actions/setup_globals.cjs');
            setupGlobals(core, github, context, exec, io);
            const { main } = require('/opt/gh-aw/actions/check_membership.cjs');
            await main();
YAML

hash_file() {
  ruby -e 'require "digest"; print Digest::SHA256.file(ARGV[0]).hexdigest' "$1"
}

bash "$SCRIPT" "$WORKFLOW" >/dev/null
FIRST_HASH=$(hash_file "$WORKFLOW")

bash "$SCRIPT" "$WORKFLOW" >/dev/null
SECOND_HASH=$(hash_file "$WORKFLOW")

[ "$FIRST_HASH" = "$SECOND_HASH" ]

grep -F "      - name: Activate same-repo pull request without membership gate" "$WORKFLOW" >/dev/null
grep -F "steps.activate_pull_request.outputs.activated == 'true' || steps.check_membership.outputs.is_team_member == 'true'" "$WORKFLOW" >/dev/null
grep -F "if: steps.activate_pull_request.outputs.activated != 'true'" "$WORKFLOW" >/dev/null

[ "$(grep -c "^      - name: Activate same-repo pull request without membership gate$" "$WORKFLOW")" -eq 1 ]
[ "$(grep -c "^        if: steps.activate_pull_request.outputs.activated != 'true'$" "$WORKFLOW")" -eq 1 ]

if grep -q "^- name: Activate same-repo pull request without membership gate$" "$WORKFLOW"; then
  echo "FAIL: bypass step was inserted without workflow indentation" >&2
  exit 1
fi

echo "patch-pr-review-agent-lock.sh tests passed"
