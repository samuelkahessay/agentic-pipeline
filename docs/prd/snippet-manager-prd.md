# PRD: Code Snippet Manager

## Overview
Build a code snippet manager — a web app where developers can save, organize,
search, and share code snippets. Features a clean web UI with syntax
highlighting, tag-based organization, and full-text search.

This is the proof-of-concept project for the agentic pipeline.

## Tech Stack
- Runtime: Node.js 20+
- Framework: Express.js
- Language: TypeScript
- Testing: Vitest
- Storage: In-memory (Map)
- Syntax Highlighting: highlight.js (CDN in frontend)
- Templating: Server-rendered HTML (no frontend framework)

## Features

### Feature 1: Project Scaffold
Set up the Express + TypeScript project with static file serving and a health check.

**Acceptance Criteria:**
- [ ] package.json with express, typescript, vitest, tsx, @types/express
- [ ] tsconfig.json targeting ES2022 with strict mode
- [ ] src/app.ts with Express app, JSON body parser, static file serving from public/
- [ ] src/server.ts listening on PORT env var (default 3000)
- [ ] GET /health returns { status: "ok", timestamp: ISO string }
- [ ] public/ directory with placeholder index.html
- [ ] npm scripts: "dev" (tsx watch), "build" (tsc), "test" (vitest)
- [ ] Tests for the health endpoint

### Feature 2: Snippet Data Model & In-Memory Store
Create the data layer for snippets.

**Acceptance Criteria:**
- [ ] src/models/snippet.ts with Snippet interface: { id, title, code, language, description, tags: string[], createdAt, updatedAt }
- [ ] src/store/snippet-store.ts with SnippetStore class using Map<string, Snippet>
- [ ] Methods: create, getById, getAll, update, delete, searchByText, filterByTag, filterByLanguage
- [ ] UUID generation for IDs (use crypto.randomUUID)
- [ ] Timestamps auto-set on create/update
- [ ] Unit tests for all store methods including edge cases

### Feature 3: CRUD API Endpoints
REST API for managing snippets.

**Acceptance Criteria:**
- [ ] POST /api/snippets — create snippet. Body: { title, code, language, description?, tags? }. Returns 201 with snippet. Returns 400 if title or code missing.
- [ ] GET /api/snippets — list all. Supports ?language=X and ?tag=X query filters. Returns { snippets: [...], count: N }
- [ ] GET /api/snippets/:id — get one. Returns snippet or 404.
- [ ] PUT /api/snippets/:id — update. Returns updated snippet or 404. Returns 400 if body empty.
- [ ] DELETE /api/snippets/:id — delete. Returns 204 or 404.
- [ ] All error responses: { error: string }
- [ ] Integration tests for all endpoints and error cases

### Feature 4: Search API
Full-text search across snippet content.

**Acceptance Criteria:**
- [ ] GET /api/snippets/search?q=term — searches title, code, description, tags
- [ ] Case-insensitive matching
- [ ] Returns { snippets: [...], count: N, query: "term" }
- [ ] Returns empty array for no matches (not 404)
- [ ] Returns 400 if q parameter is missing
- [ ] Tests for matching, partial matching, no results, and missing query

### Feature 5: Tag Management API
Endpoints for working with tags.

**Acceptance Criteria:**
- [ ] GET /api/tags — returns all unique tags with snippet counts: { tags: [{ name, count }] }
- [ ] GET /api/tags/:tag/snippets — returns all snippets with that tag
- [ ] Tags are normalized to lowercase, trimmed, duplicates removed on save
- [ ] Tests for tag listing, filtering, and normalization

### Feature 6: Web UI — Snippet List & Dashboard
The main page showing all snippets with filtering.

**Acceptance Criteria:**
- [ ] public/index.html — clean, responsive layout with header, sidebar, main content area
- [ ] public/css/style.css — modern styling (CSS variables for theming, card-based layout, monospace for code)
- [ ] public/js/app.js — client-side JavaScript (no framework)
- [ ] Displays all snippets as cards with: title, language badge, first 4 lines of code preview, tags as chips, relative timestamp
- [ ] Sidebar shows language filter list and tag cloud
- [ ] Clicking a language or tag filters the list (client-side fetch to API)
- [ ] Search bar at top with debounced search (calls /api/snippets/search)
- [ ] "New Snippet" button in header
- [ ] Works on mobile (responsive breakpoints)

### Feature 7: Web UI — Snippet Detail & Create/Edit
View, create, and edit snippet pages.

**Acceptance Criteria:**
- [ ] public/snippet.html — full snippet view page
- [ ] Displays: title, language, full code block with syntax highlighting (highlight.js via CDN), description rendered, tags as clickable chips, created/updated timestamps
- [ ] "Copy Code" button that copies snippet to clipboard
- [ ] "Edit" and "Delete" buttons
- [ ] public/edit.html — create/edit form page
- [ ] Form fields: title (text), language (dropdown with common languages), code (textarea with monospace font and tab support), description (textarea), tags (comma-separated input)
- [ ] Form validates required fields (title, code) client-side before submit
- [ ] Submits to API via fetch, redirects to snippet view on success
- [ ] Works for both create (POST) and edit (PUT) based on URL parameter

### Feature 8: Seed Data & Landing Experience
Pre-populate with example snippets for a polished first impression.

**Acceptance Criteria:**
- [ ] src/seed.ts with 6+ example snippets across different languages (TypeScript, Python, Rust, Go, SQL, Bash)
- [ ] Each seed snippet demonstrates real, useful code (not lorem ipsum)
- [ ] Seeds loaded automatically on server start (before listen)
- [ ] Landing page (index.html) loads with seed data visible immediately
- [ ] Tests verifying seed data loads correctly

## Non-Functional Requirements
- JSON API responses with proper Content-Type headers
- Error format: { error: string }
- No authentication needed
- All code in src/ with clean imports (no circular dependencies)
- Static files served from public/ directory

## Out of Scope
- Database / persistent storage
- Authentication / user accounts
- Deployment / Docker
- Server-side rendering framework (just plain HTML + fetch)
