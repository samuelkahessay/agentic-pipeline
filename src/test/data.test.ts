import { describe, it, expect, vi } from "vitest";
import { getPipelineData } from "@/data/index";
import { fetchFromGitHub } from "@/data/github";

vi.mock("@/data/github");

describe("getPipelineData", () => {
  it("returns fixture data when GitHub fetch throws", async () => {
    vi.mocked(fetchFromGitHub).mockRejectedValue(new Error("network error"));
    const data = await getPipelineData();
    expect(data.issues.length).toBeGreaterThan(0);
    expect(data.pullRequests.length).toBeGreaterThan(0);
    expect(data.workflowRuns.length).toBeGreaterThan(0);
  });

  it("returns GitHub data when fetch succeeds", async () => {
    const mockData = {
      issues: [{ number: 1, title: "Test", state: "closed" as const, createdAt: "", closedAt: null, labels: [] }],
      pullRequests: [],
      workflowRuns: [],
    };
    vi.mocked(fetchFromGitHub).mockResolvedValue(mockData);
    const data = await getPipelineData();
    expect(data.issues[0].number).toBe(1);
  });
});

describe("fixture JSON files", () => {
  it("issues.json parses correctly and has expected count", async () => {
    const issues = (await import("@/data/fixtures/issues.json")).default;
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBe(17);
    const pipelineIssues = issues.filter((i: { labels: Array<{ name: string }> }) =>
      i.labels.some((l) => l.name === "pipeline")
    );
    expect(pipelineIssues.length).toBeGreaterThan(0);
  });

  it("pull-requests.json parses correctly and has expected count", async () => {
    const prs = (await import("@/data/fixtures/pull-requests.json")).default;
    expect(Array.isArray(prs)).toBe(true);
    expect(prs.length).toBe(11);
  });

  it("workflow-runs.json parses correctly and has expected count", async () => {
    const runs = (await import("@/data/fixtures/workflow-runs.json")).default;
    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThanOrEqual(15);
  });

  it("fixture issues have required fields", async () => {
    const issues = (await import("@/data/fixtures/issues.json")).default;
    for (const issue of issues) {
      expect(issue).toHaveProperty("number");
      expect(issue).toHaveProperty("title");
      expect(issue).toHaveProperty("state");
      expect(issue).toHaveProperty("createdAt");
      expect(issue).toHaveProperty("labels");
    }
  });
});
