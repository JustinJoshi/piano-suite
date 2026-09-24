import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createEmptyPracticePage,
  createEmptyPracticePageStore,
  getPracticePageStore,
  getServerPracticePageStore,
  setPracticePageStore,
  resetPracticePageStore,
  getActivePage,
  setActivePageId,
  upsertPracticePage,
  deletePracticePage,
  duplicatePracticePage,
  createPracticePageInStore,
  createPracticePageInStoreWithEvent,
  isStarterPage,
  appendBlockToPage,
  appendBlockToPageWithEvent,
  removeFirstBlockOfType,
  forkPageIntoStore,
  forkPageIntoStoreWithEvent,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "@/lib/custom-practice-storage";
import type { PracticePageStore } from "@/lib/custom-practice-storage";
import type { PracticePage } from "@/lib/feature-blocks/types";

function makePage(overrides: Partial<ReturnType<typeof createEmptyPracticePage>> = {}) {
  return { ...createEmptyPracticePage(), ...overrides };
}

describe("custom-practice-storage", () => {
  beforeEach(() => {
    resetPracticePageStore();
    window.localStorage.clear();
  });

  afterEach(() => {
    resetPracticePageStore();
    window.localStorage.clear();
  });

  it("creates a fresh store with one empty page when nothing is stored", () => {
    const store = getPracticePageStore();

    expect(store.version).toBe(2);
    expect(store.pages).toHaveLength(1);
    expect(store.activePageId).toBe(store.pages[0].id);
  });

  it("seeds the fresh page with the ready-made drills starter tile", () => {
    const store = createEmptyPracticePageStore();

    expect(store.pages[0].blocks).toHaveLength(1);
    expect(store.pages[0].blocks[0].type).toBe("drillShortcuts");
  });

  it("treats starter-only and empty pages as starter pages, not built pages", () => {
    const starter = createEmptyPracticePageStore().pages[0];
    expect(isStarterPage(starter)).toBe(true);
    expect(isStarterPage(createEmptyPracticePage())).toBe(true);

    const built = createEmptyPracticePage();
    built.blocks.push({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
    });
    expect(isStarterPage(built)).toBe(false);
  });

  it("loads a valid v2 store from localStorage", () => {
    const page = makePage({ id: "page-a", title: "Scales" });
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, pages: [page], activePageId: "page-a" })
    );

    const store = getPracticePageStore();
    expect(store.pages[0].title).toBe("Scales");
    expect(store.activePageId).toBe("page-a");
  });

  it("migrates a legacy v1 single page into a v2 store", () => {
    const legacy = makePage({ id: "default", title: "My Practice Page" });
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacy));

    const store = getPracticePageStore();
    expect(store.version).toBe(2);
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].id).toBe("default");
    expect(store.pages[0].title).toBe("My Practice Page");
    expect(store.activePageId).toBe("default");
  });

  it("falls back to a fresh store when v1 data is corrupt", () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, "{not json");

    const store = getPracticePageStore();
    expect(store.version).toBe(2);
    expect(store.pages).toHaveLength(1);
  });

  it("falls back to a fresh store when v2 data is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
  });

  it("repairs a stale activePageId by falling back to the first page", () => {
    const a = makePage({ id: "page-a" });
    const b = makePage({ id: "page-b" });
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, pages: [a, b], activePageId: "gone" })
    );

    const store = getPracticePageStore();
    expect(store.activePageId).toBe("page-a");
    expect(getActivePage(store).id).toBe("page-a");
  });

  it("persists the store to localStorage on set", () => {
    const page = makePage({ id: "page-a", title: "Persisted" });
    setPracticePageStore({ version: 2, pages: [page], activePageId: "page-a" });

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).pages[0].title).toBe("Persisted");
  });

  describe("page operations", () => {
    it("upsertPracticePage updates an existing page and bumps updatedAt", () => {
      const page = makePage({ id: "page-a", updatedAt: 1000 });
      const store = createEmptyPracticePageStore();
      const withPage = setActivePageId(
        upsertPracticePage(store, page),
        "page-a"
      );

      const updated = upsertPracticePage(withPage, {
        ...page,
        title: "Renamed",
      });

      expect(updated.pages).toHaveLength(2); // fresh-store page + page-a
      expect(updated.pages.find((p) => p.id === "page-a")?.title).toBe(
        "Renamed"
      );
      expect(
        (updated.pages.find((p) => p.id === "page-a")?.updatedAt ?? 0) > 1000
      ).toBe(true);
      expect(updated.activePageId).toBe("page-a");
    });

    it("deletePracticePage removes the page and re-targets the active page", () => {
      const a = makePage({ id: "page-a" });
      const b = makePage({ id: "page-b" });
      const store: PracticePageStore = { version: 2, pages: [a, b], activePageId: "page-b" };

      const next = deletePracticePage(store, "page-b");
      expect(next.pages.map((p) => p.id)).toEqual(["page-a"]);
      expect(next.activePageId).toBe("page-a");
    });

    it("deletePracticePage never leaves the store empty", () => {
      const a = makePage({ id: "page-a" });
      const store: PracticePageStore = { version: 2, pages: [a], activePageId: "page-a" };

      const next = deletePracticePage(store, "page-a");
      expect(next.pages).toHaveLength(1);
      expect(next.pages[0].id).not.toBe("page-a");
      expect(next.activePageId).toBe(next.pages[0].id);
    });

    it("duplicatePracticePage copies with fresh ids and a unique title", () => {
      const a = makePage({
        id: "page-a",
        title: "Warmup",
        blocks: [
          { id: "block-1", type: "metronome", version: 1, config: { bpm: 90 } },
        ],
      });
      const store: PracticePageStore = { version: 2, pages: [a], activePageId: "page-a" };

      const next = duplicatePracticePage(store, "page-a");
      expect(next.pages).toHaveLength(2);
      expect(next.pages[1].title).toBe("Warmup (copy)");
      expect(next.pages[1].id).not.toBe("page-a");
      expect(next.pages[1].blocks[0].id).not.toBe("block-1");
      expect(next.pages[1].blocks[0].config).toEqual({ bpm: 90 });
      expect(next.activePageId).toBe(next.pages[1].id);
    });

    it("duplicatePracticePage de-duplicates repeated copy titles", () => {
      const a = makePage({ id: "page-a", title: "Warmup" });
      const b = makePage({ id: "page-b", title: "Warmup (copy)" });
      const store: PracticePageStore = { version: 2, pages: [a, b], activePageId: "page-a" };

      const next = duplicatePracticePage(store, "page-a");
      expect(next.pages[1].title).toBe("Warmup (copy) 2");
    });

    it("createPracticePageInStore appends a new page with a unique title", () => {
      const a = makePage({ id: "page-a", title: "My Practice Page" });
      const store: PracticePageStore = { version: 2, pages: [a], activePageId: "page-a" };

      const next = createPracticePageInStore(store);
      expect(next.pages).toHaveLength(2);
      expect(next.pages[1].title).toBe("My Practice Page 2");
      expect(next.activePageId).toBe(next.pages[1].id);
    });

    it("setActivePageId ignores unknown ids", () => {
      const a = makePage({ id: "page-a" });
      const store: PracticePageStore = { version: 2, pages: [a], activePageId: "page-a" };

      expect(setActivePageId(store, "nope")).toBe(store);
      expect(setActivePageId(store, "page-a").activePageId).toBe("page-a");
    });
  });
});

describe("marketplace block helpers", () => {
  it("appendBlockToPage appends a configured block of the given type", () => {
    const page = createEmptyPracticePage("P");
    const next = appendBlockToPage(page, "metronome");

    expect(next.blocks).toHaveLength(1);
    expect(next.blocks[0].type).toBe("metronome");
    expect(next.blocks[0].id).not.toBe("");
    expect(Object.keys(next.blocks[0].config).length).toBeGreaterThan(0);
  });

  it("appendBlockToPage rejects unknown types", () => {
    const page = createEmptyPracticePage("P");
    expect(appendBlockToPage(page, "not-a-block")).toBe(page);
  });

  it("removeFirstBlockOfType removes only the first instance", () => {
    const page: PracticePage = {
      ...createEmptyPracticePage("P"),
      blocks: [
        { id: "a", type: "metronome", version: 1, config: {} },
        { id: "b", type: "textBlock", version: 1, config: {} },
        { id: "c", type: "metronome", version: 1, config: {} },
      ],
    };

    const next = removeFirstBlockOfType(page, "metronome");
    expect(next.blocks.map((b) => b.id)).toEqual(["b", "c"]);
  });

  it("removeFirstBlockOfType is a no-op when the type is absent", () => {
    const page: PracticePage = {
      ...createEmptyPracticePage("P"),
      blocks: [{ id: "b", type: "textBlock", version: 1, config: {} }],
    };
    expect(removeFirstBlockOfType(page, "metronome")).toBe(page);
  });
});

describe("forkPageIntoStore", () => {
  it("copies a page with fresh ids, a fork suffix, and makes it active", () => {
    const store = createEmptyPracticePageStore();
    const before = store.pages.map((p) => p.id);

    const next = forkPageIntoStore(store, {
      title: "Five-minute warm-up",
      blocks: [
        { id: "source-1", type: "metronome", version: 1, config: { bpm: 60 } },
      ],
    });

    expect(next.pages).toHaveLength(2);
    const forked = next.pages[1];
    expect(forked.title).toBe("Five-minute warm-up (fork)");
    expect(forked.blocks[0].type).toBe("metronome");
    expect(forked.blocks[0].id).not.toBe("source-1");
    expect(next.activePageId).toBe(forked.id);
    expect(before).toContain(store.pages[0].id);
  });

  it("can link the fork to a Convex row id for later sync", () => {
    const store = createEmptyPracticePageStore();

    const next = forkPageIntoStore(
      store,
      { title: "P", blocks: [{ id: "s", type: "textBlock", version: 1, config: { text: "hi" } }] },
      "convex-client-page-id"
    );

    expect(next.pages[1].id).toBe("convex-client-page-id");
  });

  it("sanitizes untrusted blocks: unknown types dropped, configs clamped", () => {
    const store = createEmptyPracticePageStore();

    const next = forkPageIntoStore(store, {
      title: "Malicious page",
      blocks: [
        { id: "ok", type: "drillTimer", version: 1, config: { countdownSeconds: 999 } },
        { id: "bad", type: "evilBlock", version: 1, config: { anything: true } },
        { id: "worse", type: "metronome", version: 1, config: "<script>" },
        "not even a block",
      ],
    });

    const forked = next.pages[1];
    expect(forked.blocks.map((b) => b.type)).toEqual(["drillTimer", "metronome"]);
    expect(forked.blocks[0].config.countdownSeconds).toBe(30);
  });

  it("returns the store unchanged when no block survives sanitization", () => {
    const store = createEmptyPracticePageStore();

    const next = forkPageIntoStore(store, {
      title: "Empty",
      blocks: [{ id: "x", type: "nope", version: 1, config: {} }],
    });

    expect(next).toBe(store);
  });

  it("de-duplicates fork titles when forking the same page twice", () => {
    const store = createEmptyPracticePageStore();
    const source = {
      title: "Warm-up",
      blocks: [{ id: "s", type: "textBlock", version: 1, config: { text: "hi" } }] as unknown[],
    };

    const once = forkPageIntoStore(store, source);
    const twice = forkPageIntoStore(once, source);

    expect(twice.pages.map((p) => p.title)).toEqual([
      "My Practice Page",
      "Warm-up (fork)",
      "Warm-up (fork) 2",
    ]);
  });
});

describe("page_created / block_added analytics", () => {
  it("returns a page_created event with origin scratch from createPracticePageInStoreWithEvent", () => {
    const store = createEmptyPracticePageStore();

    const { result, event } = createPracticePageInStoreWithEvent(store);

    expect(result.pages).toHaveLength(2);
    expect(event).toEqual({
      event: "page_created",
      properties: { origin: "scratch" },
    });
  });

  it("returns a page_created event with origin fork from forkPageIntoStoreWithEvent", () => {
    const store = createEmptyPracticePageStore();

    const { event } = forkPageIntoStoreWithEvent(store, {
      title: "Five-minute warm-up",
      blocks: [{ id: "s", type: "metronome", version: 1, config: {} }],
    });

    expect(event).toEqual({
      event: "page_created",
      properties: { origin: "fork" },
    });
  });

  it("returns a null event when a fork has no surviving blocks", () => {
    const store = createEmptyPracticePageStore();

    const { result, event } = forkPageIntoStoreWithEvent(store, {
      title: "Empty",
      blocks: [{ id: "x", type: "nope", version: 1, config: {} }],
    });

    expect(result).toBe(store);
    expect(event).toBeNull();
  });

  it("returns a block_added event with the block type from appendBlockToPageWithEvent", () => {
    const page = createEmptyPracticePage("P");

    const { result, event } = appendBlockToPageWithEvent(page, "metronome");

    expect(result.blocks).toHaveLength(1);
    expect(event).toEqual({
      event: "block_added",
      properties: { type: "metronome" },
    });
  });

  it("returns a null event for an unknown block type", () => {
    const page = createEmptyPracticePage("P");

    const { result, event } = appendBlockToPageWithEvent(page, "not-a-block");

    expect(result).toBe(page);
    expect(event).toBeNull();
  });

  it("base store functions keep their signatures (no event channel)", () => {
    const store = createEmptyPracticePageStore();
    expect(createPracticePageInStore(store).pages).toHaveLength(2);

    const page = createEmptyPracticePage("P");
    expect(appendBlockToPage(page, "metronome").blocks).toHaveLength(1);

    const forked = forkPageIntoStore(store, {
      title: "Warm-up",
      blocks: [{ id: "s", type: "metronome", version: 1, config: {} }],
    });
    expect(forked.pages).toHaveLength(2);
  });
});
describe("getServerPracticePageStore", () => {
  it("returns the same object reference on every call", () => {
    const a = getServerPracticePageStore();
    const b = getServerPracticePageStore();
    expect(a).toBe(b);
  });

  it("returns an empty practice-page store", () => {
    const snapshot = getServerPracticePageStore();
    const expected = createEmptyPracticePageStore();

    expect(snapshot.version).toBe(2);
    expect(snapshot.pages).toHaveLength(1);
    expect(snapshot.pages[0].blocks).toHaveLength(1);
    expect(snapshot.pages[0].blocks[0].type).toBe(
      expected.pages[0].blocks[0].type
    );
    expect(snapshot.activePageId).toBe(snapshot.pages[0].id);
  });

  it("uses fixed ids and timestamps so server and client snapshots match", () => {
    // Both bundles evaluate the module; random ids here broke hydration.
    const snapshot = getServerPracticePageStore();
    expect(snapshot.activePageId).toBe("server-snapshot-page");
    expect(snapshot.pages[0].id).toBe("server-snapshot-page");
    expect(snapshot.pages[0].updatedAt).toBe(0);
    expect(snapshot.pages[0].blocks[0].id).toBe("server-snapshot-block-0-0");
  });

  it("a mutating caller cannot corrupt the snapshot for a later caller", () => {
    const first = getServerPracticePageStore();
    try {
      first.pages[0].title = "corrupted";
      (first.pages[0].blocks as unknown[]).length = 0;
    } catch {
      // Frozen snapshots may reject mutation outright; either way the
      // snapshot a later caller sees must be intact.
    }

    const second = getServerPracticePageStore();
    expect(second.pages[0].title).toBe("My Practice Page");
    expect(second.pages[0].blocks).toHaveLength(1);
  });
});
