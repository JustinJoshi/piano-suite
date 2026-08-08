/**
 * IndexedDB storage for user-uploaded audio kits.
 *
 * Keeps .sf2 and sample-map binaries device-local. Only kit metadata travels
 * to Convex; the audio data is too large and stays in the browser.
 */

const DB_NAME = "piano-suite-audio";
const DB_VERSION = 1;
const STORE_NAME = "customKits";

type StoredKit = {
  id: string;
  name: string;
  blob: Blob;
  createdAt: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export async function openAudioDatabase(): Promise<IDBDatabase | null> {
  if (!isBrowser()) return null;
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveCustomKitBlob(
  id: string,
  name: string,
  blob: Blob
): Promise<void> {
  const db = await openAudioDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: StoredKit = { id, name, blob, createdAt: Date.now() };
    const request = store.put(record);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadCustomKitBlob(
  id: string
): Promise<Blob | undefined> {
  const db = await openAudioDatabase();
  if (!db) return undefined;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredKit | undefined;
      resolve(result?.blob);
    };
  });
}

export async function deleteCustomKitBlob(id: string): Promise<void> {
  const db = await openAudioDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function listCustomKitBlobs(): Promise<
  { id: string; name: string; createdAt: number }[]
> {
  const db = await openAudioDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const records = (request.result as StoredKit[]) ?? [];
      resolve(
        records.map((record) => ({
          id: record.id,
          name: record.name,
          createdAt: record.createdAt,
        }))
      );
    };
  });
}
