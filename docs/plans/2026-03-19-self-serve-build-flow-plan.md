# Self-Serve Build Flow — Gap Analysis & Test Plan

**Date**: 2026-03-19
**Status**: Draft
**Context**: PR #511 shipped the public beta bootstrap flow. The demo CTA is live on the landing page. This plan covers what remains to make `/build` work as a real self-serve route for paying users.

---

## Architecture Summary

The entire code path exists end-to-end. No missing implementations.

```
Landing page ("Watch it build")
  → /build (chat with LLM, refine PRD)
  → /finalize (bind session to authenticated user, lock PRD)
  → OAuth redirect to GitHub (if not authenticated)
  → /provision (create repo from template, install App, bootstrap)
  → /start-build (create root PRD issue, dispatch decomposer)
  → Webhook-driven event tracking (issues, PRs, workflow runs, deployments)
  → Factory visualization (real-time via SSE)
  → Completion detection (deploy-vercel success → session complete)
```

Real users use `provisioner.launchPipeline()` which dispatches `prd-decomposer.lock.yml` on the target repo — NOT `buildRunner.dispatchBuild()` (that's demo-only). The target repo's own pipeline handles everything from decomposition through delivery.

---

## Tier 1: Environment Configuration

These are Fly.io secrets/vars on the `prd-to-prod` production console. Setting them unlocks the entire real flow.

### Required Secrets

| Secret | Purpose | Source |
|--------|---------|--------|
| `GITHUB_OAUTH_CLIENT_ID` | User authentication via GitHub OAuth | GitHub App → OAuth settings |
| `GITHUB_OAUTH_CLIENT_SECRET` | OAuth token exchange | GitHub App → OAuth settings |
| `LLM_API_KEY` or `OPENROUTER_API_KEY` | Real PRD refinement (currently GLM-5 via OpenRouter) | OpenRouter dashboard |
| `PIPELINE_APP_ID` | App JWT generation for installation tokens | GitHub App settings → App ID |
| `PIPELINE_APP_PRIVATE_KEY` | App JWT signing (RS256 PEM key) | GitHub App settings → Generate private key |
| `GITHUB_APP_WEBHOOK_SECRET` | Webhook signature verification (HMAC-SHA256) | GitHub App settings → Webhook secret |
| `COPILOT_GITHUB_TOKEN` | Injected into provisioned repos for agent LLM access | GitHub PAT with Copilot scope |
| `ENCRYPTION_KEY` | OAuth token encryption at rest (hex-encoded 32 bytes) | Generate once, keep stable |
| `GH_AW_GITHUB_TOKEN` | PAT for decomposer dispatch (needs `repo` + `workflow` scopes) | GitHub PAT |

### Required Variables

| Variable | Purpose | Value |
|----------|---------|-------|
| `FRONTEND_URL` | OAuth redirect base URL | `https://prd-to-prod.vercel.app` |
| `PUBLIC_BETA_TEMPLATE_OWNER` | Template repo owner | `samuelkahessay` |
| `PUBLIC_BETA_TEMPLATE_REPO` | Template repo name | `prd-to-prod-template` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PUBLIC_BETA_MAX_ACTIVE_BUILDS` | Concurrent build capacity | `2` |
| `PUBLIC_BETA_VERCEL_DOMAIN_SUFFIX` | Deployment URL pattern | (none — deploy_url stays null) |
| `LLM_MODEL` | OpenRouter model ID | `z-ai/glm-5` |

### Verification Checklist

- [ ] GitHub App webhook URL set to `https://prd-to-prod.fly.dev/webhooks/github-app`
- [ ] GitHub OAuth callback URL set to `https://prd-to-prod.fly.dev/pub/auth/github/callback`
- [ ] OAuth scopes include `repo` and `read:user`
- [ ] GitHub App has permissions: Contents (rw), Issues (rw), Pull requests (rw), Actions (rw), Metadata (r)
- [ ] GitHub App subscribes to events: installation, installation_repositories, issues, pull_request, issue_comment, workflow_run
- [ ] `ENCRYPTION_KEY` is persistent across deploys (stored in Fly.io secrets, not generated at runtime)
- [ ] `DEMO_MODE` is NOT set in production (real OAuth and LLM are registered only when DEMO_MODE is absent)

---

## Tier 2: Known Bugs

These require code or investigation work. Ordered by severity.

### 2.1 Decomposer activation skipped on fresh repos (PIPELINE-KILLER)

**Severity**: Critical — blocks the entire pipeline
**Symptom**: `/decompose` command is detected (pre_activation succeeds), but the `activation` job is skipped. Agent never runs. No child issues are created. repo-assist has nothing to implement.
**Investigation**:
- Check gh-aw activation logs on a fresh provisioned repo
- Compare activation step conditions against the permissions/configuration the provisioner sets
- May need: additional App permissions, `gh aw compile` during provisioning, or `memory/repo-assist` branch seeding (provisioner already does this at line 322)
**References**: Open task in memory, also noted in e2e test 2026-03-16

### 2.2 OAuth grant 10-minute TTL with no recovery

**Severity**: Medium — affects slow users
**Symptom**: If a user takes >10 minutes between finalize and provision, the OAuth grant (stored access token) expires. `createTargetRepo()` throws "No valid OAuth grant" with no clear error in the UI.
**Fix options**:
- Extend grant TTL (30 minutes or 1 hour)
- Add a re-auth prompt when grant is expired
- Store the OAuth token in the session permanently (security trade-off)

### 2.3 CI noise on fresh repos

**Severity**: Low — cosmetic but confusing
**Symptom**: Every push to main triggers deploy-router → deploy-vercel, which fails without Vercel secrets. Creates CI failure issues (#2, #10, #11) and CI Doctor diagnostics (#12) on every provisioned repo.
**Fix**: Gate deploy-vercel on secret existence (`if: secrets.VERCEL_TOKEN != ''`) in the template repo's workflow.

### 2.4 Stale lock files in provisioned repos

**Severity**: Medium — causes agent failures
**Symptom**: Provisioned repos get snapshot lock files from the template. If agent `.md` sources update after the template was last compiled, lock files go stale.
**Fix options**:
- Add `gh aw compile` step to provisioner after bootstrap
- Add CI check to template repo that verifies lock files match `.md` sources
- Automate template re-compilation on a schedule

---

## Tier 3: UX Gaps

Separate work items. Not required for initial self-serve, but needed for production quality.

### 3.1 BYOK UI for Copilot + Vercel tokens

Users currently inherit the platform owner's Copilot token (eats platform quota). Need a "Configure your pipeline" step on the build status page between bootstrap and launch:
- Copilot token (required) — link to GitHub PAT creation with "Copilot Requests: Read-only" permission
- Vercel secrets (optional) — VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

### 3.2 Payment integration

The $1 offer is not enforced anywhere. No billing or payment collection. Options:
- Stripe Checkout session before provision
- Stripe Payment Link (simplest — redirect before OAuth)
- Manual invoice (current implicit model via email)

### 3.3 Factory celebration timing

Factory shows "CELEBRATING" when provisioning finishes. Should only celebrate on `delivery:complete` (all issues implemented, PRs merged, app deployed).

### 3.4 Skip finalize for already-ready sessions

When a session is already finalized and the user triggers the build flow again, `/finalize` returns 400 before `/provision` proceeds. Frontend should check session status and skip finalize if already `ready`.

### 3.5 Repo link on build status page

Repo name shows as plain text. Should be a clickable link to `https://github.com/{owner}/{repo}`.

---

## End-to-End Test Plan

### Prerequisites
- All Tier 1 env vars set on Fly.io
- GitHub App webhook and OAuth URLs verified
- Template repo (`prd-to-prod-template`) is current

### Test Sequence

**Phase 1: Smoke test (demo mode)**
1. Visit `https://prd-to-prod.vercel.app`
2. Click "Watch it build"
3. Verify chat loads, mock LLM responds
4. Verify factory animation plays through provisioning → build → complete
5. Verify conversion nudge appears at completion: "That was a simulation. Ready for the real thing?"
6. Verify mailto link works

**Phase 2: Real flow — chat + auth**
1. Visit `/build` (no `?demo=true`)
2. Type a project idea (e.g., "a simple habit tracker")
3. Verify real LLM responds (not canned "Team Standup Dashboard")
4. Continue until PRD is ready (status: "ready")
5. Click "Build it" → verify OAuth redirect to GitHub
6. Authorize → verify redirect back to `/build?session={id}&resume=finalize`
7. Verify session binds to authenticated user
8. Verify redirect to `/build/{id}` (status page)

**Phase 3: Real flow — provision + bootstrap**
1. Verify auto-provision triggers (status page should start provisioning)
2. Watch for repo creation event in factory
3. If App install required: follow install link, install App on the new repo
4. Verify bootstrap completes (labels, secrets, variables, branch protection, repo-memory)
5. Check the target repo on GitHub: labels exist, secrets set, AGENTS.md present

**Phase 4: Real flow — pipeline launch**
1. Verify auto-launch triggers after bootstrap
2. Check target repo: root PRD issue created with correct content
3. **Critical**: verify decomposer agent runs (not just pre_activation)
4. If decomposer skips: investigate activation logs, check App permissions
5. Watch for child issues created by decomposer
6. Watch for repo-assist picking up child issues

**Phase 5: Real flow — build + delivery**
1. Monitor webhook events flowing to console (check build activity section)
2. Verify factory visualization updates in real-time
3. Watch for PR events (opened, reviewed, merged)
4. Watch for deployment events
5. Verify session transitions to "complete" on final deployment
6. Verify "Open deployed app" link appears (not demo nudge)

### Failure Scenarios to Test

- [ ] OAuth denied by user → graceful error, session preserved
- [ ] OAuth grant expired (wait >10 min) → clear error message
- [ ] App not installed → install prompt, retry works
- [ ] Provisioning retry after failure → idempotent (reuses existing repo)
- [ ] Capacity limit reached → "awaiting_capacity" state, retry button
- [ ] Webhook signature mismatch → 401, events not processed
- [ ] Pipeline stalls → "stalled" state, retry or help buttons

---

## Execution Order

1. **Set env vars** (Tier 1) — unblocks everything, no code changes
2. **Run Phase 1** (smoke test) — verify demo still works after env changes
3. **Run Phase 2** (chat + auth) — first real user flow
4. **Investigate decomposer activation** (Tier 2.1) — before Phase 4
5. **Run Phases 3-5** (provision → build → delivery) — full end-to-end
6. **Fix Tier 2 bugs** as discovered during testing
7. **Tier 3 UX gaps** as separate follow-up work

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Real users use `provisioner.launchPipeline()`, not `buildRunner` | Target repo's own pipeline handles everything via decompose → child issues → repo-assist |
| Demo mode stays as-is (mock services, no auth) | Zero-friction entry point, conversion funnel proven |
| Payment deferred to Tier 3 | Need to prove the flow works before charging for it |
| BYOK deferred to Tier 3 | Platform Copilot token works for beta; quota concern is manageable at low volume |
