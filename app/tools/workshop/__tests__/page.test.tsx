import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WorkshopPage from "@/app/tools/workshop/page";

vi.mock("@/components/drills/drill-shell", () => ({
  DrillShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drill-shell">{children}</div>
  ),
}));

vi.mock("@/components/custom-practice/practice-page-editor", () => ({
  PracticePageEditor: () => (
    <div data-testid="practice-page-editor">editor</div>
  ),
}));

// Unsigned visitor: the whole point of the public workshop is that this
// state still renders the editor.
vi.mock("@/hooks/useToolUserReady", () => ({
  useToolUserReady: () => ({
    canAccess: false,
    canPersist: false,
    authDisabled: false,
    isSignedIn: false,
    userReady: false,
  }),
}));

describe("WorkshopPage (anonymous access)", () => {
  it("renders the editor for an unsigned visitor", () => {
    render(<WorkshopPage />);
    expect(
      screen.getByTestId("practice-page-editor")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Sign in to create custom practice pages.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Loading your account…")).not.toBeInTheDocument();
  });
});
