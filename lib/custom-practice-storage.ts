import type { PracticePage } from "@/lib/feature-blocks/types";

const STORAGE_KEY = "custom-practice-pages-v1";
const DEFAULT_PAGE_ID = "default";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPracticePage(): PracticePage {
  return {
    id: DEFAULT_PAGE_ID,
    title: "My Practice Page",
    blocks: [],
    updatedAt: Date.now(),
  };
}

export function readPracticePage(): PracticePage {
  if (typeof window === "undefined") {
    return createEmptyPracticePage();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyPracticePage();

    const parsed = JSON.parse(raw) as PracticePage;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.title === "string" &&
      Array.isArray(parsed.blocks)
    ) {
      return parsed;
    }
  } catch {
    // Fall through to empty page on corrupt storage.
  }

  return createEmptyPracticePage();
}

function persistPracticePage(page: PracticePage): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...page, updatedAt: Date.now() })
    );
  } catch {
    // Storage may be full or disabled; fail silently.
  }
}

// In-memory singleton used by useSyncExternalStore. Lazy-loaded from localStorage
// on the first client render so the server snapshot (empty page) stays stable.
let currentPage: PracticePage | null = null;
const listeners = new Set<() => void>();

export function getPracticePage(): PracticePage {
  if (currentPage === null) {
    currentPage = readPracticePage();
  }
  return currentPage;
}

export function setPracticePage(page: PracticePage): void {
  currentPage = page;
  persistPracticePage(page);
  listeners.forEach((listener) => listener());
}

export function subscribePracticePage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerPracticePage(): PracticePage {
  return createEmptyPracticePage();
}

/** Resets the in-memory singleton and localStorage. Exposed for tests. */
export function resetPracticePage(): void {
  currentPage = null;
  listeners.clear();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }
}

export { generateId, DEFAULT_PAGE_ID };
