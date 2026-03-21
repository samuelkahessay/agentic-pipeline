async function deactivatePipeline(serviceResolver, session) {
  if (
    !serviceResolver ||
    typeof serviceResolver.forSession !== "function" ||
    !session?.id ||
    !session.github_repo ||
    !session.app_installation_id
  ) {
    return;
  }

  try {
    const [owner, repo] = session.github_repo.split("/");
    if (!owner || !repo) {
      return;
    }

    const { githubClient } = serviceResolver.forSession(session.id);
    if (
      !githubClient ||
      typeof githubClient.getInstallationToken !== "function" ||
      typeof githubClient.upsertActionsVariable !== "function"
    ) {
      return;
    }

    const token = await githubClient.getInstallationToken(session.app_installation_id);
    await githubClient.upsertActionsVariable(token, owner, repo, {
      name: "PIPELINE_ACTIVE",
      value: "false",
    });
  } catch (err) {
    console.error("Failed to deactivate pipeline:", err.message);
  }
}

module.exports = { deactivatePipeline };
