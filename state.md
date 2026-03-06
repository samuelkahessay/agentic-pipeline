# Pipeline State — 2026-03-06 (Run 22760214221)

## Last Run
- Workflow run: 22760214221
- Date: 2026-03-06T10:52:16Z

## Run 07 — Compliance Scan Service: **AT RISK** ⚠️

### Issues Status
| Issue | Title | Status |
|-------|-------|--------|
| #340 | Add Compliance Domain Models and Enums | ✅ Merged (PR #348) |
| #341 | Extend DbContext and Add Compliance Demo Seed Data | ✅ Merged (PR #349) |
| #342 | Implement Static Compliance Rule Library | ✅ Merged (PR #350) |
| #343 | Implement Compliance Scan Engine Service | ✅ Merged (PR #351) |
| #344 | Implement Compliance API Endpoints | ✅ Merged (PR #352) |
| #345 | Create Compliance Dashboard Razor Page at /compliance | ✅ Merged (PR #353) |
| #346 | Add Compliance Link to Navigation and Landing Page | ✅ Merged (PR #354) |
| #347 | Add Tests for Compliance Scan Service | ✅ Merged (PR #355) |
| #359 | NavigationLayoutTests: Assert 4 nav items | ✅ Merged (PR #361) |
| #362 | Trim shared navigation to 4 pages | ✅ Merged (PR #363) |
| #396 | Consolidate tokenization | ✅ Merged (PR #398) |
| **#399** | **CI Build Failure: RunHistoryTests** | **🔄 In Progress (PR created)** |

### Current Work
- PR created on branch `repo-assist/issue-399-fix-runhistory-tests` for issue #399
- Fixes: corrected EvidenceStrip_ShowsZeroWhenNoRuns assertion + robust stub registration in CreateFactory

### [aw] Issues
- #364: System-managed no-op tracker (ignore)
- #395: Triaged — previous run tried to push to non-[Pipeline] PR #393 (already merged). Issue can be closed.

### Next Actions
1. Wait for PR on issue #399 to be reviewed and merged
2. Close [aw] #395 (root cause resolved — PR #393 was already merged)
3. After #399 fix merges, CI should be green again
4. Archive Run 07: `scripts/archive-run.sh` to tag v7.0.0
