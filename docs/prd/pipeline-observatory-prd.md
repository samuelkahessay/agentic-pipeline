# PRD: Pipeline Observatory

## Overview
Build a Pipeline Observatory — a web app that visualizes, replays, and inspects
the agentic pipeline's behavior. Three views: an interactive Simulator showing
how the pipeline works, a Replay timeline of the Code Snippet Manager run, and
a Forensics inspector for agent decisions and review outputs.

This is the second project for the agentic pipeline, and the first using
Next.js + React.

## Tech Stack
- Runtime: Node.js 20+
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Animation: Framer Motion
- Data Fetching: @octokit/rest (build-time only)
- Testing: Vitest + @testing-library/react
- Hosting: Vercel (vercel.json config included)

## Features

### Feature 1: Project Scaffold
Set up the Next.js 14 project with TypeScript, Tailwind CSS, Framer Motion, and
Vitest. Include a root layout with dark theme and a placeholder home page.

**Acceptance Criteria:**
- [ ] package.json with next, react, react-dom, tailwindcss, framer-motion, @octokit/rest, vitest, @testing-library/react, @testing-library/jest-dom
- [ ] tsconfig.json extending next/core-js with strict mode, paths alias "@/*" mapping to "src/*"
- [ ] tailwind.config.ts configured for src/ directory with dark mode "class"
- [ ] src/app/layout.tsx with HTML root, dark class on body, Inter font from next/font, metadata title "Pipeline Observatory"
- [ ] src/app/page.tsx with placeholder heading "Pipeline Observatory"
- [ ] src/app/globals.css with Tailwind directives and dark theme CSS variables (bg-gray-950, text-gray-100)
- [ ] next.config.js with output "standalone" for Vercel
- [ ] vercel.json with framework "nextjs"
- [ ] npm scripts: "dev" (next dev), "build" (next build), "start" (next start), "test" (vitest)
- [ ] Test that verifies the home page renders "Pipeline Observatory"

### Feature 2: Static Fixture Data & Data Loading Layer
Bundle real pipeline run data as static JSON fixtures and create a data loading
layer that tries the GitHub API at build time with fallback to fixtures.

**Acceptance Criteria:**
- [ ] src/data/fixtures/issues.json — array of objects with fields: number, title, state, createdAt, closedAt, labels (array of {name, color}). Include all 17 issues from the Code Snippet Manager run (issues #1-#15, #19, #22, #24). Pipeline issues (#7-#14) must have labels "pipeline" and "feature" or "infra".
- [ ] src/data/fixtures/pull-requests.json — array of objects with fields: number, title, state, createdAt, mergedAt, additions, deletions, changedFiles, reviews (array of {author, state, body, submittedAt}). Include all 11 PRs (#5, #16-#18, #20-#21, #23, #25-#28).
- [ ] src/data/fixtures/workflow-runs.json — array of objects with fields: id, name, status, conclusion, createdAt, headBranch, event. Include at least 15 representative runs.
- [ ] src/data/types.ts — TypeScript interfaces: PipelineIssue, PipelinePR, PipelineReview, WorkflowRun, PipelineData (containing all arrays)
- [ ] src/data/github.ts — async function fetchFromGitHub(): Promise<PipelineData> that uses @octokit/rest to fetch issues, PRs (with reviews), and workflow runs from samuelkahessay/agentic-pipeline. Uses GITHUB_TOKEN env var if available (public repo, so unauthenticated works too). Returns structured PipelineData.
- [ ] src/data/index.ts — async function getPipelineData(): Promise<PipelineData> that calls fetchFromGitHub(), catches any error, and falls back to fixture data. Logs which source was used to console.
- [ ] Unit tests: test that getPipelineData() returns fixture data when GitHub fetch throws, test that fixture JSON files parse correctly and contain expected record counts

### Feature 3: Navigation and Landing Page
Shared navigation bar and a landing page with project overview and links to
the three views.

**Acceptance Criteria:**
- [ ] src/components/nav-bar.tsx — horizontal navigation bar with: "Pipeline Observatory" logo/text on left, links to "/simulator", "/replay", "/forensics" on right. Active link highlighted. Sticky top, dark background (bg-gray-900), height 16 (h-16). Uses next/link.
- [ ] src/app/layout.tsx updated to include NavBar component above all page content
- [ ] src/app/page.tsx — landing page with:
  - Hero section: large title "Pipeline Observatory", subtitle "Visualize, replay, and inspect an autonomous AI development pipeline", dark gradient background
  - Three card links in a grid: Simulator ("Explore how the pipeline works"), Replay ("Watch the Code Snippet Manager run"), Forensics ("Inspect agent decisions and reviews"). Each card links to its page.
  - Brief stats pulled from fixture data at build time: "8 features shipped", "11 PRs merged", "~2 hours end-to-end"
- [ ] Responsive: cards stack vertically on mobile, 3-column grid on desktop
- [ ] Test that landing page renders three view cards with correct links

### Feature 4: Simulator — Interactive Node Graph
An interactive SVG-based diagram of the 4 pipeline stages. Users click nodes
to activate them and see how data flows between stages.

**Acceptance Criteria:**
- [ ] src/app/simulator/page.tsx — page component that renders the simulator
- [ ] src/components/simulator/pipeline-graph.tsx — SVG-based node graph with 4 nodes arranged left-to-right: "PRD Decomposer", "Repo Assist", "PR Reviewer", "Auto-Merge". Each node is a rounded rectangle (rx=12) with an icon and label.
- [ ] Curved SVG path connections between nodes: Decomposer→Assist, Assist→Reviewer, Reviewer→Merge. A dashed return path from Merge back to Assist for the re-dispatch loop.
- [ ] Nodes have three visual states: idle (gray border, dim), active (blue border, glow), completed (green border, check). Track state in React useState.
- [ ] Clicking a node sets it to "active" state, then after 1.5s transitions to "completed" and activates the next node in sequence (auto-chain). Clicking "PRD Decomposer" starts the full chain.
- [ ] Framer Motion animate on node state changes: scale pulse on activate (1.0→1.05→1.0), border color transition, opacity for glow effect.
- [ ] Reset button below the graph that returns all nodes to idle state.
- [ ] Speed control slider (0.5x, 1x, 2x) that adjusts the 1.5s activation delay.
- [ ] Responsive: graph scales down on smaller screens using viewBox.
- [ ] Test that clicking the first node eventually activates all 4 nodes in sequence.

### Feature 5: Simulator — Node Detail Panels
When a node is active or completed, show an expandable panel below the graph
with details about what that workflow does.

**Acceptance Criteria:**
- [ ] src/components/simulator/node-detail.tsx — animated panel that slides down below the graph when a node is selected (Framer Motion AnimatePresence with height animation)
- [ ] Content for each of the 4 nodes stored in src/data/simulator-content.ts as an array of objects: { id, name, description (2-3 sentences), triggers (string[]), outputs (string[]), techDetail (1 sentence about engine/model) }
- [ ] Panel displays: node name as heading, description paragraph, "Triggers" list, "Outputs" list, tech detail in a muted caption
- [ ] Panel updates when a different node is clicked. AnimatePresence handles exit/enter transitions.
- [ ] Close button (X) on the panel to dismiss it
- [ ] Dark card styling: bg-gray-800, rounded-xl, border border-gray-700
- [ ] Test that clicking a node shows the correct panel content

### Feature 6: Simulator — Animated Message Particles
When the pipeline chain runs, animated particles travel along the SVG paths
between nodes showing the data being produced.

**Acceptance Criteria:**
- [ ] src/components/simulator/message-particle.tsx — a small animated circle (r=6) that travels along an SVG path from one node to another using Framer Motion's motion.circle with animateMotion or manual path interpolation
- [ ] Particles labeled with the data type: "Issues" (Decomposer→Assist), "PRs" (Assist→Reviewer), "Review" (Reviewer→Merge), "Dispatch" (Merge→Assist return path)
- [ ] Particle appears when source node becomes active, travels to target node over 1 second, disappears on arrival
- [ ] Particle color matches event type: blue for issues, green for PRs, yellow for reviews, purple for dispatch
- [ ] Multiple particles can be in flight simultaneously (during fast speed)
- [ ] Particles respect the speed control slider from Feature 4
- [ ] Test that activating the first node creates a particle between the first two nodes

### Feature 7: Replay — Timeline Component
A horizontal scrollable timeline showing all events from the Code Snippet Manager
pipeline run, plotted chronologically.

**Acceptance Criteria:**
- [ ] src/app/replay/page.tsx — page component that loads pipeline data at build time via getPipelineData() and renders the timeline
- [ ] src/components/replay/timeline.tsx — horizontal scrollable container with events plotted on a time axis from 05:29 UTC to 07:24 UTC (the full run duration)
- [ ] Events derived from pipeline data: "Issue Created" (from issues with createdAt), "PR Opened" (from PRs with createdAt), "Review Submitted" (from PR reviews with submittedAt), "PR Merged" (from PRs with mergedAt). Each event has a timestamp, type, and title.
- [ ] Events rendered as colored dots on the timeline: blue for issues, green for PRs, yellow for reviews, purple for merges. Dot size 12px.
- [ ] Hover on a dot shows a tooltip with event title and timestamp
- [ ] Time axis shows tick marks every 15 minutes with HH:MM labels
- [ ] Currently selected event highlighted with a ring. Click a dot to select it.
- [ ] Horizontal scroll via mouse wheel or drag. Timeline wider than viewport.
- [ ] Summary bar above timeline: "8 issues → 7 PRs → 7 reviews → 7 merges | 1h 55m total"
- [ ] Test that the timeline renders the correct number of event dots from fixture data

### Feature 8: Replay — Event Detail Panel & Controls
Click a timeline event to see full details. Auto-play mode steps through events.
Filters let users show/hide event types.

**Acceptance Criteria:**
- [ ] src/components/replay/event-detail.tsx — panel below timeline that shows details for the selected event. Slides in with Framer Motion.
  - For issues: title, labels (as colored badges), full body text (first 500 chars)
  - For PRs: title, additions/deletions stats (green/red), changed file count, linked issue number
  - For reviews: reviewer name, decision (APPROVE in green / REQUEST_CHANGES in red), review body text
  - For merges: PR title, merge timestamp, "Auto-merged via squash" label
- [ ] src/components/replay/timeline-controls.tsx — control bar between summary and timeline with:
  - Play/Pause button (toggles auto-play). Auto-play selects the next event every 2 seconds (adjusted by speed).
  - Speed selector: 1x, 2x, 4x
  - Previous/Next buttons to step through events manually
  - Filter toggles: "Issues", "PRs", "Reviews", "Merges" — each toggleable, hides/shows dots on timeline
- [ ] When filters hide events, auto-play skips hidden events
- [ ] Keyboard shortcuts: Space for play/pause, Left/Right arrow for prev/next
- [ ] Test that toggling a filter hides the corresponding event dots

### Feature 9: Forensics — Cycle Cards & Review Inspector
Cards showing each repo-assist cycle and a review inspector for AI decisions.

**Acceptance Criteria:**
- [ ] src/app/forensics/page.tsx — page that loads pipeline data at build time and renders forensics view with two sections: "Pipeline Cycles" and "AI Reviews"
- [ ] src/components/forensics/cycle-card.tsx — a card representing one repo-assist invocation. Data derived by grouping PRs by their creation timestamp proximity (PRs created within 5 minutes of each other = same cycle). Each card shows:
  - Cycle number and timestamp range
  - "Issues Available" count (open pipeline issues at that point in time, computed from issue createdAt/closedAt)
  - "PRs Created" list with PR numbers and titles
  - "Lines Changed" total (sum of additions + deletions for that cycle's PRs)
- [ ] Cards displayed in a vertical stack, newest at top, with alternating subtle background (bg-gray-800 / bg-gray-850)
- [ ] src/components/forensics/review-inspector.tsx — for each merged PR, shows:
  - PR title and number
  - Reviewer identity (github-actions[bot])
  - Decision badge: "APPROVED" in green or "CHANGES REQUESTED" in red
  - Full review body text in a scrollable code-style block (font-mono, bg-gray-900)
  - If review contains "AI review was unavailable": show a warning badge "Fallback Review"
- [ ] Review inspector is a scrollable list of all PR reviews, sorted by submittedAt
- [ ] Test that cycle cards correctly group PRs into cycles

### Feature 10: Forensics — Failure Timeline
Visual timeline of the 11 fixes applied during the first pipeline run, showing
what broke, root cause, and resolution.

**Acceptance Criteria:**
- [ ] src/data/failures.ts — array of 11 failure objects, each with: id, timestamp (string), title (short), rootCause (1-2 sentences), resolution (1-2 sentences), category (one of: "workflow", "config", "api", "race-condition"). Data (hardcoded from actual run):
  1. PRD Decomposer first-run failure — wrong trigger config — fixed trigger syntax
  2. safe_outputs limit exceeded — too many issues created — increased limits
  3. repo-assist branching from feature branch — stale checkout — forced checkout from main
  4. PR reviewer temperature parameter — API rejected 0.2 — removed temperature
  5. MODELS_TOKEN not set — secret missing — added PAT with models:read
  6. Auto-merge not enabled — repo setting missing — enabled allow_auto_merge
  7. Squash merge losing Closes #N — commit message setting — set PR_BODY
  8. Memory branch not seeded — first-run artifact error — bootstrap seeds memory
  9. Re-dispatch loop missing — no next cycle trigger — added dispatch step
  10. Ruleset blocking direct push — no admin bypass — updated ruleset
  11. Race condition in safe_outputs patch — concurrent workflow edits — added retry logic
- [ ] src/components/forensics/failure-timeline.tsx — vertical timeline of failures. Each entry is a card with:
  - Colored dot by category: red for workflow, yellow for config, blue for api, purple for race-condition
  - Title as heading, timestamp in muted text
  - "Root Cause" section with description
  - "Resolution" section with description
  - Category badge
- [ ] Timeline section has a heading "11 Fixes Applied During Run 1" with a subtitle "Every failure made the pipeline more robust"
- [ ] Vertical connecting line between failure cards (border-left on a wrapper div)
- [ ] Test that all 11 failure entries render

## Non-Functional Requirements
- All data-dependent pages use Next.js static generation (generateStaticParams or getStaticProps equivalent in App Router) — no client-side data fetching from external APIs
- Dark theme throughout: bg-gray-950 base, gray-100 text, accent colors for interactive elements
- Responsive: works on mobile viewports (min 375px), optimized for desktop (1280px+)
- Accessible: all interactive elements keyboard-navigable, semantic HTML (nav, main, section, article), ARIA labels on buttons and interactive SVG elements
- Framer Motion animations respect prefers-reduced-motion media query
- All components in src/components/ organized by view: simulator/, replay/, forensics/
- TypeScript strict mode with no any types

## Out of Scope
- Live WebSocket updates from GitHub
- User authentication or login
- Database or persistent storage beyond static fixtures
- Editing or triggering pipeline actions from the UI
- Support for multiple pipeline runs (v1 shows only the Code Snippet Manager run)
- Server-side API routes (this is a static/SSG site)
- Deployment automation (Vercel auto-deploys from main, no CI/CD config needed beyond vercel.json)
