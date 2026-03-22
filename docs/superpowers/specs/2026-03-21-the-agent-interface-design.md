# The Agent Interface — Blog Post Design Spec

**Date:** 2026-03-21
**Author:** Sam Kahessay
**Type:** Blog post for skahessay.dev + companion open-source repo
**Status:** Approved design, pending implementation

---

## Summary

Sequel to "The New OSS" (2026-03-10). A data-driven analysis of how to write work that agents can execute, based on the full issue history of github/gh-aw — the first major OSS repo where agents implement most fixes. The post introduces the concept of an "agent interface contract" and measures it empirically.

## Goals

1. Establish Sam as a researcher in the agentic OSS space
2. Provide a genuinely useful contribution to the gh-aw community and agentic workflows broadly
3. Create a research foundation for future standards around agent-compatible work descriptions
4. Strengthen relationships with GitHub Next (Peli, Matthew, Daniel) by offering value, not asking for anything
5. Publish open-source methodology and data for reproducibility and credibility

## Artifacts

### Blog post
- **Title:** "The Agent Interface"
- **Subtitle:** "What [N] issues reveal about writing work that agents can execute"
- **Format:** MDX on skahessay.dev (Astro, `src/content/posts/the-agent-interface.mdx`)
- **Tone:** Narrative with data. First-person framing ("I wanted to know..."), third-person findings. Genuine curiosity, not victory lap. Constructive, not critical.
- **Length:** ~3000-4000 words (longer than "The New OSS" at ~1500, justified by data depth)
- **Visuals:** 6 embedded charts rendered on the page. The post is the complete experience — no clicking into the repo required to understand the findings.

### Open-source repo
- **Name:** `samuelkahessay/gh-aw-agentic-contribution-analysis`
- **Contents:** Raw data, classification scripts, analysis notebooks, methodology docs, chart generation
- **Purpose:** Reproducibility. "Run it yourself." For maintainers and researchers who want to verify or extend.

## Target Audience

- **Primary:** GitHub Next team, gh-aw maintainers (Peli, lpcox, dsyme), developer tools researchers
- **Secondary:** Agentic workflow practitioners — anyone filing issues on repos with Copilot, or writing tickets that feed AI pipelines
- **Tertiary:** General dev audience interested in how AI is changing open source

## Connection to "The New OSS"

"The New OSS" was qualitative: 19 issues from one contributor, a thesis that diagnosis is the new bottleneck skill. This sequel is quantitative: 297 issues from 114 contributors, empirical measurement of what "diagnosis quality" actually means. The original post is referenced briefly in the opening but the sequel stands on its own.

---

## Post Structure

### Section 1: Opening (200-300 words)

**Purpose:** Hook and scope.

- Open with the concrete moment: an issue filed at 4:20 AM gets two fix PRs merged by 5:31 AM. No human wrote the code. (Reuse #18980 from the original — anchors this as a sequel.)
- Reference "The New OSS" briefly: "I made a claim that diagnosis quality is what gets bugs fixed in agentic repos. That was based on 19 issues I filed. I wanted to know what it looks like across everyone."
- "Why me" woven in naturally: built prd-to-prod on gh-aw, ran thousands of workflow runs, filed 23 issues, 23 fixes shipped, became a top community contributor. Started wondering: was my experience typical?
- Scope: "I pulled every human-filed community issue in gh-aw's history — 297 issues from 114 contributors — and measured what actually predicts whether an agent resolves your bug."

**Tone:** Curiosity, not authority. "I found something interesting" not "I proved something."

### Section 2: Context — What Makes This Unprecedented (300-400 words)

**Purpose:** Someone who hasn't read "The New OSS" needs to understand why this matters.

- gh-aw is GitHub's agentic workflows platform. The repo runs on its own platform — 100+ specialized agent workflows.
- Scale and composition: 7,683 total issues. 6,592 bot-filed (86%). 297 community (4%). For every human issue, 22 bot-generated ones. The platform is already more agent than human.
- The contribution model: human files issue → agent picks up → implements fix → opens PR → maintainer reviews and merges.
- The metaphor: every issue is an API call to an agent. Like any API, some calls succeed and some fail — depending on how they're structured. This post is the documentation for that API.

**Chart 1:** Composition breakdown — stacked area over time. Bot vs human issues by month, with gh-aw public release date marked. Establishes the dataset visually and shows community growth.

### Section 3: Methodology (300-400 words + methodology box)

**Purpose:** Credibility and reproducibility.

**The dataset:**
- 7,683 total issues on gh-aw
- 6,592 bot-filed (86%) — smoke tests, triage reports, audits, performance
- 297 community-labeled (external humans from 114+ contributors)
- ~48 maintainer-filed (internal humans, no `community` label)

**Author classification:**
- Not by label alone — by actual identity
- Maintainers identified by PR merge rights: pelikhan (93 merges), lpcox (4), dsyme (2), mnkiefer (1)
- PR reviewers: pelikhan (49 comments), Copilot (37), dsyme (10)
- `community` label = external humans. Maintainer issues don't get this label. Confirmed by data: 48% of human-filed issues lack `community`, and they're all from maintainers.

**Intake pipeline mapping:**
- Community issues go through automated workflows on filing: auto-triage, content moderation, AI inspection
- Labels applied by these workflows: `ai-inspected`, `cookie`, `community`, `contribution-report`
- Case study: security finding flagged by content moderation because the vulnerability description was precise enough to trigger the filter. The interface has input validation.

**Signal classification per issue:**
- Body signals: code blocks, error output, file paths, line numbers, run links, proposed code
- Category: doc fix, mechanical bug, design-required bug, enhancement
- Automated classification validated against hand-classified random sample of 50 issues

**Pipeline measurement per issue:**
- Time to first label (intake speed)
- Time to Copilot dispatch (if any)
- Time to fix PR → merge → release
- Linked PR data: agent implementation time, review rounds, lines changed

**Open source:** Everything at `samuelkahessay/gh-aw-agentic-contribution-analysis`

**Chart 2:** Methodology pipeline diagram — data flow from GitHub API → author classification → signal extraction → category classification → pipeline measurement → findings.

### Section 4: Findings — The Agent Interface Contract (1200-1600 words)

Seven sub-findings, six charts.

#### 4.1: "The platform is already more agent than human"

The composition data. 86% bot, 4% community. Context for everything that follows — you're filing into a system built by and for agents.

*Uses Chart 1 from Section 2 (no new chart).*

#### 4.2: "Two intake paths"

Community issues get the `community` label and enter the triage/moderation pipeline. Maintainer issues don't — they go direct. The platform has an implicit trust boundary.

Case study: security vulnerability description flagged by content moderation. The interface validates input before a human ever sees it. Writing for agents means your issue is read by agents first.

**Chart 3:** Flow diagram — issue filed → intake workflows fire → labels applied → Copilot dispatch (or not). Two paths: community (filtered) vs maintainer (direct).

#### 4.3: "What reporters control, ranked by impact"

The core findings. Presented as the interface contract — what parameters matter.

| Parameter | Effect | Evidence |
|-----------|--------|----------|
| Category framing (bug vs enhancement) | Strongest lever | Bugs: 0.70 med days. Enhancements: 1.86, 0% Copilot dispatch |
| Run link (`actions/runs/`) | 82% faster | 0.27 vs 1.48 median days for bugs |
| Error output | 37% faster | 0.56 vs 0.89 median days |
| Scope (files referenced) | Narrow = fast | 1-2 files: 0.26 med days. 3+: 2.46 |
| Proposed code | Inverse correlation | 1.48 vs 0.70 — proxy for complexity, not a speed-up |
| Body length | No effect | Noise |

All controlled for category (analysis run within bugs only, not across all types).

**Chart 4:** Horizontal bar chart — each signal's effect size on median resolution time, sorted by impact.

#### 4.4: "The decision-free threshold"

The single most important finding. The agent either can or can't fix it without asking a human. Binary, not a gradient. All quality signals are proxies for this. Doc fixes and narrow mechanical bugs cross the threshold. Design-required bugs and enhancements don't, regardless of issue quality.

**Chart 5:** Two overlaid distributions — time-to-close for decision-free issues vs decision-required issues. Clear bimodal separation.

#### 4.5: "What reporters can't control"

Honest section. Most variance in resolution time comes from factors outside the reporter's control: reporter identity/trust, filing timing relative to release cycles, whether a maintainer chooses to dispatch Copilot. The reporter's only real lever is framing work to be agent-compatible.

**Chart 6:** Variance decomposition — percentage of time-to-close variance explained by controllable factors vs uncontrollable factors.

#### 4.6: "Contribution strategies that work"

Generalized archetypes (no names, no leaderboard):

- **The volume filer** — high frequency, short issues, builds trust. The platform learns to prioritize them.
- **The deep diagnostician** — fewer issues, exhaustive evidence, high close rate.
- **The feature shaper** — mixes bugs with feature requests, co-designs the platform through issues.
- **The niche specialist** — concentrates on one subsystem, becomes the domain expert.

Reader self-selects which archetype fits. Data backs each pattern.

**Chart 7:** Scatter plot — issues filed vs median resolution time, dot size = close rate. Clusters labeled by archetype, not by person.

#### 4.7: "The missing metric — an opportunity"

gh-aw has invested deeply in agent-side observability: daily session insights, review rounds, triage coverage, team evolution reports. That infrastructure is impressive and visible in the repo's discussions.

What doesn't exist yet is the complementary view: issue-side quality metrics. How agent-compatible is the incoming work? The platform has excellent telemetry on the engine. This analysis is a first attempt at telemetry on the fuel.

**No chart.** Thesis statement landing. Sets up the conclusion.

### Section 5: Beyond gh-aw — "The Agent Interface Is Everywhere" (300-400 words)

**Purpose:** Generalize. Make the findings transferable.

- gh-aw is the first repo where this is measurable at scale, but the pattern applies anywhere agents act on human-written intent: Jira tickets → Copilot Workspace, Linear issues → Devin, PRDs → autonomous pipelines.
- The interface contract (frame as bug, include run links, keep scope narrow, don't over-specify implementation) — these aren't gh-aw rules. They're properties of agent-compatible work.
- The decision-free threshold is universal: if work requires judgment the agent lacks, no description quality makes it automatic. The skill is knowing where that line is.
- This is early. 297 issues on one repo is a baseline. As more repos adopt agentic workflows, the interface contract will evolve. This is a first measurement.

### Section 6: Conclusion — "An Open Foundation" (200-300 words)

**Purpose:** Land it. Connect back, point forward.

- Circle to opening: "I wanted to know what makes work agent-compatible. 297 issues from 114 contributors gave a clear answer: scope it so the agent can act without asking."
- The post is a contribution, not a conclusion. Dataset and methodology are open source. Findings are a starting point.
- Forward-looking: learning to write for agents isn't a niche skill — it's becoming how we build software together.
- Links: repo, "The New OSS" for context.

---

## Data Collection Plan

### Phase 1: Full dataset pull
- All 7,683 issues with full metadata (body, labels, author, timestamps, comments)
- All PRs with author, reviewer, merge data, linked issues
- All 20+ releases with notes, dates, credited issues

### Phase 2: Author classification
- Bot accounts (app/github-actions, *[bot])
- Maintainers (identified by PR merge rights + PR review comments)
- Community (everyone else, cross-referenced with `community` label)
- Validate: confirm 48% of human issues lack community label = maintainers

### Phase 3: Intake pipeline mapping
- Document every automated workflow that fires on issue creation
- Map which labels each workflow applies
- Measure time-to-first-label as intake speed metric
- Document the content moderation case study

### Phase 4: Signal extraction (per community issue)
- Automated: code blocks, error output, file paths, line numbers, run links, proposed code, body length
- Category classification: doc, mechanical bug, design-required, enhancement
- Hand-classify random sample of 50 for validation

### Phase 5: Pipeline linkage
- Link issues → fix PRs (via PR body references, closing keywords)
- Measure: time to PR, agent implementation duration, review rounds, lines changed
- Link PRs → releases (via release notes)

### Phase 6: Analysis & charts
- All findings with category-controlled statistics
- 7 charts generated as static SVGs or chart components for the post
- Full analysis scripts in the repo

### Phase 7: Validation
- Run hand-classification validation (50-issue sample)
- Confidence intervals on key findings
- Sensitivity analysis: do findings hold when excluding outliers?

---

## Chart Specifications

| # | Title | Type | Data |
|---|-------|------|------|
| 1 | Issue composition over time | Stacked area | Bot vs human issues by month + release dates |
| 2 | Data pipeline | Flow diagram | Methodology visualization |
| 3 | Intake paths | Sankey/flow | Community vs maintainer intake pipeline |
| 4 | Controllable signals ranked | Horizontal bar | Effect size per signal on resolution time |
| 5 | Decision-free threshold | Overlaid distributions | Time-to-close bimodal split |
| 6 | Variance decomposition | Stacked bar or pie | Controllable vs uncontrollable factors |
| 7 | Contributor archetypes | Scatter plot | Issues filed vs resolution time, clustered |

---

## Open-Source Repo Structure

```
samuelkahessay/gh-aw-agentic-contribution-analysis/
  README.md                    # Overview, methodology, how to reproduce
  data/
    raw/                       # Raw JSON from GitHub API
    processed/                 # Cleaned, classified datasets
  scripts/
    pull-issues.sh             # Data collection
    classify-authors.py        # Author type classification
    extract-signals.py         # Issue body signal extraction
    classify-categories.py     # Category classification
    link-prs.py               # Issue → PR → release linkage
    analyze.py                # Statistical analysis
    generate-charts.py        # Chart generation
  validation/
    hand-classified-sample.csv # 50-issue validation sample
    validation-report.md      # Classification accuracy
  charts/                     # Generated chart assets
  findings/                   # Per-finding detailed writeups
  LICENSE                     # MIT
```

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Post format | Narrative with data (not research paper) | Accessible to wider audience while maintaining rigor |
| Charts | Embedded in post | Complete experience — scroll and see everything |
| Repo | Separate from prd-to-prod | Stands alone as research artifact, discoverable |
| Names in post | No specific contributors named | Generalized archetypes, not leaderboard |
| prd-to-prod mention | Context in methodology only | Credibility, not promotion |
| Tone toward gh-aw | Constructive | "Missing metric" framed as opportunity, not criticism |
| Central metaphor | Issues as API calls | Sticky, generalizable, frames findings as interface docs |
| Thesis | "Writing for agents is a skill — here's the contract" | Bigger than gh-aw, positions as research foundation |
