# Agentic Pipeline Design

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Hybrid — Copilot SDK Orchestrator + GitHub Actions + Copilot Coding Agent

---

## Goal

Build a fully autonomous GitHub development pipeline where:

1. A PRD is parsed into atomic development tasks by an LLM-powered orchestrator
2. Tasks become GitHub Issues, added to a Projects board, and labeled for agent pickup
3. The Copilot Coding Agent autonomously writes code and opens PRs
4. Humans review and merge; the pipeline tracks progress end-to-end

Human role: write PRDs, review PRs, click merge. Everything else is automated.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   YOUR MACHINE (or CI)                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Copilot SDK Orchestrator (TypeScript)    │    │
│  │                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │    │
│  │  │ PRD      │  │ Issue    │  │ Progress     │   │    │
│  │  │ Parser   │  │ Manager  │  │ Monitor      │   │    │
│  │  │ Tool     │  │ Tool     │  │ Tool         │   │    │
│  │  └──────────┘  └──────────┘  └──────────────┘   │    │
│  │                                                  │    │
│  │  Copilot CLI (server mode) ← JSON-RPC →  SDK    │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                              │
│                     GitHub API                          │
│                    (REST + GraphQL)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     GITHUB.COM                          │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Issues   │───▶│ Copilot      │───▶│ Pull         │   │
│  │ (tasks)  │    │ Coding Agent │    │ Requests     │   │
│  └──────────┘    │ (runs in     │    └──────────────┘   │
│       ▲          │  GH Actions) │           │           │
│       │          └──────────────┘           │           │
│  ┌──────────┐                          ┌────────────┐   │
│  │ Projects │◀─────────────────────────│ Merge →    │   │
│  │ Board    │                          │ Close Issue │   │
│  └──────────┘                          └────────────┘   │
│                                                         │
│  .github/                                               │
│    copilot-instructions.md    ← Agent reads this        │
│    copilot-setup-steps.yml    ← Agent dev environment   │
│    workflows/                                           │
│      assign-to-agent.yml      ← label trigger → assign  │
│      pr-lifecycle.yml         ← PR events → labels      │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. SDK Orchestrator (TypeScript)

Entry point CLI that uses `@github/copilot-sdk` to create a session with 4 custom tools.

**Technology:** TypeScript, `@github/copilot-sdk`, `@octokit/rest`, `@octokit/graphql`, `commander`

**CLI commands:**
- `agentic-pipeline run <prd-file> --repo <owner/repo>` — Parse PRD and create issues
- `agentic-pipeline status --repo <owner/repo>` — Check pipeline progress
- `agentic-pipeline trigger --repo <owner/repo> --issue <number>` — Trigger agent on existing issue
- `agentic-pipeline init --repo <owner/repo>` — Bootstrap labels + workflows

**Session configuration:**
- Model: `gpt-4.1` (default, configurable)
- System message: project manager persona that decomposes PRDs, respects dependencies, creates well-structured issues
- MCP: GitHub MCP server enabled by default
- Tools: `parse_prd`, `create_github_issue`, `trigger_agent_on_issue`, `check_pipeline_status`

### 2. Custom Tools

#### `parse_prd`
- Reads a PRD markdown file from local filesystem
- Returns content to the LLM for decomposition into atomic tasks
- The LLM reasons about task structure, dependencies, and sizing

#### `create_github_issue`
- Creates a GitHub issue via Octokit REST API
- Parameters: title, body (with acceptance criteria), labels, dependency references
- Adds dependency info as a checklist in the issue body
- Optionally adds the issue to a Projects v2 board via GraphQL

#### `trigger_agent_on_issue`
- Adds the `agent-ready` label to an issue
- Optionally posts custom instructions as a comment
- This triggers the `assign-to-agent.yml` workflow

#### `check_pipeline_status`
- Queries issues by pipeline labels (`agent-assigned`, `in-review`, `agent-completed`)
- Checks for linked PRs and their status (open, merged, closed)
- Returns a structured progress report

### 3. GitHub Actions Workflows

#### `assign-to-agent.yml`
- Triggers on: `issues` events (`opened`, `labeled`)
- Condition: `agent-ready` label present (handles both new issues and label additions)
- Action: assigns `copilot-swe-agent` to the issue, swaps label to `agent-assigned`

#### `pr-lifecycle.yml`
- Triggers on: `pull_request` events (`opened`, `closed`)
- On PR open from `copilot/*` branch: swaps linked issue label to `in-review`
- On PR merge from `copilot/*` branch: closes linked issue, adds `agent-completed` label

### 4. Agent Configuration

#### `.github/copilot-instructions.md`
Persistent context the Copilot Coding Agent reads before working on any issue. Contains:
- Project overview and tech stack
- Coding standards and conventions
- Build/test/lint commands
- Definition of done
- What the agent should NOT do

#### `.github/copilot-setup-steps.yml`
GitHub Actions job that sets up the development environment for the coding agent:
- Checkout repo
- Install language runtime
- Install dependencies
- Any other setup (database, env vars, etc.)

### 5. Label State Machine

```
agent-ready → agent-assigned → in-review → agent-completed
```

| Label | Meaning | Set by |
|---|---|---|
| `agent-ready` | Ready for coding agent pickup | SDK orchestrator |
| `agent-assigned` | Copilot is actively working | assign-to-agent.yml |
| `in-review` | PR is open, awaiting human review | pr-lifecycle.yml |
| `agent-completed` | Merged and done | pr-lifecycle.yml |

---

## Repository Structure

```
agentic-pipeline/
├── src/
│   ├── index.ts                    # CLI entry point (commander)
│   ├── orchestrator.ts             # Copilot SDK session + agent loop
│   ├── tools/
│   │   ├── parse-prd.ts            # PRD → structured tasks
│   │   ├── create-issue.ts         # GitHub issue creation + labeling
│   │   ├── trigger-agent.ts        # Label issue → agent-ready
│   │   └── check-status.ts         # Poll pipeline status
│   ├── github/
│   │   ├── client.ts               # Octokit wrapper (REST + GraphQL)
│   │   └── projects.ts             # Projects v2 GraphQL mutations
│   └── types.ts                    # Shared interfaces
├── templates/
│   └── sample-prd.md               # Example PRD for testing
├── .github/
│   ├── copilot-instructions.md     # Agent coding context
│   ├── copilot-setup-steps.yml     # Agent dev environment
│   └── workflows/
│       ├── assign-to-agent.yml     # label → Copilot assignment
│       └── pr-lifecycle.yml        # PR events → label/close
├── scripts/
│   └── bootstrap-labels.sh         # Create pipeline labels
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Dependencies

```json
{
  "dependencies": {
    "@github/copilot-sdk": "latest",
    "@octokit/rest": "^21.0.0",
    "@octokit/graphql": "^8.0.0",
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0"
  }
}
```

---

## Environment Variables

```bash
GITHUB_TOKEN=ghp_xxxxx           # PAT: repo, project, issues, PRs scope
COPILOT_GITHUB_TOKEN=ghp_xxxxx  # Same token if user has Copilot enabled
TARGET_REPO=owner/repo           # Default target repo
PROJECT_NUMBER=1                 # GitHub Projects v2 board number (optional)
```

---

## Prerequisites

| Requirement | Verification |
|---|---|
| Copilot Pro+ or Business | `gh copilot --version` |
| Copilot CLI installed | `copilot-cli --version` |
| Copilot Coding Agent enabled | Repo Settings → Copilot → Coding Agent → On |
| PAT with correct scopes | `repo`, `project`, `read:org` |
| Node.js 20+ | `node --version` |
| Target repo exists | `gh repo view owner/repo` |

---

## Pipeline Flow

```
HUMAN RUNS: npx agentic-pipeline run ./PRD.md --repo owner/repo
              ↓
SDK ORCHESTRATOR (Copilot SDK)
  Reads PRD → LLM decomposes into atomic tasks
  Creates GitHub Issues with acceptance criteria
  Adds dependency info to issue bodies
  Labels first batch "agent-ready"
              ↓
GITHUB ACTIONS (assign-to-agent.yml)
  Detects agent-ready label
  Assigns copilot-swe-agent to issue
  Swaps label to "agent-assigned"
              ↓
COPILOT CODING AGENT
  Reads issue + copilot-instructions.md
  Spins up dev environment (copilot-setup-steps.yml)
  Writes code → runs tests → fixes failures
  Opens PR on copilot/* branch (body: "Closes #N")
              ↓
GITHUB ACTIONS (pr-lifecycle.yml)
  Detects PR open from copilot/* branch
  Swaps linked issue label to "in-review"
              ↓
HUMAN REVIEWS PR
  Approve → merge
  Request changes → mention @copilot → agent iterates
              ↓
GITHUB ACTIONS (pr-lifecycle.yml)
  Detects PR merge from copilot/* branch
  Closes linked issue
  Labels "agent-completed"
              ↓
SDK ORCHESTRATOR (if monitoring)
  Detects dependency resolved
  Labels next batch of issues "agent-ready"
  Cycle repeats until all tasks done
```

---

## Known Limitations

1. **Copilot SDK in tech preview** — APIs may change. Pin SDK version.
2. **`copilot-cli` required** — SDK spawns CLI as subprocess in server mode.
3. **Agent task complexity** — Works best for well-specified, 1-4 hour tasks. Write detailed issues.
4. **PAT requirements** — Default `GITHUB_TOKEN` may lack Projects write access. Use a PAT.
5. **Coding agent availability** — Requires Copilot Pro+ ($39/mo) or Business/Enterprise.
6. **`@copilot` re-trigger** — Automated `@copilot` mentions from bots may not trigger the agent. Human reviewers should mention `@copilot` directly.

---

## Phase 2 Enhancements (Future)

1. Slack/Teams notifications on PR open and merge
2. Auto-approve trivial PRs (tests pass, diff under N lines)
3. Multi-agent specialization via `.github/copilot-agents/`
4. MCP server integration (design system, API docs, database schema)
5. Metrics dashboard using Copilot usage metrics API
6. Scheduled monitoring mode (poll and trigger in a loop)
