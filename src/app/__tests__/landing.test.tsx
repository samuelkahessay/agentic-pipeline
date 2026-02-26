import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "../page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Landing page", () => {
  it("renders the username input field", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Enter GitHub username")).toBeInTheDocument();
  });

  it("renders all three how-it-works step titles", () => {
    render(<Home />);
    expect(screen.getByText("Enter Username")).toBeInTheDocument();
    expect(screen.getByText("We Fetch Your Data")).toBeInTheDocument();
    expect(screen.getByText("Get Your Card")).toBeInTheDocument();
  });
});
