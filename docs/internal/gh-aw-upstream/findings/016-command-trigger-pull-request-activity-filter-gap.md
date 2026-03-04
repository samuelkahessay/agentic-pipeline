# Finding: No activity-type filtering for command-trigger pull request contexts

**Status:** verified
**gh-aw version:** v0.52.1
**Discovered:** 2026-03-04
**Upstream issue:** (none yet)

## What happens

`slash_command.events` lets workflow authors include or exclude whole PR-related contexts such as `pull_request`, `pull_request_comment`, and `pull_request_review_comment`.

That solves the broadest trigger-noise problem, but it does not allow filtering by GitHub activity type within the `pull_request` body context. If a workflow needs `/command` support in the PR body, enabling `pull_request` causes the compiler to generate the default PR-body trigger set (`opened`, `edited`, `reopened`) with no supported way to narrow it to a smaller subset such as `ready_for_review` or `edited` only.

In practice, this means command workflows must choose between:

- dropping PR-body command support entirely, or
- accepting extra PR-open check noise from generated `pull_request` runs

## What should happen

Command-trigger workflows should be able to keep PR-body command support while narrowing the generated `pull_request` activity types.

One possible shape:

```yaml
on:
  slash_command:
    name: repo-assist
    events:
      - issues
      - issue_comment
      - pull_request_comment
      - pull_request_review_comment
      - event: pull_request
        types: [edited, ready_for_review]
```

Any equivalent source-level mechanism would solve the gap. The key is that PR-body command support should not force `pull_request: [opened, edited, reopened]`.

## Where in the code

- `docs/src/content/docs/reference/command-triggers.md`
  - documents `events:` filtering by context only
  - says the default is all supported comment/PR contexts
- `pkg/parser/schemas/main_workflow_schema.json`
  - `slash_command.events` accepts only strings/arrays of event identifiers
  - no structure exists for `pull_request` activity types
- `pkg/workflow/command.go`
  - builds body/comment matching logic from event families only

Relevant upstream references checked on 2026-03-04:

- `command-triggers.md:57-58` — command triggers auto-create issue/PR/comment triggers
- `command-triggers.md:88-97` — `events:` narrows contexts, not activity types
- `main_workflow_schema.json:199-219` — `slash_command.events` schema
- `command.go:124-130` — `pull_request` command condition is body-based and event-family-only

## Evidence

Production usage from `samuelkahessay/prd-to-prod`:

- PR `#363` on 2026-03-03 showed three separate gh-aw workflow runs on PR open because command-trigger workflows compiled broad PR triggers.
- The repo can mitigate this today only by removing `pull_request` from `slash_command.events`.
- For workflows that still need PR comments, `pull_request_comment` and `pull_request_review_comment` can be preserved, but PR-body commands cannot be retained without also accepting `pull_request.opened`.

Verified locally against upstream docs/source on 2026-03-04:

- `slash_command.events` is supported and works at the context-family level.
- There is no supported way to express `pull_request` activity-type filtering inside command triggers.
- Combining `slash_command` with explicit `pull_request` triggers remains disallowed except for the label-only exception, so authors cannot work around this by mixing in a custom `pull_request` config.

## Proposed fix

Extend command trigger configuration to support activity-type filters for the `pull_request` body context.

Minimal path:

1. Add an object form under `slash_command.events` / `command.events` for event-specific options.
2. Support at least `pull_request.types`.
3. Teach the compiler to emit the narrower `on.pull_request.types` list when that object form is used.
4. Document precedence and interaction with the existing label-only exception.

## Impact

- Hits any workflow that wants `/command` in PR bodies but does not want runs on every PR open.
- Creates noisy skipped checks on PR creation.
- Pushes authors toward dropping PR-body support entirely even when they still want `/command` in a later PR lifecycle stage.
- Forces repo-specific compromises instead of a clean source-level configuration.
