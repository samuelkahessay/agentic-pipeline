import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import fixture from "@/data/fixtures/sample-user.json";
import type { DevCardData } from "@/data/types";

vi.mock("@/data", () => ({
  getDevCardData: vi.fn(),
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ children, ...props }: any) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (React as any).createElement(tag, props, children),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getDevCardData } from "@/data";
import GalleryPage from "../page";

const mockGetDevCardData = vi.mocked(getDevCardData);

describe("GalleryPage", () => {
  it("renders the Gallery heading", async () => {
    mockGetDevCardData.mockResolvedValue(fixture as DevCardData);

    const element = await GalleryPage();
    render(element);

    expect(screen.getByText("Gallery")).toBeTruthy();
  });

  it("renders at least one card when fixture data is used", async () => {
    mockGetDevCardData.mockResolvedValue(fixture as DevCardData);

    const element = await GalleryPage();
    render(element);

    // Should have octocat tagline visible
    expect(screen.getByText("GitHub's mascot")).toBeTruthy();
  });
});
