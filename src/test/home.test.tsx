import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "@/app/page";
import { getPipelineData } from "@/data/index";

vi.mock("@/data/index");

const mockData = {
  issues: [
    {
      number: 1,
      title: "Feature A",
      state: "closed" as const,
      createdAt: "",
      closedAt: "2026-01-01",
      labels: [{ name: "feature", color: "green" }],
    },
  ],
  pullRequests: [
    {
      number: 1,
      title: "PR A",
      state: "merged" as const,
      createdAt: "",
      mergedAt: "2026-01-02",
      additions: 10,
      deletions: 2,
      changedFiles: 1,
      reviews: [],
    },
  ],
  workflowRuns: [],
};

describe("Home page", () => {
  it("renders Pipeline Observatory heading", async () => {
    vi.mocked(getPipelineData).mockResolvedValue(mockData);
    render(await Home());
    expect(screen.getByRole("heading", { name: /pipeline observatory/i, level: 1 })).toBeInTheDocument();
  });

  it("renders three view cards with correct hrefs", async () => {
    vi.mocked(getPipelineData).mockResolvedValue(mockData);
    render(await Home());
    const simulatorLink = screen.getByRole("link", { name: /simulator/i });
    const replayLink = screen.getByRole("link", { name: /replay/i });
    const forensicsLink = screen.getByRole("link", { name: /forensics/i });
    expect(simulatorLink).toHaveAttribute("href", "/simulator");
    expect(replayLink).toHaveAttribute("href", "/replay");
    expect(forensicsLink).toHaveAttribute("href", "/forensics");
  });
});

