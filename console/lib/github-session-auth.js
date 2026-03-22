const { decrypt } = require("./crypto");
const { createGitHubClient } = require("./github-api");

function createGitHubReauthError(returnTo = "/build") {
  const error = new Error("Your GitHub authorization has expired. Please re-authenticate.");
  error.status = 409;
  error.code = "oauth_grant_expired";
  error.action = "re_auth";
  error.returnTo = returnTo;
  return error;
}

function isGitHubAuthFailure(error) {
  const message = error?.message || "";
  return (
    error?.status === 401 ||
    /bad credentials|authorization has expired|oauth[_\s-]*grant|re-authenticate/i.test(message)
  );
}

async function validateSessionGithubAccess(
  session,
  {
    returnTo = "/build",
    githubClient = createGitHubClient(),
  } = {}
) {
  if (!session?.github_access_token) {
    throw createGitHubReauthError(returnTo);
  }

  try {
    const token = decrypt(session.github_access_token);
    await githubClient.getAuthenticatedUser(token);
  } catch (error) {
    if (isGitHubAuthFailure(error)) {
      throw createGitHubReauthError(returnTo);
    }
    throw error;
  }
}

module.exports = {
  createGitHubReauthError,
  isGitHubAuthFailure,
  validateSessionGithubAccess,
};
