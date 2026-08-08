import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveCustomKitBlob,
  loadCustomKitBlob,
  deleteCustomKitBlob,
  listCustomKitBlobs,
} from "@/lib/audio-storage";

type StoredRecord = { id: string; name: string; blob: Blob; createdAt: number };

const store = new Map<string, StoredRecord>();

function createFakeIDBDatabase(): IDBDatabase {
  return {
    transaction: () => ({
      objectStore: () => ({
        put: (record: StoredRecord) => {
          store.set(record.id, record);
          const request = {
            result: undefined,
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set onsuccess(fn: (() => void) | null) {
              if (fn) fn();
            },
            set onerror(fn: (() => void) | null) {
              // no-op
            },
          };
          return request;
        },
        get: (id: string) => {
          const request = {
            result: store.get(id),
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set onsuccess(fn: (() => void) | null) {
              if (fn) fn();
            },
            set onerror(fn: (() => void) | null) {
              // no-op
            },
          };
          return request;
        },
        delete: (id: string) => {
          store.delete(id);
          const request = {
            result: undefined,
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set onsuccess(fn: (() => void) | null) {
              if (fn) fn();
            },
            set onerror(fn: (() => void) | null) {
              // no-op
            },
          };
          return request;
        },
        getAll: () => {
          const request = {
            result: Array.from(store.values()),
            error: null,
            onsuccess: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set onsuccess(fn: (() => void) | null) {
              if (fn) fn();
            },
            set onerror(fn: (() => void) | null) {
              // no-op
            },
          };
          return request;
        },
      }),
    }),
    objectStoreNames: {
      contains: () => true,
    },
  } as unknown as IDBDatabase;
}

beforeEach(() => {
  store.clear();
  vi.stubGlobal(
    "indexedDB",
    {
      open: () => {
        const request = {
          result: createFakeIDBDatabase(),
          error: null,
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onupgradeneeded: null as ((event: Event) => void) | null,
          set onsuccess(fn: (() => void) | null) {
            if (fn) fn();
          },
          set onerror(fn: (() => void) | null) {
            // no-op
          },
          set onupgradeneeded(fn: ((event: Event) => void) | null) {
            // no-op
          },
        };
        return request;
      },
    } as unknown as IDBFactory
  );
});

describe("audio-storage", () => {
  it("saves and loads a kit blob", async () => {
    const blob = new Blob(["test"], { type: "application/octet-stream" });
    await saveCustomKitBlob("kit-1", "My Kit", blob);
    const loaded = await loadCustomKitBlob("kit-1");
    expect(loaded).not.toBeUndefined();
    expect(loaded?.size).toBe(blob.size);
  });

  it("returns undefined for missing blobs", async () => {
    const loaded = await loadCustomKitBlob("missing");
    expect(loaded).toBeUndefined();
  });

  it("deletes a kit blob", async () => {
    const blob = new Blob(["test"]);
    await saveCustomKitBlob("kit-1", "My Kit", blob);
    await deleteCustomKitBlob("kit-1");
    const loaded = await loadCustomKitBlob("kit-1");
    expect(loaded).toBeUndefined();
  });

  it("lists stored kit blobs", async () => {
    await saveCustomKitBlob("a", "First", new Blob(["1"]));
    await saveCustomKitBlob("b", "Second", new Blob(["2"]));
    const list = await listCustomKitBlobs();
    expect(list).toHaveLength(2);
    expect(list.map((k) => k.name).sort()).toEqual(["First", "Second"]);
  });
});
