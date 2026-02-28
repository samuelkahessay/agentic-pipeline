# Pipeline State — 2026-02-28

## Last Run
- Workflow run: 22512207885
- Date: 2026-02-28T03:30:00Z

## Current Run: Run 04 — Ticket Deflection Service (C#/.NET 8 → .NET 10)

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
| #185 | Upgrade NuGet packages to match net10.0 | None | closed/merged | — |
| #186 | Update dotnet-ci.yml to use .NET 10 SDK | #185 | closed | — |
| #189 | Fix EF Core in-memory database scoping in test fixtures | None | **PATCH READY** | — |

### This Run's Actions (run 22512207885)
- Issues #185 and #186 confirmed closed by human
- Issue #189 implemented — 6 files changed, all 62 tests pass locally
- Patch posted as comment on issue #189 for manual application
- Updated project status board

### ⚠️ Environment Constraints
1. The agent environment's squid proxy blocks `api.nuget.org:443` (HTTP 403 ERR_ACCESS_DENIED).
   NuGet packages cannot be restored locally.
2. `GH_AW_GITHUB_TOKEN` cannot push branches to the remote repository.
   safeoutputs falls back to creating patch artifacts instead of real PRs.
3. Issue #189 patch is ready — requires human to push the branch and open PR.
