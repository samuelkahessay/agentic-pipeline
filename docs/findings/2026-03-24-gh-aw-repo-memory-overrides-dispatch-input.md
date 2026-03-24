# Finding: gh-aw `workflow_dispatch` reruns lack a clear force-rerun semantic

**Date:** 2026-03-24
**Severity:** Medium (silent no-op on valid re-dispatch)
**Status:** Filed upstream as [#22585](https://github.com/github/gh-aw/issues/22585)
**Component:** gh-aw rerun behavior with persisted prior-run state
**Upstream:** https://github.com/github/gh-aw
**Related upstream issues:** [#21501](https://github.com/github/gh-aw/issues/21501), [#21784](https://github.com/github/gh-aw/issues/21784)

## Summary

After a partial `prd-decomposer` failure, re-dispatching `workflow_dispatch` against the same PRD issue did not reliably produce a fresh decomposition. Prior-run state persisted outside the dispatch input appeared to influence execution, including repo-memory and context attached to the original issue such as prior summary comments.

In the observed runs, closing previously created child issues was not enough, and deleting `memory/prd-decomposer` alone was not enough. A clean rerun was only observed after using a fresh issue with the same body and no prior comments, together with cleared memory branches.

This merged finding replaces the earlier split framing around "repo-memory overrides dispatch input" and "stale comments poison reruns." The current evidence supports one narrower conclusion: gh-aw lacks a clear force-rerun semantic when prior-run state persists. It does **not** prove that repo-memory and issue comments are each independently sufficient on their own.

## What happened (Aurrin-Ventures/aurrin-platform, 2026-03-24)

| Run | ID | Input | Outcome |
|-----|----|-------|---------|
| 1 | 23440152574 | `issue_number=5` | 17/19 issues created. 2 failed (`aw_db`, `aw_og` temp ID too short). A summary comment was posted on issue #5. Run marked `failure`. |
| 2 | 23469838991 | `issue_number=5` | All 17 created child issues from run 1 were closed. Re-dispatched against the same issue while repo-memory remained. Agent emitted a no-op: "Previous decomposition remains in place." Zero issues created. Run marked `success`. |
| 3 | 23470232443 | `issue_number=5` | Deleted `memory/prd-decomposer` and re-dispatched against the same issue. The run still produced no recreated decomposition output and only a `missing_tool` result. Zero issues created. Run marked `success`. |
| 4 | 23470641103 | `issue_number=28` | Created fresh issue #28 with the same PRD body and no prior comments, cleared memory branches, and re-dispatched. Clean rerun succeeded. |

## Key observations

1. **Re-dispatching against the same issue was not sufficient to recover**. Runs 2 and 3 both targeted issue #5 and did not recreate the missing issues.

2. **Deleting `memory/prd-decomposer` alone did not produce a clean rerun**. After that branch was removed in run 3, some persisted state associated with the original issue still appeared to matter.

3. **Original issue context is a plausible part of the failure mode**. That context included prior summary comments from run 1, but this run sequence does not prove that comments alone are independently sufficient.

4. **A clean rerun was only observed with a fresh issue plus cleared memory branches**. That recovery path worked in this repository, but these runs do not prove it is the minimal required sequence.

5. **Agent artifacts reported inconsistent totals across runs**. The original failed run created 17 of 19 issues, later agent artifacts referenced 18 issues remaining in place, and prior issue commentary referenced 19 issues created. Those values came from different artifacts and should not be treated as a single reconciled count without deeper log inspection.

## Working recovery path

The following recovery path worked in this repository:

```bash
# 1. Delete the workflow's repo-memory branch
gh api repos/OWNER/REPO/git/refs/heads/memory/prd-decomposer --method DELETE

# 2. Close the old PRD issue
gh issue close N --comment "Closing for clean re-run"

# 3. Create a fresh issue with the same body
gh issue create --title "PRD: ..." --label pipeline \
  --body-file <(gh issue view N --json body --jq '.body')

# 4. Dispatch against the new issue
gh workflow run prd-decomposer.lock.yml -f issue_number=NEW_NUMBER
```

This recovery path worked here, but the current evidence does not prove that each step is individually necessary.

## Relation to upstream issues

- **#21501** was a targeted-dispatch binding bug in which the bound issue was never read before a noop was accepted. That issue was opened on **2026-03-18** and closed the same day. In the closing comments, Don Syme characterized it as mostly a prompting problem and redirected the concrete framework bug to **#21624**.
- **#21624** was the narrow prompt-rendering bug where the literal text `${{ steps.sanitized.outputs.text }}` leaked into the generated prompt. It was opened and closed on **2026-03-18**. That issue does **not** cover rerun semantics or persisted prior-run state.
- **#21784** was opened on **2026-03-19** and remains open. It is adjacent: targeted dispatch can still drift into unrelated backlog or scheduled-mode behavior and conclude `success` when hidden framework state interferes with the intended target.

The shared product gap across these reports is that `workflow_dispatch issue_number=N` does not provide a clear "force this issue to be re-evaluated from current state" contract.

## Upstream check (2026-03-23)

An upstream search on **2026-03-23** found:

- no open or closed gh-aw issue specifically covering a **force-rerun** or **fresh evaluation** semantic for rerunning the **same bound issue**
- no upstream PR obviously implementing that behavior
- only the adjacent targeted-dispatch reports above, which address prompt leakage or integrity-filtered dispatch drift rather than persisted prior-run state causing a false "already done" conclusion

That means this finding does not appear to be a duplicate of an existing upstream issue as of 2026-03-23.

## Filing recommendation

If filed upstream, this should be framed as a **feature request**, not a pure bug report:

- the maintainers already treated **#21501** as mostly a prompting issue
- the stronger ask here is structural: provide an explicit rerun semantic when operators intentionally re-dispatch against the same issue after partial failure
- the request is not "ignore all prior context", but "do not allow prior-run memory or summaries to silently override a new targeted rerun without an explicit contract"

## Suggested Fix

Safer fixes than simply ignoring all prior comments on every rerun:

1. **Explicit force-rerun mode**: add a workflow or agent-level flag that tells gh-aw to recompute from current repository state for the specified `issue_number`, instead of inferring completion from prior context.

2. **Run-aware context handling**: tag repo-memory and safe-output comments with run metadata, and instruct the agent not to treat prior-run completion summaries as authoritative for a new rerun.

3. **Targeted-dispatch guardrails**: when rerunning against the same issue, separate historical context from current-run instructions and reject successful noop completion if the bound issue was never meaningfully re-evaluated.

## Impact

- Re-dispatching against the same PRD issue after a partial failure may silently produce no new work.
- Operators may need a fresh issue to recover cleanly.
- Recovery can fragment the PRD conversation across multiple issues.
- `workflow_dispatch issue_number=N` did not, in this case, override prior-run state strongly enough to force a fresh pass.

## Environment

- gh-aw version: v0.62.5
- Agent engine: copilot (`gpt-5`)
- Workflow: prd-decomposer
