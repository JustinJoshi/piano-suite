import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DashboardShell } from "@/components/tools/dashboard-shell";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  prefersReducedMotion: () => false,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    has: () => false,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools/workshop",
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => undefined),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    settings: { getSetting: {}, setSetting: {} },
    logoMark: { getLogoMarkSettings: {} },
  },
}));

vi.mock("@/components/brand/applied-logo-mark", () => ({
  AppliedLogoMark: () => <div data-testid="applied-logo-mark" />,
}));

vi.mock("@/hooks/useExperimentalFeatures", () => ({
  useExperimentalFeatures: () => ({ enabled: false, setEnabled: vi.fn() }),
}));

vi.mock("@/components/app-user-button", () => ({
  AppUserButton: () => <div data-testid="app-user-button" />,
}));

describe("DashboardShell", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/?onboarding=instant");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders the skip link as the first focusable element", () => {
    render(
      <DashboardShell>
        <p>content</p>
      </DashboardShell>
    );

    const skipLink = screen.getByRole("link", { name: /skip to content/i });
    const focusable = document.querySelectorAll(
      "a[href], button, input, select, textarea, [tabindex]"
    );

    expect(focusable[0]).toBe(skipLink);
  });

  it("targets an existing #main-content that can receive focus", () => {
    render(
      <DashboardShell>
        <p>content</p>
      </DashboardShell>
    );

    const skipLink = screen.getByRole("link", { name: /skip to content/i });
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const main = document.getElementById("main-content");
    expect(main).not.toBeNull();
    expect(main?.tagName).toBe("MAIN");
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});

describe("DashboardShell onboarding strip", () => {
  it("renders children and the onboarding strip, but not the overlay, on first visit", () => {
    render(
      <DashboardShell>
        <p>content</p>
      </DashboardShell>
    );

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-shell")).not.toBeInTheDocument();
  });

  it("renders neither the strip nor the overlay once the tour is completed", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    render(
      <DashboardShell>
        <p>content</p>
      </DashboardShell>
    );

    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-shell")).not.toBeInTheDocument();
  });
});
