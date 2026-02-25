import { describe, it, expect } from "vitest";
import { groupIntoCycles } from "@/components/forensics/cycle-card";
import { failures } from "@/data/failures";
import type { PipelinePR, PipelineIssue } from "@/data/types";

function makeIssue(overrides: Partial<PipelineIssue> = {}): PipelineIssue {
  return {
    number: 1,
    title: "Test Issue",
    state: "open",
    createdAt: "2026-02-25T05:00:00Z",
    closedAt: null,
    labels: [{ name: "pipeline", color: "blue" }],
    ...overrides,
  };
}

function makePR(overrides: Partial<PipelinePR> = {}): PipelinePR {
  return {
    number: 1,
    title: "Test PR",
    state: "merged",
    createdAt: "2026-02-25T06:00:00Z",
    mergedAt: "2026-02-25T06:10:00Z",
    additions: 10,
    deletions: 2,
    changedFiles: 1,
    reviews: [],
    ...overrides,
  };
}

describe("groupIntoCycles", () => {
  it("returns empty array for no PRs", () => {
    expect(groupIntoCycles([], [])).toEqual([]);
  });

  it("puts PRs within 5 minutes of each other in the same cycle", () => {
    const prs = [
      makePR({ number: 1, createdAt: "2026-02-25T06:00:00Z" }),
      makePR({ number: 2, createdAt: "2026-02-25T06:03:00Z" }), // 3 min gap → same cycle
      makePR({ number: 3, createdAt: "2026-02-25T06:10:00Z" }), // 7 min gap → new cycle
    ];
    const cycles = groupIntoCycles(prs, []);
    expect(cycles.length).toBe(2);
    expect(cycles[0].prs.length).toBe(2);
    expect(cycles[1].prs.length).toBe(1);
  });

  it("puts PRs more than 5 minutes apart in different cycles", () => {
    const prs = [
      makePR({ number: 1, createdAt: "2026-02-25T06:00:00Z" }),
      makePR({ number: 2, createdAt: "2026-02-25T06:06:00Z" }), // 6 min gap → different cycle
    ];
    const cycles = groupIntoCycles(prs, []);
    expect(cycles.length).toBe(2);
  });

  it("counts issues available at cycle time correctly", () => {
    const issues = [
      makeIssue({
        number: 1,
        createdAt: "2026-02-25T05:00:00Z",
        closedAt: null,
        labels: [{ name: "pipeline", color: "" }],
      }),
      makeIssue({
        number: 2,
        createdAt: "2026-02-25T05:00:00Z",
        closedAt: "2026-02-25T05:30:00Z", // closed before cycle time
        labels: [{ name: "pipeline", color: "" }],
      }),
      makeIssue({
        number: 3,
        createdAt: "2026-02-25T07:00:00Z", // created after cycle time
        closedAt: null,
        labels: [{ name: "pipeline", color: "" }],
      }),
    ];
    const prs = [makePR({ createdAt: "2026-02-25T06:00:00Z" })];
    const cycles = groupIntoCycles(prs, issues);
    // Only issue #1 is available: #2 closed before, #3 not yet created
    expect(cycles[0].issuesAvailable).toBe(1);
  });

  it("assigns cycle numbers starting from 1", () => {
    const prs = [
      makePR({ number: 1, createdAt: "2026-02-25T06:00:00Z" }),
      makePR({ number: 2, createdAt: "2026-02-25T07:00:00Z" }),
    ];
    const cycles = groupIntoCycles(prs, []);
    expect(cycles[0].cycleNumber).toBe(1);
    expect(cycles[1].cycleNumber).toBe(2);
  });
});

describe("failures data", () => {
  it("contains exactly 11 failure entries", () => {
    expect(failures).toHaveLength(11);
  });

  it("all entries have required fields", () => {
    for (const f of failures) {
      expect(f.id).toBeTypeOf("number");
      expect(f.timestamp).toBeTypeOf("string");
      expect(f.title).toBeTypeOf("string");
      expect(f.rootCause).toBeTypeOf("string");
      expect(f.resolution).toBeTypeOf("string");
      expect(["workflow", "config", "api", "race-condition"]).toContain(f.category);
    }
  });

  it("ids are 1 through 11", () => {
    const ids = failures.map((f) => f.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});
