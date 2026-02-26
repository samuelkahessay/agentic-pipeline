import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DevCard from "../dev-card";
import ThemeSelector from "../theme-selector";
import { THEMES } from "@/data/themes";
import sampleUser from "@/data/fixtures/sample-user.json";
import type { DevCardData } from "@/data/types";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

const fixtureData = sampleUser as DevCardData;

describe("ThemeSelector", () => {
  it("renders all 6 theme swatches", () => {
    const onChange = vi.fn();
    render(<ThemeSelector currentTheme="midnight" onChange={onChange} />);
    THEMES.forEach((theme) => {
      expect(screen.getByRole("button", { name: `Select ${theme.name} theme` })).toBeInTheDocument();
    });
  });

  it("calls onChange with the correct themeId when a swatch is clicked", () => {
    const onChange = vi.fn();
    render(<ThemeSelector currentTheme="midnight" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Select Neon theme" }));
    expect(onChange).toHaveBeenCalledWith("neon");
  });
});

describe("DevCard theming", () => {
  it("applies neon accent color when theme is 'neon'", () => {
    render(<DevCard data={fixtureData} theme="neon" />);
    const card = document.querySelector("[data-card-root]") as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.style.background).toMatch(/^(#000000|rgb\(0,\s*0,\s*0\))$/);
    expect(card.style.boxShadow).toBe("0 0 0 1px #ec4899, 0 0 20px #ec4899");
  });

  it("uses midnight theme by default", () => {
    render(<DevCard data={fixtureData} />);
    const card = document.querySelector("[data-card-root]") as HTMLElement;
    expect(card.style.background).toContain("0f172a");
  });
});
