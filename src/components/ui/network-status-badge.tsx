"use client";

import { useEffect, useState } from "react";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Database 
} from "lucide-react";
import { 
  getQueuedOfflineEvents, 
  syncQueuedOfflineEvents, 
  registerServiceWorker, 
  OfflinePracticeEvent 
} from "@/lib/offline-sync";
import { createPracticeEventAction } from "@/modules/logbook/actions";

export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const checkQueue = async () => {
    try {
      const items = await getQueuedOfflineEvents();
      setQueuedCount(items.length);
    } catch {
      // Ignore if IndexedDB is not accessible
    }
  };

  useEffect(() => {
    registerServiceWorker();

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        checkQueue();
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      checkQueue();
      const interval = setInterval(checkQueue, 15000);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        clearInterval(interval);
      };
    }
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setSyncMessage(null);

    const { syncedCount, errorsCount } = await syncQueuedOfflineEvents(async (event: OfflinePracticeEvent) => {
      const res = await createPracticeEventAction({
        tenantSlug: "unilag",
        allocationId: event.allocationId,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        category: event.category,
        clientRef: event.clientRef || "CASE-ANON-0001",
        activityTitle: event.activityTitle,
        activityDescription: event.activityDescription,
        criticalReflection: event.criticalReflection,
        competenciesTagged: event.competenciesTagged,
        scopeLevel: event.scopeLevel,
      });
      return { success: res.success, error: res.error };
    });

    setSyncing(false);
    await checkQueue();

    if (syncedCount > 0) {
      setSyncMessage(`Synced ${syncedCount} offline record(s) successfully!`);
      setTimeout(() => setSyncMessage(null), 5000);
    } else if (errorsCount > 0) {
      setSyncMessage(`Sync attempt encountered ${errorsCount} error(s). Will retry.`);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {syncMessage && (
        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {syncMessage}
        </span>
      )}

      {isOnline ? (
        queuedCount > 0 ? (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{queuedCount} Queued</span>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">Sync</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">Online • PWA Synced</span>
          </div>
        )
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-300 text-amber-800 animate-pulse">
          <WifiOff className="w-3 h-3 text-amber-600" />
          <span>Offline Mode ({queuedCount} Queued)</span>
        </div>
      )}
    </div>
  );
}
