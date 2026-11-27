"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { registerServiceWorker } from "@/lib/offline-sync";

export function NetworkStatusBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    registerServiceWorker();
    const updateStatus = () => setOnline(navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return online ? (
    <div className="flex items-center gap-1 text-xs text-emerald-700"><Wifi className="h-4 w-4" /> Online</div>
  ) : (
    <div className="flex items-center gap-1 text-xs text-amber-700"><WifiOff className="h-4 w-4" /> Offline</div>
  );
}
