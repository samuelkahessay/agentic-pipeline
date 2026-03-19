export interface ShowcaseApp {
  slug: string;
  run: number;
  name: string;
  tag: string;
  techStack: string;
  originalStack: string | null;
  date: string;
  prdPath: string;
  prdUrl: string;
  issueCount: number;
  prCount: number;
  description: string;
  linesAdded?: number;
  filesChanged?: number;
  testsWritten?: number;
  themes?: number;
}

const REPO = "https://github.com/samuelkahessay/prd-to-prod";

// Derived from showcase/*/manifest.json — counts match the arrays in each manifest.
// Curated fields (slug, description, originalStack, extra metrics) are added manually.
export const SHOWCASE_APPS: ShowcaseApp[] = [
  {
    slug: "code-snippets",
    run: 1,
    name: "Code Snippet Manager",
    tag: "v1.0.0",
    techStack: "Express + TypeScript",
    originalStack: null,
    date: "2026-02",
    prdPath: "docs/prd/sample-prd.md",
    prdUrl: `${REPO}/blob/v1.0.0/docs/prd/sample-prd.md`,
    issueCount: 8,
    prCount: 7,
    description: "Save, tag, and search code snippets with full-text search",
  },
  {
    slug: "observatory",
    run: 2,
    name: "Pipeline Observatory",
    tag: "v2.0.0",
    techStack: "Next.js 14 + TypeScript",
    originalStack: null,
    date: "2026-02",
    prdPath: "docs/prd/pipeline-observatory-prd.md",
    prdUrl: `${REPO}/blob/v2.0.0/docs/prd/pipeline-observatory-prd.md`,
    issueCount: 12,
    prCount: 14,
    description: "Interactive pipeline visualizer with timeline replay and forensic inspection",
    testsWritten: 32,
  },
  {
    slug: "devcard",
    run: 3,
    name: "DevCard",
    tag: "v3.0.0",
    techStack: "Next.js 14 + Framer Motion",
    originalStack: null,
    date: "2026-02",
    prdPath: "docs/prd/devcard-prd.md",
    prdUrl: `${REPO}/blob/v3.0.0/docs/prd/devcard-prd.md`,
    issueCount: 18,
    prCount: 28,
    description: "GitHub profile card generator with 6 themes and PNG export",
    themes: 6,
  },
  {
    slug: "ticket-deflection",
    run: 4,
    name: "Ticket Deflection",
    tag: "v4.0.0",
    techStack: "Next.js (showcase)",
    originalStack: "ASP.NET Core + C#",
    date: "2026-02",
    prdPath: "docs/prd/ticket-deflection-prd.md",
    prdUrl: `${REPO}/blob/v4.0.0/docs/prd/ticket-deflection-prd.md`,
    issueCount: 52,
    prCount: 37,
    description: "Support ticket classifier that auto-resolves common issues and escalates complex cases",
    linesAdded: 3987,
    filesChanged: 119,
  },
  {
    slug: "compliance",
    run: 5,
    name: "Compliance Scan Service",
    tag: "v5.0.0",
    techStack: "Next.js (showcase)",
    originalStack: "ASP.NET Core + C#",
    date: "2026-03",
    prdPath: "docs/prd/run-07-compliance-scan-service-prd.md",
    prdUrl: `${REPO}/blob/v5.0.0/docs/prd/run-07-compliance-scan-service-prd.md`,
    issueCount: 8,
    prCount: 8,
    description: "PIPEDA + FINTRAC regulatory scanner with auto-block and human escalation",
  },
];

export function getShowcaseApp(slug: string): ShowcaseApp | undefined {
  return SHOWCASE_APPS.find((app) => app.slug === slug);
}
