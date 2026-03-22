const crypto = require("crypto");

function resolveOAuthGrantTtlMs() {
  const parsed = Number.parseInt(process.env.GITHUB_OAUTH_GRANT_TTL_MS || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 60 * 60 * 1000;
}

function purgeExpiredAuthState(db, now = new Date().toISOString()) {
  const runCleanup = db.transaction((timestamp) => {
    const expiredSessions = db
      .prepare("DELETE FROM user_sessions WHERE expires_at <= ?")
      .run(timestamp).changes;
    const staleGrants = db
      .prepare(
        `DELETE FROM oauth_grants
         WHERE consumed_at IS NOT NULL OR expires_at <= ?`
      )
      .run(timestamp).changes;

    return {
      expiredSessions,
      staleGrants,
    };
  });

  return runCleanup(now);
}

function createUserSession(db, {
  userId,
  createdAt,
  expiresAt,
  encryptedGithubAccessToken = null,
  sessionId = crypto.randomUUID(),
}) {
  db.prepare(
    `INSERT INTO user_sessions (id, user_id, github_access_token, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, userId, encryptedGithubAccessToken, createdAt, expiresAt);

  return sessionId;
}

function replaceOAuthGrant(db, {
  userId,
  encryptedAccessToken,
  createdAt,
  expiresAt,
  grantId = crypto.randomUUID(),
}) {
  const runReplace = db.transaction((params) => {
    db.prepare("DELETE FROM oauth_grants WHERE user_id = ?").run(params.userId);
    db.prepare(
      `INSERT INTO oauth_grants (id, user_id, github_access_token, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      params.grantId,
      params.userId,
      params.encryptedAccessToken,
      params.createdAt,
      params.expiresAt
    );
  });

  runReplace({
    grantId,
    userId,
    encryptedAccessToken,
    createdAt,
    expiresAt,
  });

  return grantId;
}

function deleteUserSession(db, sessionId) {
  return db.prepare("DELETE FROM user_sessions WHERE id = ?").run(sessionId).changes;
}

function deleteActiveOAuthGrantsForUser(db, userId) {
  return db
    .prepare(
      `DELETE FROM oauth_grants
       WHERE user_id = ? AND consumed_at IS NULL`
    )
    .run(userId).changes;
}

function getActiveUserSession(db, sessionId, now = new Date().toISOString()) {
  return db
    .prepare(
      `SELECT us.id AS session_id, us.user_id, us.github_access_token, us.expires_at,
              u.github_id, u.github_login, u.github_avatar_url
       FROM user_sessions us
       JOIN users u ON u.id = us.user_id
       WHERE us.id = ? AND us.expires_at > ?`
    )
    .get(sessionId, now);
}

function ensureOAuthGrantForSession(
  db,
  sessionId,
  {
    now = new Date().toISOString(),
    ttlMs = resolveOAuthGrantTtlMs(),
  } = {}
) {
  const session = getActiveUserSession(db, sessionId, now);
  if (!session) {
    return null;
  }

  const existingGrant = db
    .prepare(
      `SELECT *
       FROM oauth_grants
       WHERE user_id = ? AND consumed_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(session.user_id, now);

  if (existingGrant) {
    return existingGrant;
  }

  if (!session.github_access_token) {
    return null;
  }

  const expiresAt = new Date(Date.parse(now) + ttlMs).toISOString();
  replaceOAuthGrant(db, {
    userId: session.user_id,
    encryptedAccessToken: session.github_access_token,
    createdAt: now,
    expiresAt,
  });

  return db
    .prepare(
      `SELECT *
       FROM oauth_grants
       WHERE user_id = ? AND consumed_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(session.user_id, now);
}

function startAuthStateCleanup(db, {
  intervalMs = 5 * 60 * 1000,
  logger = console,
} = {}) {
  const runCleanup = () => {
    try {
      purgeExpiredAuthState(db);
    } catch (error) {
      logger.error("Auth state cleanup failed:", error);
    }
  };

  runCleanup();
  const timer = setInterval(runCleanup, intervalMs);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
  return timer;
}

module.exports = {
  createUserSession,
  deleteActiveOAuthGrantsForUser,
  deleteUserSession,
  ensureOAuthGrantForSession,
  getActiveUserSession,
  purgeExpiredAuthState,
  replaceOAuthGrant,
  resolveOAuthGrantTtlMs,
  startAuthStateCleanup,
};
