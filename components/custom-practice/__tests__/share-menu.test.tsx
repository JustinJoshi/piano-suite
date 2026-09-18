import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { ShareMenu } from "@/components/custom-practice/share-menu";

const { useAuthAccessMock, publishMock, unpublishMock, useQueryMock } =
  vi.hoisted(() => ({
    useAuthAccessMock: vi.fn(),
    publishMock: vi.fn(),
    unpublishMock: vi.fn(),
    useQueryMock: vi.fn(),
  }));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: useAuthAccessMock,
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => publishMock),
  useQuery: useQueryMock,
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    workshop: {
      publishCustomDrill: {},
      unpublishCustomDrill: {},
      getPublishState: {},
    },
  },
}));

const PROPS = {
  clientPageId: "page-1",
  title: "Warmup",
  blocks: [],
  updatedAt: 1000,
};

function analyticsLog(): Array<{ name: string }> {
  return ((window as unknown as Record<string, unknown>).__analyticsEvents ??
    []) as Array<{ name: string }>;
}

describe("ShareMenu", () => {
  beforeEach(() => {
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;
    useAuthAccessMock.mockReset();
    publishMock.mockReset();
    unpublishMock.mockReset();
    useQueryMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the sign-in prompt with no Pro copy when signed out", () => {
    useAuthAccessMock.mockReturnValue({
      isSignedIn: false,
      canAccess: false,
      canPersist: false,
    });
    useQueryMock.mockReturnValue(undefined);

    render(<ShareMenu {...PROPS} />);

    const signInLink = screen.getByRole("link", { name: "Sign in" });
    expect(signInLink).toHaveAttribute("href", "/sign-in");
    expect(
      screen.getByText(/to publish this page to the community/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /publish to gallery/i })
    ).not.toBeInTheDocument();
  });

  it("renders an enabled publish control for a signed-in non-Pro user", () => {
    useAuthAccessMock.mockReturnValue({
      isSignedIn: true,
      canAccess: true,
      canPersist: false,
    });
    useQueryMock.mockReturnValue({ isPublic: false, drillId: null });

    render(<ShareMenu {...PROPS} />);

    const publishButton = screen.getByRole("button", {
      name: /publish to gallery/i,
    });
    expect(publishButton).toBeEnabled();
    expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pro/i)).not.toBeInTheDocument();
  });

  it("fires exactly one page_published event on a successful publish", async () => {
    useAuthAccessMock.mockReturnValue({
      isSignedIn: true,
      canAccess: true,
      canPersist: false,
    });
    useQueryMock.mockReturnValue({ isPublic: false, drillId: null });
    publishMock.mockResolvedValue({ _id: "drill-1", updatedAt: 2000 });

    render(
      <StrictMode>
        <ShareMenu {...PROPS} />
      </StrictMode>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /publish to gallery/i })
    );

    await waitFor(() => {
      expect(publishMock).toHaveBeenCalledTimes(1);
    });
    expect(publishMock).toHaveBeenCalledWith({
      clientPageId: "page-1",
      title: "Warmup",
      blocks: [],
      updatedAt: 1000,
    });

    await waitFor(() => {
      expect(
        analyticsLog().filter((entry) => entry.name === "page_published")
      ).toHaveLength(1);
    });
  });
});
