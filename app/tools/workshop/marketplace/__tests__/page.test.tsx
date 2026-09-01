import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MarketplacePage from "@/app/tools/workshop/marketplace/page";
import { resetPracticePageStore } from "@/lib/custom-practice-storage";

vi.mock("@/components/drills/drill-shell", () => ({
  DrillShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drill-shell">{children}</div>
  ),
}));

vi.mock("@/components/workshop-marketplace/marketplace", () => ({
  Marketplace: () => <div data-testid="marketplace">marketplace</div>,
}));

vi.mock("@/hooks/useToolUserReady", () => ({
  useToolUserReady: () => ({
    canAccess: false,
    canPersist: false,
    authDisabled: false,
    isSignedIn: false,
    userReady: false,
  }),
}));

describe("WorkshopMarketplacePage (anonymous access)", () => {
  beforeEach(() => {
    resetPracticePageStore();
  });

  it("renders the marketplace for an unsigned visitor", () => {
    render(<MarketplacePage />);
    expect(screen.getByTestId("marketplace")).toBeInTheDocument();
    expect(
      screen.queryByText("Sign in to build your workshop.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Loading your account…")).not.toBeInTheDocument();
  });
});
