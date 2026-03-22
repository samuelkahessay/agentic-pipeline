function createGitHubSnapshotCollector({ serviceResolver }) {
  return {
    async collect(session) {
      if (!session?.github_repo || !session?.app_installation_id) {
        return emptySnapshot();
      }

      const [owner, repo] = session.github_repo.split("/");
      if (!owner || !repo) {
        return emptySnapshot();
      }

      const { githubClient } = serviceResolver.forSession(session.id);
      const token = await githubClient.getInstallationToken(session.app_installation_id);

      const [
        repoInfo,
        labels,
        secrets,
        variables,
        issues,
        pullRequests,
        workflowRuns,
      ] = await Promise.all([
        githubClient.getRepo(token, owner, repo),
        githubClient.listLabels(token, owner, repo),
        githubClient.listActionsSecrets(token, owner, repo),
        githubClient.listActionsVariables(token, owner, repo),
        githubClient.listIssues(token, owner, repo, { state: "all" }),
        githubClient.listPullRequests(token, owner, repo, { state: "all" }),
        githubClient.listWorkflowRuns(token, owner, repo, { perPage: 30 }),
      ]);

      const issuesOnly = (issues || [])
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          labels: (issue.labels || []).map((label) => label.name),
          html_url: issue.html_url,
        }));

      return {
        repo: repoInfo
          ? {
              fullName: repoInfo.full_name,
              htmlUrl: repoInfo.html_url,
              isPrivate: Boolean(repoInfo.private),
            }
          : null,
        labels: (labels || []).map((label) => label.name).sort(),
        secrets: (secrets || []).map((secret) => secret.name).sort(),
        variables: Object.fromEntries(
          (variables || []).map((variable) => [variable.name, variable.value])
        ),
        pipelineActive:
          variables?.find((variable) => variable.name === "PIPELINE_ACTIVE")?.value ||
          null,
        issues: issuesOnly,
        pullRequests: (pullRequests || []).map((pr) => ({
          number: pr.number,
          title: pr.title,
          state: pr.state,
          html_url: pr.html_url,
        })),
        workflowRuns: (workflowRuns || []).map((run) => ({
          id: run.id,
          name: run.name,
          status: run.status,
          conclusion: run.conclusion,
          html_url: run.html_url,
        })),
      };
    },

    async cleanupRepo(session) {
      if (!session?.github_repo || !session?.app_installation_id) {
        return { cleaned: false, detail: "No provisioned repo to delete." };
      }

      const [owner, repo] = session.github_repo.split("/");
      if (!owner || !repo) {
        return { cleaned: false, detail: "Invalid repo name." };
      }

      const { githubClient } = serviceResolver.forSession(session.id);
      const token = await githubClient.getInstallationToken(session.app_installation_id);
      await githubClient.deleteRepo(token, owner, repo);
      return { cleaned: true, detail: `Deleted ${session.github_repo}.` };
    },
  };
}

function emptySnapshot() {
  return {
    repo: null,
    labels: [],
    secrets: [],
    variables: {},
    pipelineActive: null,
    issues: [],
    pullRequests: [],
    workflowRuns: [],
  };
}

module.exports = {
  createGitHubSnapshotCollector,
};
