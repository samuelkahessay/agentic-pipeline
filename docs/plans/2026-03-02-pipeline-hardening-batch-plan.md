# Pipeline Hardening Batch — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship 4 pipeline improvements (llms.txt, sensitive-path HITL gate, semantic CI diagnostics, context checkpoints) and produce a parallel-dispatch investigation doc.

**Architecture:** All changes are direct infrastructure modifications (workflows, scripts, config, prompt). No application code changes. No new dependencies. Each task is independently committable.

**Tech Stack:** GitHub Actions YAML, Bash, jq, Ruby (existing policy checker), gh-aw Markdown prompt format.

**Design doc:** `docs/plans/2026-03-02-pipeline-hardening-batch-design.md`

---

## Task 1: Create `llms.txt`

**Files:**
- Create: `llms.txt`

**Step 1: Create the file**

```
# prd-to-prod

> Autonomous software pipeline powered by gh-aw (GitHub Agentic Workflows).
> Issues labeled `pipeline` are implemented by AI agents. No human writes implementation code.

## Agent Instructions
- [AGENTS.md](AGENTS.md) — Coding standards, build commands, PR requirements
- [autonomy-policy.yml](autonomy-policy.yml) — What agents can and cannot do autonomously

## Architecture
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System architecture

## Key Workflows
- .github/workflows/auto-dispatch.yml — Dispatches repo-assist for pipeline issues
- .github/workflows/ci-failure-issue.yml — Routes CI failures to repair
- .github/workflows/pr-review-submit.yml — Submits reviews and arms auto-merge

## Configuration
- .deploy-profile — Active deployment profile
- .github/deploy-profiles/ — Stack-specific build/test/deploy commands
```

**Step 2: Verify all referenced paths exist**

Run: `for f in AGENTS.md autonomy-policy.yml docs/ARCHITECTURE.md .github/workflows/auto-dispatch.yml .github/workflows/ci-failure-issue.yml .github/workflows/pr-review-submit.yml .deploy-profile .github/deploy-profiles/; do [ -e "$f" ] && echo "OK: $f" || echo "MISSING: $f"; done`

Expected: All OK.

**Step 3: Commit**

```bash
git add llms.txt
git commit -m "feat: add llms.txt as AI-readable repo sitemap"
```

---

## Task 2: Add `sensitive_app_change` policy action

**Files:**
- Modify: `autonomy-policy.yml` (append after the `ci_repair_existing_pr` action, before `policy_artifact_change`)

**Step 1: Add the new action entry**

Insert after line 86 (the `ci_repair_existing_pr` action's last `evidence_required` item) and before line 98 (the `policy_artifact_change` action):

```yaml
  - action: sensitive_app_change
    scope: Modify application code in security-sensitive, compliance, or payment paths.
    default_mode: human_required
    requires_human_reason: >
      Changes to authentication, compliance, or payment logic carry elevated risk
      and require human review before merge.
    allowed_targets:
      - TicketDeflection/**/Auth/**
      - TicketDeflection/**/Compliance/**
      - TicketDeflection/**/Payments/**
      - src/**/auth/**
      - src/**/compliance/**
      - src/**/payments/**
    evidence_required:
      - Human-approved sensitive change
      - Security or compliance impact assessment
      - Test coverage for the sensitive path
```

**Step 2: Validate the policy**

Run: `bash scripts/check-autonomy-policy.sh validate autonomy-policy.yml`

Expected: `{ "ok": true, ... }` with no errors.

**Step 3: Verify the new action resolves correctly**

Run: `bash scripts/check-autonomy-policy.sh resolve sensitive_app_change autonomy-policy.yml`

Expected: `{ "ok": true, "found": true, "action": "sensitive_app_change", "mode": "human_required", ... }`

**Step 4: Verify path matching works**

Run: `bash scripts/check-autonomy-policy.sh match sensitive_app_change "TicketDeflection/Services/Auth/TokenValidator.cs" autonomy-policy.yml`

Expected: `{ "ok": true, "found": true, "matched": true, "mode": "human_required", ... }`

Run: `bash scripts/check-autonomy-policy.sh match sensitive_app_change "TicketDeflection/Services/TicketService.cs" autonomy-policy.yml`

Expected: `{ "ok": true, "found": true, "matched": false, ... }` (non-sensitive path should NOT match)

**Step 5: Commit**

```bash
git add autonomy-policy.yml
git commit -m "feat: add sensitive_app_change policy action for HITL gate"
```

---

## Task 3: Wire `sensitive_app_change` into `pr-review-submit.yml`

**Files:**
- Modify: `.github/workflows/pr-review-submit.yml:223-276` (the `Evaluate autonomy policy` step in `submit-review-comment` job)
- Modify: `.github/workflows/pr-review-submit.yml:626-678` (the duplicate step in `submit-review-dispatch` job)
- Modify: `.github/workflows/pr-review-submit.yml:77-86` (the `sparse-checkout` to also include the new script helper if needed)

**Step 1: Extend the policy action loop in `submit-review-comment` job**

In the `Evaluate autonomy policy for autonomous merge (APPROVE only)` step (line ~255), the inner `for` loop currently iterates:

```bash
for ACTION in policy_artifact_change workflow_file_change; do
```

Change to:

```bash
for ACTION in policy_artifact_change workflow_file_change sensitive_app_change; do
```

This is on line 255 in the `submit-review-comment` job.

**Step 2: Add the sensitive-review status check and `/approve-sensitive` comment**

After the existing `Comment autonomy policy block on PR` step (line ~277-288), add a new step that sets a `sensitive-review` pending status when the blocking action is `sensitive_app_change`:

```yaml
      - name: Set sensitive-review pending status
        if: steps.policy.outputs.blocked == 'true' && steps.policy.outputs.blocked_action == 'sensitive_app_change'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          HEAD_SHA: ${{ steps.idempotency.outputs.head_sha }}
          PR_NUMBER: ${{ github.event.issue.number }}
          REPO: ${{ github.repository }}
        run: |
          gh api --method POST "/repos/${REPO}/statuses/${HEAD_SHA}" \
            -f state="pending" \
            -f context="sensitive-review" \
            -f description="Sensitive path change — awaiting /approve-sensitive from repo owner"
          echo "Set sensitive-review pending status on ${HEAD_SHA}"
```

Also update the existing policy block comment step to include the `/approve-sensitive` instruction when the action is `sensitive_app_change`. Replace the body text in the `Comment autonomy policy block on PR` step:

Current (line 287-288):
```bash
          gh pr comment "$PR_NUMBER" --repo "$REPO" --body \
            "Autonomous merge blocked by autonomy policy. File \`${BLOCKED_FILE}\` matched \`${BLOCKED_ACTION}\`. ${BLOCKED_REASON} Human review and manual merge are required for this PR."
```

Replace with:
```bash
          if [ "$BLOCKED_ACTION" = "sensitive_app_change" ]; then
            gh pr comment "$PR_NUMBER" --repo "$REPO" --body \
              "## Sensitive Path Gate

Autonomous merge blocked. This PR modifies a sensitive path:

- **File**: \`${BLOCKED_FILE}\`
- **Policy**: \`${BLOCKED_ACTION}\`
- **Reason**: ${BLOCKED_REASON}

To approve, the repository owner must comment \`/approve-sensitive\` on this PR."
          else
            gh pr comment "$PR_NUMBER" --repo "$REPO" --body \
              "Autonomous merge blocked by autonomy policy. File \`${BLOCKED_FILE}\` matched \`${BLOCKED_ACTION}\`. ${BLOCKED_REASON} Human review and manual merge are required for this PR."
          fi
```

**Step 3: Replicate the same changes in the `submit-review-dispatch` job**

The `submit-review-dispatch` job has an identical policy check step starting at line ~626. Apply the same two changes:

1. Add `sensitive_app_change` to the action loop (line ~658):
   ```bash
   for ACTION in policy_artifact_change workflow_file_change sensitive_app_change; do
   ```

2. Add the sensitive-review pending status step after the policy block comment step (line ~680-691).

3. Update the policy block comment with the same conditional logic.

**Step 4: Add `/approve-sensitive` comment handler**

Add a new job to `pr-review-submit.yml` that handles the `/approve-sensitive` comment:

```yaml
  # ---------------------------------------------------------------------------
  # Job 3: /approve-sensitive comment handler
  # ---------------------------------------------------------------------------
  approve-sensitive:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    if: |
      github.event_name == 'issue_comment' &&
      github.event.issue.pull_request != null &&
      startsWith(github.event.comment.body, '/approve-sensitive') &&
      github.event.comment.user.login == github.repository_owner

    concurrency:
      group: "pr-review-submit-${{ github.event.issue.number }}"
      cancel-in-progress: false

    steps:
      - name: Approve sensitive path change
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MERGE_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.issue.number }}
          REPO: ${{ github.repository }}
        run: |
          HEAD_SHA=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json headRefOid --jq '.headRefOid')

          # Set sensitive-review status to success
          gh api --method POST "/repos/${REPO}/statuses/${HEAD_SHA}" \
            -f state="success" \
            -f context="sensitive-review" \
            -f description="Sensitive path approved by @${{ github.event.comment.user.login }}"

          # Re-enable auto-merge
          PR_TITLE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json title --jq '.title')
          if [[ "$PR_TITLE" == "[Pipeline]"* ]] && [ -n "$MERGE_TOKEN" ]; then
            GH_TOKEN="$MERGE_TOKEN" gh pr merge "$PR_NUMBER" --repo "$REPO" --auto --squash || \
              echo "::warning::Could not enable auto-merge"
          fi

          # Post confirmation
          gh pr comment "$PR_NUMBER" --repo "$REPO" --body \
            "Sensitive path change approved by @${{ github.event.comment.user.login }}. Auto-merge re-enabled."
          echo "Sensitive path approved for PR #${PR_NUMBER}"
```

**Step 5: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pr-review-submit.yml'))" && echo "YAML valid"`

Expected: `YAML valid`

**Step 6: Commit**

```bash
git add .github/workflows/pr-review-submit.yml
git commit -m "feat: wire sensitive-path HITL gate into PR review submit

Extends autonomy policy check to include sensitive_app_change action.
Adds /approve-sensitive comment handler for repo owner to unblock.
Sets pending sensitive-review status check when sensitive paths detected."
```

---

## Task 4: Add `--changed-files` flag to `extract-failure-context.sh`

**Files:**
- Modify: `scripts/extract-failure-context.sh`

**Step 1: Add argument parsing for `--changed-files`**

Replace the argument parsing block (lines 4-17) with:

```bash
usage() {
  echo "Usage: $0 [--changed-files FILE_LIST] [log-file]" >&2
  exit 1
}

CHANGED_FILES=""
POSITIONAL=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --changed-files)
      CHANGED_FILES="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [ "${#POSITIONAL[@]}" -gt 1 ]; then
  usage
fi

if [ "${#POSITIONAL[@]}" -eq 1 ]; then
  RAW_LOGS=$(cat "${POSITIONAL[0]}")
else
  RAW_LOGS=$(cat)
fi
```

**Step 2: Add file path extraction and correlation logic**

After the existing `EXCERPT` handling (before the final `jq` command at line ~107), add:

```bash
# --- Hypothesis generation (only when --changed-files provided) ---
HYPOTHESIS=""
CORRELATED_FILES="[]"

if [ -n "$CHANGED_FILES" ]; then
  # Extract file paths from error lines (.cs, .ts, .js, .jsx, .tsx, .py, .go, .rs, .java)
  ERROR_FILES=$(printf '%s\n' "$RAW_LOGS" \
    | grep -oE '[A-Za-z0-9_./-]+\.(cs|ts|js|jsx|tsx|py|go|rs|java)' \
    | sort -u || true)

  if [ -n "$ERROR_FILES" ]; then
    MATCHED=()
    UNMATCHED=()

    while IFS= read -r efile; do
      # Check if any changed file ends with this error file path
      FOUND=false
      while IFS= read -r cfile; do
        [ -n "$cfile" ] || continue
        if printf '%s' "$cfile" | grep -qF "$efile"; then
          MATCHED+=("$cfile")
          FOUND=true
          break
        fi
      done <<< "$CHANGED_FILES"

      if [ "$FOUND" = "false" ]; then
        UNMATCHED+=("$efile")
      fi
    done <<< "$ERROR_FILES"

    if [ "${#MATCHED[@]}" -gt 0 ]; then
      MATCHED_LIST=$(printf '%s, ' "${MATCHED[@]}" | sed 's/, $//')
      HYPOTHESIS="Error references ${MATCHED_LIST} which was modified in this PR. The failure likely stems from these changes."
      CORRELATED_FILES=$(printf '%s\n' "${MATCHED[@]}" | jq -R . | jq -s .)
    elif [ "${#UNMATCHED[@]}" -gt 0 ]; then
      UNMATCHED_LIST=$(printf '%s, ' "${UNMATCHED[@]}" | sed 's/, $//')
      HYPOTHESIS="Error references ${UNMATCHED_LIST} which was NOT directly modified in this PR — possible downstream dependency breakage."
      CORRELATED_FILES="[]"
    fi
  fi
fi
```

**Step 3: Update the final `jq` output to include new fields**

Replace the final `jq` command (line ~109-114):

```bash
jq -n \
  --arg failure_type "$FAILURE_TYPE" \
  --arg failure_signature "$FAILURE_SIGNATURE" \
  --arg summary "$SUMMARY" \
  --arg excerpt "$EXCERPT" \
  '{failure_type: $failure_type, failure_signature: $failure_signature, summary: $summary, excerpt: $excerpt}'
```

With:

```bash
jq -n \
  --arg failure_type "$FAILURE_TYPE" \
  --arg failure_signature "$FAILURE_SIGNATURE" \
  --arg summary "$SUMMARY" \
  --arg excerpt "$EXCERPT" \
  --arg hypothesis "$HYPOTHESIS" \
  --argjson correlated_files "$CORRELATED_FILES" \
  '{
    failure_type: $failure_type,
    failure_signature: $failure_signature,
    summary: $summary,
    excerpt: $excerpt,
    hypothesis: (if $hypothesis == "" then null else $hypothesis end),
    correlated_files: $correlated_files
  }'
```

**Step 4: Test without `--changed-files` (backward compatibility)**

Run: `echo "error CS0246: The type or namespace name 'Foo' could not be found" | bash scripts/extract-failure-context.sh`

Expected: JSON with `hypothesis: null` and `correlated_files: []`

**Step 5: Test with `--changed-files`**

Run: `echo "TicketDeflection/Services/Foo.cs(10,5): error CS0246: The type or namespace name 'Bar'" | bash scripts/extract-failure-context.sh --changed-files "TicketDeflection/Services/Foo.cs"`

Expected: JSON with `hypothesis` containing "Foo.cs which was modified in this PR" and `correlated_files` containing `["TicketDeflection/Services/Foo.cs"]`

**Step 6: Test with unmatched files**

Run: `echo "TicketDeflection/Services/Foo.cs(10,5): error CS0246: The type or namespace name 'Bar'" | bash scripts/extract-failure-context.sh --changed-files "TicketDeflection/Pages/Index.cshtml"`

Expected: JSON with `hypothesis` containing "NOT directly modified" and `correlated_files: []`

**Step 7: Commit**

```bash
git add scripts/extract-failure-context.sh
git commit -m "feat: add --changed-files hypothesis to extract-failure-context.sh

Correlates error file paths with PR changed files to generate a
diagnostic hypothesis. Backward compatible — hypothesis is null
when --changed-files is omitted."
```

---

## Task 5: Add `--hypothesis` and `--correlated-files` to `render-ci-repair-command.sh`

**Files:**
- Modify: `scripts/render-ci-repair-command.sh`

**Step 1: Add the new flags to argument parsing**

In the `while` loop (lines 25-42), add two new cases:

```bash
    --hypothesis) HYPOTHESIS="$2"; shift 2 ;;
    --correlated-files) CORRELATED_FILES="$2"; shift 2 ;;
```

**Step 2: Set defaults for the new optional fields**

After `PR_DIFF=${PR_DIFF:-}` (line 65), add:

```bash
HYPOTHESIS=${HYPOTHESIS:-}
CORRELATED_FILES=${CORRELATED_FILES:-}
```

**Step 3: Append hypothesis and correlated files to the output**

After the PR diff block (lines 92-99), add:

```bash
if [ -n "$HYPOTHESIS" ]; then
  printf '%s\n' \
    "" \
    "### Diagnostic Hypothesis" \
    "${HYPOTHESIS}"
fi

if [ -n "$CORRELATED_FILES" ] && [ "$CORRELATED_FILES" != "[]" ]; then
  printf '%s\n' \
    "" \
    "### Correlated Changed Files" \
    '```' \
    "${CORRELATED_FILES}" \
    '```'
fi
```

**Step 4: Test the new flags**

Run:
```bash
bash scripts/render-ci-repair-command.sh \
  --pr-number 999 \
  --linked-issue 998 \
  --head-sha abc123def456 \
  --head-branch repo-assist/issue-998-test \
  --failure-run-id 12345 \
  --failure-run-url "https://github.com/test/runs/12345" \
  --failure-type build \
  --failure-signature cs0246-foo \
  --attempt-count 1 \
  --failure-summary "error CS0246" \
  --failure-excerpt "error CS0246: Foo not found" \
  --hypothesis "Error references Foo.cs which was modified in this PR." \
  --correlated-files "TicketDeflection/Services/Foo.cs"
```

Expected: Output includes `### Diagnostic Hypothesis` and `### Correlated Changed Files` sections.

**Step 5: Test backward compatibility (no hypothesis)**

Run same command without `--hypothesis` and `--correlated-files`.

Expected: Output does NOT include hypothesis or correlated files sections.

**Step 6: Commit**

```bash
git add scripts/render-ci-repair-command.sh
git commit -m "feat: add --hypothesis and --correlated-files to repair command renderer"
```

---

## Task 6: Wire diagnostic hypothesis into `ci-failure-issue.yml`

**Files:**
- Modify: `.github/workflows/ci-failure-issue.yml:270-271` (the `extract-failure-context.sh` call)
- Modify: `.github/workflows/ci-failure-issue.yml:441-453` (the `render-ci-repair-command.sh` call)

**Step 1: Pass changed files to extract-failure-context.sh**

In the `Route failing CI run` step, replace lines 270-271:

```bash
          FAILURE_JSON=$(printf '%s' "$RAW_LOGS" | scripts/extract-failure-context.sh)
```

With:

```bash
          # Get changed files for hypothesis generation (PR-only)
          CHANGED_FILE_LIST=""
          if [ -n "$PR_NUMBER" ]; then
            CHANGED_FILE_LIST=$(gh pr diff "$PR_NUMBER" --repo "$REPO" --name-only 2>/dev/null || true)
          fi

          if [ -n "$CHANGED_FILE_LIST" ]; then
            FAILURE_JSON=$(printf '%s' "$RAW_LOGS" | scripts/extract-failure-context.sh --changed-files "$CHANGED_FILE_LIST")
          else
            FAILURE_JSON=$(printf '%s' "$RAW_LOGS" | scripts/extract-failure-context.sh)
          fi
```

**Step 2: Extract the new fields from the JSON**

After the existing field extractions (lines 272-275), add:

```bash
          HYPOTHESIS=$(printf '%s' "$FAILURE_JSON" | jq -r '.hypothesis // empty')
          CORRELATED_FILES_JSON=$(printf '%s' "$FAILURE_JSON" | jq -r '.correlated_files | join(", ") // empty')
```

**Step 3: Pass hypothesis to render-ci-repair-command.sh**

In the repair command rendering call (lines 441-453), add the new flags. After `--pr-diff "$PR_DIFF")`:

Change the call to include hypothesis. The current call is a multiline command ending with `--pr-diff "$PR_DIFF")`. Add the new flags:

```bash
          COMMAND_ARGS=(
            --pr-number "$PR_NUMBER"
            --linked-issue "$LINKED_ISSUE"
            --head-sha "$HEAD_SHA"
            --head-branch "$HEAD_BRANCH"
            --failure-run-id "$RUN_ID"
            --failure-run-url "$RUN_URL"
            --failure-type "$FAILURE_TYPE"
            --failure-signature "$FAILURE_SIGNATURE"
            --attempt-count 1
            --failure-summary "$FAILURE_SUMMARY"
            --failure-excerpt "$FAILURE_EXCERPT"
            --pr-diff "$PR_DIFF"
          )
          if [ -n "$HYPOTHESIS" ]; then
            COMMAND_ARGS+=(--hypothesis "$HYPOTHESIS")
          fi
          if [ -n "$CORRELATED_FILES_JSON" ]; then
            COMMAND_ARGS+=(--correlated-files "$CORRELATED_FILES_JSON")
          fi
          COMMAND_BODY=$(scripts/render-ci-repair-command.sh "${COMMAND_ARGS[@]}")
```

**Step 4: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-failure-issue.yml'))" && echo "YAML valid"`

Expected: `YAML valid`

**Step 5: Commit**

```bash
git add .github/workflows/ci-failure-issue.yml
git commit -m "feat: wire diagnostic hypothesis into CI failure router

Passes PR changed files to extract-failure-context.sh for hypothesis
generation. Forwards hypothesis and correlated files to the repair
command template so repo-assist gets richer upfront context."
```

---

## Task 7: Add Checkpoint Protocol to `repo-assist.md`

**Files:**
- Modify: `.github/workflows/repo-assist.md:141-151` (after the "Memory" section)

**Step 1: Insert the Checkpoint Protocol section**

After line 151 (the last line of the Memory section: `Memory may be stale — always verify against current repo state.`), insert:

```markdown

## Checkpoint Protocol

Write structured checkpoint entries to repo-memory at these key moments during Task 1 (implementing issues):

1. **Plan checkpoint** — after reading the issue and forming an implementation plan, before writing any code. Key: `checkpoint:<issue-number>:plan`
2. **Progress checkpoint** — after completing a significant code change (creating a new file, making a test pass, completing a logical unit of work). Key: `checkpoint:<issue-number>:progress`
3. **Pre-PR checkpoint** — immediately before creating a PR or pushing to a PR branch. Key: `checkpoint:<issue-number>:pre-pr`

Each checkpoint value is a JSON string:
```json
{
  "timestamp": "ISO 8601",
  "stage": "plan | progress | pre-pr",
  "issue": 123,
  "summary": "Read issue #123, plan: add AuthService with 2 endpoints",
  "files_touched": ["TicketDeflection/Services/AuthService.cs"],
  "blockers": [],
  "next_step": "Create test file and write failing tests"
}
```

**Resumption**: At the start of every run, after reading memory, check for any `checkpoint:*` entries. If a checkpoint exists for an issue you are about to work on, read it and resume from that state rather than re-reading the issue and re-planning from scratch. Update the checkpoint as you progress.

**Cleanup**: After a PR is created or an issue is closed, delete all `checkpoint:<issue-number>:*` entries for that issue.
```

**Step 2: Recompile the workflow**

Run: `cd /Users/skahessay/Documents/Projects/active/prd-to-prod && gh aw compile .github/workflows/repo-assist.md`

Expected: `repo-assist.lock.yml` is updated. If `gh aw compile` is not available, skip — the `.md` is the source of truth and the lock file will be recompiled on next gh-aw operation.

**Step 3: Commit**

```bash
git add .github/workflows/repo-assist.md
# Only add lock file if it was recompiled:
git add .github/workflows/repo-assist.lock.yml 2>/dev/null || true
git commit -m "feat: add checkpoint protocol to repo-assist prompt

Instructs the agent to write structured checkpoints to repo-memory
at plan/progress/pre-PR stages. Enables resumption across runs
instead of starting from scratch after timeout or failure."
```

---

## Task 8: Parallel Dispatch Investigation

**Files:**
- Create: `docs/internal/gh-aw-upstream/parallel-dispatch-investigation.md`

**Step 1: Research gh-aw concurrency model**

Read the gh-aw source at `/Users/skahessay/Documents/Projects/active/gh-aw`. Focus on:
- How compiled workflows handle `concurrency` groups
- Whether the engine supports multiple simultaneous runs of the same workflow
- How `repo-memory` is stored and whether it has locking

Key files to investigate:
- `src/` or `lib/` — the compilation engine
- Any docs about concurrency, memory, or rate limits
- The `repo-memory` tool implementation
- GitHub API client code (to understand rate limit usage)

**Step 2: Research repo-memory safety**

Determine:
- Is `repo-memory` backed by GitHub API (gist, repo file, etc.) or a separate store?
- Does it use optimistic locking, pessimistic locking, or no locking?
- What happens if two runs read-modify-write the same key simultaneously?

**Step 3: Estimate rate limit budget**

From the gh-aw source, catalog the GitHub API calls a typical repo-assist run makes:
- Issue reads/writes
- PR reads/writes
- Commit status updates
- File content reads
- Comment creates
- Workflow dispatches

Multiply by 3-5 for concurrent runs. Compare against GitHub's 5,000/hour authenticated limit.

**Step 4: Write findings doc**

Create `docs/internal/gh-aw-upstream/parallel-dispatch-investigation.md` with:
- Concurrency model findings
- Repo-memory safety findings
- Rate limit analysis
- Recommendation (safe to parallelize? at what cap? what changes needed?)
- Risks and mitigations

**Step 5: Commit**

```bash
git add docs/internal/gh-aw-upstream/parallel-dispatch-investigation.md
git commit -m "docs: parallel dispatch investigation findings

Analyzes gh-aw concurrency model, repo-memory locking, and rate
limits to determine if auto-dispatch can safely run multiple
repo-assist instances in parallel."
```

---

## Verification Checklist

After all tasks are complete:

1. `llms.txt` exists at repo root with valid relative links
2. `autonomy-policy.yml` validates: `bash scripts/check-autonomy-policy.sh validate`
3. `sensitive_app_change` matches sensitive paths: `bash scripts/check-autonomy-policy.sh match sensitive_app_change "TicketDeflection/Services/Auth/Test.cs"`
4. `extract-failure-context.sh` backward compatible: `echo "error CS0246: Foo" | bash scripts/extract-failure-context.sh` returns valid JSON with `hypothesis: null`
5. `extract-failure-context.sh` hypothesis works: test with `--changed-files`
6. `render-ci-repair-command.sh` backward compatible: test without `--hypothesis`
7. All YAML files parse: `for f in .github/workflows/*.yml; do python3 -c "import yaml; yaml.safe_load(open('$f'))" && echo "OK: $f"; done`
8. `repo-assist.md` has Checkpoint Protocol section
9. Investigation doc exists at `docs/internal/gh-aw-upstream/parallel-dispatch-investigation.md`
