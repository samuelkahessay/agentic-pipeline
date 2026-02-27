# Pipeline Blocker Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 outstanding pipeline issues: duplicate PRs (BLOCKER 3), superseded PR cleanup (BLOCKER 4), issue auto-close reliability, cross-issue false CHANGES_REQUESTED, and action_required gate.

**Architecture:** Defense-in-depth for dedup (dispatch layer reduces, repo-assist layer prevents). Primary+backup pattern for cleanup (pr-review-submit acts immediately, watchdog sweeps up). Prompt changes for false reviews.

**Tech Stack:** GitHub Actions YAML, gh-aw agentic workflow Markdown prompts, GitHub REST API via `gh` CLI.

**Design doc:** `docs/plans/2026-02-27-pipeline-blocker-fixes-design.md`

**Important:** After modifying any `.md` workflow file, run `gh aw compile` to regenerate the `.lock.yml` files. Never edit `.lock.yml` directly.

---

### Task 1: Fix action_required gate (repo setting)

**Files:**
- None (API call only)

**Step 1: Check current approval policy**

Run:
```bash
gh api repos/samuelkahessay/agentic-pipeline/actions/permissions/fork-pr-contributor-approval
```
Expected: JSON showing current `approval_policy` (likely `first_time_contributors`).

**Step 2: Update fork PR contributor approval policy**

Run:
```bash
gh api repos/samuelkahessay/agentic-pipeline/actions/permissions/fork-pr-contributor-approval \
  --method PUT -f approval_policy=first_time_contributors_new_to_github
```
Expected: 204 No Content or JSON confirming the update.

**Step 3: Verify the change**

Run:
```bash
gh api repos/samuelkahessay/agentic-pipeline/actions/permissions/fork-pr-contributor-approval
```
Expected: `"approval_policy": "first_time_contributors_new_to_github"`

No commit — this is a repo setting change with no tracked files. The design doc serves as the audit record.

---

### Task 2: Dispatch-layer dedup (auto-dispatch.yml)

**Files:**
- Modify: `.github/workflows/auto-dispatch.yml` (all 49 lines)

**Step 1: Switch cancel-in-progress to true**

In `.github/workflows/auto-dispatch.yml`, change line 10:
```yaml
  cancel-in-progress: true
```

This ensures rapid issue creation (decomposer burst) collapses to a single dispatch.

**Step 2: Add 15-second debounce before guard check**

Insert a new step before "Skip when repo-assist already active" (before current line 19):
```yaml
      - name: Debounce (let issue burst settle)
        run: sleep 15
```

**Step 3: Verify the full file reads correctly**

The complete file should be:
```yaml
name: Auto-Dispatch Pipeline Issues

on:
  issues:
    types: [opened, reopened, labeled]

# Collapse rapid issue creation (e.g., decomposer burst) to one dispatch.
concurrency:
  group: auto-dispatch-pipeline
  cancel-in-progress: true

jobs:
  dispatch:
    if: |
      (github.event.action == 'labeled' && github.event.label.name == 'pipeline') ||
      (github.event.action != 'labeled' && contains(github.event.issue.labels.*.name, 'pipeline'))
    runs-on: ubuntu-latest
    steps:
      - name: Debounce (let issue burst settle)
        run: sleep 15

      - name: Skip when repo-assist already active
        id: guard
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
        run: |
          IN_PROGRESS=$(gh run list --repo "$REPO" \
            --workflow repo-assist.lock.yml \
            --status in_progress \
            --json databaseId \
            --jq 'length')
          QUEUED=$(gh run list --repo "$REPO" \
            --workflow repo-assist.lock.yml \
            --status queued \
            --json databaseId \
            --jq 'length')
          if [ "$IN_PROGRESS" -gt 0 ] || [ "$QUEUED" -gt 0 ]; then
            echo "skip=true" >> "$GITHUB_OUTPUT"
            echo "repo-assist already queued/running; skipping dispatch."
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Dispatch repo-assist scheduled mode
        if: steps.guard.outputs.skip != 'true'
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN }}
        run: |
          gh workflow run repo-assist.lock.yml \
            --repo ${{ github.repository }}
```

**Step 4: Commit**

```bash
git add .github/workflows/auto-dispatch.yml
git commit -m "fix(auto-dispatch): cancel-in-progress + 15s debounce to reduce burst duplication

Decomposer creating N issues now collapses to 1 dispatch instead of N.
Best-effort layer — repo-assist dedup check is the authoritative guard."
```

---

### Task 3: repo-assist dedup check (repo-assist.md)

**Files:**
- Modify: `.github/workflows/repo-assist.md:106-121` (Task 1 steps)

**Step 1: Add dedup check before checkout (new step 3b)**

In `.github/workflows/repo-assist.md`, find Task 1 step 3 (line ~108). After sub-step `a` ("Read the issue carefully") and before sub-step `b` ("CRITICAL: Always git checkout main"), insert:

```
   b. **Dedup check (required)**: Before starting work, check if a `[Pipeline]` PR already exists for this issue. Run: `gh pr list --repo $REPO --state all --json number,state,title,body`. Parse each PR's body for close keywords (`closes`, `close`, `fix`, `fixes`, `resolve`, `resolves`) followed by `#N`. Filter to PRs whose title starts with `[Pipeline]`. If any matching result has state `open` or `merged`, skip this issue silently — update memory that issue #N is already covered and move to the next issue. PRs that are `closed` (without merge) do NOT count as covered — those are failed attempts and the issue still needs work.
```

Re-letter subsequent steps: old b→c, old c→d, etc.

**Step 2: Add pre-creation dedup recheck (new step 3h)**

Find the step that creates the PR (currently step 3g, will be 3h after re-lettering). Insert a new step immediately before it:

```
   h. **Dedup recheck (required)**: Immediately before creating the PR, re-run the dedup check from step 3b (parse PR bodies for close keywords matching `#N`, filter to `[Pipeline]` prefix, check for `open` or `merged` state). If a `[Pipeline]` PR is now `open` or `merged` for this issue (a concurrent run may have created one while you were coding), abandon your branch and skip this issue. Do not create a duplicate PR.
```

Re-letter the PR creation step to 3i.

**Step 3: Verify Task 1 step 3 reads correctly after changes**

The updated step 3 should be:
```
3. For each implementable issue (check memory — skip if already attempted):
   a. Read the issue carefully, including acceptance criteria and technical notes.
   b. **Dedup check (required)**: Before starting work, check if a `[Pipeline]` PR already exists for this issue. Run: `gh pr list --repo $REPO --state all --json number,state,title,body`. Parse each PR's body for close keywords (`closes`, `close`, `fix`, `fixes`, `resolve`, `resolves`) followed by `#N`. Filter to PRs whose title starts with `[Pipeline]`. If any matching result has state `open` or `merged`, skip this issue silently — update memory that issue #N is already covered and move to the next issue. PRs that are `closed` (without merge) do NOT count as covered — those are failed attempts and the issue still needs work.
   c. **CRITICAL**: Always `git checkout main && git pull origin main` before creating each new branch. Create a fresh branch off the latest `main`: `repo-assist/issue-<N>-<short-desc>`. NEVER branch off another feature branch — each PR must be independently mergeable.
   d. Set up the development environment as described in AGENTS.md (run `npm install` if package.json exists).
   e. Implement the feature/task described in the issue. Follow acceptance criteria exactly.
   f. **Build and test (required)**: Run the build and test commands from AGENTS.md. Do not create a PR if tests fail due to your changes.
   g. Add tests if the issue type is `feature` or `infra` and tests aren't explicitly excluded.
   h. **Dedup recheck (required)**: Immediately before creating the PR, re-run the dedup check from step 3b (parse PR bodies for close keywords matching `#N`, filter to `[Pipeline]` prefix, check for `open` or `merged` state). If a `[Pipeline]` PR is now `open` or `merged` for this issue (a concurrent run may have created one while you were coding), abandon your branch and skip this issue. Do not create a duplicate PR.
   i. Create a PR with:
      - Title matching the issue title
      - Body containing: `Closes #N`, description of changes, and test results
      - AI disclosure: "This PR was created by Pipeline Assistant."
   j. **Trigger the reviewer**: After creating the PR, run `gh workflow run pr-review-agent.lock.yml` to dispatch the review agent. GitHub's anti-cascade protection suppresses automatic `pull_request:opened` triggers from App tokens, so this explicit dispatch is required.
   k. Label the source issue `in-progress`.
```

**Step 4: Compile lock file**

Run:
```bash
gh aw compile
```
Expected: `repo-assist.lock.yml` regenerated.

**Step 5: Commit**

```bash
git add .github/workflows/repo-assist.md .github/workflows/repo-assist.lock.yml
git commit -m "fix(repo-assist): add authoritative dedup check before checkout and before PR creation

Checks gh pr list for existing open/merged [Pipeline] PRs referencing
Closes #N. Runs twice: early (save runner time) and pre-creation (catch
races). closed-unmerged PRs are ignored (failed attempts)."
```

---

### Task 4: Issue auto-close reliability (pr-review-submit.yml)

**Files:**
- Modify: `.github/workflows/pr-review-submit.yml:216-243` (Job 1 close step)
- Modify: `.github/workflows/pr-review-submit.yml:420-453` (Job 2 close step)

**Step 1: Update Job 1 merge poll to 120s**

In `.github/workflows/pr-review-submit.yml`, find the "Close linked issues after merge" step in Job 1 (line 205). Change the poll loop and timeout fallback:

Replace lines 217-243:
```yaml
          MERGED=false
          for i in $(seq 1 24); do
            sleep 5
            STATE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state --jq '.state')
            if [ "$STATE" = "MERGED" ]; then
              MERGED=true
              break
            fi
            echo "PR #${PR_NUMBER} state: ${STATE} (attempt $i/24)"
          done

          if [ "$MERGED" = "true" ]; then
            echo "PR #${PR_NUMBER} merged. Closing linked issues."
            if [ -n "${ISSUE_NUMBER:-}" ]; then
              ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
              if [ "$ISSUE_STATE" = "OPEN" ]; then
                gh issue close "$ISSUE_NUMBER" --repo "$REPO" \
                  -c "Closed by merge of PR #${PR_NUMBER}." || \
                  echo "::warning::Could not close issue #${ISSUE_NUMBER}"
              else
                echo "Issue #${ISSUE_NUMBER} already ${ISSUE_STATE}"
              fi
            else
              echo "No linked issue found — skipping issue close"
            fi
          else
            echo "::warning::Merge not observed within 120s for PR #${PR_NUMBER}."
            if [ -n "${ISSUE_NUMBER:-}" ]; then
              ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
              if [ "$ISSUE_STATE" = "OPEN" ]; then
                gh issue comment "$ISSUE_NUMBER" --repo "$REPO" \
                  --body "Merge not observed within 120s for PR #${PR_NUMBER}. Issue closure deferred to watchdog." || true
              fi
            fi
          fi
```

**Step 2: Update Job 2 merge poll to 120s**

Apply the same pattern to Job 2's "Close linked issues after merge" step (line 412). Replace lines 420-453 with identical poll logic. Note: Job 2 uses `TARGET` variable instead of `ISSUE_NUMBER` directly (it has a fallback extraction from PR body). Preserve that pattern but apply the same 24-iteration loop and timeout message:

Replace lines 420-453:
```yaml
          MERGED=false
          for i in $(seq 1 24); do
            sleep 5
            STATE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state --jq '.state')
            if [ "$STATE" = "MERGED" ]; then
              MERGED=true
              break
            fi
            echo "PR #${PR_NUMBER} state: ${STATE} (attempt $i/24)"
          done

          if [ "$MERGED" = "true" ]; then
            echo "PR #${PR_NUMBER} merged. Closing linked issues."
            TARGET="${ISSUE_NUMBER:-}"
            if [ -z "$TARGET" ]; then
              TARGET=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json body \
                --jq '[.body | scan("(?i)(?:closes|close|fix|fixes|resolve|resolves)\\s+#(\\d+)")] | first | .[]? // empty' \
                | head -1 || true)
            fi
            if [ -n "$TARGET" ]; then
              ISSUE_STATE=$(gh issue view "$TARGET" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
              if [ "$ISSUE_STATE" = "OPEN" ]; then
                gh issue close "$TARGET" --repo "$REPO" \
                  -c "Closed by merge of PR #${PR_NUMBER}." || \
                  echo "::warning::Could not close issue #${TARGET}"
              else
                echo "Issue #${TARGET} already ${ISSUE_STATE}"
              fi
            else
              echo "No linked issue found — skipping issue close"
            fi
          else
            echo "::warning::Merge not observed within 120s for PR #${PR_NUMBER}."
            TARGET="${ISSUE_NUMBER:-}"
            if [ -z "$TARGET" ]; then
              TARGET=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json body \
                --jq '[.body | scan("(?i)(?:closes|close|fix|fixes|resolve|resolves)\\s+#(\\d+)")] | first | .[]? // empty' \
                | head -1 || true)
            fi
            if [ -n "$TARGET" ]; then
              ISSUE_STATE=$(gh issue view "$TARGET" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
              if [ "$ISSUE_STATE" = "OPEN" ]; then
                gh issue comment "$TARGET" --repo "$REPO" \
                  --body "Merge not observed within 120s for PR #${PR_NUMBER}. Issue closure deferred to watchdog." || true
```

Note: `gh issue close` uses `-c` for comment, but `gh issue comment` uses `--body`. These are different subcommands with different flags.
              fi
            fi
          fi
```

**Step 3: Commit**

```bash
git add .github/workflows/pr-review-submit.yml
git commit -m "fix(pr-review-submit): increase merge poll to 120s with visible timeout fallback

Both jobs now poll 24x5s instead of 12x5s. On timeout, posts a comment
on the linked issue (if open) so the watchdog can pick it up.
Does not claim 'merged' unless merge was actually observed."
```

---

### Task 5: Superseded PR cleanup — pr-review-submit.yml

**Files:**
- Modify: `.github/workflows/pr-review-submit.yml` (add step after close-issues in both jobs)

**Step 1: Add cleanup step to Job 1 (after close-issues, before dispatch)**

Insert a new step between "Close linked issues after merge" and "Dispatch repo-assist for next cycle" in Job 1 (after the block ending at line ~243, before line 245):

```yaml
      - name: Close superseded duplicate PRs
        if: steps.idempotency.outputs.skip != 'true' && steps.review.outputs.verdict == 'APPROVE'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.issue.number }}
          ISSUE_NUMBER: ${{ steps.review.outputs.issue_number }}
          REPO: ${{ github.repository }}
        run: |
          if [ -z "${ISSUE_NUMBER:-}" ]; then
            echo "No linked issue — skipping superseded PR check"
            exit 0
          fi

          # Check if this PR actually merged
          STATE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state --jq '.state')
          if [ "$STATE" != "MERGED" ]; then
            echo "PR #${PR_NUMBER} not merged — skipping superseded PR cleanup"
            exit 0
          fi

          # Find other open [Pipeline] PRs referencing the same issue
          DUPES=$(gh pr list --repo "$REPO" --state open \
            --json number,title,body \
            --jq "[.[] | select(
              .number != ${PR_NUMBER} and
              (.title | startswith(\"[Pipeline]\")) and
              (.body | test(\"(?i)(closes?|fix(es)?|resolves?)\\\\s+#${ISSUE_NUMBER}\\\\b\"))
            )] | .[].number")

          if [ -z "$DUPES" ]; then
            echo "No superseded PRs found for issue #${ISSUE_NUMBER}"
            exit 0
          fi

          for DUP in $DUPES; do
            echo "Closing superseded PR #${DUP}"
            gh pr close "$DUP" --repo "$REPO" --delete-branch \
              -c "Superseded by PR #${PR_NUMBER} which merged and closed issue #${ISSUE_NUMBER}." || \
              echo "::warning::Could not close PR #${DUP}"
          done
```

**Step 2: Add identical cleanup step to Job 2 (after close-issues, before dispatch)**

Insert the same step in Job 2, between "Close linked issues after merge" and "Dispatch repo-assist for next cycle" (after the block ending at ~line 453, before line 455). Adjust env vars for dispatch context:

```yaml
      - name: Close superseded duplicate PRs
        if: always() && github.event.inputs.verdict == 'APPROVE'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.inputs.pr_number }}
          ISSUE_NUMBER: ${{ steps.review.outputs.issue_number }}
          REPO: ${{ github.repository }}
        run: |
          TARGET="${ISSUE_NUMBER:-}"
          if [ -z "$TARGET" ]; then
            TARGET=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json body \
              --jq '[.body | scan("(?i)(?:closes|close|fix|fixes|resolve|resolves)\\s+#(\\d+)")] | first | .[]? // empty' \
              | head -1 || true)
          fi
          if [ -z "$TARGET" ]; then
            echo "No linked issue — skipping superseded PR check"
            exit 0
          fi

          STATE=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json state --jq '.state')
          if [ "$STATE" != "MERGED" ]; then
            echo "PR #${PR_NUMBER} not merged — skipping superseded PR cleanup"
            exit 0
          fi

          DUPES=$(gh pr list --repo "$REPO" --state open \
            --json number,title,body \
            --jq "[.[] | select(
              .number != ${PR_NUMBER} and
              (.title | startswith(\"[Pipeline]\")) and
              (.body | test(\"(?i)(closes?|fix(es)?|resolves?)\\\\s+#${TARGET}\\\\b\"))
            )] | .[].number")

          if [ -z "$DUPES" ]; then
            echo "No superseded PRs found for issue #${TARGET}"
            exit 0
          fi

          for DUP in $DUPES; do
            echo "Closing superseded PR #${DUP}"
            gh pr close "$DUP" --repo "$REPO" --delete-branch \
              -c "Superseded by PR #${PR_NUMBER} which merged and closed issue #${TARGET}." || \
              echo "::warning::Could not close PR #${DUP}"
          done
```

**Step 3: Commit**

```bash
git add .github/workflows/pr-review-submit.yml
git commit -m "fix(pr-review-submit): auto-close superseded duplicate PRs after merge

After a [Pipeline] PR merges, finds other open [Pipeline] PRs referencing
the same Closes #N and closes them with --delete-branch. Applied to both
comment-triggered and dispatch-triggered jobs."
```

---

### Task 6: Superseded PR cleanup — pipeline-watchdog.yml (backup)

**Files:**
- Modify: `.github/workflows/pipeline-watchdog.yml:117-165` (insert new pass before completion check)

**Step 1: Add superseded PR detection pass**

In `pipeline-watchdog.yml`, insert a new section between the "orphaned issues" block (ending at line 165) and the "completion check" block (starting at line 167):

```bash
          # ── Detect superseded PRs ──
          # Open [Pipeline] PRs whose linked issue is already closed AND
          # another [Pipeline] PR already merged for that issue.
          echo ""
          echo "=== Checking for superseded PRs ==="

          while IFS= read -r PR_ROW; do
            PR_NUM=$(echo "$PR_ROW" | jq -r '.number')

            # Extract linked issue number from PR body
            LINKED_ISSUE=$(gh pr view "$PR_NUM" --repo "$REPO" --json body \
              --jq '[.body | scan("(?i)(?:closes|close|fix|fixes|resolve|resolves)\\s+#(\\d+)")] | first | .[]? // empty' \
              | head -1 || true)

            if [ -z "$LINKED_ISSUE" ]; then
              echo "PR #${PR_NUM}: no linked issue. Skipping."
              continue
            fi

            # Check if linked issue is closed
            ISSUE_STATE=$(gh issue view "$LINKED_ISSUE" --repo "$REPO" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
            if [ "$ISSUE_STATE" != "CLOSED" ]; then
              echo "PR #${PR_NUM}: issue #${LINKED_ISSUE} is ${ISSUE_STATE}. Skipping."
              continue
            fi

            # Check if another [Pipeline] PR already merged for this issue
            MERGED_PR=$(gh pr list --repo "$REPO" --state merged \
              --json number,title,body \
              --jq "[.[] | select(
                .number != ${PR_NUM} and
                (.title | startswith(\"[Pipeline]\")) and
                (.body | test(\"(?i)(closes?|fix(es)?|resolves?)\\\\s+#${LINKED_ISSUE}\\\\b\"))
              )] | first | .number // empty" | head -1 || true)

            if [ -z "$MERGED_PR" ]; then
              echo "PR #${PR_NUM}: issue #${LINKED_ISSUE} closed but no merged [Pipeline] PR found. Skipping (may be won't-fix)."
              continue
            fi

            echo "PR #${PR_NUM}: SUPERSEDED (issue #${LINKED_ISSUE} closed by merged PR #${MERGED_PR})"
            gh pr close "$PR_NUM" --repo "$REPO" --delete-branch \
              -c "Superseded: issue #${LINKED_ISSUE} was already closed by PR #${MERGED_PR}. Closed by Pipeline Watchdog." || \
              echo "::warning::Could not close PR #${PR_NUM}"
            ACTIONS_TAKEN=$((ACTIONS_TAKEN + 1))
          done < <(echo "$PIPELINE_PRS" | jq -c '.[]')
```

**Step 2: Commit**

```bash
git add .github/workflows/pipeline-watchdog.yml
git commit -m "fix(watchdog): add superseded PR cleanup as backup to pr-review-submit

Detects open [Pipeline] PRs whose linked issue is CLOSED and another
[Pipeline] PR already MERGED for that issue. Requires both conditions
to avoid closing PRs for manually closed/won't-fix issues."
```

---

### Task 7: Cross-issue false CHANGES_REQUESTED — prd-decomposer.md

**Files:**
- Modify: `.github/workflows/prd-decomposer.md:96-106` (Quality Checklist / Decomposition Rules)

**Step 1: Add self-contained criteria rule**

In `.github/workflows/prd-decomposer.md`, find Decomposition Rule 7 (line ~76, the temporary_id rule). After it, add rule 8:

```
8. **Self-contained acceptance criteria.** Each issue's acceptance criteria must ONLY reference files, functions, and artifacts that will be created or modified IN THAT ISSUE. Do not include criteria that depend on artifacts from other issues — those belong on the issue that creates the artifact. If a feature spans multiple issues, each issue's criteria cover only its portion. Example: if Issue A creates `page.tsx` and Issue B adds OG metadata to it, Issue B's criteria should say "Add OG metadata to the card page" NOT "Update `generateMetadata` in `src/app/card/[username]/page.tsx`" — because that file doesn't exist until Issue A merges.
```

**Step 2: Compile lock file**

Run:
```bash
gh aw compile
```
Expected: `prd-decomposer.lock.yml` regenerated.

**Step 3: Commit**

```bash
git add .github/workflows/prd-decomposer.md .github/workflows/prd-decomposer.lock.yml
git commit -m "fix(prd-decomposer): require self-contained acceptance criteria per issue

New rule 8: criteria must only reference artifacts created in that issue.
Prevents cross-issue criteria that cause false CHANGES_REQUESTED reviews."
```

---

### Task 8: Cross-issue false CHANGES_REQUESTED — pr-review-agent.md

**Files:**
- Modify: `.github/workflows/pr-review-agent.md:67-74` (Decision rules section)

**Step 1: Add DEFERRED criteria rule**

In `.github/workflows/pr-review-agent.md`, find the Decision Rules section (line 68, section 8). After the last bullet ("Be pragmatic: minor style issues alone are NOT grounds for REQUEST_CHANGES"), add:

```
   - **Deferred criteria**: If an acceptance criterion references a file or export that does not exist in the repository OR in the PR diff, check the linked issue's `## Dependencies` section for an explicit `Depends on #N` reference. Then verify issue #N is still OPEN via `gh issue view #N`. **Only mark as DEFERRED if both conditions are true** (explicit dependency exists AND that dependency issue is still open). Use `- [ ] ~Criterion — DEFERRED: depends on #N which is not yet merged~` in your checklist. Deferred criteria do NOT count as unmet — do not REQUEST_CHANGES for them. If the missing artifact has no matching dependency reference in the issue body, treat the criterion as **unmet** and REQUEST_CHANGES. Note in your summary that the decomposer may need to reassign this criterion to the correct issue.
```

**Step 2: Compile lock file**

Run:
```bash
gh aw compile
```
Expected: `pr-review-agent.lock.yml` regenerated.

**Step 3: Commit**

```bash
git add .github/workflows/pr-review-agent.md .github/workflows/pr-review-agent.lock.yml
git commit -m "fix(pr-review-agent): add DEFERRED criteria rule for cross-issue dependencies

Reviewer now checks Dependencies section + issue state before flagging
missing artifacts. Requires explicit evidence (Depends on #N + issue open)
to defer; otherwise treats as unmet to avoid over-deferring."
```

---

### Task 9: Final compile and integration verification

**Files:**
- All `.lock.yml` files

**Step 1: Full recompile**

Run:
```bash
gh aw compile
```
Verify all 4 lock files are up to date:
- `repo-assist.lock.yml`
- `pr-review-agent.lock.yml`
- `prd-decomposer.lock.yml`
- `pipeline-status.lock.yml` (should be unchanged)

**Step 2: Verify no uncommitted changes**

Run:
```bash
git status
```
Expected: Clean working tree (all changes committed in Tasks 1-8).

**Step 3: Review all commits**

Run:
```bash
git log --oneline -10
```
Expected: 7 new commits (Tasks 2-8, no commit for Task 1 repo setting) plus the design doc commit.

**Step 4: Verify YAML syntax**

Run:
```bash
python3 -c "
import yaml, sys, glob
for f in glob.glob('.github/workflows/*.yml'):
    try:
        yaml.safe_load(open(f))
        print(f'OK: {f}')
    except Exception as e:
        print(f'FAIL: {f}: {e}')
        sys.exit(1)
"
```
Expected: All files OK.
