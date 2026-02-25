import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Timeline } from "@/components/replay/timeline";
import type { PipelineData } from "@/data/types";

// Minimal fixture for testing
const mockData: PipelineData = {
  issues: [
    {
      number: 1,
      title: "Test Issue 1",
      state: "closed",
      createdAt: "2026-02-25T05:45:00Z",
      closedAt: "2026-02-25T06:00:00Z",
      labels: [{ name: "pipeline", color: "blue" }],
    },
    {
      number: 2,
      title: "Test Issue 2",
      state: "closed",
      createdAt: "2026-02-25T06:00:00Z",
      closedAt: "2026-02-25T06:30:00Z",
      labels: [],
    },
  ],
  pullRequests: [
    {
      number: 10,
      title: "PR Alpha",
      state: "merged",
      createdAt: "2026-02-25T06:05:00Z",
      mergedAt: "2026-02-25T06:20:00Z",
      additions: 50,
      deletions: 10,
      changedFiles: 3,
      reviews: [
        {
          author: "github-actions[bot]",
          state: "APPROVED",
          body: "LGTM",
          submittedAt: "2026-02-25T06:15:00Z",
        },
      ],
    },
    {
      number: 11,
      title: "PR Beta",
      state: "merged",
      createdAt: "2026-02-25T06:30:00Z",
      mergedAt: "2026-02-25T06:45:00Z",
      additions: 20,
      deletions: 5,
      changedFiles: 2,
      reviews: [
        {
          author: "github-actions[bot]",
          state: "APPROVED",
          body: "Looks good",
          submittedAt: "2026-02-25T06:40:00Z",
        },
      ],
    },
  ],
  workflowRuns: [],
};

describe("Timeline", () => {
  it("renders the correct number of event dots from fixture data", () => {
    render(<Timeline data={mockData} />);

    // 2 issues + 2 PR opens + 2 PR merges + 2 reviews = 8 events
    // Scope to the timeline region to exclude control buttons
    const region = screen.getByRole("region", { name: /pipeline event timeline/i });
    const dots = within(region).getAllByRole("button");
    expect(dots.length).toBe(8);
  });

  it("renders summary bar with correct counts", () => {
    render(<Timeline data={mockData} />);
    // Should show "2 issues → 2 PRs → 2 reviews → 2 merges"
    const summary = screen.getByText(/2 issues → 2 PRs → 2 reviews → 2 merges/i);
    expect(summary).toBeInTheDocument();
  });

  it("renders the timeline region with aria-label", () => {
    render(<Timeline data={mockData} />);
    expect(
      screen.getByRole("region", { name: /pipeline event timeline/i })
    ).toBeInTheDocument();
  });

  it("toggling the Issues filter hides issue event dots from the timeline", () => {
    render(<Timeline data={mockData} />);

    const region = screen.getByRole("region", { name: /pipeline event timeline/i });

    // Initially all 8 event buttons are visible inside the timeline region
    expect(within(region).getAllByRole("button").length).toBe(8);

    // Click the "Issues" filter toggle button
    const issuesFilter = screen.getByRole("button", { name: /toggle issues/i });
    fireEvent.click(issuesFilter);

    // After toggling Issues off, 2 issue dots removed → 6 event dots remain
    expect(within(region).getAllByRole("button").length).toBe(6);
  });
});
