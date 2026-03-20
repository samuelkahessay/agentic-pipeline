# CLAUDE.md

## How this repo works

This is **prd-to-prod** — an autonomous software pipeline powered by gh-aw (GitHub Agentic Workflows). Issues labeled `pipeline` are picked up by the `repo-assist` agent, which implements them, opens PRs, and the review/merge chain handles the rest. No human writes implementation code.

## Our role

We write **design briefs as GitHub issues**, not code. The pipeline agents do the implementation.

- Describe *what* should change and *why*, not *how* (no file paths, no diffs, no implementation details)
- Use the issue format established in past issues (#201, #202, #205): Problem → Solution → Layout/Behavior → Scope → Design Constraints → Anti-Slop Rules → Acceptance Criteria
- Label issues with `feature, pipeline` or `bug, pipeline` so auto-dispatch picks them up
- Acceptance criteria are the contract — the PR review agent verifies against them

**Exception:** `.github/workflows/` changes (pipeline infrastructure) are done directly, not through issues.

## Current goal: pipeline reliability and documentation accuracy

The autonomous pipeline pattern — where AI builds, reviews, and deploys while humans own policy and compliance decisions — must be structurally sound, not just narratively plausible.

**The failure mode we're defending against is that the strongest claim (structural enforcement of the human boundary) is stronger in narrative than in implementation.** Every fix should close a gap between what the documentation says and what the code actually does.

Key enforcement boundaries:

- **Autonomy policy** (`autonomy-policy.yml`) — glob patterns must actually match the compliance files they claim to gate. Regression tests prevent drift.
- **Decision state machine** — constrained enum (`Approved`/`Rejected`), HUMAN_REQUIRED-only decisions, no duplicates. The state space should be small enough to reason about completely.
- **Operator authentication** — cookie-based auth on decision endpoints. API endpoints return 401, not 302. `operatorId` comes from authenticated identity, not user-supplied text.
- **Runtime controls** — demo bypass is environment-gated, destructive endpoints require auth, rate limiting on public mutation endpoints.
- **Persistence** — SQLite with FK enforcement. Compliance decisions survive restarts. Durable audit trail.
- **Documentation accuracy** — every claim in README and operator surfaces must be exactly true at the implementation level. No aspirational copy.

When making changes, ask: "If someone reads this claim and then reads the code, will the code back it up?"

## gh-aw upstream bugs

gh-aw is in early technical preview. When discussing gh-aw bugs — issues we find in this repo caused by the library itself — look at `docs/internal/gh-aw-upstream/findings/` (gitignored) for our findings, and the gh-aw source at `/Users/skahessay/Documents/Projects/active/gh-aw` (added as an additional working directory) to investigate. The findings directory is not visible to Glob because it's gitignored — use `ls` or `Read` with the full path.

**"Check status of findings"** means: read `VERIFICATION.md` in the findings directory, then fetch the actual gh-aw release notes (`gh release view <version> --json body`) for each release that shipped our fixes, and verify credits in the Community Contributions section. Update VERIFICATION.md with any corrections (credit counts, statuses, new releases).

## Working style

- When exploring the codebase or investigating an issue, start with the specific files/folders mentioned before doing broad exploration. Do not autonomously explore unrelated parts of the repo unless asked.
- Never fabricate or assume details about PRs, issue statuses, release dates, or external resources. Always read the actual source (PR conversations, issue threads, release notes) before writing about them. If you can't access the source, say so explicitly.
- Do not claim a process succeeded (build running, server started, deployment complete) until you have verified the actual output. Check exit codes, logs, and process status before reporting success.

## Development guardrails

These rules enforce the efficiency findings from 2026-03-19. They exist because this repo is developed AI-native (human prompts, Claude implements), and without structural guardrails the default mode is to spread work across too many workstreams and over-invest in polish before core product works.

### Priority enforcement
1. **Self-serve build flow is the top priority.** Do not start work on visual polish, showcase content, marketing pages, or new landing page sections until the `/build` route works end-to-end for a real (non-demo) user. If asked to do polish work, flag the priority conflict before proceeding.
2. **CI infrastructure debt is second priority.** Golden file drift, silent test failures, and deploy-vercel noise create drag on every PR. Fix these when encountered, don't defer.

### Process scaling
- **Architectural changes** (data model, auth, pipeline, new API routes): spec → plan → Codex review → implement. Full process.
- **Bug fixes and config changes**: investigate → fix → test → commit. No spec needed.
- **Visual/UI changes** (CSS, copy, component layout): one-line description → implement → test. No spec, no plan doc. Trust the anti-slop rules to maintain quality.
- **If a plan doc exceeds 200 lines for a non-architectural change, the process is too heavy.** Trim or skip the doc.

### Vertical slices
- Work one workstream to completion before starting another. "Completion" means: code merged, tests passing, deployed, and verified in production.
- Do not interleave unrelated changes in the same commit or PR. Scaffold changes should not ride along with landing page changes.
- When CI reveals a pre-existing failure unrelated to the current work, fix it in a separate commit on main first. Do not accumulate fix-on-fix chains in feature PRs.

### Golden file and scaffold discipline
- After any change to scaffold content (workflows, scripts, studio files), regenerate `expected-tree.txt` in the same commit.
- Never suppress stderr in test scripts. If a test fails silently, add diagnostic output before fixing the root cause.

## CI failure triage procedure

Run `gh run list --status=failure --limit=5 --json databaseId,name,conclusion,headBranch` to find recent CI failures. For each failure:

1. Fetch the full logs with `gh run view <id> --log-failed`
2. Identify the root cause by tracing error messages to specific source files using grep and read
3. Check `docs/troubleshooting.md` for known patterns before proposing a fix
4. Implement the fix on a new branch named `fix/ci-<short-description>`
5. Run the same build/test command that failed to verify the fix locally
6. If verification passes, commit with a conventional commit message referencing the run ID, push, and open a PR with the failure log excerpt and root cause analysis in the description

If you cannot reproduce or fix a failure, document it in `docs/troubleshooting.md` with the error signature and your analysis.

## Issue writing guidelines

- Be descriptive about the desired experience, not prescriptive about implementation
- Include a "Scope" section that describes boundaries (what should/shouldn't change) without naming specific files
- Anti-Slop Rules prevent generic AI-generated aesthetics — include them for any visual work
- The agent reads the codebase itself — trust it to find the right files
- Acceptance criteria should be verifiable (build passes, tests pass, behavior observable)

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: `/plan-ceo-review`, `/plan-eng-review`, `/review`, `/ship`, `/browse`, `/qa`, `/setup-browser-cookies`, `/retro`

## Design Context

### Users (dual audience)
- **Primary (acquisition):** Non-technical creators — someone with an idea, no coding background, first time using agentic workflows. They arrive wanting to know: can I actually use this? The animation, build flow, and brand warmth serve this group.
- **Secondary (revenue):** Engineering leaders and CTOs evaluating autonomous delivery pipelines. They arrive wanting to know: is this real infrastructure? The evidence ledger, self-healing drills, and autonomy policy serve this group.

### Brand Personality
Approachable, Capable, Alive
- Warm enough for a first-timer, precise enough for a CTO
- The animation is the "alive" — everything else is calm and clear

### Aesthetic Direction
- References: Linear (purposeful motion, restrained), Vercel (spring physics, developer-native), but own identity
- Anti-references: Generic SaaS (no Lottie confetti, floating gradients), over-animated (prd→prod is THE animation, not one of many)
- Theme: Light, warm (cream palette), monospace for system terms, sans-serif for human language

### Design Principles
1. **Approachable over impressive** — a non-technical person should feel invited, not intimidated
2. **Evidence over assertion** — real data, not promises
3. **One animation, one identity** — the prd→prod transformation IS the brand motion; no other decorative animations compete with it
4. **One job per page** — if you can't state the purpose in one sentence, redesign or remove
5. **Human boundary is the story** — surface blocked actions, queued decisions, escalations prominently
6. **Clarity beats completeness** — less that's understood > more that's confusing
