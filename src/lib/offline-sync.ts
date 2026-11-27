import type { createPracticeEventAction } from "@/modules/logbook/actions";

const DB_NAME = "PracticumOS_OfflineStore";
const STORE_NAME = "scoped_practice_events";

type Entry = Parameters<typeof createPracticeEventAction>[0];
export type OfflinePracticeEvent = {
  id: string;
  scope: string;
  payload: Entry;
  error?: string;
};

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("scope", "scope");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function saveOfflineEvent(item: OfflinePracticeEvent): Promise<void> {
  await withStore("readwrite", (store) => store.put(item));
}

export async function getQueuedOfflineEvents(scope: string): Promise<OfflinePracticeEvent[]> {
  return withStore("readonly", (store) => store.index("scope").getAll(scope));
}

export async function removeOfflineEvent(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

export function registerServiceWorker(): void {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  }
}
