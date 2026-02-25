export type FailureCategory = "workflow" | "config" | "api" | "race-condition";

export interface Failure {
  id: number;
  timestamp: string;
  title: string;
  rootCause: string;
  resolution: string;
  category: FailureCategory;
}

export const failures: Failure[] = [
  {
    id: 1,
    timestamp: "2026-02-25T05:29:00Z",
    title: "PRD Decomposer first-run failure",
    rootCause: "Wrong trigger configuration caused the workflow to not fire on the expected issue_comment event.",
    resolution: "Fixed trigger syntax to use the correct event type and added missing permissions block.",
    category: "workflow",
  },
  {
    id: 2,
    timestamp: "2026-02-25T05:32:00Z",
    title: "safe_outputs limit exceeded",
    rootCause: "PRD Decomposer tried to create more issues than the safe_outputs tool allows in a single run.",
    resolution: "Increased safe_outputs issue creation limit to accommodate full PRD decomposition.",
    category: "config",
  },
  {
    id: 3,
    timestamp: "2026-02-25T05:50:00Z",
    title: "repo-assist branching from feature branch",
    rootCause: "Agent branched off a stale feature branch instead of main, creating dependency on unmerged changes.",
    resolution: "Added explicit `git checkout main && git pull origin main` before every new branch creation.",
    category: "workflow",
  },
  {
    id: 4,
    timestamp: "2026-02-25T06:00:00Z",
    title: "PR reviewer temperature parameter rejected",
    rootCause: "The models API rejected the `temperature: 0.2` parameter as unsupported for the selected model.",
    resolution: "Removed the temperature parameter from the PR reviewer agent configuration.",
    category: "api",
  },
  {
    id: 5,
    timestamp: "2026-02-25T06:10:00Z",
    title: "MODELS_TOKEN secret not set",
    rootCause: "The PR reviewer workflow required a MODELS_TOKEN secret with models:read scope that was not configured.",
    resolution: "Created a new PAT with models:read scope and added it as the MODELS_TOKEN repository secret.",
    category: "config",
  },
  {
    id: 6,
    timestamp: "2026-02-25T06:20:00Z",
    title: "Auto-merge not enabled on repository",
    rootCause: "Approved PRs could not be auto-merged because the repository setting was disabled by default.",
    resolution: "Enabled `allow_auto_merge` in repository settings to permit squash auto-merge.",
    category: "config",
  },
  {
    id: 7,
    timestamp: "2026-02-25T06:30:00Z",
    title: "Squash merge losing Closes #N reference",
    rootCause: "Squash merge used only the PR title as the commit message, dropping the `Closes #N` in the PR body.",
    resolution: "Updated merge settings to use PR_BODY as the squash commit message, preserving the closing reference.",
    category: "config",
  },
  {
    id: 8,
    timestamp: "2026-02-25T06:40:00Z",
    title: "Memory branch not seeded on first run",
    rootCause: "The repo-assist workflow tried to read from a memory branch that did not yet exist, causing an artifact error.",
    resolution: "Updated bootstrap script to seed the memory branch with an empty state.json before the first run.",
    category: "workflow",
  },
  {
    id: 9,
    timestamp: "2026-02-25T06:50:00Z",
    title: "Re-dispatch loop missing after PR merge",
    rootCause: "After merging a PR, no trigger fired to pick up the next issue, stalling the pipeline.",
    resolution: "Added a workflow_run dispatch step that re-triggers repo-assist whenever a pipeline PR is merged.",
    category: "workflow",
  },
  {
    id: 10,
    timestamp: "2026-02-25T07:00:00Z",
    title: "Ruleset blocking direct push to main",
    rootCause: "A branch protection ruleset required pull request reviews before merging, with no admin bypass configured.",
    resolution: "Updated the ruleset to add a bypass exception for the GitHub Actions bot service account.",
    category: "config",
  },
  {
    id: 11,
    timestamp: "2026-02-25T07:10:00Z",
    title: "Race condition in safe_outputs patch",
    rootCause: "Two concurrent workflow runs attempted to patch the same issue simultaneously, causing one write to fail.",
    resolution: "Added retry logic with exponential backoff to the safe_outputs patch operation.",
    category: "race-condition",
  },
];
