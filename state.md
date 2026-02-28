# Pipeline State — 2026-02-28

## Last Run
- Workflow run: 22513853785
- Date: 2026-02-28T05:02:14Z

## Current Run: Run 04 — Ticket Deflection Service (C#/.NET 10)

### Status: **AT_RISK** — PR creation blocked by token scope

### Issues
| Issue | Title | Deps | Status | PR |
|-------|-------|------|--------|----|
| #125 | Scaffold ASP.NET Core 8 Solution Structure | None | merged | #138 |
| #126 | Ticket Data Model & EF Core InMemory DbContext | #125 | merged | #139 |
| #127 | Ticket CRUD Minimal API Endpoints | #126 | merged | #150 |
| #128 | Ticket Classification Service & Classify Endpoint | #126 | merged | #145 |
| #129 | Knowledge Base Matching & Resolution Service | #128,#137 | merged | #151 |
| #130 | Ticket Pipeline Orchestrator & Submit Endpoint | #128,#129 | merged | #154 |
| #131 | Simulation Endpoint for Demo Data Generation | #130 | merged | #155 |
| #132 | Dashboard Overview Page with Metrics API | #130 | merged | #159 |
| #133 | Dashboard Ticket Feed Razor Page | #132 | merged | #161 |
| #134 | Dashboard Activity Log Razor Page | #132 | merged | #164 |
| #135 | Landing Page with Demo Run Button | #131,#133,#134 | merged | #167 |
| #136 | Dockerfile & Production Configuration | #135 | merged | #170 |
| #137 | Knowledge Base CRUD Endpoints & Seed Data | None | merged | #142 |
| #140 | Add .NET 8 CI workflow | None | closed/completed | — |
| #165 | CI Build Failure: CS0246 _ViewImports | None | merged | #166 |
| #172 | Fix CS0117: KnowledgeArticle missing CreatedAt | None | merged | #173 |
| #176 | Update target framework from net8.0 to net10.0 | None | merged | #182 |
| #185 | Upgrade NuGet packages to match net10.0 | None | closed/completed | — |
| #186 | Update dotnet-ci.yml to use .NET 10 SDK | #185 | closed/completed | — |
| #189 | Fix EF Core in-memory database scoping in test fixtures | None | merged | #192 |
| #190 | Auto-seed 25 demo tickets on startup for cold-start dashboard | None | closed/completed | — |
| #191 | Redirect Run Demo button to /dashboard after simulation | #190 | closed/completed | — |
| #197 | Improve landing page visual design and demo flow | None | merged | #198 |
| #199 | Fix demo deflection rate: tune seed tickets and lower matching threshold | None | merged | #200 |
| #201 | Redesign landing page with Blueprint×Terminal aesthetic | None | closed/completed | — |
| #202 | Apply Blueprint×Terminal to Dashboard/Tickets/Activity pages | #201 | merged | #204 |
| #205 | Add Run History section to landing page | #201 | **attempted** | patch only |

### This Run's Actions (run 22513853785)
- Issue #205: implemented Run History section on landing page
  - Build manifest / mission log layout (terminal process table style)
  - All 4 pipeline runs shown: Run 04 ACTIVE, Runs 01-03 with git tag links
  - Cumulative headline: 4 runs · 4 apps · 3 tech stacks · 50+ issues · 61+ PRs · zero human code
  - Responsive: desktop grid, mobile stacked
  - Anti-slop rules respected: no emoji, no card grids, no gradient text
  - All 62 tests pass
  - safeoutputs PR creation blocked → patch artifact at /tmp/gh-aw/aw-repo-assist-issue-205-run-history-landing-page.patch
  - Branch committed locally: repo-assist/issue-205-run-history-landing-page

### Open Issues
- #123: PRD tracking issue (open, not an implementation task)
- #205: Add Run History section to landing page (attempted, patch-only)

### ⚠️ Environment Constraints
1. NuGet restore succeeded (.NET 10.0.102 SDK installed)
2. GH_AW_GITHUB_TOKEN cannot push branches to the remote repository
   safeoutputs falls back to creating patch artifacts instead of real PRs
