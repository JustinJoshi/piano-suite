import "@testing-library/jest-dom/vitest";

// Node 26+ may expose an undefined experimental localStorage in jsdom.
// Provide a working in-memory store so tests can read/write onboarding/theme prefs.
const memoryStore = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  value: {
    getItem(key: string) {
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    setItem(key: string, value: string) {
      memoryStore.set(key, String(value));
    },
    removeItem(key: string) {
      memoryStore.delete(key);
    },
    clear() {
      memoryStore.clear();
    },
    get length() {
      return memoryStore.size;
    },
    key(index: number) {
      const keys = Array.from(memoryStore.keys());
      return keys[index] ?? null;
    },
  },
  writable: true,
  configurable: true,
});
