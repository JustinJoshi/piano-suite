import { describe, it, expect, vi, afterEach } from "vitest";
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

vi.mock("@/components/tools/dashboard-nav", () => ({
  useDashboardNav: () => ({ open: false, setOpen: vi.fn() }),
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
