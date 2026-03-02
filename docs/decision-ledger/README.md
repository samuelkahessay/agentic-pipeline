# Decision Ledger

The decision ledger is the durable record for consequential autonomous and
human-gated actions in `prd-to-prod`.

It exists to answer four questions without opening GitHub logs:

1. What action did the system try to take?
2. What policy result applied?
3. What evidence did it use?
4. Did it act, stop, escalate, or hand off to a human?

## Storage

Ledger entries are stored as one JSON document per event under
`drills/decisions/`.

That directory is intentionally simple:

- easy for shell scripts to write
- easy for the ASP.NET app to read later
- easy to demo as auditable artifacts

## Event Schema

Each ledger file uses this shape:

```json
{
  "schema_version": 1,
  "event_id": "20260302T201840Z-auto-merge-pipeline-pr-acted",
  "timestamp": "2026-03-02T20:18:40Z",
  "actor": {
    "type": "workflow",
    "name": "pr-review-submit"
  },
  "workflow": "pr-review-submit",
  "requested_action": "auto_merge_pipeline_pr",
  "policy_result": {
    "mode": "autonomous",
    "reason": null
  },
  "target": {
    "type": "pull_request",
    "id": "284",
    "path": null,
    "display": "[Pipeline] PR #284"
  },
  "evidence": [
    "Formal APPROVE review posted",
    "Required checks green",
    "PR title starts with [Pipeline]"
  ],
  "outcome": "acted",
  "summary": "Auto-merge armed after approval on PR #284.",
  "human_owner": null
}
```

## Field Notes

- `schema_version`: allows future format changes without breaking readers
- `event_id`: stable identifier for the decision event
- `timestamp`: UTC time in ISO 8601 format
- `actor`: who initiated the action (`workflow`, `agent`, `human`, or `service`)
- `workflow`: workflow or subsystem that made the decision
- `requested_action`: normalized action name, ideally aligned to
  `autonomy-policy.yml`
- `policy_result.mode`: `autonomous` or `human_required`
- `policy_result.reason`: required when `mode` is `human_required`
- `target`: the primary object affected by the action
- `evidence`: human-readable decision inputs
- `outcome`: one of `acted`, `blocked`, `queued_for_human`, or `escalated`
- `summary`: short one-line explanation suitable for an operator queue
- `human_owner`: optional named human owner when the system hands off

## Seed Events

The repo should keep three committed seed events for demo and development:

- one `autonomous` decision that acted
- one `human_required` decision that was blocked
- one `human_required` decision queued for a human

These seed events give `WS-06` and `WS-07` stable fixture data before the live
workflows are updated to write ledger entries directly.
