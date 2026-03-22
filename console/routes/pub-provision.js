const { ensureOAuthGrantForSession, getActiveUserSession } = require("../lib/auth-store");
const { encrypt } = require("../lib/crypto");
const { createAccessCodeStore } = require("../lib/access-codes");
const { createBuildSessionStore } = require("../lib/build-session-store");

const BYOK_CREDENTIALS = [
  { key: "OPENAI_API_KEY", required: true },
  { key: "VERCEL_TOKEN", required: false },
  { key: "VERCEL_ORG_ID", required: false },
  { key: "VERCEL_PROJECT_ID", required: false },
];

function registerProvisionRoutes(app, { db, serviceResolver }) {
  const accessCodes = createAccessCodeStore(db);
  const buildSessionStore = createBuildSessionStore(db);

  // Redeem an access code (binds to user account, not session)
  app.post("/pub/build-session/:id/redeem", (req, res) => {
    const userSession = requireUserSession(db, req, res);
    if (!userSession) return;

    const session = getOwnedBuildSession(db, req.params.id, userSession.user_id);
    if (!session) {
      return res.status(404).json({ error: "Build session not found" });
    }

    if (!enforceSessionBoundary(db, userSession.user_id, session, res)) return;

    if (session.is_demo) {
      return res.status(400).json({ error: "Demo sessions do not require access codes" });
    }

    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Access code is required" });
    }

    const result = accessCodes.redeem(code, userSession.user_id, session.id);
    if (!result.success) {
      const messages = {
        invalid_code: "Invalid access code.",
        already_redeemed: "This code has already been used.",
        expired: "This access code has expired.",
      };
      return res.status(400).json({
        error: "code_invalid",
        message: messages[result.reason] || "Could not redeem code.",
      });
    }

    buildSessionStore.appendEvent(session.id, {
      category: "provision",
      kind: "access_code_redeemed",
      data: {
        detail: "Access code redeemed. This beta session is now entitled to provision one run.",
      },
    });

    res.json({ redeemed: true });
  });
  // Store BYOK credentials for a build session
  app.post("/pub/build-session/:id/credentials", (req, res) => {
    const userSession = requireUserSession(db, req, res);
    if (!userSession) return;

    const session = getOwnedBuildSession(db, req.params.id, userSession.user_id);
    if (!session) {
      return res.status(404).json({ error: "Build session not found" });
    }

    if (!enforceSessionBoundary(db, userSession.user_id, session, res)) return;

    if (session.is_demo) {
      return res.status(400).json({ error: "Demo sessions do not accept credentials" });
    }

    const credentials = req.body;
    if (!credentials || typeof credentials !== "object") {
      return res.status(400).json({ error: "Credentials object required" });
    }

    if (!credentials.OPENAI_API_KEY && typeof credentials.OPENROUTER_API_KEY === "string") {
      credentials.OPENAI_API_KEY = credentials.OPENROUTER_API_KEY;
    }

    if (!credentials.OPENAI_API_KEY || typeof credentials.OPENAI_API_KEY !== "string") {
      return res.status(400).json({ error: "OPENAI_API_KEY is required" });
    }

    for (const { key } of BYOK_CREDENTIALS) {
      const value = credentials[key];
      if (typeof value === "string" && value.length > 0) {
        buildSessionStore.upsertRef(session.id, {
          type: "credential",
          key,
          value: encrypt(value),
        });
      }
    }

    buildSessionStore.appendEvent(session.id, {
      category: "provision",
      kind: "credentials_submitted",
      data: {
        deployConfigured: hasDeployCredentials(db, session.id),
        detail: hasDeployCredentials(db, session.id)
          ? "AI API and Vercel credentials saved. This run can provision and validate deployment."
          : "AI API credentials saved. This run can build and hand off the repo without deployment validation.",
      },
    });

    res.json({ stored: true });
  });
  // Start provisioning — creates repo, waits for app installation, bootstraps target repo
  app.post("/pub/build-session/:id/provision", async (req, res) => {
    const userSession = requireUserSession(db, req, res);
    if (!userSession) {
      return;
    }

    const session = getOwnedBuildSession(db, req.params.id, userSession.user_id);
    if (!session) {
      return res.status(404).json({ error: "Build session not found" });
    }

    if (!enforceSessionBoundary(db, userSession.user_id, session, res)) {
      return;
    }

    if (session.status === "awaiting_install") {
      return res.json({
        sessionId: session.id,
        status: "awaiting_install",
        installRequired: true,
      });
    }

    if (session.status === "bootstrapping") {
      return res.json({
        sessionId: session.id,
        status: "bootstrapping",
        installRequired: false,
      });
    }

    if (session.status === "ready_to_launch") {
      return res.json({
        sessionId: session.id,
        status: "ready_to_launch",
        installRequired: false,
      });
    }

    // Real sessions require a redeemed access code
    if (!session.is_demo && !accessCodes.hasActiveCredit(userSession.user_id, session.id)) {
      return res.status(402).json({
        error: "access_code_required",
        message: "An access code is required to provision a build. Redeem a code first.",
        action: "redeem",
      });
    }

    const parsedOptions = parseProvisionOptions(req.body);
    if (!parsedOptions.ok) {
      return res.status(400).json({ error: parsedOptions.error });
    }

    try {
      if (!session.is_demo) {
        ensureOAuthGrantForSession(db, req.cookies?.build_session);
      }

      const { provisioner } = serviceResolver.forSession(session.id);
      const result = parsedOptions.options
        ? await provisioner.provisionRepo(session.id, parsedOptions.options)
        : await provisioner.provisionRepo(session.id);
      res.json(result);
    } catch (err) {
      console.error("Provisioning error:", err);
      if (err.message.includes("OAuth grant") || err.message.includes("re-authenticate")) {
        return res.status(409).json({
          error: "oauth_grant_expired",
          message: "Your GitHub authorization has expired. Please re-authenticate.",
          action: "re_auth",
          returnTo: `/build/${session.id}`,
        });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // Launch the target-repo pipeline after bootstrap is complete
  app.post("/pub/build-session/:id/start-build", async (req, res) => {
    const userSession = requireUserSession(db, req, res);
    if (!userSession) {
      return;
    }

    const session = getOwnedBuildSession(db, req.params.id, userSession.user_id);
    if (!session) {
      return res.status(404).json({ error: "Build session not found" });
    }

    if (!enforceSessionBoundary(db, userSession.user_id, session, res)) {
      return;
    }

    if (session.status === "ready") {
      return res.status(400).json({
        error: "Repository provisioning has not started yet.",
      });
    }

    if (session.status === "building") {
      return res.json({
        sessionId: session.id,
        status: "building",
      });
    }

    if (session.status === "handoff_ready") {
      return res.json({
        sessionId: session.id,
        status: "handoff_ready",
      });
    }

    if (session.status === "complete") {
      return res.json({
        sessionId: session.id,
        status: "complete",
      });
    }

    if (!session.app_installation_id) {
      return res.status(400).json({
        error: "GitHub App not installed yet. Install the app first.",
      });
    }

    if (!isStartableStatus(session.status)) {
      return res.status(400).json({
        error: `Build session is not startable from status ${session.status}.`,
      });
    }

    // Real sessions require a BYOK AI API key before launch
    if (!session.is_demo) {
      const agentApiKeyRef = db
        .prepare(
          `SELECT 1 FROM build_session_refs
           WHERE build_session_id = ? AND ref_type = 'credential' AND ref_key = 'OPENAI_API_KEY'`
        )
        .get(session.id);
      if (!agentApiKeyRef) {
        return res.status(400).json({
          error: "credentials_required",
          message: "Submit your AI API key before starting the build.",
          action: "byok",
        });
      }
    }

    try {
      const { provisioner, buildRunner } = serviceResolver.forSession(session.id);
      if (session.is_demo) {
        await buildRunner.dispatchBuild(session.id);
      } else {
        const result = await provisioner.launchPipeline(session.id);
        return res.json(result);
      }

      res.json({ sessionId: session.id, status: "building" });
    } catch (err) {
      console.error("Build dispatch error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}

function requireUserSession(db, req, res) {
  const sessionId = req.cookies?.build_session;
  if (!sessionId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  const userSession = getActiveUserSession(db, sessionId);
  if (!userSession) {
    res.status(401).json({ error: "Session expired" });
    return null;
  }

  return userSession;
}

function getOwnedBuildSession(db, buildSessionId, userId) {
  const session = db
    .prepare("SELECT * FROM build_sessions WHERE id = ?")
    .get(buildSessionId);

  if (!session || session.user_id !== userId) {
    return null;
  }

  return session;
}

function isStartableStatus(status) {
  return status === "ready_to_launch" || status === "awaiting_capacity" || status === "stalled";
}

function hasDeployCredentials(db, sessionId) {
  return ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"].every((key) =>
    db.prepare(
      `SELECT 1 FROM build_session_refs
       WHERE build_session_id = ? AND ref_type = 'credential' AND ref_key = ?`
    ).get(sessionId, key)
  );
}

function parseProvisionOptions(body) {
  if (body == null) {
    return { ok: true, options: null };
  }

  if (Array.isArray(body) || typeof body !== "object") {
    return { ok: false, error: "Provision options must be an object." };
  }

  if (body.repoName !== undefined && typeof body.repoName !== "string") {
    return { ok: false, error: "repoName must be a string." };
  }

  const repoName = typeof body.repoName === "string" ? body.repoName.trim() : "";
  if (!repoName) {
    return { ok: true, options: null };
  }

  return {
    ok: true,
    options: {
      repoName,
    },
  };
}

function enforceSessionBoundary(db, userId, session, res) {
  const user = db.prepare("SELECT github_id FROM users WHERE id = ?").get(userId);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return false;
  }
  if (session.is_demo && user.github_id !== 0) {
    res.status(403).json({ error: "Demo sessions require demo authentication" });
    return false;
  }
  if (!session.is_demo && user.github_id === 0) {
    res.status(403).json({ error: "Real sessions require GitHub authentication" });
    return false;
  }
  return true;
}

module.exports = { registerProvisionRoutes, enforceSessionBoundary };
