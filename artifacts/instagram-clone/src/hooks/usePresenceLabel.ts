import { useEffect, useMemo, useState } from "react";
import { formatPresence } from "@/lib/message-utils";

/** Re-computes “Active X min ago” as time passes without a new heartbeat. */
export function usePresenceLabel(lastSeen: number | undefined) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => formatPresence(lastSeen), [lastSeen, tick]);
}
