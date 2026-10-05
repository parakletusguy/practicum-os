// Client-Side Offline Queue & IndexedDB Sync Engine
// Engineered for rural clinics & low-connectivity field placements

const DB_NAME = "PracticumOS_OfflineStore";
const DB_VERSION = 1;
const STORE_NAME = "queued_events";

export interface OfflinePracticeEvent {
  id?: number;
  allocationId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  category: string;
  clientRef?: string;
  activityTitle: string;
  activityDescription: string;
  criticalReflection: string;
  competenciesTagged: string[];
  scopeLevel: "INDEPENDENT" | "CO_PRACTICE" | "DIRECT_SUPERVISION";
  evidenceUrl?: string;
  queuedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineEvent(eventData: Omit<OfflinePracticeEvent, "id" | "queuedAt">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const item: OfflinePracticeEvent = {
      ...eventData,
      queuedAt: new Date().toISOString(),
    };
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueuedOfflineEvents(): Promise<OfflinePracticeEvent[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeSyncedOfflineEvent(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function syncQueuedOfflineEvents(
  submitHandler: (event: OfflinePracticeEvent) => Promise<{ success: boolean; error?: string }>
): Promise<{ syncedCount: number; errorsCount: number }> {
  const items = await getQueuedOfflineEvents();
  let syncedCount = 0;
  let errorsCount = 0;

  for (const item of items) {
    if (!item.id) continue;
    try {
      const result = await submitHandler(item);
      if (result.success) {
        await removeSyncedOfflineEvent(item.id);
        syncedCount++;
      } else {
        errorsCount++;
      }
    } catch {
      errorsCount++;
    }
  }

  return { syncedCount, errorsCount };
}

export function registerServiceWorker(): void {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PracticumOS PWA Service Worker registered with scope:", registration.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });
    });
  }
}
