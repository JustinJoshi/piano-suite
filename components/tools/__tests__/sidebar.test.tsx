import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";


const useUserMock = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools/chladni",
}));

vi.mock("@/components/app-user-button", () => ({
  AppUserButton: () => <div data-testid="app-user-button" />,
}));

vi.mock("@/components/brand/applied-logo-mark", () => ({
  AppliedLogoMark: () => <div data-testid="piano-suite-mark" />,
}));

vi.mock("@/components/tools/dashboard-nav", () => ({
  useDashboardNav: () => ({ open: false, setOpen: vi.fn() }),
}));

vi.mock("@/hooks/useExperimentalFeatures", () => ({
  useExperimentalFeatures: () => ({ enabled: false, setEnabled: vi.fn() }),
}));

import { Sidebar } from "@/components/tools/sidebar";

afterEach(() => {
  cleanup();
  useUserMock.mockReset();
});

describe("Sidebar account label", () => {
  it("shows Anonymous pianist when the user is not signed in", () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });

    render(<Sidebar />);

    expect(screen.getByText("Anonymous pianist")).toBeInTheDocument();
  });

  it("shows the signed-in user's name when available", () => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        fullName: "Ada Lovelace",
        primaryEmailAddress: { emailAddress: "ada@example.com" },
      },
    });

    render(<Sidebar />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Anonymous pianist")).not.toBeInTheDocument();
  });
});

describe("Sidebar navigation sections", () => {
  beforeEach(() => {
    useUserMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });
    window.localStorage.clear();
  });

  it("leads with the Workshop, not a Welcome item", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Workshop" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Welcome" })
    ).not.toBeInTheDocument();
  });

  it("shows ready-made drills and progress sections", () => {
    render(<Sidebar />);

    expect(screen.getByText("Ready-made drills")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    for (const name of [
      "Chord Drill",
      "Arpeggios",
      "Root Cycling",
      "Progression",
      "Technique",
      "Tracking",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("collapses labs until toggled open", async () => {
    render(<Sidebar />);

    const toggle = screen.getByRole("button", { name: "Labs" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: "Chladni Lab" })
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Chladni Lab" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Logo Lab" })
    ).toBeInTheDocument();
    // Experimental labs stay hidden unless the flag is on.
    expect(
      screen.queryByRole("link", { name: "Multigrid Lab" })
    ).not.toBeInTheDocument();
  });
});
