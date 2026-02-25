# Agents Configuration

## Project Overview
This repository is managed by an agentic pipeline. Issues are created from PRDs
by the prd-decomposer workflow, and implemented by the repo-assist workflow.

## Coding Standards
- Write tests for all new functionality (Vitest + @testing-library/react)
- Follow existing naming conventions
- Keep functions small and single-purpose
- Add comments only for non-obvious logic
- Use TypeScript strict mode (no `any` types)
- Components organized by view: src/components/simulator/, replay/, forensics/
- Use Next.js App Router conventions (layout.tsx, page.tsx, loading.tsx)
- Use Framer Motion for animations; respect prefers-reduced-motion
- Use Tailwind CSS for styling; no inline styles or separate CSS files beyond globals.css

## Build & Test
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- Start: `npm start`

## Tech Stack (Active PRD: Pipeline Observatory)
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS (dark theme)
- Animation: Framer Motion
- Data: @octokit/rest (build-time) with static JSON fixture fallback
- Testing: Vitest + @testing-library/react

## PR Requirements
- PR body must include `Closes #N` referencing the source issue
- All tests must pass before requesting review
- PR title should be descriptive (not just the issue title)

## What Agents Should NOT Do
- Modify workflow files (.github/workflows/)
- Change dependency versions without explicit instruction in the issue
- Refactor code outside the scope of the assigned issue
- Add new dependencies without noting them in the PR description
- Merge their own PRs

## Labels
- `feature` — New feature implementation
- `test` — Test coverage
- `infra` — Infrastructure / scaffolding
- `docs` — Documentation
- `bug` — Bug fix
