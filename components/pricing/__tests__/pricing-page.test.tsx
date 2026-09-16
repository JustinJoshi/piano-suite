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
import { BILLING_ENABLED } from "@/lib/billing";

describe("PricingPage (pre-launch, BILLING_ENABLED=false)", () => {
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

  it("renders waitlist hero, waitlist CTA, and launch FAQ", () => {
    expect(BILLING_ENABLED).toBe(false);

    render(<PricingPage />);

    expect(
      screen.getByRole("heading", {
        name: /Practice free\. Pro is on the way\./i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pricing-table")).not.toBeInTheDocument();
    expect(screen.getAllByText(/founding pro/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText(/When does Pro launch\?/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Can I cancel anytime\?/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the piano" })
    ).toHaveAttribute("href", "/tools");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });
});
