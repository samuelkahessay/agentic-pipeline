# Architecture Planning Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a structured architecture planning layer between PRD intake and decomposition, with a human review gate, structured JSON artifact in repo-memory, and downstream integration with prd-decomposer and repo-assist.

**Architecture:** New gh-aw agent (`prd-planner.md`) produces architecture plans from PRDs. Plans are stored as JSON in repo-memory and as human-readable comments on the PRD issue. A standard GitHub Actions workflow (`architecture-approve.yml`) listens for `/approve-architecture` and gates decomposition. Existing agents are updated to read the architecture artifact when available, with backward-compatible fallback.

**Tech Stack:** gh-aw agent definitions (Markdown), GitHub Actions YAML, Bash

---

### Task 1: Add architecture labels to bootstrap

**Files:**
- Modify: `scripts/bootstrap.sh:12-28`

**Step 1: Add new labels to the bootstrap label loop**

Add `architecture-draft` and `architecture-approved` to the label list in `bootstrap.sh`:

```bash
# Add these two lines inside the for loop's label list:
             "architecture-draft:7057ff:Architecture plan awaiting human review" \
             "architecture-approved:0e8a16:Architecture plan approved for decomposition" \
```

Insert after the `"ready:0e8a16:Ready for implementation"` line (line 21).

**Step 2: Verify the script parses correctly**

Run: `bash -n scripts/bootstrap.sh`
Expected: No output (syntax OK)

**Step 3: Commit**

```bash
git add scripts/bootstrap.sh
git commit -m "chore: add architecture-draft and architecture-approved labels to bootstrap"
```

---

### Task 2: Add architecture_planning action to autonomy policy

**Files:**
- Modify: `autonomy-policy.yml:26` (after `issue_decomposition` action)

**Step 1: Add the new action block**

Insert after the `issue_decomposition` action (after line 26):

```yaml
  - action: architecture_planning
    scope: Generate structured architecture plan from a PRD before decomposition begins.
    default_mode: autonomous
    requires_human_reason: null
    allowed_targets:
      - Issue comments on PRD issues
      - Architecture artifacts in repo-memory branch
    evidence_required:
      - Human-authored PRD in the source issue
      - Architecture artifact written to repo-memory
      - Human approval via /approve-architecture before decomposition
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('autonomy-policy.yml'))"`
Expected: No output (valid YAML)

**Step 3: Commit**

```bash
git add autonomy-policy.yml
git commit -m "policy: add architecture_planning action to autonomy policy"
```

---

### Task 3: Create the prd-planner agent definition

**Files:**
- Create: `.github/workflows/prd-planner.md`

**Step 1: Write the agent definition**

Create `.github/workflows/prd-planner.md` with the full agent definition. The frontmatter configures gh-aw triggers, engine, safe-outputs, and tools. The body contains the agent's instructions.

```markdown
---
description: |
  Architecture planning agent. Reads a PRD and produces a structured
  architecture plan with components, data model, decomposition order,
  patterns, and risks. The plan is posted as a human-readable comment
  and stored as a JSON artifact in repo-memory for downstream agents.

on:
  workflow_dispatch:
  slash_command:
    name: plan
  reaction: "eyes"

timeout-minutes: 30

engine:
  id: copilot
  model: gpt-5

permissions: read-all

network: defaults

safe-outputs:
  add-comment:
    max: 3
    target: "*"
    hide-older-comments: true
  add-labels:
    allowed: [architecture-draft]
    max: 2

tools:
  bash: true
  github:
    toolsets: [issues, labels]
  repo-memory: true

---

# PRD Architecture Planner

You are a senior technical architect. Your job is to read a Product Requirements Document (PRD) and produce a structured architecture plan that will guide decomposition and implementation.

## Instructions

"${{ steps.sanitized.outputs.text }}"

If the instructions above contain a URL or file path, fetch/read that content as the PRD. If the instructions are empty, read the body of issue #${{ github.event.issue.number }} as the PRD.

## Planning Process

1. **Read the PRD carefully.** Understand the full scope, features, constraints, and acceptance criteria.

2. **Read the deploy profile.** Check `.deploy-profile` for the active profile name, then read `.github/deploy-profiles/{profile}.yml` to understand the target tech stack, build commands, and deployment target.

3. **Check the repository state.** Determine if this is greenfield, enhancement, or migration:
   - Greenfield: No existing application code — plan from scratch
   - Enhancement: Existing app — plan additions that fit existing architecture
   - Migration: Existing app being replaced — plan the new architecture

4. **Read the autonomy policy.** Check `autonomy-policy.yml` to understand what actions are autonomous vs human_required. Your architecture must not propose patterns that violate policy boundaries.

5. **If enhancement mode**, read existing source code to understand:
   - Current project structure and conventions
   - Existing services, models, and endpoints
   - Patterns already established (naming, error handling, testing)

## Architecture Output

### Part 1: Human-Readable Comment

Post a comment on the PRD issue with this exact format:

```
## Architecture Plan

**Profile:** {profile} | **Language:** {language} | **Framework:** {framework}

### Summary
{1-paragraph description of the architecture approach and key decisions}

### Components
| Component | Type | Responsibility |
|-----------|------|----------------|
| {Name} | {service/api/model/page/test} | {What it does} |

### Data Model
{Entity relationships as bullet list: "EntityA → has many EntityB"}

### Decomposition Order
{Numbered list of implementation phases, infrastructure first, tests last}

### Patterns
{Key design patterns and conventions the implementation should follow}

### Risks
{Known risks with mitigation strategies}

---

*To approve this architecture and begin decomposition, comment `/approve-architecture`.*
*To request changes, reply with feedback and the planner will revise.*
```

### Part 2: Structured JSON Artifact

Write a JSON artifact to repo-memory at path `architecture/{issue-number}.json` with this schema:

```json
{
  "schema_version": "1.0",
  "prd_source": "#{issue-number}",
  "created_at": "{ISO-8601 timestamp}",
  "summary": "{1-paragraph approach}",
  "tech_stack": {
    "profile": "{deploy-profile name}",
    "language": "{primary language}",
    "framework": "{primary framework}",
    "storage": "{database or storage}",
    "deployment": "{deployment target}"
  },
  "requirements": [
    {
      "id": "REQ-{NNN}",
      "text": "{requirement text}",
      "priority": "must|should|could",
      "acceptance_criteria": ["{criterion}"]
    }
  ],
  "entities": [
    {
      "name": "{EntityName}",
      "fields": ["{field1}", "{field2}"],
      "relationships": ["{has many X}"]
    }
  ],
  "components": [
    {
      "name": "{ComponentName}",
      "type": "service|api|model|page|test",
      "responsibility": "{what it does}",
      "file_hint": "{suggested file path}"
    }
  ],
  "decomposition_order": [
    "{phase-1-name}",
    "{phase-2-name}"
  ],
  "patterns": [
    {
      "name": "{pattern name}",
      "description": "{how and why to use it}"
    }
  ],
  "risks": [
    {
      "description": "{risk}",
      "mitigation": "{mitigation}"
    }
  ],
  "nfrs": {
    "scale": "{small|medium|large}",
    "data_sensitivity": "{low|medium|high}",
    "audit_required": true
  }
}
```

### Part 3: Label

After posting the comment and writing the artifact, add the `architecture-draft` label to the issue.

## Quality Checklist

Before posting the architecture:
- [ ] Tech stack matches the active deploy profile
- [ ] Components cover all PRD features
- [ ] Data model captures all entities mentioned in the PRD
- [ ] Decomposition order puts infrastructure before features, features before tests
- [ ] Patterns reference existing codebase conventions (if enhancement mode)
- [ ] Risks include at least one technical risk with mitigation
- [ ] JSON artifact validates against the schema above
- [ ] Requirements preserve exact normative language from the PRD (paths, counts, status codes)

## Revision Mode

If the human replies with feedback instead of `/approve-architecture`:
1. Read their feedback
2. Revise the architecture accordingly
3. Post an updated comment (hide-older-comments will clean up the previous one)
4. Update the JSON artifact in repo-memory
5. Keep the `architecture-draft` label (do not re-add it)
```

**Step 2: Compile the workflow**

Run: `gh aw compile`
Expected: `.github/workflows/prd-planner.lock.yml` is generated

**Step 3: Verify the lock file exists**

Run: `ls -la .github/workflows/prd-planner.lock.yml`
Expected: File exists

**Step 4: Commit**

```bash
git add .github/workflows/prd-planner.md .github/workflows/prd-planner.lock.yml
git commit -m "feat: add prd-planner architecture planning agent"
```

---

### Task 4: Create the architecture approval gate workflow

**Files:**
- Create: `.github/workflows/architecture-approve.yml`

**Step 1: Write the approval workflow**

```yaml
name: Architecture Approval Gate

on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  issues: write
  actions: write

jobs:
  approve:
    if: |
      github.event.issue.pull_request == null &&
      contains(github.event.issue.labels.*.name, 'architecture-draft') &&
      startsWith(github.event.comment.body, '/approve-architecture')
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Verify author has write access
        id: check-access
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          PERM=$(gh api repos/${{ github.repository }}/collaborators/${{ github.event.comment.user.login }}/permission \
            --jq '.permission' 2>/dev/null || echo "none")
          if [[ "$PERM" != "admin" && "$PERM" != "write" && "$PERM" != "maintain" ]]; then
            echo "::error::User ${{ github.event.comment.user.login }} does not have write access"
            exit 1
          fi
          echo "approved_by=${{ github.event.comment.user.login }}" >> "$GITHUB_OUTPUT"

      - name: Swap labels
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          gh issue edit ${{ github.event.issue.number }} \
            --repo ${{ github.repository }} \
            --remove-label "architecture-draft" \
            --add-label "architecture-approved"

      - name: Post approval confirmation
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --repo ${{ github.repository }} \
            --body "Architecture approved by @${{ steps.check-access.outputs.approved_by }}. Dispatching decomposer..."

      - name: Dispatch prd-decomposer
        env:
          GH_TOKEN: ${{ secrets.GH_AW_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}
        run: |
          gh workflow run prd-decomposer.lock.yml \
            --repo ${{ github.repository }} \
            -f issue_number=${{ github.event.issue.number }}
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/architecture-approve.yml'))"`
Expected: No output (valid YAML)

**Step 3: Commit**

```bash
git add .github/workflows/architecture-approve.yml
git commit -m "feat: add architecture approval gate workflow"
```

---

### Task 5: Update prd-decomposer to read architecture artifact

**Files:**
- Modify: `.github/workflows/prd-decomposer.md`

**Step 1: Add architecture-aware instructions**

Add a new section after the existing "## Decomposition Rules" section (after line 97) and before "## Delivery Mode Detection":

```markdown
## Architecture-Aware Decomposition

Before creating issues, check repo-memory for an architecture artifact at `architecture/{issue-number}.json`.

### If an architecture artifact exists:

1. **Use `decomposition_order`** from the artifact to sequence issue creation instead of the default heuristic (infrastructure → features → tests).

2. **Reference `components`** in each issue's `## Technical Notes` section. For each issue, include the relevant component names, types, and `file_hint` paths from the artifact.

3. **Reference `patterns`** from the artifact in acceptance criteria where applicable. If the architecture specifies a pattern (e.g., "Three-disposition classification"), issues that implement that pattern should reference it.

4. **Preserve `requirements`** from the artifact. Cross-reference each issue's acceptance criteria against the artifact's requirements to ensure coverage. Every `must` requirement must appear in at least one issue's acceptance criteria.

5. **Add a `## Architecture Context` section** to each issue (after PRD Traceability):
   ```
   ## Architecture Context
   - **Architecture Plan**: Approved on #{prd-issue-number}
   - **Component**: {component name} ({component type})
   - **File Hint**: {file_hint from artifact}
   - **Related Patterns**: {relevant pattern names}
   ```

### If no architecture artifact exists:

Fall back to current behavior — use heuristic ordering and infer architecture from the PRD and codebase. This preserves backward compatibility for PRDs that skip the planning step.
```

**Step 2: Add `repo-memory: true` to tools if not already present**

Check the frontmatter tools section. If `repo-memory` is not listed, add it. (Current prd-decomposer does not have `repo-memory` — it needs to be added.)

In the frontmatter, update the tools section:

```yaml
tools:
  bash: true
  github:
    toolsets: [issues, labels]
  repo-memory: true
```

**Step 3: Compile the workflow**

Run: `gh aw compile`
Expected: `.github/workflows/prd-decomposer.lock.yml` is regenerated

**Step 4: Commit**

```bash
git add .github/workflows/prd-decomposer.md .github/workflows/prd-decomposer.lock.yml
git commit -m "feat: update prd-decomposer to read architecture artifacts from repo-memory"
```

---

### Task 6: Update repo-assist to read architecture artifact

**Files:**
- Modify: `.github/workflows/repo-assist.md`

**Step 1: Add architecture context reading instructions**

Add a new section early in the agent's instructions (after the existing preamble, before implementation instructions). Insert after the "## Command Mode" section:

```markdown
## Architecture Context

Before implementing any issue, check if an architecture plan exists:

1. Read the issue body for an `## Architecture Context` section. If present, it will contain:
   - The source PRD issue number
   - The component name, type, and suggested file path
   - Related design patterns to follow

2. If an Architecture Context section exists, also read the full architecture artifact from repo-memory at `architecture/{prd-issue-number}.json` to understand:
   - `tech_stack`: Build environment and framework conventions
   - `components`: The full system shape — understand where your component fits
   - `entities`: Data model relationships your code should respect
   - `patterns`: Design patterns to follow for consistency across the codebase
   - `risks`: Known risks and mitigations to consider

3. Use this context to:
   - Follow the suggested `file_hint` for file placement (adapt if the codebase has evolved)
   - Apply patterns from the architecture plan consistently
   - Ensure your implementation fits the overall component structure
   - Reference the architecture in your PR description

4. If no Architecture Context section exists, proceed with current behavior — infer architecture from the codebase and issue acceptance criteria.
```

**Step 2: Compile the workflow**

Run: `gh aw compile`
Expected: `.github/workflows/repo-assist.lock.yml` is regenerated

**Step 3: Commit**

```bash
git add .github/workflows/repo-assist.md .github/workflows/repo-assist.lock.yml
git commit -m "feat: update repo-assist to read architecture artifacts for implementation context"
```

---

### Task 7: Update ARCHITECTURE.md with planning layer documentation

**Files:**
- Modify: `docs/ARCHITECTURE.md`

**Step 1: Add a "Planning Layer" section**

Add a new section describing the architecture planning pipeline. Place it in the appropriate location within the existing document structure. Include:

- The planning flow diagram (PRD → /plan → architecture comment + artifact → /approve-architecture → decompose)
- The architecture artifact schema reference
- How downstream agents use the artifact
- Backward compatibility note

Keep it concise — 20-30 lines. Reference the design doc for full details.

**Step 2: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: add planning layer to architecture documentation"
```

---

### Task 8: End-to-end verification

**Step 1: Compile all workflows**

Run: `gh aw compile`
Expected: All `.lock.yml` files regenerated without errors

**Step 2: Verify bootstrap labels**

Run: `bash -n scripts/bootstrap.sh`
Expected: No syntax errors

**Step 3: Verify autonomy policy**

Run: `python3 -c "import yaml; yaml.safe_load(open('autonomy-policy.yml'))"`
Expected: Valid YAML

**Step 4: Verify architecture-approve.yml**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/architecture-approve.yml'))"`
Expected: Valid YAML

**Step 5: Push and test**

Push to main, then create a test PRD issue and comment `/plan` to verify the full flow:
1. prd-planner posts architecture comment
2. `architecture-draft` label is added
3. `/approve-architecture` swaps to `architecture-approved` and dispatches decomposer
4. Decomposed issues contain `## Architecture Context` sections
5. repo-assist reads the architecture artifact when implementing

**Step 6: Final commit**

```bash
git commit --allow-empty -m "chore: architecture planning pipeline — all tasks complete"
```
