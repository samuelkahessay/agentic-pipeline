import type { PipelineData } from "./types";
import { fetchFromGitHub } from "./github";
import issuesFixture from "./fixtures/issues.json";
import pullRequestsFixture from "./fixtures/pull-requests.json";
import workflowRunsFixture from "./fixtures/workflow-runs.json";

export async function getPipelineData(): Promise<PipelineData> {
  try {
    const data = await fetchFromGitHub();
    console.log("[getPipelineData] Using GitHub API data");
    return data;
  } catch (err) {
    console.log("[getPipelineData] GitHub fetch failed, using fixture data:", err);
    return {
      issues: issuesFixture as PipelineData["issues"],
      pullRequests: pullRequestsFixture as PipelineData["pullRequests"],
      workflowRuns: workflowRunsFixture as PipelineData["workflowRuns"],
    };
  }
}
