const fs = require("fs");
const os = require("os");
const path = require("path");

const { createDatabase } = require("../lib/db");
const { createE2EStore } = require("../lib/e2e/store");

let db;
let store;
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptp-e2e-store-"));
  db = createDatabase(tmpDir);
  store = createE2EStore(db);
});

afterEach(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("createRun persists runs and default metadata", () => {
  const run = store.createRun({
    lane: "provision-only",
    metadata: { requestedBy: "jest" },
  });

  expect(run.lane).toBe("provision-only");
  expect(run.status).toBe("queued");
  expect(run.metadata).toEqual({ requestedBy: "jest" });
});

test("appendEvent stores evidence and elapsed time", () => {
  const run = store.createRun({ lane: "decomposer-only" });

  store.appendEvent(run.id, {
    lane: "decomposer-only",
    step: "child-issue",
    status: "passed",
    detail: "Observed child issue.",
    evidence: { issueNumber: 4 },
    elapsedMs: 1200,
  });

  const updated = store.getRun(run.id);
  expect(updated.events).toHaveLength(1);
  expect(updated.events[0]).toEqual(
    expect.objectContaining({
      lane: "decomposer-only",
      step: "child-issue",
      status: "passed",
      evidence: { issueNumber: 4 },
      elapsedMs: 1200,
    })
  );
});

test("updateRun persists artifact refs and cleanup status", () => {
  const run = store.createRun({ lane: "first-pr" });

  store.updateRun(run.id, {
    cleanup_status: "deleted",
    artifact_refs: [{ type: "report_json", path: "/tmp/report.json" }],
  });

  const updated = store.getRun(run.id);
  expect(updated.cleanupStatus).toBe("deleted");
  expect(updated.artifactRefs).toEqual([
    { type: "report_json", path: "/tmp/report.json" },
  ]);
});
