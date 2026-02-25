# PRD: DevCard — Developer Identity Card Generator

## Overview
Build DevCard — a web app that generates beautiful, shareable developer identity
cards from any GitHub username. Enter a username, and DevCard fetches their
profile, repositories, languages, and contribution stats, then renders a
visually striking card with multiple theme options. Cards are shareable via
unique URLs and exportable as PNG images.

This is the third project for the agentic pipeline, and the second using
Next.js + React.

## Tech Stack
- Runtime: Node.js 20+
- Framework: Next.js 14 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Animation: Framer Motion
- Data Fetching: @octokit/rest (server-side and build-time)
- Image Export: html-to-image
- Testing: Vitest + @testing-library/react
- Hosting: Vercel (vercel.json config included)

## Features

### Feature 1: Project Scaffold
Set up the Next.js 14 project with TypeScript, Tailwind CSS, Framer Motion, and
Vitest. Include a root layout with dark theme and a placeholder home page.

**Acceptance Criteria:**
- [ ] package.json with next, react, react-dom, tailwindcss, framer-motion, @octokit/rest, html-to-image, vitest, @testing-library/react, @testing-library/jest-dom
- [ ] tsconfig.json extending next/core-js with strict mode, paths alias "@/*" mapping to "src/*"
- [ ] tailwind.config.ts configured for src/ directory with dark mode "class"
- [ ] src/app/layout.tsx with HTML root, dark class on body, Inter font from next/font, metadata title "DevCard"
- [ ] src/app/page.tsx with placeholder heading "DevCard"
- [ ] src/app/globals.css with Tailwind directives and dark theme CSS variables (bg-gray-950, text-gray-100)
- [ ] next.config.js with images.remotePatterns allowing avatars.githubusercontent.com
- [ ] vercel.json with framework "nextjs"
- [ ] npm scripts: "dev" (next dev), "build" (next build), "start" (next start), "test" (vitest)
- [ ] Test that verifies the home page renders "DevCard"

### Feature 2: GitHub Data Layer & Fixture Data
Fetch GitHub user data via API with fallback to bundled fixture data for
offline development and testing.

**Acceptance Criteria:**
- [ ] src/data/types.ts — TypeScript interfaces:
  - GitHubUser: login, name, avatarUrl, bio, company, location, blog, twitterUsername, publicRepos, followers, following, createdAt
  - GitHubRepo: name, description, language, stargazerCount, forkCount, updatedAt, url, topics (string[])
  - LanguageStat: name, percentage, color (hex string), bytes
  - ContributionStats: totalContributions (number), currentStreak (number), longestStreak (number), contributionsLastYear (number)
  - DevCardData: user (GitHubUser), topRepos (GitHubRepo[]), languages (LanguageStat[]), contributions (ContributionStats)
- [ ] src/data/fixtures/sample-user.json — fixture data for user "octocat" with realistic profile, 6 repos, 5 languages, contribution stats
- [ ] src/data/github.ts — async function fetchGitHubUser(username: string): Promise<DevCardData> that uses @octokit/rest to:
  - Fetch user profile via GET /users/{username}
  - Fetch top 20 repos sorted by stars via GET /users/{username}/repos?sort=stars&per_page=20
  - Compute language breakdown by iterating repos and aggregating languages (use GET /repos/{owner}/{repo}/languages for top 6 repos)
  - Compute contribution stats from the user's public events or return estimated values from profile data
  - Uses GITHUB_TOKEN env var if available for higher rate limits
- [ ] src/data/index.ts — async function getDevCardData(username: string): Promise<DevCardData> that calls fetchGitHubUser(), catches errors, and falls back to fixture data when username is "octocat" or on any API error. Logs which source was used.
- [ ] Unit tests: test that getDevCardData("octocat") returns fixture data when API throws, test that fixture JSON parses correctly and matches DevCardData shape

### Feature 3: Navigation & Landing Page
Shared navigation bar and a landing page with a hero section, username input
form, and example cards.

**Acceptance Criteria:**
- [ ] src/components/nav-bar.tsx — horizontal navigation bar with: "DevCard" logo/text on left (emoji 🃏 + text), links to "/" (Home) and "/gallery" (Gallery) on right. Active link highlighted. Sticky top, dark background (bg-gray-900/80 backdrop-blur), height h-16. Uses next/link.
- [ ] src/app/layout.tsx updated to include NavBar component above all page content
- [ ] src/app/page.tsx — landing page with:
  - Hero section: large title "DevCard", subtitle "Generate beautiful developer identity cards from any GitHub profile", dark gradient background (gray-950 to gray-900)
  - Username input form: text input with "@" prefix icon, placeholder "Enter GitHub username", submit button "Generate Card". Form navigates to /card/[username] on submit.
  - "How it works" section: 3-step horizontal cards — "1. Enter Username" (with search icon), "2. We Fetch Your Data" (with download icon), "3. Get Your Card" (with card icon). Each card has icon, title, subtitle.
  - Example preview section: show the sample "octocat" card rendered at 60% scale with a "Try it →" link to /card/octocat
- [ ] Responsive: hero stacks vertically on mobile, 3-column "how it works" grid on desktop
- [ ] Framer Motion: hero title fades in on mount, step cards stagger in from below
- [ ] Test that landing page renders the username input and the three step cards

### Feature 4: Card Layout — Profile Section
The core DevCard component rendering the user's identity: avatar, name, bio,
and key profile stats.

**Acceptance Criteria:**
- [ ] src/components/card/dev-card.tsx — the main card wrapper component. Accepts DevCardData and theme (string) as props. Renders as a fixed-aspect-ratio card (400×560px at 1x), with rounded-2xl corners, overflow hidden, and a data-card-root attribute for image export targeting
- [ ] Profile section at the top of the card:
  - Circular avatar image (96px, border-2 with theme accent color) loaded via next/image with avatars.githubusercontent.com domain
  - Display name in bold (text-xl), login in muted text below (@username)
  - Bio text truncated to 2 lines (line-clamp-2)
  - Location and company in a single row with icons (map pin, building), muted text
  - Stats row: "X repos", "Y followers", "Z following" in a flex row with dividers
- [ ] Empty/missing field handling: if bio is null, hide bio line. If location is null, hide location. Never render "null" text.
- [ ] Framer Motion: card content staggers in from below when the card first renders (each section 0.1s apart)
- [ ] Test that DevCard renders avatar, name, login, and stats from provided data. Test that null bio doesn't render the bio element.

### Feature 5: Card Layout — Language Breakdown
A visual horizontal bar and legend showing the user's top programming languages.

**Acceptance Criteria:**
- [ ] src/components/card/language-bar.tsx — horizontal stacked bar chart showing top 5 languages as colored segments. Each segment's width is proportional to its percentage. Minimum segment width of 3% so tiny languages are still visible. Bar height 8px, rounded-full.
- [ ] Language colors from src/data/language-colors.ts — a map of language name → hex color for the top 30 GitHub languages (JavaScript: #f1e05a, TypeScript: #3178c6, Python: #3572A5, etc.). Unknown languages default to #8b8b8b.
- [ ] Legend below the bar: language name, colored dot, and percentage rendered in a 2-column grid. Top 5 languages shown, rest aggregated as "Other" with gray dot.
- [ ] If the user has zero repos or no language data, show a muted "No language data" placeholder instead of the bar.
- [ ] Framer Motion: bar segments animate their width from 0 to final width on mount (0.5s stagger)
- [ ] Test that LanguageBar renders the correct number of segments for fixture data. Test that "Other" appears when there are more than 5 languages.

### Feature 6: Card Layout — Top Repositories
A compact list of the user's top repositories shown inside the card.

**Acceptance Criteria:**
- [ ] src/components/card/top-repos.tsx — list of top 3 repositories (by star count) within the card. Each repo entry shows:
  - Repository name as a bold link (text-sm)
  - Description truncated to 1 line (line-clamp-1, text-xs, muted)
  - Language dot + language name, star count (⭐), fork count (🍴) in a flex row (text-xs)
- [ ] If a repo has no description, show just the name and stats row
- [ ] Section heading "Top Repositories" with a subtle separator line above
- [ ] Compact layout: each repo entry is max 48px tall, the section fits within the card
- [ ] If the user has no repos, show "No public repositories" placeholder text
- [ ] Test that TopRepos renders 3 repo entries with correct names from fixture data. Test that empty repos array shows placeholder.

### Feature 7: Card Themes
Multiple visual themes that change the card's color scheme, gradients, and
accent colors.

**Acceptance Criteria:**
- [ ] src/data/themes.ts — array of 6 theme objects, each with: id (string), name (string), background (CSS gradient or solid), textPrimary (hex), textSecondary (hex), accentColor (hex), borderColor (hex). Themes:
  1. "midnight" — deep dark blue gradient (#0f172a → #1e293b), white text, blue accent. DEFAULT.
  2. "aurora" — dark green-to-purple gradient (#064e3b → #312e81), white text, emerald accent
  3. "sunset" — warm dark gradient (#1c1917 → #431407), warm white text, orange accent
  4. "neon" — pure black background, white text, hot pink accent (#ec4899), neon glow border effect
  5. "arctic" — cool light-gray gradient (#f8fafc → #e2e8f0), dark text, sky-blue accent
  6. "mono" — flat dark gray (#18181b), white text, white accent, no gradient
- [ ] src/components/card/dev-card.tsx updated to read the theme prop and apply the matching theme's colors to all card elements: background gradient, text colors, accent colors on avatar border, language bar, stat numbers, and section headings
- [ ] src/components/card/theme-selector.tsx — a row of 6 small circular swatches (24px each) below the card. Each swatch shows the theme's gradient as a preview. Clicking a swatch calls an onChange callback with the theme ID. Active theme has a ring indicator.
- [ ] Theme switch is instantaneous with Framer Motion layoutId transition on the selection ring
- [ ] Test that switching theme to "neon" applies the neon accent color. Test that all 6 theme swatches render.

### Feature 8: Card Generator Page
The /card/[username] page that fetches data, renders the card, and provides
theme selection and export controls.

**Acceptance Criteria:**
- [ ] src/app/card/[username]/page.tsx — dynamic route page that:
  - Receives the username from params
  - Fetches DevCardData server-side via getDevCardData(username)
  - Renders the DevCard component centered on the page
  - Renders ThemeSelector below the card
  - Renders export buttons (Feature 9) below the theme selector
  - Shows a "Share" section with the shareable URL (current page URL)
  - Has a "Generate Another" link back to /
- [ ] Loading state: while data loads, show a card-sized skeleton placeholder with pulsing animation (animate-pulse on gray-800 blocks)
- [ ] Error state: if the username doesn't exist (API returns 404), show a friendly "User not found" message with a link back to home. Use the octocat fixture as a subtle background watermark.
- [ ] Page metadata: dynamic title "DevCard — @{username}", description "Developer identity card for @{username}", Open Graph image pointing to /api/og/[username] (Feature 10)
- [ ] Responsive: card is centered with max-w-md on desktop, full-width with padding on mobile
- [ ] Framer Motion: card and controls fade in together on page load
- [ ] Test that the page renders the card for fixture data. Test that invalid username shows error state.

### Feature 9: Card Export as PNG
Export the rendered card as a downloadable PNG image.

**Acceptance Criteria:**
- [ ] src/lib/export.ts — async function exportCardAsPng(element: HTMLElement): Promise<Blob> that uses html-to-image's toPng or toBlob to render the card element (identified by data-card-root attribute) to a PNG blob at 2x resolution (800×1120px). Handles CORS for avatar images by setting the fetchRequestInit option.
- [ ] src/components/card/export-button.tsx — "Download PNG" button styled with the theme's accent color. On click:
  - Calls exportCardAsPng targeting the [data-card-root] element
  - Creates a temporary download link and triggers download with filename "devcard-{username}.png"
  - Shows a brief "Downloading..." state on the button during export
  - Shows a checkmark (✓) for 2 seconds after successful download
- [ ] "Copy Link" button next to the download button that copies the current page URL to clipboard with a "Copied!" confirmation tooltip (2s duration)
- [ ] Both buttons in a flex row below the theme selector
- [ ] Test that ExportButton renders and is clickable. Test that CopyLink button calls navigator.clipboard.writeText.

### Feature 10: OG Image API Route
A serverless API route that generates an Open Graph image for social media
previews when sharing a DevCard URL.

**Acceptance Criteria:**
- [ ] src/app/api/og/[username]/route.ts — Next.js Route Handler that:
  - Fetches DevCardData for the given username (with fixture fallback)
  - Returns a dynamically generated PNG image using @vercel/og (ImageResponse) with:
    - Card-like layout (1200×630px OG dimensions): avatar on the left, name + login + bio on the right, language bar at bottom, "DevCard" watermark in corner
    - Uses the "midnight" theme colors for consistent branding
  - Sets Cache-Control header: public, max-age=86400, s-maxage=86400 (cache 24 hours)
  - Returns 404 response for unknown usernames (when API and fixture both fail)
- [ ] package.json includes @vercel/og as a dependency
- [ ] The /card/[username] page metadata sets og:image to /api/og/{username}
- [ ] Test that the route handler returns a Response with content-type image/png for a valid username

### Feature 11: Gallery Page
A gallery showcasing pre-generated cards for notable GitHub users, demonstrating
the variety of card outputs.

**Acceptance Criteria:**
- [ ] src/data/gallery-users.ts — array of 8 featured GitHub usernames with display metadata: username, tagline (1 short sentence describing them, e.g., "Creator of Linux"). Users: "torvalds", "gaearon", "sindresorhus", "addyosmani", "kentcdodds", "sarah-edo", "ThePrimeagen", "octocat"
- [ ] src/app/gallery/page.tsx — gallery page that renders a grid of mini DevCards
  - Page heading: "Gallery" with subtitle "Cards generated for notable developers"
  - For each gallery user: fetch DevCardData at build time via getDevCardData(). Each card rendered at 75% scale inside a clickable wrapper that links to /card/{username}
  - Cards grid: 2 columns on mobile, 3 on tablet, 4 on desktop
  - Each card wrapper shows the user's tagline below it
  - If a user's data fails to fetch, skip that card silently
- [ ] Framer Motion: cards stagger in on page load (0.05s apart)
- [ ] Page metadata: title "Gallery — DevCard", description "DevCards for notable developers"
- [ ] Test that the gallery page renders at least one card and the heading

## Non-Functional Requirements
- All statically-determinable pages use Next.js static generation. The /card/[username] route uses dynamic rendering with caching.
- Dark theme throughout: bg-gray-950 base, gray-100 text, accent colors per theme
- Responsive: works on mobile viewports (min 375px), optimized for desktop (1280px+)
- Accessible: all interactive elements keyboard-navigable, semantic HTML, ARIA labels on buttons, alt text on avatar images
- Framer Motion animations respect prefers-reduced-motion media query
- All components in src/components/ organized by concern: card/, nav-bar.tsx
- TypeScript strict mode with no any types
- GitHub API rate limiting: handle 403 rate-limit responses gracefully by falling back to fixtures, show a user-friendly message
- Avatar images optimized via next/image with appropriate sizes attribute

## Out of Scope
- User authentication or saved cards (no database)
- Editing card content manually (data comes from GitHub)
- Private repository data or GitHub GraphQL API
- Real-time updates or WebSocket connections
- Custom card dimensions or layouts beyond the 6 themes
- PDF export (PNG only)
- Deployment automation (Vercel auto-deploys from main)
