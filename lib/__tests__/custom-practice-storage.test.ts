import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createEmptyPracticePage,
  createEmptyPracticePageStore,
  getPracticePageStore,
  setPracticePageStore,
  resetPracticePageStore,
  getActivePage,
  setActivePageId,
  upsertPracticePage,
  deletePracticePage,
  duplicatePracticePage,
  createPracticePageInStore,
  isStarterPage,
  appendBlockToPage,
  removeFirstBlockOfType,
  importPublicPage,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "@/lib/custom-practice-storage";
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
    expect(JSON.parse(raw).pages[0].title).toBe("Persisted");
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
      const store = { version: 2, pages: [a, b], activePageId: "page-b" } as const;

      const next = deletePracticePage(store, "page-b");
      expect(next.pages.map((p) => p.id)).toEqual(["page-a"]);
      expect(next.activePageId).toBe("page-a");
    });

    it("deletePracticePage never leaves the store empty", () => {
      const a = makePage({ id: "page-a" });
      const store = { version: 2, pages: [a], activePageId: "page-a" } as const;

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
      const store = { version: 2, pages: [a], activePageId: "page-a" } as const;

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
      const store = { version: 2, pages: [a, b], activePageId: "page-a" } as const;

      const next = duplicatePracticePage(store, "page-a");
      expect(next.pages[1].title).toBe("Warmup (copy) 2");
    });

    it("createPracticePageInStore appends a new page with a unique title", () => {
      const a = makePage({ id: "page-a", title: "My Practice Page" });
      const store = { version: 2, pages: [a], activePageId: "page-a" } as const;

      const next = createPracticePageInStore(store);
      expect(next.pages).toHaveLength(2);
      expect(next.pages[1].title).toBe("My Practice Page 2");
      expect(next.activePageId).toBe(next.pages[1].id);
    });

    it("setActivePageId ignores unknown ids", () => {
      const a = makePage({ id: "page-a" });
      const store = { version: 2, pages: [a], activePageId: "page-a" } as const;

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

describe("importPublicPage (save a copy)", () => {
  const publicBlocks = [
    { id: "src-1", type: "metronome", version: 1, config: { bpm: 90 } },
    { id: "src-2", type: "textBlock", version: 1, config: { body: "hi" } },
  ];

  it("replaces a first-run starter page in place and activates the copy", () => {
    const store = createEmptyPracticePageStore();
    const starterId = store.pages[0].id;

    const next = importPublicPage(store, {
      title: "Community Warmup",
      blocks: publicBlocks,
    });

    expect(next.pages).toHaveLength(1);
    expect(next.pages[0].title).toBe("Community Warmup");
    expect(next.pages[0].id).not.toBe(starterId);
    expect(next.activePageId).toBe(next.pages[0].id);
  });

  it("appends after a real page and activates the copy", () => {
    const existing = makePage({ id: "mine", title: "My Practice Page" });
    existing.blocks.push({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
    });
    const store = {
      version: 2 as const,
      pages: [existing],
      activePageId: "mine",
    };

    const next = importPublicPage(store, {
      title: "Community Warmup",
      blocks: publicBlocks,
    });

    expect(next.pages).toHaveLength(2);
    expect(next.pages[0].id).toBe("mine");
    expect(next.pages[1].title).toBe("Community Warmup");
    expect(next.activePageId).toBe(next.pages[1].id);
  });

  it("remints block ids and copies configs instead of referencing them", () => {
    const store = createEmptyPracticePageStore();

    const next = importPublicPage(store, {
      title: "Community Warmup",
      blocks: publicBlocks,
    });

    const imported = next.pages[0];
    expect(imported.blocks.map((b) => b.id)).not.toContain("src-1");
    expect(imported.blocks.map((b) => b.id)).not.toContain("src-2");
    // Same content, new identities.
    expect(imported.blocks.map((b) => b.type)).toEqual([
      "metronome",
      "textBlock",
    ]);
    expect(imported.blocks[0].config).toEqual({ bpm: 90 });
    expect(imported.blocks[0].config).not.toBe(publicBlocks[0].config);
  });

  it("keeps two copies of the same source from colliding on title", () => {
    const existing = makePage({ id: "mine", title: "My Practice Page" });
    existing.blocks.push({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
    });
    const store = {
      version: 2 as const,
      pages: [existing],
      activePageId: "mine",
    };

    const once = importPublicPage(store, {
      title: "Community Warmup",
      blocks: publicBlocks,
    });
    const twice = importPublicPage(once, {
      title: "Community Warmup",
      blocks: publicBlocks,
    });

    expect(twice.pages).toHaveLength(3);
    expect(twice.pages[1].title).toBe("Community Warmup");
    expect(twice.pages[2].title).toBe("Community Warmup 2");
    // Forking twice must not collide block ids either.
    const ids = [
      ...twice.pages[1].blocks,
      ...twice.pages[2].blocks,
    ].map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses the provided id (mutation clientPageId) when given", () => {
    const store = createEmptyPracticePageStore();

    const next = importPublicPage(store, {
      id: "from-convex",
      title: "Community Warmup",
      blocks: publicBlocks,
    });

    expect(next.pages[0].id).toBe("from-convex");
    expect(next.activePageId).toBe("from-convex");
  });
});
