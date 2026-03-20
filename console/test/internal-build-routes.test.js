const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { createDatabase } = require("../lib/db");
const { createBuildSessionStore } = require("../lib/build-session-store");
const { registerInternalBuildRoutes } = require("../routes/internal-build");

async function withServer(db, buildSessionStore, run) {
  const app = express();
  app.use(express.json());
  registerInternalBuildRoutes(app, { buildSessionStore });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  try {
    await run(server);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function makeUrl(server, pathname) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}${pathname}`;
}

let db;
let tmpDir;
let buildSessionStore;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptp-internal-build-"));
  db = createDatabase(tmpDir);
  buildSessionStore = createBuildSessionStore(db);

  db.prepare(
    `INSERT INTO build_sessions (id, status, deploy_url, created_at, updated_at)
     VALUES
     ('complete-build', 'complete', 'https://example.com', '2026-03-20T00:00:00Z', '2026-03-20T00:00:00Z'),
     ('handoff-build', 'handoff_ready', NULL, '2026-03-20T00:00:00Z', '2026-03-20T00:00:00Z')`
  ).run();
});

afterEach(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("handoff_ready callback does not regress a complete session", async () => {
  await withServer(db, buildSessionStore, async (server) => {
    const response = await fetch(makeUrl(server, "/internal/build-callback"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: "complete-build",
        category: "delivery",
        kind: "handoff_ready",
        data: {
          detail: "Late handoff callback",
        },
      }),
    });

    expect(response.status).toBe(200);
  });

  const session = buildSessionStore.getSession("complete-build");
  expect(session.status).toBe("complete");
  expect(session.deploy_url).toBe("https://example.com");
});

test("complete callback upgrades a handoff_ready session", async () => {
  await withServer(db, buildSessionStore, async (server) => {
    const response = await fetch(makeUrl(server, "/internal/build-callback"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: "handoff-build",
        category: "delivery",
        kind: "complete",
        data: {
          deploy_url: "https://validated.example.com",
        },
      }),
    });

    expect(response.status).toBe(200);
  });

  const session = buildSessionStore.getSession("handoff-build");
  expect(session.status).toBe("complete");
  expect(session.deploy_url).toBe("https://validated.example.com");
});
