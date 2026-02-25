# Architecture

## Pipeline Overview

The agentic pipeline turns Product Requirements Documents (PRDs) into shipped code
with minimal human intervention. Four workflows cooperate in a loop:

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
 | (GHA, gpt-5    )|                  | (auto, Closes #N)|
 +-----------------+                  +------------------+
       |                                      |
       | re-dispatches if                     | auto-closes
       | issues remain                        | linked issue
       v                                      |
 +-----------------+                          |
 | repo-assist     | <───── cycle continues ──+
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
2. Calls GitHub Models API with the full context
3. Submits APPROVE or REQUEST_CHANGES via GitHub API
4. On APPROVE of `[Pipeline]` PRs: enables auto-merge (squash)
5. After merge: checks for remaining pipeline issues, dispatches `repo-assist` if any exist

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

## Key Design Decisions

**Squash merge with PR_BODY** — The repo is configured so squash merge commits
use the PR body as the commit message. Since repo-assist writes `Closes #N` in
every PR body, squash merging automatically closes the linked issue.

**Orphan branch memory** — repo-assist stores state in a JSON file on the
`memory/repo-assist` orphan branch. This persists across workflow runs without
polluting the main branch history.

**Model cascade** — pr-reviewer tries gpt-5 first, falls back to gpt-5-mini,
then gpt-5-nano. If all fail, it auto-approves passing PRs with a note that AI
review was unavailable.

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
