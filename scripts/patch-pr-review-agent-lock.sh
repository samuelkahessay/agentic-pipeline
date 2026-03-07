#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
WORKFLOW_PATH="${1:-$ROOT_DIR/.github/workflows/pr-review-agent.lock.yml}"

ruby - "$WORKFLOW_PATH" <<'RUBY'
path = ARGV.fetch(0)
content = File.read(path)
original = content.dup

bypass_step = <<'STEP'.chomp
      - name: Activate same-repo pull request without membership gate
        id: activate_pull_request
        if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.id == github.repository_id
        run: |
          echo "Same-repository pull request event detected; bypassing membership gate."
          echo "activated=true" >> "$GITHUB_OUTPUT"
STEP

malformed_bypass_step = <<'STEP'.chomp
- name: Activate same-repo pull request without membership gate
  id: activate_pull_request
  if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.id == github.repository_id
  run: |
    echo "Same-repository pull request event detected; bypassing membership gate."
    echo "activated=true" >> "$GITHUB_OUTPUT"
STEP

old_activated_output = "      activated: ${{ steps.check_membership.outputs.is_team_member == 'true' }}"
new_activated_output = "      activated: ${{ steps.activate_pull_request.outputs.activated == 'true' || steps.check_membership.outputs.is_team_member == 'true' }}"

unless content.include?(new_activated_output)
  raise "Could not find pre_activation activated output in #{path}" unless content.sub!(old_activated_output, new_activated_output)
end

content.gsub!(malformed_bypass_step, bypass_step)

unless content.include?(bypass_step)
  membership_step = "      - name: Check team membership for workflow\n"
  raise "Could not find membership step in #{path}" unless content.sub!(membership_step, "#{bypass_step}\n#{membership_step}")
end

membership_guard = "        if: steps.activate_pull_request.outputs.activated != 'true'\n"
unless content.include?(membership_guard)
  old_membership_step = "      - name: Check team membership for workflow\n        id: check_membership\n"
  new_membership_step = "      - name: Check team membership for workflow\n#{membership_guard}        id: check_membership\n"
  raise "Could not add membership guard in #{path}" unless content.sub!(old_membership_step, new_membership_step)
end

raise "Patched activated output missing in #{path}" unless content.include?(new_activated_output)
raise "Patched bypass step missing in #{path}" unless content.include?(bypass_step)
raise "Patched membership guard missing in #{path}" unless content.include?(membership_guard)
raise "Duplicate bypass step detected in #{path}" unless content.scan(bypass_step).length == 1
raise "Duplicate membership guard detected in #{path}" unless content.scan(membership_guard).length == 1

File.write(path, content) if content != original
RUBY

echo "pr-review-agent lock patch verified: $WORKFLOW_PATH"
