import { Octokit } from "@octokit/rest";
import type { PipelineData, PipelineIssue, PipelinePR, WorkflowRun } from "./types";

const OWNER = "samuelkahessay";
const REPO = "agentic-pipeline";

export async function fetchFromGitHub(): Promise<PipelineData> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const [issuesRes, pullsRes, workflowRunsRes] = await Promise.all([
    octokit.issues.listForRepo({
      owner: OWNER,
      repo: REPO,
      state: "all",
      per_page: 100,
    }),
    octokit.pulls.list({
      owner: OWNER,
      repo: REPO,
      state: "all",
      per_page: 100,
    }),
    octokit.actions.listWorkflowRunsForRepo({
      owner: OWNER,
      repo: REPO,
      per_page: 50,
    }),
  ]);

  const issues: PipelineIssue[] = issuesRes.data
    .filter((i) => !("pull_request" in i))
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state === "open" ? "open" : "closed",
      createdAt: i.created_at,
      closedAt: i.closed_at ?? null,
      labels: (i.labels as Array<{ name?: string; color?: string }>).map((l) => ({
        name: l.name ?? "",
        color: l.color ?? "",
      })),
    }));

  const pullRequests: PipelinePR[] = await Promise.all(
    pullsRes.data.map(async (pr) => {
      const reviewsRes = await octokit.pulls.listReviews({
        owner: OWNER,
        repo: REPO,
        pull_number: pr.number,
      });
      return {
        number: pr.number,
        title: pr.title,
        state: pr.merged_at ? "merged" : pr.state === "open" ? "open" : "closed",
        createdAt: pr.created_at,
        mergedAt: pr.merged_at ?? null,
        additions: pr.additions ?? 0,
        deletions: pr.deletions ?? 0,
        changedFiles: pr.changed_files ?? 0,
        reviews: reviewsRes.data.map((r) => ({
          author: r.user?.login ?? "unknown",
          state: r.state as PipelinePR["reviews"][number]["state"],
          body: r.body ?? "",
          submittedAt: r.submitted_at ?? "",
        })),
      };
    })
  );

  const workflowRuns: WorkflowRun[] = workflowRunsRes.data.workflow_runs.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    status: r.status as WorkflowRun["status"],
    conclusion: (r.conclusion as WorkflowRun["conclusion"]) ?? null,
    createdAt: r.created_at,
    headBranch: r.head_branch ?? "",
    event: r.event,
  }));

  return { issues, pullRequests, workflowRuns };
}
