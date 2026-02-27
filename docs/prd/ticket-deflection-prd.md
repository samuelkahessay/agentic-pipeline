# PRD: Ticket Deflection Service

## Overview
Build a Ticket Deflection Service — an ASP.NET Core 8 API that accepts support
tickets, classifies them by category and severity, matches them against a
knowledge base, and auto-resolves or escalates. A live Razor Pages dashboard
shows pipeline metrics, a ticket feed, and an activity log. A simulation endpoint
generates realistic demo data on demand.

This is the fourth project for the agentic pipeline (prd-to-prod) and the first
using C# / .NET. It proves the pipeline is stack-agnostic beyond TypeScript.

Deployable to Azure App Service. Dashboard accessible via browser with no setup
required.

## Tech Stack
- **Runtime**: .NET 8 / ASP.NET Core 8
- **Language**: C# 12
- **API Style**: Minimal API endpoints (REST/JSON)
- **Dashboard**: Razor Pages with Tailwind CSS (CDN) and Chart.js (CDN) — served from the same project
- **Data**: Entity Framework Core 8 with InMemory provider (no external database)
- **Testing**: xUnit + Microsoft.AspNetCore.Mvc.Testing (integration tests via `WebApplicationFactory<Program>`)
- **NuGet Packages**: `Microsoft.EntityFrameworkCore.InMemory`, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.NET.Test.Sdk`, `xunit`, `xunit.runner.visualstudio`
- **Project Template**: `dotnet new web` (ASP.NET Core Empty)
- **Solution Structure**: Single solution `TicketDeflection.sln` with two projects — `TicketDeflection/TicketDeflection.csproj` (web app) and `TicketDeflection.Tests/TicketDeflection.Tests.csproj` (test project)

## Validation Commands
- Restore: `dotnet restore TicketDeflection.sln`
- Build: `dotnet build TicketDeflection.sln --no-restore -warnaserror`
- Test: `dotnet test TicketDeflection.sln --no-build`
- Run: `dotnet run --project TicketDeflection/TicketDeflection.csproj --urls http://localhost:5000`

## Features

### Feature 1: Scaffold ASP.NET Core 8 Project
Set up the solution structure using `dotnet new web` and `dotnet new xunit`. Configure `Program.cs` with Minimal API routing, Razor Pages, and a health-check endpoint. The project scaffold establishes the folder structure and comment markers that all subsequent features build on.

**Technical Notes:**
- Run: `dotnet new sln -n TicketDeflection`, `dotnet new web -n TicketDeflection`, `dotnet new xunit -n TicketDeflection.Tests`
- `Program.cs` must include `builder.Services.AddRazorPages()` and `app.MapRazorPages()`
- `Program.cs` must include two comment markers for later features to insert code: `// --- Service Registrations ---` (after `var builder = WebApplication.CreateBuilder(args);`) and `// --- Endpoint Mappings ---` (after `var app = builder.Build();`)
- Create empty directories: `Models/`, `Services/`, `DTOs/`, `Endpoints/`, `Data/`, `Pages/`, `wwwroot/js/`, `wwwroot/css/`
- Do NOT create `Views/` or `Controllers/` — this project uses Minimal APIs + Razor Pages, not MVC
- Test project must reference the web project and include a `WebApplicationFactory<Program>` test that hits `/health`
- Add `<InternalsVisibleTo Include="TicketDeflection.Tests" />` to the web project's `.csproj` so tests can access `Program`

**Acceptance Criteria:**
- [ ] `TicketDeflection.sln` exists at repo root with both projects referenced
- [ ] `TicketDeflection/TicketDeflection.csproj` targets `net8.0` with `Microsoft.EntityFrameworkCore.InMemory` NuGet package
- [ ] `TicketDeflection.Tests/TicketDeflection.Tests.csproj` targets `net8.0` with `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.NET.Test.Sdk`, `xunit`, `xunit.runner.visualstudio` NuGet packages and a `<ProjectReference>` to the web project
- [ ] `TicketDeflection/Program.cs` contains `AddRazorPages()`, `MapRazorPages()`, the two comment markers (`// --- Service Registrations ---` and `// --- Endpoint Mappings ---`), and maps `GET /health` returning `{ "status": "healthy", "version": "1.0.0" }` with 200
- [ ] Empty directories exist: `Models/`, `Services/`, `DTOs/`, `Endpoints/`, `Data/`, `Pages/`, `wwwroot/js/`, `wwwroot/css/` (each with a `.gitkeep` file)
- [ ] `TicketDeflection/appsettings.json` exists with default configuration
- [ ] `.gitignore` includes `bin/`, `obj/`, `*.user`, `.vs/`
- [ ] `dotnet build TicketDeflection.sln` exits with code 0 and zero warnings
- [ ] `dotnet test TicketDeflection.sln` passes — at least one test hits `GET /health` via `WebApplicationFactory<Program>` and asserts 200 status code

### Feature 2: Ticket Data Model & EF Core InMemory Store
Define all entity models, enums, and the EF Core DbContext. This feature creates every data type used by the application so that subsequent features never need to define new entities.

**Technical Notes:**
- `TicketDbContext` must be registered in DI with InMemory provider: `builder.Services.AddDbContext<TicketDbContext>(o => o.UseInMemoryDatabase("TicketDb"));`
- Each test should use a unique in-memory DB name (`Guid.NewGuid().ToString()`) for isolation
- All entities use `Guid` for primary keys, auto-generated
- `ActivityLog` entity is essential — it will be consumed by the pipeline orchestrator (Feature 7) and the activity log page (Feature 10)

**Acceptance Criteria:**
- [ ] `TicketDeflection/Models/Enums.cs` defines enums: `TicketCategory` (Bug, FeatureRequest, HowTo, AccountIssue, Other), `TicketSeverity` (Low, Medium, High, Critical), `TicketStatus` (New, Classified, Matched, AutoResolved, Escalated)
- [ ] `TicketDeflection/Models/Ticket.cs` defines entity with properties: `Id` (Guid), `Title` (string), `Description` (string), `Category` (TicketCategory), `Severity` (TicketSeverity), `Status` (TicketStatus), `Resolution` (string?, nullable), `Source` (string), `CreatedAt` (DateTime), `UpdatedAt` (DateTime)
- [ ] `TicketDeflection/Models/KnowledgeArticle.cs` defines entity with properties: `Id` (Guid), `Title` (string), `Content` (string), `Tags` (string, comma-separated), `Category` (TicketCategory)
- [ ] `TicketDeflection/Models/ActivityLog.cs` defines entity with properties: `Id` (Guid), `TicketId` (Guid), `Action` (string), `Details` (string), `Timestamp` (DateTime)
- [ ] `TicketDeflection/Data/TicketDbContext.cs` defines `DbContext` with `DbSet<Ticket>`, `DbSet<KnowledgeArticle>`, `DbSet<ActivityLog>`
- [ ] `TicketDbContext` is registered in `Program.cs` DI container using `UseInMemoryDatabase("TicketDb")` (inserted below the `// --- Service Registrations ---` marker)
- [ ] `dotnet build TicketDeflection.sln` exits with code 0
- [ ] At least one test creates a `TicketDbContext` with a unique in-memory DB name, persists a `Ticket` entity, retrieves it, and asserts all fields match

### Feature 3: Ticket CRUD API Endpoints
Implement five Minimal API endpoints for managing tickets. These are plain CRUD operations — `POST /api/tickets` creates a ticket with status `New` and does NOT auto-classify or trigger any pipeline logic.

**Technical Notes:**
- Use DTOs for request/response — never expose the `Ticket` entity directly
- `POST /api/tickets` sets `Status = TicketStatus.New` and `CreatedAt = DateTime.UtcNow`. It does NOT call any classification service.
- Map endpoints using an extension method in `Endpoints/TicketEndpoints.cs` with `app.MapGroup("/api/tickets")`

**Acceptance Criteria:**
- [ ] `TicketDeflection/DTOs/TicketDtos.cs` defines `CreateTicketRequest` (Title, Description, Source), `UpdateTicketRequest` (Title, Description), and `TicketResponse` (all ticket fields)
- [ ] `TicketDeflection/Endpoints/TicketEndpoints.cs` defines a static `MapTicketEndpoints(this WebApplication app)` extension method registered in `Program.cs` (inserted below `// --- Endpoint Mappings ---` marker)
- [ ] `POST /api/tickets` creates a ticket with `Status = New`, returns 201 with Location header
- [ ] `GET /api/tickets` returns 200 with a list of tickets, supports optional `?status=New&category=Bug` query parameter filtering
- [ ] `GET /api/tickets/{id}` returns 200 with ticket or 404 if not found
- [ ] `PUT /api/tickets/{id}` updates Title/Description, sets `UpdatedAt`, returns 200 or 404
- [ ] `DELETE /api/tickets/{id}` returns 204 or 404
- [ ] `dotnet test TicketDeflection.sln` passes — integration tests via `WebApplicationFactory<Program>` verify all five endpoints with correct status codes

### Feature 4: Ticket Classification Service
Create a standalone classification service that analyzes ticket text and assigns category and severity using keyword rules. Expose a single endpoint to classify an existing ticket. This service does NOT auto-trigger on ticket creation — it is a pure, independently callable service.

**Technical Notes:**
- Register `ClassificationService` in DI as a scoped service
- Keyword matching should be case-insensitive against both title and description
- If no keywords match, default to `Category = Other`, `Severity = Medium`

**Acceptance Criteria:**
- [ ] `TicketDeflection/Services/ClassificationService.cs` defines a class with method `ClassifyTicket(Ticket ticket)` that sets `ticket.Category` and `ticket.Severity` based on keyword rules, and sets `ticket.Status = TicketStatus.Classified`
- [ ] At least 15 keyword-to-category mapping rules defined: e.g. "crash", "error", "broken", "bug", "exception" → Bug; "how do I", "how to", "help with", "guide" → HowTo; "add feature", "request", "wish", "would be nice" → FeatureRequest; "login", "password", "account", "billing", "subscription" → AccountIssue
- [ ] Severity rules: Bug keywords default to High; HowTo to Low; FeatureRequest to Medium; AccountIssue to Medium; no-match defaults to Other/Medium
- [ ] `TicketDeflection/Endpoints/ClassifyEndpoints.cs` defines a static `MapClassifyEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `POST /api/tickets/{id}/classify` looks up the ticket by ID, runs classification, saves changes, returns 200 with updated ticket or 404 if not found
- [ ] `ClassificationService` is registered in DI in `Program.cs` (inserted below `// --- Service Registrations ---` marker)
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify that a ticket with "crash" in the title is classified as Bug/High, a ticket with "how do I" is classified as HowTo/Low, and a ticket with no matching keywords is classified as Other/Medium

### Feature 5: Knowledge Base CRUD & Seed Data
Implement CRUD endpoints for knowledge articles and seed the database with 12+ articles on startup. This provides the knowledge base that the matching service (Feature 6) will search against.

**Technical Notes:**
- Seed data is loaded via a static method called during app startup, not via EF Core migrations
- The seed method should check if articles already exist before inserting (idempotent)
- Map endpoints using `app.MapGroup("/api/knowledge")`

**Acceptance Criteria:**
- [ ] `TicketDeflection/DTOs/KnowledgeDtos.cs` defines `CreateKnowledgeRequest` (Title, Content, Tags, Category) and `KnowledgeResponse` (all fields)
- [ ] `TicketDeflection/Endpoints/KnowledgeEndpoints.cs` defines a static `MapKnowledgeEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `POST /api/knowledge` creates an article, returns 201
- [ ] `GET /api/knowledge` returns 200 with all articles, supports optional `?category=Bug` filtering
- [ ] `GET /api/knowledge/{id}` returns 200 or 404
- [ ] `DELETE /api/knowledge/{id}` returns 204 or 404
- [ ] `TicketDeflection/Data/SeedData.cs` defines a static `Initialize(TicketDbContext context)` method that seeds 12+ articles covering all five `TicketCategory` values: at least 2 Bug articles (e.g. "Common Error Codes", "Crash Recovery Guide"), 2 HowTo articles (e.g. "How to Export Data", "Getting Started Guide"), 2 FeatureRequest articles, 2 AccountIssue articles (e.g. "Password Reset Guide", "Billing FAQ"), 2 Other articles
- [ ] `SeedData.Initialize` is called in `Program.cs` after `app.Build()` using a scoped `TicketDbContext`
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify seed data is loaded (article count >= 12) and articles exist for all categories

### Feature 6: Knowledge Base Matching & Resolution Service
Create a standalone matching service that takes a classified ticket, searches the knowledge base for relevant articles, and determines whether to auto-resolve or escalate. Expose a single endpoint to resolve an existing ticket. This service does NOT auto-trigger after classification — it is a pure, independently callable service.

**Technical Notes:**
- Match scoring: compute keyword overlap between ticket (title + description, split on whitespace) and article (content + tags, split on whitespace/commas). Score = intersection count / union count (Jaccard similarity). Both sides lowercased.
- Configurable threshold via `appsettings.json` under key `MatchingThreshold` (default: 0.3)
- If score >= threshold: set `Status = AutoResolved`, populate `Resolution` with matched article title and snippet
- If score < threshold for all articles: set `Status = Escalated`

**Acceptance Criteria:**
- [ ] `TicketDeflection/Services/MatchingService.cs` defines a class with method `ResolveTicket(Ticket ticket, TicketDbContext context)` that searches all `KnowledgeArticle` records, computes match scores, and sets ticket status to `AutoResolved` (with resolution text) or `Escalated`
- [ ] Match threshold is read from `IConfiguration["MatchingThreshold"]` with default 0.3
- [ ] `TicketDeflection/Endpoints/ResolveEndpoints.cs` defines a static `MapResolveEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `POST /api/tickets/{id}/resolve` looks up the ticket by ID, runs matching, saves changes, returns 200 with JSON containing the updated ticket, matched article(s), and confidence scores — or 404 if ticket not found
- [ ] `MatchingService` is registered in DI in `Program.cs` (inserted below `// --- Service Registrations ---` marker)
- [ ] `appsettings.json` includes `"MatchingThreshold": 0.3`
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify: (1) a ticket about "password reset" matched against seed data scores above threshold and is auto-resolved, (2) a ticket with gibberish description scores below threshold and is escalated

### Feature 7: Ticket Pipeline Orchestrator
Create a pipeline service that chains the full lifecycle: create ticket → classify → match → resolve/escalate. This is the single owner of the complete pipeline chain. It calls `ClassificationService` and `MatchingService` internally and writes `ActivityLog` entries at each stage. `POST /api/tickets/submit` is the primary integration endpoint.

**Technical Notes:**
- `PipelineService` depends on `ClassificationService`, `MatchingService`, and `TicketDbContext` via constructor injection
- Writes `ActivityLog` entries: "Ticket Created", "Ticket Classified as {Category}/{Severity}", "Ticket Matched (score: {score})" or "Ticket Escalated (no match above threshold)", "Ticket Auto-Resolved: {article title}" or "Ticket Escalated: no matching articles"
- This is the ONLY place that chains classify → match. Features 3, 4, 6 are independently callable.

**Acceptance Criteria:**
- [ ] `TicketDeflection/Services/PipelineService.cs` defines a class with method `ProcessTicket(string title, string description, string source, TicketDbContext context)` that: (1) creates a new `Ticket` with `Status = New`, (2) calls `ClassificationService.ClassifyTicket`, (3) calls `MatchingService.ResolveTicket`, (4) writes `ActivityLog` entries for each stage, (5) saves all changes, (6) returns the final ticket and processing results
- [ ] `TicketDeflection/Endpoints/PipelineEndpoints.cs` defines a static `MapPipelineEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `POST /api/tickets/submit` accepts `{ "title": "...", "description": "...", "source": "..." }`, runs the full pipeline, returns 200 with JSON containing the final ticket state, classification details, match results (article title, score), and list of activity log entries
- [ ] Pipeline handles edge cases: empty description (still classifies as Other/Medium), no knowledge matches (escalates)
- [ ] `PipelineService` is registered in DI in `Program.cs` (inserted below `// --- Service Registrations ---` marker)
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify: (1) submitting a ticket about "password reset" results in `AutoResolved` status with activity log entries, (2) submitting a ticket with gibberish results in `Escalated` status, (3) activity log contains at least 3 entries per processed ticket

### Feature 8: Dashboard — Overview Page with Metrics API
Create the main dashboard Razor Page at `/dashboard` with overview metrics and charts. Data is fetched from a dedicated metrics API endpoint. Charts use Chart.js from CDN and the page uses Tailwind CSS from CDN.

**Technical Notes:**
- Razor Page files go in `TicketDeflection/Pages/Dashboard.cshtml` and `Dashboard.cshtml.cs`
- Do NOT create `Views/` or `Controllers/` — this is a Razor Pages project, not MVC
- All chart containers should use `<canvas>` elements with specific IDs so they are structurally verifiable
- Load Chart.js and Tailwind CSS via CDN `<script>` and `<link>` tags in the page head section

**Acceptance Criteria:**
- [ ] `TicketDeflection/Endpoints/MetricsEndpoints.cs` defines a static `MapMetricsEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `GET /api/metrics/overview` returns 200 with JSON: `{ "totalTickets", "byStatus": { "New": N, ... }, "byCategory": { "Bug": N, ... }, "autoResolutionRate": 0.0-1.0 }`
- [ ] `TicketDeflection/Pages/Dashboard.cshtml` exists (NOT `Views/Dashboard.cshtml`) with `@page "/dashboard"` directive
- [ ] Dashboard page includes `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` and `<script src="https://cdn.tailwindcss.com"></script>` (or Tailwind CDN link)
- [ ] Dashboard page contains `<canvas id="statusChart"></canvas>` and `<canvas id="categoryChart"></canvas>` elements for Chart.js
- [ ] Dashboard page contains a `<div id="autoResolutionRate"></div>` element for the resolution rate display
- [ ] Dashboard page includes a `<script>` block or linked JS file that fetches `/api/metrics/overview` and renders charts on page load
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify `GET /api/metrics/overview` returns valid JSON with expected fields

### Feature 9: Dashboard — Ticket Feed & Submit Modal
Add a live ticket feed section and a submit modal to the dashboard page. The feed shows the 20 most recent tickets with status badges. The submit modal creates tickets via the pipeline endpoint.

**Technical Notes:**
- This modifies the existing `Dashboard.cshtml` from Feature 8 — add new HTML sections and JavaScript
- Create or extend `wwwroot/js/dashboard.js` for the JavaScript logic
- All elements use specific IDs and CSS classes for structural verifiability
- Auto-refresh uses `setInterval` with 30-second interval

**Acceptance Criteria:**
- [ ] `TicketDeflection/Pages/Dashboard.cshtml` is updated to include a `<div id="ticketFeed"></div>` section below the charts
- [ ] `TicketDeflection/Pages/Dashboard.cshtml` is updated to include a `<div id="submitModal" class="modal"></div>` element with a form containing inputs for title, description, and source, and a submit button
- [ ] `TicketDeflection/Pages/Dashboard.cshtml` includes a button with `id="openSubmitModal"` that shows the modal
- [ ] `TicketDeflection/wwwroot/js/dashboard.js` exists and contains a `loadFeed()` function that fetches `GET /api/tickets` and renders the 20 most recent tickets into `#ticketFeed` with status-colored badges (green for AutoResolved, red for Escalated, yellow for Classified, gray for New)
- [ ] `dashboard.js` contains a `setInterval(loadFeed, 30000)` call for 30-second auto-refresh
- [ ] `dashboard.js` contains submit handler that posts to `/api/tickets/submit` and calls `loadFeed()` on success
- [ ] Dashboard page includes `<script src="/js/dashboard.js"></script>`
- [ ] `dotnet test TicketDeflection.sln` passes — existing metrics endpoint tests still pass

### Feature 10: Dashboard — Activity Log Page
Create a separate Razor Page at `/activity` showing a chronological timeline of all pipeline activity log entries. Add a paginated API endpoint for activity data.

**Technical Notes:**
- Razor Page files go in `TicketDeflection/Pages/Activity.cshtml` and `Activity.cshtml.cs`
- Extend the existing `MetricsEndpoints.cs` to add the activity endpoint (same file, same extension method)
- Timeline is rendered client-side via JavaScript fetching the activity API

**Acceptance Criteria:**
- [ ] `GET /api/metrics/activity` is added to `MetricsEndpoints.cs`, returns 200 with JSON array of activity log entries sorted by `Timestamp` descending, supports `?limit=50&offset=0` query parameters for pagination
- [ ] `TicketDeflection/Pages/Activity.cshtml` exists (NOT `Views/Activity.cshtml`) with `@page "/activity"` directive
- [ ] Activity page includes `<script src="https://cdn.tailwindcss.com"></script>` (or Tailwind CDN link)
- [ ] Activity page contains a `<div id="activityTimeline"></div>` container element
- [ ] Activity page includes a `<script>` block that fetches `/api/metrics/activity` and renders entries as a vertical timeline with timestamp, action, and details for each entry
- [ ] Activity page contains a `<a href="/dashboard">` link back to the dashboard
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify `GET /api/metrics/activity?limit=10&offset=0` returns valid JSON array

### Feature 11: Bulk Ticket Simulation Endpoint
Create a simulation endpoint that generates N random tickets with realistic content, runs each through the pipeline, and returns aggregate statistics. This lets anyone generate demo data to populate the dashboard.

**Technical Notes:**
- `SimulationService` depends on `PipelineService` for processing each ticket
- Templates should span all categories for realistic distribution
- Response includes aggregate stats so the caller knows what happened without fetching separately

**Acceptance Criteria:**
- [ ] `TicketDeflection/Services/SimulationService.cs` defines a class with an internal array of at least 30 ticket templates, each with a `Title` and `Description` string. Templates span all five `TicketCategory` values with realistic support ticket content (e.g. "App crashes on startup", "How do I export my data?", "Add dark mode support", "Cannot reset my password", "Form submission slow")
- [ ] `SimulationService` has a method `RunSimulation(int count, TicketDbContext context)` that randomly selects `count` templates, processes each through `PipelineService`, and returns aggregate stats: `TotalCreated`, `AutoResolved`, `Escalated`, `AverageConfidenceScore`
- [ ] `TicketDeflection/Endpoints/SimulationEndpoints.cs` defines a static `MapSimulationEndpoints(this WebApplication app)` extension method registered in `Program.cs`
- [ ] `POST /api/simulate?count=25` runs simulation and returns 200 with JSON aggregate stats
- [ ] Default count is 25 if `count` query parameter is omitted; maximum count is capped at 100
- [ ] `SimulationService` is registered in DI in `Program.cs` (inserted below `// --- Service Registrations ---` marker)
- [ ] `dotnet test TicketDeflection.sln` passes — tests verify: (1) simulation with count=5 creates exactly 5 tickets, (2) aggregate stats fields are present and counts sum correctly

### Feature 12: Landing Page
Create a landing page at `/` (the root Razor Page) with project title, architecture diagram, a simulate button, and a link to the dashboard.

**Technical Notes:**
- Razor Page: `TicketDeflection/Pages/Index.cshtml` with `@page` directive (root route)
- Architecture diagram can be ASCII art in a `<pre>` block or an inline SVG — both are structurally verifiable
- The simulate button should POST to `/api/simulate?count=25` via JavaScript and then redirect to `/dashboard`

**Acceptance Criteria:**
- [ ] `TicketDeflection/Pages/Index.cshtml` exists with `@page` directive (serves at `/`)
- [ ] Landing page includes `<script src="https://cdn.tailwindcss.com"></script>` (or Tailwind CDN link)
- [ ] Landing page contains an `<h1>` element with the text "Ticket Deflection Service"
- [ ] Landing page contains a `<pre id="architectureDiagram">` or `<svg id="architectureDiagram">` element showing the pipeline flow (Intake → Classify → Match → Resolve/Escalate)
- [ ] Landing page contains a `<button id="simulateButton">` that triggers a `POST /api/simulate?count=25` call via JavaScript
- [ ] Landing page contains an `<a href="/dashboard">` link to the dashboard
- [ ] Landing page contains an `<a href="/activity">` link to the activity log
- [ ] `dotnet test TicketDeflection.sln` passes — all existing tests continue to pass

### Feature 13: Dockerfile & Production Configuration
Add a multi-stage Dockerfile for containerized deployment and production-specific configuration. Add a README with project overview and run instructions.

**Technical Notes:**
- Multi-stage Dockerfile: `mcr.microsoft.com/dotnet/sdk:8.0` for build stage, `mcr.microsoft.com/dotnet/aspnet:8.0` for runtime stage
- Do NOT include a GitHub Actions workflow — CI/CD requires Azure secrets that the pipeline cannot verify
- `appsettings.Production.json` overrides settings for production (e.g. different matching threshold, logging level)

**Acceptance Criteria:**
- [ ] `Dockerfile` at repo root with multi-stage build: first stage uses `mcr.microsoft.com/dotnet/sdk:8.0` to restore, build, and publish; second stage uses `mcr.microsoft.com/dotnet/aspnet:8.0` as runtime base
- [ ] Dockerfile includes `EXPOSE 8080` and `ENTRYPOINT ["dotnet", "TicketDeflection.dll"]`
- [ ] Dockerfile copies `.csproj` files first for layer caching, then copies source and builds
- [ ] `TicketDeflection/appsettings.Production.json` exists with `"MatchingThreshold": 0.25` and `"Logging": { "LogLevel": { "Default": "Warning" } }`
- [ ] `TicketDeflection/README.md` exists with: project title, one-paragraph description, tech stack list, instructions to build (`dotnet build`), test (`dotnet test`), and run (`dotnet run --project TicketDeflection/TicketDeflection.csproj`), and Docker build/run commands (`docker build -t ticket-deflection .` and `docker run -p 8080:8080 ticket-deflection`)
- [ ] `dotnet test TicketDeflection.sln` passes — all existing tests continue to pass

## Non-Functional Requirements
- All data is stored in EF Core InMemory provider — no external database, no persistent storage between restarts
- No user authentication or login — all endpoints are publicly accessible
- Razor Pages served from the same ASP.NET Core project as the API — single deployable unit
- Tailwind CSS and Chart.js loaded from CDN — no npm, no frontend build step
- All API endpoints return JSON with appropriate HTTP status codes (200, 201, 204, 404)
- All DTOs use records or classes with validation — never expose EF Core entities directly in API responses
- C# nullable reference types enabled (`<Nullable>enable</Nullable>` in `.csproj`)
- All file paths follow the convention: `TicketDeflection/Models/`, `TicketDeflection/Services/`, `TicketDeflection/Endpoints/`, `TicketDeflection/DTOs/`, `TicketDeflection/Data/`, `TicketDeflection/Pages/`

## Out of Scope
- User authentication, authorization, or login
- Persistent storage (no SQL Server, no SQLite, no file-based DB — InMemory only)
- Frontend build toolchain (no npm, no webpack, no Vite)
- CI/CD GitHub Actions workflow (requires Azure secrets — add manually post-run)
- Real-time updates via SignalR or WebSockets (dashboard uses polling)
- ML-based classification (keyword rules only)
- Email notifications or external integrations
- Rate limiting or API throttling
- HTTPS certificate configuration (handled by hosting platform)
- Multi-tenancy or workspace separation
