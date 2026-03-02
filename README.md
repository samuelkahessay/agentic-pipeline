# PRD to Prod

A policy-bounded AI execution system that turns product requirements into
shipped code within explicit autonomy limits.

You define the intent and the policy. The pipeline executes within those bounds:
decomposing requirements, writing code, reviewing PRs, and merging — without
human coding or merge intervention on the pipeline-generated path. Control-plane
changes and human-authored PRs always require human approval.

Powered by [gh-aw](https://github.com/github/gh-aw) agentic workflows.

## What It Does

```
  Human:   PRD ──────────────────────────────────────────────────> Policy
                                                                       |
  AI:           Issues ──> Code ──> Review ──> Merge ──> Ship         |
                    ↑                              |        |          |
                    +────── loop until done ────────+        |          |
                                                            v          |
                                              control-plane PRs: human-required
```

You write a product requirements document. The pipeline executes within policy:

- **Decomposes** the PRD into atomic, dependency-ordered issues
- **Implements** each issue — branching, writing code, running tests, opening PRs
- **Reviews** every PR with full-context AI code review (no truncation)
- **Auto-merges** approved `[Pipeline]` PRs via squash merge, closing linked issues
- **Self-heals** within autonomous scope — stalled PRs, CI incidents, orphaned issues
- **Tracks progress** on a GitHub Projects v2 board, updated every run

Where AI stops: `.github/workflows/`, agent configs, and `autonomy-policy.yml`
are control-plane paths. PRs touching them trigger REQUEST_CHANGES from the
review agent — those merges require human approval.

## Autonomy Policy

The repo ships a formal [`autonomy-policy.yml`](autonomy-policy.yml) that
defines the boundary between autonomous and human-required actions.

Key rules:
- **Fail-closed default** — unknown or unclassified actions require human approval
- **Merge gate** — PRs touching `.github/workflows/**`, `.github/agents/**`, or
  `autonomy-policy.yml` always get REQUEST_CHANGES from pr-review-agent
- **Auto-merge scope** — only `[Pipeline]`-prefixed PRs on approved code changes;
  never control-plane changes, never human-authored PRs
- **Healing scope** — watchdog and CI repair operate only on `[Pipeline]` work;
  human PRs are never modified by the pipeline

**Emergency stop:** Set repository variable `PIPELINE_HEALING_ENABLED=false` to
pause autonomous healing. Review submission and failure detection still run, but
auto-dispatch, repair commands, and pipeline auto-merge are skipped until the
variable is unset or reset to `true`. See [autonomy-policy.yml](autonomy-policy.yml)
for the full classification.

## Shipped So Far

The autonomous path has produced five runs across different tech stacks.
Each row is evidence: issue links, PR links, and a tagged commit you can
`git checkout` and inspect. Zero human implementation code.

| Run | App | Stack | Tag |
|-----|-----|-------|-----|
| 01 | [Code Snippet Manager](showcase/01-code-snippet-manager/) | Express + TypeScript | [`v1.0.0`](https://github.com/samuelkahessay/prd-to-prod/tree/v1.0.0) |
| 02 | [Pipeline Observatory](showcase/02-pipeline-observatory/) | Next.js 14 + TypeScript | [`v2.0.0`](https://github.com/samuelkahessay/prd-to-prod/tree/v2.0.0) |
| 03 | [DevCard](showcase/03-devcard/) | Next.js 14 + TypeScript + Framer Motion | [`v3.0.0`](https://github.com/samuelkahessay/prd-to-prod/tree/v3.0.0) |
| 04 | [Ticket Deflection Service](https://prd-to-prod.azurewebsites.net/) | ASP.NET Core + C# | [`v4.0.0`](https://github.com/samuelkahessay/prd-to-prod/tree/v4.0.0) |

Each run produces a different app with a different tech stack — the pipeline is stack-agnostic.

See [`showcase/`](showcase/) for detailed run reports.

## Quick Start

Week-one MVP support is currently validated for the `dotnet-azure` profile.
See [docs/SELF_HEALING_MVP.md](docs/SELF_HEALING_MVP.md) for the operator runbook.
See [autonomy-policy.yml](autonomy-policy.yml) for the full action classification.

```bash
# 1. Clone
git clone https://github.com/samuelkahessay/prd-to-prod.git
cd prd-to-prod

# 2. Install gh-aw
gh extension install github/gh-aw

# 3. Bootstrap (creates labels, compiles workflows, seeds memory)
bash scripts/bootstrap.sh

# 4. Configure secrets
gh aw secrets bootstrap

# 5. Verify repo settings
#    - auto-merge enabled
#    - delete branch on merge enabled
#    - active Protect main ruleset

# 6. Push
git push

# 7. Create an issue with your PRD, then comment: /decompose
```

**Requirements:** GitHub account with Copilot subscription, GitHub CLI (`gh`) v2.0+, `gh-aw` extension.

### Required Secrets

- `COPILOT_GITHUB_TOKEN`
- `GH_AW_GITHUB_TOKEN`
- `GH_AW_PROJECT_GITHUB_TOKEN`
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Required Repo Settings

- Auto-merge enabled
- Delete branch on merge enabled
- Active `Protect main` ruleset on `main`

### Emergency Control

Set repository variable `PIPELINE_HEALING_ENABLED=false` to pause autonomous
healing. Review submission and failure detection still run, but auto-dispatch,
watchdog remediation, repair-command posting, and pipeline auto-merge are
skipped until the variable is unset or set back to `true`. See
[autonomy-policy.yml](autonomy-policy.yml) for what stays running.

## Autonomy Boundaries

The repo intentionally distinguishes between pipeline-generated PRs and
human-authored PRs:

- PRs titled `[Pipeline] ...` are the autonomous path. After approval, they can
  be auto-merged by `pr-review-submit`.
- Human-authored PRs still go through review and CI, but they are not
  auto-merged by the pipeline.
- "Self-healing" means the workflows can retry, redispatch, escalate, and
  repair common pipeline incidents. It does not mean rollback automation or
  automatic merging of arbitrary approved PRs.

## How the Pipeline Works

1. **Write a PRD** — paste it in a GitHub Issue
2. **`/decompose`** — AI breaks it into issues with acceptance criteria and dependency ordering
3. **`repo-assist`** — AI implements each issue as a PR (branch, code, test, open)
4. **`pr-review-agent`** — AI reviews the full diff against acceptance criteria
5. **`pr-review-submit`** — formal review + auto-merge for approved `[Pipeline]`
   PRs + re-dispatch for the next issue
6. **Self-healing** — watchdog catches stalls, CI failures feed the repair loop,
   and unresolved incidents escalate

The autonomous loop runs until every issue from the PRD is shipped. Human PRs
can still use the same review workflows, but they remain outside the auto-merge
path.

For the full architecture, workflow details, design decisions, and self-healing mechanics, see [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md).
For the MVP setup, verification steps, and drill commands, see [**docs/SELF_HEALING_MVP.md**](docs/SELF_HEALING_MVP.md).
For the rationale behind the gh-aw + GitHub Actions split, see [**docs/why-gh-aw.md**](docs/why-gh-aw.md).

## License

MIT
