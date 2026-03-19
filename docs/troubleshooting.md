# CI Troubleshooting

Known failure patterns and root causes, logged during investigations.

---

## Broken pipe in CI Failure Router (classify-ci-failure.sh)

**Date**: 2026-03-19
**Runs**: 23317612475, 23317591528
**Symptom**: `ci-failure-issue.yml` triggers but crashes with `printf: write error: Broken pipe` in `classify-ci-failure.sh` lines 14, 19, 24 and `extract-failure-context.sh` line 119.

**Root cause**: `printf '%s' "$LOG_LOWER" | grep -Eq '...'` with large log input under `set -euo pipefail`. `grep -Eq` matches early and exits, closing the read end of the pipe while `printf` is still writing the large blob. SIGPIPE (exit 141) is treated as fatal by `pipefail`.

**Impact**: CI Failure Router crashes before creating any issue or repair command. The entire self-healing loop is dead at step 2.

**Fix**: Replace `printf | grep -Eq` with bash-native pattern matching (`[[ "$LOG_LOWER" =~ pattern ]]`) or use `grep -Eq ... <<< "$LOG_LOWER"` (here-string, no pipe). Both avoid SIGPIPE entirely.

**Status**: Unfixed.

---

## Test-copy drift after landing page text changes

**Date**: 2026-03-19
**Run**: 23317584389 (Node CI)
**Symptom**: 2 of 106 tests fail in `test/components.test.tsx`:
- `Hero > renders headline and CTA` — `getByText("$1.")` fails because `$1.` was inlined into `"Get a deployed app for $1."` (commit `ebd8ca9`, "inline $1")
- `StickyNav > renders anchor links and CTA` — `getByRole("link", { name: "prd-to-prod" })` fails because nav text was changed to `"prd to prod"` (commit `ebd8ca9`, "rebrand nav text")

**Root cause**: Landing page copy was changed but corresponding test assertions were not updated.

**Fix**: Update test assertions to match current copy:
- `getByText("$1.")` -> `getByText(/\$1\./)` or match the full text
- `{ name: "prd-to-prod" }` -> `{ name: "prd to prod" }`

**Status**: Unfixed.

---

## Pipeline Scripts CI — test-export-scaffold.sh silent failure

**Date**: 2026-03-19
**Run**: 23317584417
**Symptom**: `pipeline-scripts` job fails after `manifest-parse tests passed` with exit code 1. No error message shown.

**Root cause**: `test-export-scaffold.sh` runs `bash "$EXPORT_SCRIPT" >/dev/null 2>&1` under `set -euo pipefail`. When the export script fails, stderr is suppressed, producing no diagnostic output. Likely cause: golden file mismatch (`expected-tree.txt`) or missing `yq` dependency.

**Fix**: Remove stderr suppression from the export call so failures produce diagnostics, or add explicit error messages before the call.

**Status**: Unfixed (root cause needs CI reproduction to confirm).

---

## gh-aw artifact name collision in safe_outputs

**Date**: 2026-03-19
**Run**: 23317584419 (Pipeline Review Agent)
**Symptom**: `safe_outputs` step fails with 409 Conflict: "an artifact with this name already exists on the workflow run."

**Root cause**: gh-aw `upload-artifact` uses a fixed artifact name (`agent`) that collides when the `agent` job already uploaded an artifact earlier in the same workflow run.

**Impact**: Cosmetic — the review agent work (comment posting) succeeded. Only the artifact upload failed.

**Fix**: gh-aw upstream issue. No local fix needed.

**Status**: gh-aw bug.

---

## Self-healing loop did not fire for non-[Pipeline] PR

**Date**: 2026-03-19
**Context**: PR #511 (`codex/heal-loop-fix`) CI failed but no repair was dispatched.

**Root cause (dual)**:
1. CI Failure Router crashed (broken pipe, see above)
2. Even if the router succeeded, PR #511 title (`"Activate public beta bootstrap flow..."`) is not `[Pipeline]`-prefixed, so the router would have created a `[CI Incident]` issue, not a repair command. Automatic repair only applies to `[Pipeline]` PRs with linked source issues.

**Takeaway**: Self-healing is designed for pipeline-authored PRs only. Human-authored PRs get incident tracking but not automatic repair. The broken pipe bug prevents even that incident tracking from working.
