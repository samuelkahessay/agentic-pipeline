import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LanguageBar from "../language-bar";
import sampleUser from "@/data/fixtures/sample-user.json";
import type { DevCardData, LanguageStat } from "@/data/types";

const fixtureData = sampleUser as DevCardData;

describe("LanguageBar", () => {
  it("renders correct number of legend items for fixture data (≤5 + possibly Other)", () => {
    render(<LanguageBar languages={fixtureData.languages} />);
    // fixture has 6 languages — top 5 shown + 1 "Other"
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("HTML")).toBeInTheDocument();
    expect(screen.getByText("Ruby")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("shows Other when more than 5 languages are in input", () => {
    render(<LanguageBar languages={fixtureData.languages} />);
    // fixture has 6 languages, so "Other" should appear
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("renders No language data when languages is empty", () => {
    render(<LanguageBar languages={[]} />);
    expect(screen.getByText("No language data")).toBeInTheDocument();
  });

  it("does not show Other when 5 or fewer languages", () => {
    const fiveLangs: LanguageStat[] = fixtureData.languages.slice(0, 5);
    render(<LanguageBar languages={fiveLangs} />);
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });
});
