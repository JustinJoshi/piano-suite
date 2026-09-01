import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";


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

  it("collapses to exactly four top-level sections", () => {
    render(<Sidebar />);

    // The four sections: Workshop, Shelf, Progress, Settings.
    expect(screen.getByRole("link", { name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shelf" })).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();

    // Retired groupings are gone.
    expect(
      screen.queryByText("Ready-made drills")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Labs" })
    ).not.toBeInTheDocument();
  });

  it("nests guided routes and ready-made drills under the Workshop", () => {
    render(<Sidebar />);

    expect(
      screen.getByRole("link", { name: "Guided routes" })
    ).toBeInTheDocument();
    for (const name of [
      "Chord Drill",
      "Arpeggios",
      "Root Cycling",
      "Progression",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("keeps the progress tools", () => {
    render(<Sidebar />);

    for (const name of ["Technique", "Tracking"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("drops the labs section and Logo Lab", () => {
    render(<Sidebar />);

    expect(
      screen.queryByRole("button", { name: "Labs" })
    ).not.toBeInTheDocument();
    for (const name of [
      "Chladni Lab",
      "Chladni Ripple",
      "Julia Lab",
      "Lissajous Lab",
      "Quasiperiodic Lab",
      "Multigrid Lab",
      "Logo Lab",
    ]) {
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    }
  });

  it("links the single settings page", () => {
    render(<Sidebar />);

    expect(
      screen.getByRole("link", { name: "Settings" })
    ).toHaveAttribute("href", "/settings");
    for (const name of ["Theme", "Atmosphere", "Billing"]) {
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    }
  });
});
