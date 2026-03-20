const fs = require("fs");
const os = require("os");
const path = require("path");

const { createDatabase } = require("../lib/db");
const { createBuildSessionStore } = require("../lib/build-session-store");
const { createProvisioner } = require("../lib/provisioner");

let db;
let tmpDir;
let buildSessionStore;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptp-provisioner-launch-"));
  db = createDatabase(tmpDir);
  buildSessionStore = createBuildSessionStore(db);

  db.prepare(
    `INSERT INTO build_sessions
       (id, status, github_repo, app_installation_id, prd_final, created_at, updated_at)
     VALUES
       ('build-1', 'ready_to_launch', 'octocat/customer-portal', 99, '# PRD: Customer portal', '2026-03-20T00:00:00Z', '2026-03-20T00:00:00Z')`
  ).run();
});

afterEach(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("launchPipeline avoids duplicate root issues and dispatches under concurrent starts", async () => {
  const githubClient = {
    getInstallationToken: jest.fn().mockResolvedValue("installation-token"),
    createIssue: jest.fn().mockResolvedValue({
      number: 17,
      html_url: "https://github.com/octocat/customer-portal/issues/17",
      title: "[Pipeline] Customer portal",
    }),
    dispatchWorkflow: jest.fn().mockResolvedValue(undefined),
  };

  const provisioner = createProvisioner({
    db,
    buildSessionStore,
    githubClient,
  });

  const [first, second] = await Promise.all([
    provisioner.launchPipeline("build-1"),
    provisioner.launchPipeline("build-1"),
  ]);

  expect([first.status, second.status]).toEqual(["building", "building"]);
  expect(
    [first.rootIssueNumber, second.rootIssueNumber].filter((value) => value === 17)
  ).toHaveLength(1);
  expect(githubClient.createIssue).toHaveBeenCalledTimes(1);
  expect(githubClient.dispatchWorkflow).toHaveBeenCalledTimes(1);
});
