import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@clerk/nextjs", () => ({
  PricingTable: () => <div data-testid="pricing-table">PricingTable</div>,
  Show: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: () => ({ isSignedIn: false }),
  useAuth: () => ({ isLoaded: true, has: () => false }),
}));

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(async () => undefined),
}));

vi.mock("@/components/app-user-button", () => ({
  AppUserButton: () => null,
}));

import { PricingPage } from "@/components/pricing/pricing-page";

describe("PricingPage", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders marketing hero, Clerk table, and FAQ", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("heading", {
        name: /Practice free\. Pro when you're ready\./i,
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("pricing-table")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(
      screen.getByText(/pop out live Chladni resonance beside Chord Drill/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Can I see resonance while I practice chords\?/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Enter the drill" })
    ).toHaveAttribute("href", "/tools");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });
});
