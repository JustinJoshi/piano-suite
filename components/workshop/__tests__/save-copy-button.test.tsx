import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SaveCopyButton } from "@/components/workshop/save-copy-button";
import {
  resetPracticePageStore,
  getPracticePageStore,
  STORAGE_KEY,
} from "@/lib/custom-practice-storage";

const { pushMock, mutateMock, mockAuth } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  mutateMock: vi.fn(),
  mockAuth: {
    isSignedIn: false,
    authDisabled: false,
    canAccess: false,
    canPersist: false,
    canUseFloatPanel: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => mockAuth,
}));

vi.mock("convex/react", () => ({
  useMutation: () => mutateMock,
}));

const drill = {
  _id: "k7drill123",
  title: "Community Warmup",
  blocks: [
    { id: "src-1", type: "metronome", version: 1, config: { bpm: 90 } },
  ],
  authorName: "Justin",
  blockCount: 1,
  updatedAt: 1,
};

describe("SaveCopyButton", () => {
  beforeEach(() => {
    resetPracticePageStore();
    window.localStorage.clear();
    pushMock.mockClear();
    mutateMock.mockReset();
    mockAuth.isSignedIn = false;
    mockAuth.authDisabled = false;
  });

  afterEach(() => {
    resetPracticePageStore();
    window.localStorage.clear();
  });

  it("unsigned: writes localStorage only — no mutation — and navigates", async () => {
    render(<SaveCopyButton drill={drill as never} />);

    fireEvent.click(screen.getByRole("button", { name: /save a copy/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/tools/workshop");
    });
    expect(mutateMock).not.toHaveBeenCalled();

    const store = getPracticePageStore();
    expect(store.pages.at(-1)?.title).toBe("Community Warmup");
    expect(store.activePageId).toBe(store.pages.at(-1)?.id);
    // Actually persisted, not just in-memory.
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
      "Community Warmup"
    );
  });

  it("signed-in: calls forkCustomDrill and stores the returned clientPageId", async () => {
    mockAuth.isSignedIn = true;
    mutateMock.mockResolvedValue({
      _id: "new-convex-id",
      clientPageId: "convex-page-id",
      title: "Community Warmup",
      blocks: drill.blocks,
      authorName: "Justin",
    });

    render(<SaveCopyButton drill={drill as never} />);
    fireEvent.click(screen.getByRole("button", { name: /save a copy/i }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith({ drillId: drill._id });
    });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/tools/workshop");
    });

    const store = getPracticePageStore();
    expect(store.pages.at(-1)?.id).toBe("convex-page-id");
    expect(store.activePageId).toBe("convex-page-id");
  });

  it("mutation null: shows the gone message, keeps the store, no navigate", async () => {
    mockAuth.isSignedIn = true;
    mutateMock.mockResolvedValue(null);

    const before = getPracticePageStore();
    render(<SaveCopyButton drill={drill as never} />);
    fireEvent.click(screen.getByRole("button", { name: /save a copy/i }));

    await waitFor(() => {
      expect(
        screen.getByText("This page is no longer available.")
      ).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
    expect(getPracticePageStore()).toBe(before);
  });

  it("mutation error: surfaces a retryable message without navigating", async () => {
    mockAuth.isSignedIn = true;
    mutateMock.mockRejectedValue(new Error("network"));

    render(<SaveCopyButton drill={drill as never} />);
    fireEvent.click(screen.getByRole("button", { name: /save a copy/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not save/i)).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
