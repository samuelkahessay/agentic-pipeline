# Architecture

## Pipeline Overview

The agentic pipeline turns Product Requirements Documents (PRDs) into shipped code
with minimal human intervention. Six workflows cooperate in a loop:

```
 You write a PRD
       |
       v
 +-----------------+     creates      +------------------+
 | prd-decomposer  | ──────────────>  | GitHub Issues    |
 | (agentic, gpt-5)|     (atomic,     | with acceptance  |
 +-----------------+   ordered by dep) | criteria         |
       |                               +------------------+
       | dispatches                           |
       v                                      |
 +-----------------+     implements           |
 | repo-assist     | <───────────────────────-+
 | (agentic, gpt-5)|
 +-----------------+
       |
       | opens PR
       v
 +-----------------+     approves     +------------------+
 | pr-reviewer     | ──────────────>  | Squash merge     |
 | (GHA, gpt-5    )|                  | (auto)           |
 +-----------------+                  +------------------+
       |                                      |
       | re-dispatches if                     | triggers
       | issues remain                        v
       |                              +------------------+
       |                              | close-issues     |
       |                              | (GHA, on merge)  |
       |                              +------------------+
       v                                      |
 +-----------------+                          |
 | repo-assist     | <───── cycle continues ──+
 +-----------------+
       ^
       |  detects stalls
 +-----------------+
 | pipeline-       |
 | watchdog        |
 | (cron, 30 min)  |
 +-----------------+
```

## Workflows

### prd-decomposer

| | |
|---|---|
| **File** | `.github/workflows/prd-decomposer.md` |
| **Engine** | Copilot (gpt-5) |
| **Trigger** | `/decompose` command on an issue |
| **Output** | Up to 20 atomic GitHub Issues with `[Pipeline]` prefix, acceptance criteria, and dependency ordering |

Reads a PRD from the issue body, decomposes it into implementable issues labeled
`pipeline` + a type label (`feature`, `infra`, `test`, `docs`, `bug`). Issues
reference each other via temporary IDs for dependency ordering. After creating
all issues, dispatches `repo-assist` once.

### repo-assist

| | |
|---|---|
| **File** | `.github/workflows/repo-assist.md` |
| **Engine** | Copilot (gpt-5) |
| **Trigger** | Dispatch from prd-decomposer or pr-reviewer, daily schedule, `/repo-assist` command |
| **Output** | Up to 4 PRs per run |

Runs a 5-task cycle each invocation:

1. **Implement issues** — picks unblocked pipeline issues, creates branches from `main`, writes code, runs tests, opens PRs with `Closes #N`
2. **Maintain PRs** — fixes CI failures and merge conflicts on open pipeline PRs
3. **Unblock dependents** — comments on issues whose dependencies have resolved
4. **Handle review feedback** — implements requested changes from pr-reviewer
5. **Update status** — maintains a rolling status issue with progress table

Persists memory on an orphan branch (`memory/repo-assist`) to track attempted
issues, outcomes, and backlog state across runs.

### pr-reviewer

| | |
|---|---|
| **File** | `.github/workflows/pr-reviewer.yml` |
| **Engine** | GitHub Models API (gpt-5 cascade: gpt-5 -> gpt-5-mini -> gpt-5-nano) |
| **Trigger** | Automatic on PR opened/updated/ready |
| **Output** | APPROVE or REQUEST_CHANGES review |

Standard GitHub Actions workflow (not agentic) that runs as `github-actions[bot]`.
This identity separation is critical — the bot that creates PRs (Copilot) is
different from the bot that approves them, satisfying GitHub's self-approval restriction.

Review process:
1. Fetches PR diff, linked issue acceptance criteria, AGENTS.md guidelines
2. Calls GitHub Models API with the full context (smart diff truncation prioritizes tests)
3. Validates decision output — unrecognized decisions default to REQUEST_CHANGES
4. Submits APPROVE or REQUEST_CHANGES via GitHub API
5. On APPROVE of `[Pipeline]` PRs: enables auto-merge (squash)
6. After review: checks for remaining pipeline issues, dispatches `repo-assist` if any exist

Fallback behavior when all AI models fail:
- **Pipeline PRs**: REQUEST_CHANGES (never rubber-stamped — no human is watching)
- **Human PRs**: APPROVE with note (human reviewer will do real review; status check still passes)
- **CI failing**: always REQUEST_CHANGES regardless of PR type

### pipeline-status

| | |
|---|---|
| **File** | `.github/workflows/pipeline-status.md` |
| **Engine** | Copilot (gpt-5) |
| **Trigger** | Daily schedule |
| **Output** | Updated status issue |

Read-only reporting workflow. Scans all pipeline issues and PRs, categorizes them
(open, in-progress, blocked, completed), and updates a single `[Pipeline] Status`
issue with a summary table.

### close-issues

| | |
|---|---|
| **File** | `.github/workflows/close-issues.yml` |
| **Engine** | Standard GitHub Actions |
| **Trigger** | `pull_request: closed` (merged only) |
| **Output** | Closes linked issues via `gh issue close` |

Dedicated workflow for closing issues referenced by `Closes #N` (and variants) in
merged PR bodies. Isolated from pr-reviewer with its own concurrency group
(`close-issues-{PR_NUMBER}`, `cancel-in-progress: false`) to prevent the job from
being cancelled by concurrent workflow runs.

Fetches the PR body via `gh pr view` (not `${{ github.event.pull_request.body }}`)
to avoid script injection vulnerabilities.

### pipeline-watchdog

| | |
|---|---|
| **File** | `.github/workflows/pipeline-watchdog.yml` |
| **Engine** | Standard GitHub Actions |
| **Trigger** | Cron (every 30 minutes), manual dispatch |
| **Output** | `/repo-assist` comments or `repo-assist` dispatches |

Cron-based stall detector that replaces the human supervisor. Detects two failure modes:

1. **Stalled PRs** — Open `[Pipeline]` PRs with a `CHANGES_REQUESTED` review and no
   activity for 30+ minutes. Posts `/repo-assist` on the linked issue with fix instructions.
2. **Orphaned issues** — Open pipeline issues with no linked open PR and no activity
   for 30+ minutes. Dispatches `repo-assist.lock.yml` in Scheduled Mode.

Safety mechanisms:
- Skips all dispatches if repo-assist is already running (prevents flooding)
- One action per cycle (stalled PR takes priority over orphaned issue)
- Concurrency group `pipeline-watchdog` with `cancel-in-progress: false`
- Posts completion notice on status issue when all pipeline items are resolved

## Key Design Decisions

**Squash merge with PR_BODY** — The repo is configured so squash merge commits
use the PR body as the commit message. Since repo-assist writes `Closes #N` in
every PR body, squash merging preserves the issue reference. However, `GITHUB_TOKEN`
cannot trigger the `Closes #N` auto-close — the dedicated `close-issues` workflow
handles issue closing explicitly after each merge.

**Orphan branch memory** — repo-assist stores state in a JSON file on the
`memory/repo-assist` orphan branch. This persists across workflow runs without
polluting the main branch history.

**Model cascade** — pr-reviewer tries gpt-5 first, falls back to gpt-5-mini,
then gpt-5-nano. If all models fail: pipeline PRs get REQUEST_CHANGES (never
rubber-stamped), while human PRs get APPROVE with a note (human will do real
review). CI-failing PRs always get REQUEST_CHANGES regardless of type.

**Identity separation** — Agentic workflows run under the Copilot app identity.
pr-reviewer runs under `github-actions[bot]`. This lets the reviewer approve PRs
created by the Copilot agent without violating GitHub's self-approval rules.

**Re-dispatch loop** — After each merge, pr-reviewer checks for remaining open
issues and re-dispatches repo-assist. This creates a continuous loop that runs
until all issues from the PRD are implemented.

## Secrets

| Secret | Purpose |
|--------|---------|
| `MODELS_TOKEN` | GitHub PAT with `models:read` scope for AI code review |
| `GH_AW_GITHUB_TOKEN` | Token for gh-aw agentic workflow engine |
| `COPILOT_GITHUB_TOKEN` | Copilot agent token |

## Repo Settings

Configured by `scripts/bootstrap.sh` and manual ruleset setup:

- Squash merge commit message: `PR_BODY` (preserves `Closes #N`)
- Allow auto-merge: enabled
- Ruleset "Protect main": 1 required review + `review` status check, squash-only, admin bypass
