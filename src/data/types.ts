export interface IssueLabel {
  name: string;
  color: string;
}

export interface PipelineIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
  labels: IssueLabel[];
  body?: string;
}

export interface PipelineReview {
  author: string;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED";
  body: string;
  submittedAt: string;
}

export interface PipelinePR {
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  mergedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviews: PipelineReview[];
  body?: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  status: "completed" | "in_progress" | "queued" | "waiting";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  createdAt: string;
  headBranch: string;
  event: string;
}

export interface PipelineData {
  issues: PipelineIssue[];
  pullRequests: PipelinePR[];
  workflowRuns: WorkflowRun[];
}
