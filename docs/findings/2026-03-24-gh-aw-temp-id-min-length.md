# Finding: gh-aw safe-outputs rejects short temporary IDs

**Date:** 2026-03-24
**Severity:** Low (workaround exists)
**Status:** Won't file — intentional design decision upstream
**Component:** gh-aw safe-outputs processor — temporary ID validation
**Upstream:** https://github.com/github/gh-aw

## Summary

The safe-outputs handler rejects `temporary_id` values where the portion after `aw_` is shorter than 3 characters. IDs like `aw_db` and `aw_og` fail validation even though they are readable, unambiguous, and follow the documented `aw_` prefix convention.

## Reproduction

1. Create a gh-aw workflow with `safe-outputs` → `create-issue`
2. Have the agent emit a `create_issue` call with `temporary_id: "aw_db"`
3. The safe-outputs processor rejects it:

```
Invalid temporary_id format: 'aw_db'. Temporary IDs must be in format 'aw_'
followed by 3 to 12 alphanumeric characters (A-Za-z0-9).
Example: 'aw_abc' or 'aw_Test123'
```

4. The issue is never created. Other issues that reference `#aw_db` in their dependency list retain the unresolved placeholder text.

## Impact

- In our case, 2 of 19 decomposed issues were silently dropped from a PRD decomposition run. The run was marked as `failure` even though 17 issues succeeded.
- The two dropped issues happened to be the **root infrastructure dependency** (database schema) and a Phase 2 feature (social asset generation). Every downstream issue referencing `#aw_db` has a broken dependency link.
- The agent (GPT-5 via Copilot engine) naturally picks short IDs for short concepts (`db`, `og`). The 3-character minimum is not intuitive and agents will repeatedly hit it unless explicitly warned in the prompt.

## Root Cause

The validation regex in the safe-outputs processor enforces a minimum of 3 alphanumeric characters after the `aw_` prefix. The documented format says "3 to 12" but the lower bound of 3 is unnecessarily restrictive — `aw_db` is a valid, unambiguous identifier.

## Suggested Fix

Lower the minimum character count after `aw_` from 3 to 2 (or even 1). The `aw_` prefix already namespaces these IDs sufficiently. A regex like `^aw_[A-Za-z0-9]{1,12}$` would accept all current valid IDs plus short ones like `aw_db`, `aw_og`, `aw_ci`.

Alternatively, if the minimum exists to prevent collisions or ambiguity, document the rationale so prompt authors can warn agents explicitly.

## Current Workaround

We patched the `prd-decomposer.md` prompt to explicitly warn the agent:

```
The part after `aw_` MUST be at least 3 characters. Do NOT use IDs shorter
than 3 chars after `aw_` (e.g., `aw_db` and `aw_og` will FAIL validation).
```

This works but relies on the LLM reading and following the instruction. A validation-side fix would be more robust.

## Resolution (2026-03-23)

**Won't file.** The gh-aw team intentionally tightened temp ID validation, not loosened it:

- PR [#15392](https://github.com/github/gh-aw/pull/15392) changed the spec to **exactly 12 lowercase hex characters**: `^aw_[0-9a-f]{12}$`
- PR [#15393](https://github.com/github/gh-aw/pull/15393) recompiled all 149 workflow lock files to propagate the new schema validation and updated agent instructions

Temp IDs are designed to be opaque references (e.g. `aw_abc123def456`), not human-readable labels. The 3-char minimum we hit was actually the **older, more lenient** validation — the current policy is stricter.

On newer gh-aw versions the schema `pattern` constraint is embedded in the lock file tool definitions, so agents get the format from the tool schema itself rather than needing a prompt-level warning.

Our prompt workaround (telling the agent to use 3+ chars) remains sufficient for v0.62.5 but will need updating to the hex format when we upgrade.

## Environment

- gh-aw version: v0.62.5
- Agent engine: copilot (gpt-5)
- Workflow: prd-decomposer
