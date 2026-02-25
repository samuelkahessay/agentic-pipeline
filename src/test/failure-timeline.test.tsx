import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FailureTimeline } from "@/components/forensics/failure-timeline";

describe("FailureTimeline", () => {
  it("renders all 11 failure entries in the DOM", () => {
    render(<FailureTimeline />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(11);
  });
});
