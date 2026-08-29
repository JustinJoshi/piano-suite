import type { PracticePage, FeatureBlock } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";

const STORAGE_KEY = "custom-practice-pages-v2";
const LEGACY_STORAGE_KEY = "custom-practice-pages-v1";
const DEFAULT_PAGE_ID = "default";

/** Starter tile seeded on a fresh workshop so shortcuts live on the grid. */
export const STARTER_TILE_TYPE = "drillShortcuts";

export { STORAGE_KEY, LEGACY_STORAGE_KEY };

/**
 * The stored shape for a user's practice pages. `version` enables future
 * on-read migrations (see the workshop versioning plan).
 */
export type PracticePageStore = {
  version: 2;
  pages: PracticePage[];
  activePageId: string;
};

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPracticePage(title = "My Practice Page"): PracticePage {
  return {
    id: generateId(),
    title,
    blocks: [],
    updatedAt: Date.now(),
  };
}

export function createEmptyPracticePageStore(): PracticePageStore {
  const page = createEmptyPracticePage();
  page.blocks = [
    { id: generateId(), type: STARTER_TILE_TYPE, version: 1, config: {} },
  ];
  return {
    version: 2,
    pages: [page],
    activePageId: page.id,
  };
}

/**
 * True when the page holds nothing the user built — only starter tiles
 * (or nothing at all). Drives first-run onboarding and template replacement.
 */
export function isStarterPage(page: PracticePage): boolean {
  return page.blocks.every((b) => b.type === STARTER_TILE_TYPE);
}

function isValidPage(value: unknown): value is PracticePage {
  if (typeof value !== "object" || value === null) return false;
  const page = value as Record<string, unknown>;
  return (
    typeof page.id === "string" &&
    typeof page.title === "string" &&
    Array.isArray(page.blocks)
  );
}

function isValidStore(value: unknown): value is PracticePageStore {
  if (typeof value !== "object" || value === null) return false;
  const store = value as Record<string, unknown>;
  return (
    store.version === 2 &&
    Array.isArray(store.pages) &&
    store.pages.every(isValidPage) &&
    typeof store.activePageId === "string"
  );
}

/** Migrates the v1 single-page format into a v2 store. */
function migrateLegacyStore(raw: string): PracticePageStore | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidPage(parsed)) return null;
    return {
      version: 2,
      pages: [parsed],
      activePageId: parsed.id,
    };
  } catch {
    return null;
  }
}

function readStoreFromWindow(): PracticePageStore | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isValidStore(parsed)) {
        // Guard against a stale activePageId (e.g. hand-edited storage).
        if (!parsed.pages.some((p) => p.id === parsed.activePageId)) {
          return { ...parsed, activePageId: parsed.pages[0]?.id ?? "" };
        }
        return parsed;
      }
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacyStore(legacy);
      if (migrated) return migrated;
    }
  } catch {
    // Fall through to an empty store on corrupt storage.
  }
  return null;
}

function persistStore(store: PracticePageStore): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage may be full or disabled; fail silently.
  }
}

// In-memory singleton used by useSyncExternalStore. Lazy-loaded from localStorage
// on the first client render so the server snapshot (empty store) stays stable.
let currentStore: PracticePageStore | null = null;
const listeners = new Set<() => void>();

export function getPracticePageStore(): PracticePageStore {
  if (currentStore === null) {
    currentStore = readStoreFromWindow() ?? createEmptyPracticePageStore();
  }
  return currentStore;
}

export function setPracticePageStore(store: PracticePageStore): void {
  currentStore = store;
  persistStore(store);
  listeners.forEach((listener) => listener());
}

export function subscribePracticePageStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerPracticePageStore(): PracticePageStore {
  return createEmptyPracticePageStore();
}

/** Resets the in-memory singleton and localStorage. Exposed for tests. */
export function resetPracticePageStore(): void {
  currentStore = null;
  listeners.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }
}

// ---------------------------------------------------------------------------
// Page-level operations (pure helpers so they stay unit-testable).
// ---------------------------------------------------------------------------

export function getActivePage(store: PracticePageStore): PracticePage {
  return (
    store.pages.find((p) => p.id === store.activePageId) ?? store.pages[0]
  );
}

export function setActivePageId(
  store: PracticePageStore,
  pageId: string
): PracticePageStore {
  if (!store.pages.some((p) => p.id === pageId)) return store;
  return { ...store, activePageId: pageId };
}

export function upsertPracticePage(
  store: PracticePageStore,
  page: PracticePage
): PracticePageStore {
  const next: PracticePage = { ...page, updatedAt: Date.now() };
  const exists = store.pages.some((p) => p.id === next.id);
  return {
    ...store,
    pages: exists
      ? store.pages.map((p) => (p.id === next.id ? next : p))
      : [...store.pages, next],
    activePageId: next.id,
  };
}

export function deletePracticePage(
  store: PracticePageStore,
  pageId: string
): PracticePageStore {
  const remaining = store.pages.filter((p) => p.id !== pageId);
  if (remaining.length === 0) {
    // Never leave the store empty; reset to one fresh page.
    const fresh = createEmptyPracticePage();
    return { ...store, pages: [fresh], activePageId: fresh.id };
  }
  const isActive = store.activePageId === pageId;
  return {
    ...store,
    pages: remaining,
    activePageId: isActive ? remaining[0].id : store.activePageId,
  };
}

export function duplicatePracticePage(
  store: PracticePageStore,
  pageId: string
): PracticePageStore {
  const source = store.pages.find((p) => p.id === pageId);
  if (!source) return store;

  const copy: PracticePage = {
    id: generateId(),
    title: uniqueTitle(store, `${source.title} (copy)`),
    blocks: source.blocks.map((block) => ({
      ...block,
      id: generateId(),
      config: { ...block.config },
    })),
    updatedAt: Date.now(),
  };

  const index = store.pages.findIndex((p) => p.id === pageId);
  const pages = [...store.pages];
  pages.splice(index + 1, 0, copy);

  return { ...store, pages, activePageId: copy.id };
}

export function createPracticePageInStore(
  store: PracticePageStore,
  title?: string
): PracticePageStore {
  const page = createEmptyPracticePage(
    title ?? uniqueTitle(store, "My Practice Page")
  );
  return { ...store, pages: [...store.pages, page], activePageId: page.id };
}

function uniqueTitle(store: PracticePageStore, base: string): string {
  const titles = new Set(store.pages.map((p) => p.title));
  if (!titles.has(base)) return base;
  let n = 2;
  while (titles.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

/**
 * Marketplace helper: appends a block of `type` (with default config) to
 * `page`. Returns the page unchanged for unknown types.
 */
export function appendBlockToPage(page: PracticePage, type: string): PracticePage {
  const def = getFeatureDefinition(type);
  if (!def) return page;

  const block: FeatureBlock = {
    id: generateId(),
    type,
    version: 1,
    config: { ...def.defaultConfig },
  };
  return { ...page, blocks: [...page.blocks, block] };
}

/**
 * Marketplace helper: removes the first block of `type` from `page`
 * (no-op when absent).
 */
export function removeFirstBlockOfType(
  page: PracticePage,
  type: string
): PracticePage {
  const index = page.blocks.findIndex((b) => b.type === type);
  if (index === -1) return page;
  return {
    ...page,
    blocks: page.blocks.filter((_, i) => i !== index),
  };
}

export { generateId, DEFAULT_PAGE_ID };
