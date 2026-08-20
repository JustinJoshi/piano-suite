import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { useWorkshopSync } from "@/hooks/useWorkshopSync";
import {
  resetPracticePageStore,
  setPracticePageStore,
  getPracticePageStore,
  createEmptyPracticePage,
} from "@/lib/custom-practice-storage";
import type { PracticePage } from "@/lib/feature-blocks/types";

let mockCanPersist = true;
let mockRemoteRows: unknown = undefined;

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: vi.fn(() => ({
    canAccess: true,
    canPersist: mockCanPersist,
    isSignedIn: true,
  })),
}));

const upsertMock = vi.fn().mockResolvedValue({ accepted: true });
const deleteMock = vi.fn().mockResolvedValue(null);

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockRemoteRows),
  useMutation: vi.fn((ref: { name: string }) =>
    ref.name === "upsertCustomDrill" ? upsertMock : deleteMock
  ),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    workshop: {
      listCustomDrills: { name: "listCustomDrills" },
      upsertCustomDrill: { name: "upsertCustomDrill" },
      deleteCustomDrill: { name: "deleteCustomDrill" },
    },
  },
}));

const FAST_DEBOUNCE = 30;

function Harness() {
  const status = useWorkshopSync(true, { pushDebounceMs: FAST_DEBOUNCE });
  return <div data-testid="status">{status}</div>;
}

function seedPages(pages: PracticePage[], activePageId?: string) {
  setPracticePageStore({
    version: 2,
    pages,
    activePageId: activePageId ?? pages[0]?.id ?? "",
  });
}

describe("useWorkshopSync", () => {
  beforeEach(() => {
    resetPracticePageStore();
    mockCanPersist = true;
    mockRemoteRows = undefined;
    upsertMock.mockClear();
    deleteMock.mockClear();
  });

  afterEach(() => {
    resetPracticePageStore();
  });

  it("stays local-only when canPersist is false", () => {
    mockCanPersist = false;
    const { getByTestId } = render(<Harness />);
    expect(getByTestId("status").textContent).toBe("local");
  });

  it("merges newer remote pages into the local store", async () => {
    const local = createEmptyPracticePage();
    local.title = "Old title";
    local.updatedAt = 1000;
    seedPages([local]);

    mockRemoteRows = [
      {
        clientPageId: local.id,
        title: "New remote title",
        blocks: [],
        deleted: false,
        updatedAt: 2000,
      },
    ];

    const { getByTestId } = render(<Harness />);

    await waitFor(() => {
      expect(getByTestId("status").textContent).toBe("synced");
    });
    expect(getPracticePageStore().pages[0].title).toBe("New remote title");
  });

  it("drops local pages that are tombstoned remotely", async () => {
    const keep = createEmptyPracticePage("Keep");
    const drop = createEmptyPracticePage("Drop");
    seedPages([keep, drop]);

    mockRemoteRows = [
      {
        clientPageId: drop.id,
        title: "Drop",
        blocks: [],
        deleted: true,
        updatedAt: 5000,
      },
    ];

    render(<Harness />);

    await waitFor(() => {
      expect(getPracticePageStore().pages.map((p) => p.title)).toEqual([
        "Keep",
      ]);
    });
  });

  it("pushes local-only pages to the remote after the pull", async () => {
    const local = createEmptyPracticePage("Local only");
    local.updatedAt = 1000;
    seedPages([local]);

    mockRemoteRows = [];

    render(<Harness />);

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Local only" })
      );
    });
  });

  it("debounces pushes for local edits and deletes removed pages remotely", async () => {
    const page = createEmptyPracticePage("Editable");
    page.updatedAt = 1000;
    seedPages([page]);
    mockRemoteRows = [
      {
        clientPageId: page.id,
        title: "Editable",
        blocks: [],
        deleted: false,
        updatedAt: 1000,
      },
    ];

    const { getByTestId } = render(<Harness />);
    await waitFor(() => {
      expect(getByTestId("status").textContent).toBe("synced");
    });

    // Edit locally.
    act(() => {
      const store = getPracticePageStore();
      setPracticePageStore({
        ...store,
        pages: [{ ...page, title: "Edited", updatedAt: 2000 }],
      });
    });

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Edited" })
      );
    });

    // Delete locally.
    act(() => {
      const store = getPracticePageStore();
      setPracticePageStore({
        ...store,
        pages: store.pages.filter((p) => p.id !== page.id),
      });
    });

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(
        expect.objectContaining({ clientPageId: page.id })
      );
    });
  });

  it("does not re-push unchanged pages", async () => {
    const page = createEmptyPracticePage("Stable");
    page.updatedAt = 1000;
    seedPages([page]);
    mockRemoteRows = [
      {
        clientPageId: page.id,
        title: "Stable",
        blocks: [],
        deleted: false,
        updatedAt: 1000,
      },
    ];

    const { getByTestId } = render(<Harness />);

    await waitFor(() => {
      expect(getByTestId("status").textContent).toBe("synced");
    });
    expect(upsertMock).not.toHaveBeenCalled();

    // Trigger the debounced flush path via an unrelated store write.
    act(() => {
      const store = getPracticePageStore();
      setPracticePageStore({ ...store, activePageId: store.pages[0].id });
    });

    // Wait past the debounce window.
    await new Promise((resolve) => setTimeout(resolve, FAST_DEBOUNCE * 3));

    // Page content unchanged → no upsert.
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
