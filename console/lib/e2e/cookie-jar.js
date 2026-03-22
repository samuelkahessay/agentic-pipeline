const fs = require("fs");
const path = require("path");

function loadCookieJar(cookieJarPath) {
  if (!cookieJarPath || !fs.existsSync(cookieJarPath)) {
    return null;
  }

  const raw = fs.readFileSync(cookieJarPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed?.cookieHeader) {
    return null;
  }
  return parsed;
}

function saveCookieJar(cookieJarPath, payload) {
  if (!cookieJarPath) {
    throw new Error("Cookie jar path is required");
  }

  fs.mkdirSync(path.dirname(cookieJarPath), { recursive: true });
  fs.writeFileSync(cookieJarPath, JSON.stringify(payload, null, 2) + "\n", {
    mode: 0o600,
  });
  fs.chmodSync(cookieJarPath, 0o600);
}

function ensureBuildSessionCookie(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    throw new Error("Missing build_session cookie");
  }

  const parts = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const buildSession = parts.find((part) => part.startsWith("build_session="));
  if (!buildSession) {
    throw new Error("Missing build_session cookie");
  }
  return buildSession;
}

module.exports = {
  ensureBuildSessionCookie,
  loadCookieJar,
  saveCookieJar,
};
