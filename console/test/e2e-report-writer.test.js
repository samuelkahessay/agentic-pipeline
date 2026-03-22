const fs = require("fs");
const os = require("os");
const path = require("path");

const { createE2EReportWriter } = require("../lib/e2e/report-writer");

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptp-e2e-report-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("writes JSON and markdown reports", () => {
  const writer = createE2EReportWriter({ projectRoot: tmpDir });
  const run = {
    id: "run-1",
    lane: "first-pr",
    activeLane: "first-pr",
    status: "failed",
    failureClass: "first_pr_timeout",
    createdAt: "2026-03-21T12:00:00.000Z",
    startedAt: "2026-03-21T12:00:00.000Z",
    finishedAt: "2026-03-21T12:25:00.000Z",
    buildSessionId: "session-1",
    repoFullName: "octocat/example",
    rootIssueNumber: 1,
    firstPrNumber: null,
    cleanupStatus: "deleted",
    cleanupDetail: "Deleted octocat/example.",
    events: [
      {
        id: 1,
        lane: "first-pr",
        step: "first-pr",
        status: "failed",
        detail: "Timed out waiting for a PR.",
        createdAt: "2026-03-21T12:25:00.000Z",
      },
    ],
  };

  const result = writer.write(run, {
    summary: "Timed out waiting for the first PR.",
    labels: ["pipeline", "feature"],
    secrets: ["OPENAI_API_KEY"],
    variables: { PIPELINE_ACTIVE: "true" },
    issues: [],
    pullRequests: [],
    workflowRuns: [],
  });

  expect(fs.existsSync(result.reportJsonPath)).toBe(true);
  expect(fs.existsSync(result.reportMarkdownPath)).toBe(true);
  expect(JSON.parse(fs.readFileSync(result.reportJsonPath, "utf8")).run.id).toBe("run-1");
  expect(fs.readFileSync(result.reportMarkdownPath, "utf8")).toContain("Timed out waiting for the first PR.");
});
