# Template Repo Extraction — Implementation Plan

> **Phase 1: COMPLETE** — Template extraction, 2026-03-02.
> **Phase 2: COMPLETE** — Setup wizard, 2026-03-02.
> **Phase 3: COMPLETE** — GitHub App auth, 2026-03-03.
> Repo live at https://github.com/samuelkahessay/prd-to-prod-template

**Goal:** Create `prd-to-prod-template` — a GitHub template repo that anyone can fork, configure for Next.js + Vercel, and have a working autonomous pipeline.

**Architecture:** Extract all generic pipeline infrastructure from `prd-to-prod` into a new repo, templatizing hardcoded references (project URLs, app names, file paths). The `.lock.yml` files are NOT copied — users generate them via `gh aw compile` during bootstrap. The primary stack profile is `nextjs-vercel`; `dotnet-azure` and `docker-generic` are included as dormant alternatives.

**Tech Stack:** Shell scripts, GitHub Actions YAML, gh-aw Markdown workflows, GitHub CLI

**Source repo:** `/Users/skahessay/Documents/Projects/active/prd-to-prod`
**Target repo:** `/Users/skahessay/Documents/Projects/active/prd-to-prod-template`
**Live repo:** https://github.com/samuelkahessay/prd-to-prod-template

---

## Task 1: Initialize Template Repo

**Files:**
- Create: `prd-to-prod-template/` directory tree

**Step 1: Create the directory structure**

```bash
cd /Users/skahessay/Documents/Projects/active
mkdir -p prd-to-prod-template/.github/workflows/shared
mkdir -p prd-to-prod-template/.github/agents
mkdir -p prd-to-prod-template/.github/deploy-profiles
mkdir -p prd-to-prod-template/.github/ISSUE_TEMPLATE
mkdir -p prd-to-prod-template/scripts
mkdir -p prd-to-prod-template/docs/prd
mkdir -p prd-to-prod-template/docs/decision-ledger
```

**Step 2: Initialize git repo**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
git init
```

**Step 3: Commit**

```bash
git add .
git commit -m "chore: initialize template repo directory structure"
```

---

## Task 2: Copy As-Is Workflow Files (no templatization needed)

These workflow files are generic and need zero changes.

**Files:**
- Copy from source → target:
  - `.github/workflows/auto-dispatch.yml`
  - `.github/workflows/auto-dispatch-requeue.yml`
  - `.github/workflows/prd-decomposer.md`
  - `.github/workflows/pr-review-agent.md`
  - `.github/workflows/pr-review-submit.yml`
  - `.github/workflows/ci-failure-resolve.yml`
  - `.github/workflows/pipeline-watchdog.yml`
  - `.github/workflows/close-issues.yml`
  - `.github/workflows/agentics-maintenance.yml`
  - `.github/workflows/ci-node.yml`
  - `.github/workflows/deploy-router.yml`
  - `.github/workflows/deploy-vercel.yml`
  - `.github/workflows/deploy-docker.yml`

**Step 1: Copy all as-is workflow files**

```bash
SRC=/Users/skahessay/Documents/Projects/active/prd-to-prod
DST=/Users/skahessay/Documents/Projects/active/prd-to-prod-template

for f in auto-dispatch.yml auto-dispatch-requeue.yml prd-decomposer.md \
         pr-review-agent.md pr-review-submit.yml ci-failure-resolve.yml \
         pipeline-watchdog.yml close-issues.yml agentics-maintenance.yml \
         ci-node.yml deploy-router.yml deploy-vercel.yml deploy-docker.yml; do
  cp "$SRC/.github/workflows/$f" "$DST/.github/workflows/$f"
done
```

**Step 2: Copy auxiliary agent workflows**

```bash
for f in ci-doctor.md code-simplifier.md pipeline-status.md; do
  cp "$SRC/.github/workflows/$f" "$DST/.github/workflows/$f"
done
cp "$SRC/.github/workflows/shared/reporting.md" "$DST/.github/workflows/shared/reporting.md"
```

**Step 3: Copy non-workflow config files (as-is)**

```bash
cp "$SRC/.github/agents/agentic-workflows.agent.md" "$DST/.github/agents/agentic-workflows.agent.md"
cp "$SRC/.github/copilot-instructions.md" "$DST/.github/copilot-instructions.md"
cp "$SRC/.github/ISSUE_TEMPLATE/bug-report.yml" "$DST/.github/ISSUE_TEMPLATE/bug-report.yml"
cp "$SRC/.github/deploy-profiles/nextjs-vercel.yml" "$DST/.github/deploy-profiles/nextjs-vercel.yml"
cp "$SRC/.github/deploy-profiles/dotnet-azure.yml" "$DST/.github/deploy-profiles/dotnet-azure.yml"
cp "$SRC/.github/deploy-profiles/docker-generic.yml" "$DST/.github/deploy-profiles/docker-generic.yml"
cp "$SRC/AGENTS.md" "$DST/AGENTS.md"
cp "$SRC/docs/why-gh-aw.md" "$DST/docs/why-gh-aw.md"
cp "$SRC/docs/SELF_HEALING_MVP.md" "$DST/docs/SELF_HEALING_MVP.md"
```

**Step 4: Verify no files were missed**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
find .github/workflows -type f | sort
find .github -type f | sort
```

Expected: 13 workflow files + 3 auxiliary agents + 1 shared + 3 deploy profiles + 1 agent config + 1 copilot instructions + 1 issue template = ~23 files.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: copy as-is pipeline workflow and config files from prd-to-prod"
```

---

## Task 3: Templatize repo-assist.md

Remove the hardcoded `samuelkahessay/projects/2` project URL. Make project status updates optional — most template users won't have a GitHub Project Board configured.

**Files:**
- Copy + modify: `.github/workflows/repo-assist.md`

**Step 1: Copy and templatize**

Copy `repo-assist.md` from source. Make two changes:

1. **Line 53** — Replace the `project:` URL with a placeholder and make it conditional:
```yaml
  # Uncomment and configure if you use GitHub Projects for tracking:
  # create-project-status-update:
  #   project: "https://github.com/users/YOUR_GITHUB_USERNAME/projects/YOUR_PROJECT_ID"
  #   max: 1
  #   github-token: ${{ secrets.GH_AW_PROJECT_GITHUB_TOKEN }}
```

2. **Line 243** — Replace Task 5 project status update section. Change:
```
Post a project status update to `https://github.com/users/samuelkahessay/projects/2` as a rolling summary.
```
To:
```
If `create-project-status-update` is configured in safe-outputs above, post a project status update as a rolling summary. Otherwise, skip this task silently.
```

**Step 2: Verify no `samuelkahessay` references remain**

```bash
grep -n 'samuelkahessay' prd-to-prod-template/.github/workflows/repo-assist.md
```

Expected: no matches.

**Step 3: Commit**

```bash
git add .github/workflows/repo-assist.md
git commit -m "feat: templatize repo-assist.md — make project tracking optional"
```

---

## Task 4: Templatize ci-failure-issue.yml

Remove the `extract_drill_id()` function and `append_drill_metadata()` calls. These are drill harness infrastructure specific to `prd-to-prod` and will be re-added in Phase 5 (Drill Kit).

**Files:**
- Copy + modify: `.github/workflows/ci-failure-issue.yml`

**Step 1: Copy ci-failure-issue.yml**

Copy from source.

**Step 2: Remove `extract_drill_id()` function**

Delete lines 136-147 (the entire `extract_drill_id()` function):
```bash
          extract_drill_id() {
            ...
            git log --format=%B -- TicketDeflection/Canary/DrillCanary.cs 2>/dev/null \
              | sed -n 's/.*\[drill-id:\([^]]*\)\].*/\1/p' | head -1
          }
```

**Step 3: Remove `append_drill_metadata()` function**

Delete lines 149-165 (the entire `append_drill_metadata()` function).

**Step 4: Remove calls to both functions**

There are 2 call sites:

1. Around line 296-297 (no-PR path):
```bash
            DRILL_ID=$(extract_drill_id)
            BODY=$(append_drill_metadata "$BODY" "$DRILL_ID")
```
Delete both lines.

2. Around line 338-339 (main-branch pipeline path):
```bash
            DRILL_ID=$(extract_drill_id)
            BODY=$(append_drill_metadata "$BODY" "$DRILL_ID")
```
Delete both lines.

**Step 5: Verify no `TicketDeflection` or `drill` function references remain**

```bash
grep -n 'TicketDeflection\|extract_drill_id\|append_drill_metadata\|drill_id\|DrillCanary' \
  prd-to-prod-template/.github/workflows/ci-failure-issue.yml
```

Expected: no matches.

**Step 6: Commit**

```bash
git add .github/workflows/ci-failure-issue.yml
git commit -m "feat: templatize ci-failure-issue.yml — remove drill harness functions"
```

---

## Task 5: Templatize copilot-setup-steps.yml

Make the SDK setup conditional on `.deploy-profile`. The current file hardcodes `.NET 8 SDK` — the template should install the right SDK for the active profile.

**Files:**
- Copy + modify: `.github/workflows/copilot-setup-steps.yml`

**Step 1: Write templatized copilot-setup-steps.yml**

Replace the single `.NET 8 SDK` step with profile-conditional setup:

```yaml
name: "Copilot Setup Steps"

# This workflow configures the environment for GitHub Copilot Agent with gh-aw MCP server
on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  # The job MUST be called 'copilot-setup-steps' to be recognized by GitHub Copilot Agent
  copilot-setup-steps:
    runs-on: ubuntu-latest

    # Set minimal permissions for setup steps
    # Copilot Agent receives its own token with appropriate permissions
    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Read deploy profile
        id: profile
        run: |
          PROFILE=$(cat .deploy-profile 2>/dev/null || echo "nextjs-vercel")
          echo "profile=${PROFILE}" >> $GITHUB_OUTPUT

      - name: Setup Node.js
        if: steps.profile.outputs.profile == 'nextjs-vercel'
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup .NET SDK
        if: steps.profile.outputs.profile == 'dotnet-azure'
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Install gh-aw extension
        uses: github/gh-aw/actions/setup-cli@v0.50.1
        with:
          version: v0.50.1
```

**Step 2: Commit**

```bash
git add .github/workflows/copilot-setup-steps.yml
git commit -m "feat: templatize copilot-setup-steps.yml — conditional SDK based on deploy profile"
```

---

## Task 6: Templatize deploy-azure.yml

Replace hardcoded `prd-to-prod` and `prd-to-prod-rg` with repository variables.

**Files:**
- Copy + modify: `.github/workflows/deploy-azure.yml`

**Step 1: Copy and templatize**

Copy from source. Make the following changes:

1. **Comment (line 12)** — Remove the specific service principal name:
```
# - Federated identity credential on the service principal for this repo
```

2. **Lines 45-48** — Templatize the hardcoded dotnet commands (TicketDeflection.sln):
Replace with deploy-profile-aware commands:
```yaml
      - name: Restore, build, test, and publish
        run: |
          SOLUTION=$(find . -maxdepth 1 -name '*.sln' | head -1)
          if [ -z "$SOLUTION" ]; then
            echo "::error::No .sln file found in repo root"
            exit 1
          fi
          dotnet restore "$SOLUTION"
          dotnet build "$SOLUTION" --no-restore -c Release
          dotnet test "$SOLUTION" --no-build -c Release --verbosity normal
          # Find the main project (first .csproj in a non-test directory)
          MAIN_PROJECT=$(find . -name '*.csproj' -not -path '*.Tests*' | head -1)
          dotnet publish "$MAIN_PROJECT" --no-build -c Release -o ./publish
```

3. **Lines 61-62, 66-67** — Replace hardcoded Azure names with vars:
```yaml
          az webapp config appsettings set \
            --name ${{ vars.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ vars.AZURE_RESOURCE_GROUP }} \
            --settings WEBSITE_RUN_FROM_PACKAGE=1 \
            --output none
          az webapp deploy \
            --name ${{ vars.AZURE_WEBAPP_NAME }} \
            --resource-group ${{ vars.AZURE_RESOURCE_GROUP }} \
            --src-path deploy.zip \
            --type zip \
            --clean true
```

**Step 2: Verify no `prd-to-prod` hardcoded names remain**

```bash
grep -n 'prd-to-prod' prd-to-prod-template/.github/workflows/deploy-azure.yml
```

Expected: no matches (the service principal comment is now generic).

**Step 3: Commit**

```bash
git add .github/workflows/deploy-azure.yml
git commit -m "feat: templatize deploy-azure.yml — use repo vars for Azure resource names"
```

---

## Task 7: Templatize dotnet-ci.yml

Replace hardcoded `TicketDeflection.sln` with dynamic solution file detection.

**Files:**
- Copy + modify: `.github/workflows/dotnet-ci.yml`

**Step 1: Copy and templatize**

Copy from source. Replace lines 41-43 (hardcoded `TicketDeflection.sln`) with:

```yaml
      - name: Find solution file
        id: sln
        run: |
          SOLUTION=$(find . -maxdepth 1 -name '*.sln' | head -1)
          if [ -z "$SOLUTION" ]; then
            echo "::error::No .sln file found in repo root"
            exit 1
          fi
          echo "file=${SOLUTION}" >> $GITHUB_OUTPUT
      - run: dotnet restore ${{ steps.sln.outputs.file }}
      - run: dotnet build ${{ steps.sln.outputs.file }} --no-restore
      - run: dotnet test ${{ steps.sln.outputs.file }} --no-build --verbosity normal
```

**Step 2: Verify no `TicketDeflection` references remain**

```bash
grep -n 'TicketDeflection' prd-to-prod-template/.github/workflows/dotnet-ci.yml
```

Expected: no matches.

**Step 3: Commit**

```bash
git add .github/workflows/dotnet-ci.yml
git commit -m "feat: templatize dotnet-ci.yml — dynamic solution file detection"
```

---

## Task 8: Templatize ci-docker.yml

Replace hardcoded `prd-to-prod-ci` image name with repo-derived name.

**Files:**
- Copy + modify: `.github/workflows/ci-docker.yml`

**Step 1: Copy and templatize**

Copy from source. Replace line 36:
```yaml
      - run: docker build -t prd-to-prod-ci:${{ github.sha }} .
```
With:
```yaml
      - run: docker build -t ${{ github.event.repository.name }}-ci:${{ github.sha }} .
```

This uses the GitHub repo name dynamically.

**Step 2: Verify no `prd-to-prod` references remain**

```bash
grep -n 'prd-to-prod' prd-to-prod-template/.github/workflows/ci-docker.yml
```

Expected: no matches.

**Step 3: Commit**

```bash
git add .github/workflows/ci-docker.yml
git commit -m "feat: templatize ci-docker.yml — derive image name from repo name"
```

---

## Task 9: Templatize autonomy-policy.yml

Replace all `TicketDeflection/**` paths with `# YOUR_APP_DIR/**` placeholders and generic `app/**` defaults.

**Files:**
- Copy + modify: `autonomy-policy.yml`

**Step 1: Copy and templatize**

Copy from source. Make changes in 3 action blocks:

1. **`app_code_change` allowed_targets** (lines 33-40) — Replace with:
```yaml
    allowed_targets:
      # Replace with your application directories:
      - src/**
      - tests/**
      - package.json
      - Dockerfile
      # Dotnet example (uncomment if using dotnet-azure profile):
      # - YourApp/**
      # - YourApp.Tests/**
      # - YourApp.sln
      # - global.json
```

2. **`observability_change` allowed_targets** (lines 64-71) — Replace with:
```yaml
    allowed_targets:
      - docs/decision-ledger/**
      - drills/decisions/**
      - scripts/log-decision.sh
      - scripts/demo-preflight.sh
      # Replace with your operator-facing pages/endpoints:
      # - src/pages/operator/**
      # - src/api/autonomy/**
```

3. **`sensitive_app_change` allowed_targets** (lines 94-100) — Replace with:
```yaml
    allowed_targets:
      # Replace with your security-sensitive paths:
      - src/**/auth/**
      - src/**/compliance/**
      - src/**/payments/**
      # Dotnet example (uncomment if using dotnet-azure profile):
      # - YourApp/**/Auth/**
      # - YourApp/**/Compliance/**
      # - YourApp/**/Payments/**
```

**Step 2: Verify no `TicketDeflection` references remain**

```bash
grep -n 'TicketDeflection' prd-to-prod-template/autonomy-policy.yml
```

Expected: no matches.

**Step 3: Commit**

```bash
git add autonomy-policy.yml
git commit -m "feat: templatize autonomy-policy.yml — replace hardcoded paths with placeholders"
```

---

## Task 10: Copy and Templatize Scripts

Copy all pipeline scripts except `self-healing-drill.sh`. Templatize `run-lifecycle-lib.sh` to remove `TicketDeflection` references.

**Files:**
- Copy (as-is): all scripts except `self-healing-drill.sh` and `demo-preflight.sh`
- Copy + modify: `scripts/run-lifecycle-lib.sh`

**Step 1: Copy all as-is scripts**

```bash
SRC=/Users/skahessay/Documents/Projects/active/prd-to-prod
DST=/Users/skahessay/Documents/Projects/active/prd-to-prod-template

for f in bootstrap.sh start-run.sh archive-run.sh monitor-pipeline.sh \
         capture-run-data.sh extract-failure-context.sh render-ci-repair-command.sh \
         classify-pipeline-issue.sh check-autonomy-policy.sh log-decision.sh \
         pipeline-watchdog.sh healing-control.sh demo-preflight.sh verify-mvp.sh; do
  if [ -f "$SRC/scripts/$f" ]; then
    cp "$SRC/scripts/$f" "$DST/scripts/$f"
  fi
done
```

**Step 2: Templatize run-lifecycle-lib.sh**

Copy from source. Replace the ephemeral dirs/files arrays (lines 6-25) with generic defaults:

```bash
# Ephemeral directories — replaced during each PRD run.
# Customize these to match your application structure.
RUN_LIFECYCLE_EPHEMERAL_DIRS=(
  "src"
  "tests"
)

# Ephemeral files — PRD-specific configuration that gets removed on archive.
RUN_LIFECYCLE_EPHEMERAL_FILES=(
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "tailwind.config.ts"
  "postcss.config.js"
  "next.config.js"
  "vitest.config.ts"
  "vercel.json"
  "next-env.d.ts"
  "Dockerfile"
  # Dotnet example (uncomment if using dotnet-azure profile):
  # "YourApp.sln"
  # "global.json"
)
```

**Step 3: Verify no `TicketDeflection` references remain in scripts**

```bash
grep -rn 'TicketDeflection' prd-to-prod-template/scripts/
```

Expected: no matches.

**Step 4: Make scripts executable**

```bash
chmod +x prd-to-prod-template/scripts/*.sh
```

**Step 5: Commit**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
git add scripts/
git commit -m "feat: copy pipeline scripts and templatize run-lifecycle-lib.sh"
```

---

## Task 11: Create Template .deploy-profile

Set the default profile to `nextjs-vercel` since that's the Phase 1 primary stack.

**Files:**
- Create: `.deploy-profile`

**Step 1: Write .deploy-profile**

```
nextjs-vercel
```

**Step 2: Commit**

```bash
git add .deploy-profile
git commit -m "feat: set default deploy profile to nextjs-vercel"
```

---

## Task 12: Create Template .gitignore

Based on the source `.gitignore` but without project-specific entries and with `CLAUDE.md` NOT ignored (template ships a checked-in version).

**Files:**
- Create: `.gitignore`

**Step 1: Write .gitignore**

```gitignore
.DS_Store
*.swp
*.swo
*~
*.log
.env
.env.*
.claude/
node_modules/
dist/
.next/
.github/aw/
.vscode/
.vercel/
aw-prompts/
aw_info.json
mcp-logs/
*.patch
.vercel

# .NET
bin/
obj/
*.user
.vs/
.azure/

# Drill reports (generated, not committed)
drills/reports/*.json
```

Note: `CLAUDE.md` is NOT gitignored — the template ships a checked-in version.

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "feat: add template .gitignore"
```

---

## Task 13: Create Template CLAUDE.md

This is a checked-in version that ships with the template, unlike the source repo where `CLAUDE.md` is gitignored. It provides instructions for the pipeline agents and human operators.

**Files:**
- Create: `CLAUDE.md`

**Step 1: Write CLAUDE.md**

```markdown
# CLAUDE.md

## How this repo works

This is an autonomous software pipeline powered by gh-aw (GitHub Agentic Workflows). Issues labeled `pipeline` are picked up by the `repo-assist` agent, which implements them, opens PRs, and the review/merge chain handles the rest.

## Our role

We write **design briefs as GitHub issues**, not code. The pipeline agents do the implementation.

- Describe *what* should change and *why*, not *how* (no file paths, no diffs, no implementation details)
- Use clear issue structure: Problem → Solution → Scope → Acceptance Criteria
- Label issues with `feature, pipeline` or `bug, pipeline` so auto-dispatch picks them up
- Acceptance criteria are the contract — the PR review agent verifies against them

**Exception:** `.github/workflows/` changes (pipeline infrastructure) are done directly, not through issues.

## Working style

- When exploring the codebase or investigating an issue, start with the specific files/folders mentioned before doing broad exploration
- Never fabricate or assume details about PRs, issue statuses, or external resources
- Do not claim a process succeeded until you have verified the actual output

## CI failure triage procedure

Run `gh run list --status=failure --limit=5 --json databaseId,name,conclusion,headBranch` to find recent CI failures. For each failure:

1. Fetch the full logs with `gh run view <id> --log-failed`
2. Identify the root cause by tracing error messages to specific source files
3. Implement the fix on a new branch named `fix/ci-<short-description>`
4. Run the same build/test command that failed to verify the fix locally
5. If verification passes, commit and open a PR with the failure log excerpt and root cause analysis

## Issue writing guidelines

- Be descriptive about the desired experience, not prescriptive about implementation
- Include a "Scope" section that describes boundaries (what should/shouldn't change)
- The agent reads the codebase itself — trust it to find the right files
- Acceptance criteria should be verifiable (build passes, tests pass, behavior observable)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: add checked-in CLAUDE.md template for pipeline operators"
```

---

## Task 14: Create Generic docs/ARCHITECTURE.md

Adapt the source `docs/ARCHITECTURE.md` to be generic — remove `TicketDeflection` references and prd-to-prod specifics while keeping the architecture explanation.

**Files:**
- Create: `docs/ARCHITECTURE.md`

**Step 1: Write generic ARCHITECTURE.md**

Copy the structure and Mermaid diagram from the source, but:
- Replace all `prd-to-prod`-specific references with generic language
- Remove drill infrastructure references
- Keep the workflow groups, security model, and design decisions sections
- Replace the specific app references with "your application"

The content should preserve the full Mermaid flow diagram and workflow group tables from the source file (read from `/Users/skahessay/Documents/Projects/active/prd-to-prod/docs/ARCHITECTURE.md`), with project-specific details generalized.

**Step 2: Verify no `TicketDeflection` or `samuelkahessay` references**

```bash
grep -n 'TicketDeflection\|samuelkahessay' prd-to-prod-template/docs/ARCHITECTURE.md
```

Expected: no matches.

**Step 3: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "feat: add generic ARCHITECTURE.md for template users"
```

---

## Task 15: Create Template README.md

Comprehensive getting-started guide focused on the Next.js + Vercel path. This is the most important file for new users.

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

Structure:

```markdown
# prd-to-prod

> Turn product requirements into deployed software. Autonomously.

Drop a PRD. The pipeline decomposes it into issues, implements them as PRs,
reviews the code, merges on approval, and deploys. If CI breaks, it fixes itself.

## How it works

[Mermaid flowchart from ARCHITECTURE.md]

## Quick Start (Next.js + Vercel)

### Prerequisites

- GitHub account with Actions enabled
- [gh CLI](https://cli.github.com/) installed
- [gh-aw extension](https://github.com/github/gh-aw) installed (`gh extension install github/gh-aw`)

### 1. Create your repo

Click **"Use this template"** → **"Create a new repository"**.

Clone your new repo locally.

### 2. Run bootstrap

```bash
./scripts/bootstrap.sh
```

This creates labels, compiles gh-aw workflows, seeds the repo-memory branch,
and configures repo settings.

### 3. Configure secrets

```bash
# Configure the AI engine (GitHub Copilot, Claude, or Codex)
gh aw secrets bootstrap

# Required for self-healing loop and auto-merge:
# Create a PAT with `repo` and `workflow` scopes, then:
gh secret set GH_AW_GITHUB_TOKEN

# For Vercel deployment:
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

### 4. Configure repo settings

- Enable **Settings → General → Allow auto-merge**
- Create a **branch protection rule** for `main`:
  - Require 1 approving review
  - Require the `review` status check
  - Allow squash merges only

### 5. Submit your first PRD

Create an issue with your product requirements, then comment `/decompose`.

Or drop a PRD file into `docs/prd/` and run:
```bash
gh aw run prd-decomposer
```

## Choosing a Stack

Edit `.deploy-profile` to switch stacks:

| Profile | File content | CI Workflow | Deploy Target |
|---------|-------------|-------------|---------------|
| **Next.js + Vercel** | `nextjs-vercel` | Node CI | Vercel |
| .NET + Azure | `dotnet-azure` | .NET CI | Azure App Service |
| Docker + GHCR | `docker-generic` | Docker CI | GitHub Container Registry |

After changing the profile, run `./scripts/bootstrap.sh` to recompile workflows.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

See [docs/why-gh-aw.md](docs/why-gh-aw.md) for why this uses GitHub Agentic Workflows.

## Customization

### autonomy-policy.yml

Defines what the AI agents can and cannot do. Edit `allowed_targets` in
each action block to match your application's directory structure.

### .github/deploy-profiles/

Each profile defines the build runtime, commands, and deploy workflow for a
tech stack. You can create custom profiles by adding new YAML files here.

## Self-Healing Loop

When CI fails on `main`, the pipeline:
1. Creates a `[Pipeline] CI Build Failure` issue
2. `auto-dispatch` triggers `repo-assist`
3. The agent reads failure logs, implements a fix, opens a PR
4. The review agent approves, auto-merge lands the fix
5. Deploy runs on the green main branch

This loop is autonomous — zero human intervention required.

## Secrets Reference

| Secret | Required | Purpose |
|--------|----------|---------|
| `GH_AW_GITHUB_TOKEN` | Yes | PAT for auto-merge and workflow dispatch (bypasses GitHub anti-cascade) |
| `VERCEL_TOKEN` | Vercel only | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel only | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel only | Vercel project ID |
| `AZURE_CLIENT_ID` | Azure only | Azure service principal client ID |
| `AZURE_TENANT_ID` | Azure only | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure only | Azure subscription ID |

## Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `PIPELINE_HEALING_ENABLED` | No | Set to `false` to pause autonomous healing |
| `AZURE_WEBAPP_NAME` | Azure only | Azure Web App name |
| `AZURE_RESOURCE_GROUP` | Azure only | Azure resource group name |

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "feat: add comprehensive README with Next.js quick start guide"
```

---

## Task 16: Create Placeholder Files

Create necessary placeholder files and directories to make the template feel complete.

**Files:**
- Create: `docs/prd/.gitkeep`
- Create: `docs/decision-ledger/.gitkeep`
- Create: `LICENSE`

**Step 1: Create placeholder files**

```bash
touch prd-to-prod-template/docs/prd/.gitkeep
touch prd-to-prod-template/docs/decision-ledger/.gitkeep
```

**Step 2: Create MIT LICENSE**

Standard MIT license file.

**Step 3: Commit**

```bash
git add docs/prd/.gitkeep docs/decision-ledger/.gitkeep LICENSE
git commit -m "feat: add placeholder directories and MIT license"
```

---

## Task 17: Full Template Verification

Run a comprehensive check that the template is clean — no leftover hardcoded references from prd-to-prod.

**Files:** None (verification only)

**Step 1: Check for TicketDeflection references**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
grep -rn 'TicketDeflection' . --include='*.yml' --include='*.md' --include='*.sh' --include='*.yaml'
```

Expected: no matches.

**Step 2: Check for samuelkahessay references**

```bash
grep -rn 'samuelkahessay' . --include='*.yml' --include='*.md' --include='*.sh' --include='*.yaml'
```

Expected: no matches.

**Step 3: Check for prd-to-prod hardcoded names (not in docs/README)**

```bash
grep -rn 'prd-to-prod' . --include='*.yml' --include='*.sh' --include='*.yaml' | grep -v README | grep -v ARCHITECTURE | grep -v why-gh-aw
```

Expected: no matches (only appears in documentation context, not as hardcoded config values).

**Step 4: Verify .lock.yml files were NOT copied**

```bash
find . -name '*.lock.yml' -type f
```

Expected: no matches.

**Step 5: Verify file tree**

```bash
find . -type f | grep -v '.git/' | sort
```

Expected: all planned files present, nothing extra.

**Step 6: Commit any fixes needed**

If any issues found, fix them and commit:
```bash
git add -A
git commit -m "fix: clean up remaining hardcoded references"
```

---

## Task 18: Push to GitHub

Create the remote repo and push.

**Step 1: Create GitHub repo**

```bash
cd /Users/skahessay/Documents/Projects/active/prd-to-prod-template
gh repo create samuelkahessay/prd-to-prod-template --public --source=. --push \
  --description "Template repo for autonomous PRD-to-production pipeline powered by gh-aw"
```

**Step 2: Enable template repo setting**

```bash
gh api repos/samuelkahessay/prd-to-prod-template --method PATCH -f is_template=true
```

**Step 3: Verify repo is accessible**

```bash
gh repo view samuelkahessay/prd-to-prod-template
```

Expected: repo exists, is_template: true, files are all present.

---

## Post-Implementation Checklist

All verified 2026-03-02:

- [x] `nextjs-vercel` is the default in `.deploy-profile`
- [x] No `.lock.yml` files in the template (generated by `gh aw compile`)
- [x] No `TicketDeflection`, `samuelkahessay`, or hardcoded `prd-to-prod` config values
- [x] All scripts are executable (`chmod +x`)
- [x] `README.md` has complete setup instructions for Next.js path
- [x] `autonomy-policy.yml` has clean paths (no dotnet placeholders)
- [x] `repo-assist.md` has project tracking commented out
- [x] `ci-failure-issue.yml` has no drill harness functions
- [x] `copilot-setup-steps.yml` installs Node.js + gh-aw
- [x] Template can be forked via GitHub's "Use this template" button (`is_template: true`)
- [x] Non-Next.js stacks stripped (dotnet-azure, docker-generic removed for Phase 1)

## Implementation Notes

**49 files** in the template repo (4 commits):
1. `c6e2048` — 26 as-is files copied from prd-to-prod
2. `4b350b7` — 30 templatized/new files (workflows, scripts, docs, config)
3. `f534b88` — Cleanup of 6 files with lingering hardcoded references
4. `4c7a7ae` — Strip non-Next.js stacks: removed 6 files (deploy-azure.yml, dotnet-ci.yml, ci-docker.yml, deploy-docker.yml, 2 deploy profiles), updated 18 files (workflow_run triggers, network allowlists, deploy-router, docs)

**Scope narrowed from original plan:** The plan included all 3 stacks as dormant profiles, but during review we decided to strip non-Next.js stacks entirely for Phase 1. This removes `deploy-azure.yml`, `dotnet-ci.yml`, `ci-docker.yml`, `deploy-docker.yml`, and the `dotnet-azure` and `docker-generic` deploy profiles. These will be re-added in a later phase after validating the template with Next.js.

**Cleanup required beyond the plan:** The initial "as-is" copy of AGENTS.md, SELF_HEALING_MVP.md, repo-assist.md, and 3 scripts (capture-run-data.sh, monitor-pipeline.sh, demo-preflight.sh) contained hardcoded references that weren't caught until the full verification pass. Scripts now derive REPO dynamically via `gh repo view` instead of hardcoding.

**Not included (deferred to later phases):**
- dotnet-azure and docker-generic stacks → re-add after Next.js validation
- `self-healing-drill.sh` and drill infrastructure → Phase 5 (Drill Kit)
- Landing page → Phase 4

---

## Phase 2: Setup Wizard — Implementation Notes

**Status: COMPLETE** — Implemented 2026-03-02.

**Plan:** `prd-to-prod-template/docs/plans/2026-03-02-setup-wizard.md`

**Commits** (7 commits, 993ebf2..899ee85):
1. `993ebf2` — `setup.sh` interactive wizard (prerequisites, app-dir prompt, policy patching, secrets, bootstrap)
2. `6532689` — Code review fixes: replaced `eval` injection with `printf -v`, added sed metacharacter escaping, preserved file permissions on awk output, added temp file cleanup trap
3. `ef5d606` — `setup-verify.sh` configuration validator (26 checks across 6 sections)
4. `4a02614` — Code review fixes: fixed `gh api` path placeholder, moved git ls-remote out of auth gate, removed redundant lock count check
5. `ef6dafd` — README updated for wizard, autonomy-policy.yml placeholders removed, verify-mvp.sh simplified
6. `812d223` — Fixed cleanup trap exit code
7. `899ee85` — Phase 2 implementation plan committed

**Files created:**
- `setup.sh` — interactive wizard with `--non-interactive` mode, macOS/Linux compatible
- `setup-verify.sh` — validates prerequisites, config, workflows, labels, secrets, repo settings

**Files modified:**
- `README.md` — Quick Start now points to `./setup.sh` instead of manual steps
- `autonomy-policy.yml` — removed placeholder comments
- `scripts/verify-mvp.sh` — stripped references to nonexistent test scripts

**Security fixes applied during code review:**
- Replaced `eval` with `printf -v` in prompt helpers (command injection vulnerability)
- Added sed metacharacter escaping for `APP_DIR` (prevents `&` corruption)
- Used `cat > file` instead of `mv` for awk output (preserves file permissions)

**Deferred:**
- ~~GitHub App auth → Phase 3~~ (done)

---

## Phase 2.5: Architecture Planning Pipeline Sync

**Status: COMPLETE** — Synced 2026-03-03.

Synced the new architecture planning pipeline from the source repo to the template:
- `prd-planner.md` — new architecture planning agent
- `architecture-approve.yml` — human approval gate workflow
- Updated `prd-decomposer.md` with architecture-aware decomposition
- Updated `repo-assist.md` with architecture context reading
- Updated `docs/ARCHITECTURE.md` with planning layer documentation
- Added `architecture_planning` action to `autonomy-policy.yml`
- Added `architecture-draft`/`architecture-approved` labels to `bootstrap.sh`

---

## Phase 3: GitHub App Auth — Implementation Notes

**Status: COMPLETE** — Implemented 2026-03-03.

**Plan:** `prd-to-prod-template/docs/plans/2026-03-02-github-app-auth.md`

**Commits** (3 commits, 899ee85..e0185ba):
1. `8b9391d` — Synced architecture planning pipeline from source repo
2. `5b8c864` — Added `actions/create-github-app-token@v1` to all 6 workflows with PAT fallback
3. `e0185ba` — Updated setup.sh, setup-verify.sh, README, ARCHITECTURE.md for dual auth

**Workflow files modified** (6 files):
- `architecture-approve.yml` — 3-way fallback: App → PAT → GITHUB_TOKEN
- `auto-dispatch.yml` — App token for guard + dispatch steps
- `auto-dispatch-requeue.yml` — App token for requeue dispatch
- `ci-failure-issue.yml` — App token for issue creation + repair comments
- `pipeline-watchdog.yml` — App token for watchdog operations
- `pr-review-submit.yml` — App token in 3 jobs (submit-review-comment, submit-review-dispatch, approve-sensitive)

**Token resolution pattern:**
```yaml
- name: Generate App token
  id: app-token
  if: vars.PIPELINE_APP_ID != ''
  uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ vars.PIPELINE_APP_ID }}
    private-key: ${{ secrets.PIPELINE_APP_PRIVATE_KEY }}
```
Downstream: `${{ steps.app-token.outputs.token || secrets.GH_AW_GITHUB_TOKEN }}`

**Setup changes:**
- `setup.sh` — Auth method choice (1=App recommended, 2=PAT fallback)
- `setup-verify.sh` — Accepts either App (PIPELINE_APP_ID + key) or PAT as valid auth
- `README.md` — Documents both auth options
- `docs/ARCHITECTURE.md` — Updated secrets table

**Remaining:**
- Register the actual GitHub App (manual step, not automatable)
- Landing page → Phase 4
