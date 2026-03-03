# Wealthsimple AI Builder Submission — prd-to-prod

**Samuel Kahessay** | March 2, 2026

prd-to-prod is not AI layered onto an existing workflow. It is a software delivery process rebuilt from scratch as an AI-native system. One person can now supervise continuous delivery across multiple parallel workstreams — triage, implementation, security scanning, code review, CI repair — without writing implementation code. I write product intent and acceptance criteria. The system decomposes, implements, reviews, merges, and repairs. My attention goes to what to build and why.

## What the AI handles

The pipeline manages the full delivery loop: PRD decomposition into dependency-ordered issues, implementation, PR creation, review against acceptance criteria, CI diagnosis on failure, and first-line repair. The compliance service in this submission is the specimen — the pipeline built a Canadian regulatory scanner that classifies PIPEDA and FINTRAC violations, auto-blocks clear violations, and escalates ambiguous findings to a human operator. It built that system the same way it builds everything else: one scoped issue at a time, inside a human-owned control plane.

## Where the AI must stop

The compliance service cannot determine remediation for escalated findings. That boundary is structural, not advisory — HUMAN_REQUIRED response payloads omit the remediation field entirely. It does not exist in the schema. Getting it wrong under PIPEDA or the Proceeds of Crime Act has legal consequences. The AI classifies and stops. A human decides.

The same logic governs the pipeline itself. `gh-aw` (GitHub Agentic Workflows, released February 2026) agents handle decomposition, implementation, review, and repair. GitHub Actions handles routing, merge gates, deploy policy, and authority enforcement. The agents operate inside the human-owned control plane. They do not get to redefine it. Unknown actions fail closed to human_required.

## What breaks first at scale

What breaks first is not code generation — it is the control plane. External platform dependencies on GitHub, Copilot, and Azure remain critical. Repair routing is only as good as the failure signals it can extract. Ambiguous inputs produce variable outputs. Silent degradation compounds: a watchdog failing without alerting, a rate limit approaching without backoff.

Pressure-testing this at depth revealed edges. I filed 9 bug reports against `gh-aw` upstream. 4 were merged and I'm credited in the release notes — including a fix shipped today (v0.51.6) for auto-merge gating incorrectly blocking on non-required third-party deployment statuses. Running a pipeline in production means you find the platform's limits. You stop being a user and start being responsible for it.

---

Most delivery loops were designed before AI could take on real cognitive work. The manual burden was never just writing code — it was triaging intent, decomposing work, moving state between tools, reviewing against requirements, and deciding when the system must stop. This rebuilds that loop with explicit authority limits, real failure conditions, and visible operator controls. The system is designed to stop rather than silently widen its own authority. That constraint is the point.

---

**Salary expectation:** $160,000 CAD  
**Years of hands-on AI experience:** 5
