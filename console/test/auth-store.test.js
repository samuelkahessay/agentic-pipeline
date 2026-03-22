const fs = require("fs");
const os = require("os");
const path = require("path");

const { createDatabase } = require("../lib/db");
const {
  createUserSession,
  ensureOAuthGrantForSession,
  getActiveUserSession,
  purgeExpiredAuthState,
  replaceOAuthGrant,
} = require("../lib/auth-store");

let db;
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ptp-auth-store-"));
  db = createDatabase(tmpDir);
  db.prepare(
    `INSERT INTO users (id, github_id, github_login, github_avatar_url, created_at, updated_at)
     VALUES ('u1', 1, 'octocat', '', '2026-03-13T00:00:00Z', '2026-03-13T00:00:00Z')`
  ).run();
});

afterEach(() => {
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("purgeExpiredAuthState removes expired sessions and stale grants", () => {
  createUserSession(db, {
    userId: "u1",
    createdAt: "2026-03-13T00:00:00Z",
    expiresAt: "2026-03-13T00:05:00Z",
    sessionId: "expired-session",
  });
  createUserSession(db, {
    userId: "u1",
    createdAt: "2026-03-13T00:10:00Z",
    expiresAt: "2026-03-13T01:00:00Z",
    sessionId: "active-session",
  });

  db.prepare(
    `INSERT INTO oauth_grants (id, user_id, github_access_token, created_at, consumed_at, expires_at)
     VALUES ('expired-grant', 'u1', 'token-a', '2026-03-13T00:00:00Z', NULL, '2026-03-13T00:05:00Z')`
  ).run();
  db.prepare(
    `INSERT INTO oauth_grants (id, user_id, github_access_token, created_at, consumed_at, expires_at)
     VALUES ('consumed-grant', 'u1', 'token-b', '2026-03-13T00:00:00Z', '2026-03-13T00:01:00Z', '2026-03-13T01:00:00Z')`
  ).run();
  db.prepare(
    `INSERT INTO oauth_grants (id, user_id, github_access_token, created_at, consumed_at, expires_at)
     VALUES ('active-grant', 'u1', 'token-c', '2026-03-13T00:10:00Z', NULL, '2026-03-13T01:00:00Z')`
  ).run();

  const result = purgeExpiredAuthState(db, "2026-03-13T00:30:00Z");

  expect(result.expiredSessions).toBe(1);
  expect(result.staleGrants).toBe(2);
  expect(getActiveUserSession(db, "expired-session", "2026-03-13T00:30:00Z")).toBeUndefined();
  expect(getActiveUserSession(db, "active-session", "2026-03-13T00:30:00Z")).toMatchObject({
    user_id: "u1",
    github_login: "octocat",
  });
  expect(
    db.prepare("SELECT id FROM oauth_grants ORDER BY id").all().map((row) => row.id)
  ).toEqual(["active-grant"]);
});

test("replaceOAuthGrant keeps only the latest grant per user", () => {
  replaceOAuthGrant(db, {
    userId: "u1",
    encryptedAccessToken: "token-a",
    createdAt: "2026-03-13T00:00:00Z",
    expiresAt: "2026-03-13T00:10:00Z",
    grantId: "grant-a",
  });

  replaceOAuthGrant(db, {
    userId: "u1",
    encryptedAccessToken: "token-b",
    createdAt: "2026-03-13T00:01:00Z",
    expiresAt: "2026-03-13T00:11:00Z",
    grantId: "grant-b",
  });

  const grants = db
    .prepare("SELECT id, github_access_token FROM oauth_grants WHERE user_id = 'u1'")
    .all();

  expect(grants).toEqual([{ id: "grant-b", github_access_token: "token-b" }]);
});

test("ensureOAuthGrantForSession remints a grant from the active browser session token", () => {
  createUserSession(db, {
    userId: "u1",
    createdAt: "2026-03-13T00:00:00Z",
    expiresAt: "2026-03-13T02:00:00Z",
    encryptedGithubAccessToken: "encrypted-session-token",
    sessionId: "active-session",
  });

  const grant = ensureOAuthGrantForSession(db, "active-session", {
    now: "2026-03-13T01:00:00Z",
    ttlMs: 15 * 60 * 1000,
  });

  expect(grant).toEqual(
    expect.objectContaining({
      user_id: "u1",
      github_access_token: "encrypted-session-token",
    })
  );

  const stored = db
    .prepare("SELECT github_access_token, expires_at FROM oauth_grants WHERE user_id = 'u1'")
    .get();
  expect(stored.github_access_token).toBe("encrypted-session-token");
  expect(stored.expires_at).toBe("2026-03-13T01:15:00.000Z");
});
