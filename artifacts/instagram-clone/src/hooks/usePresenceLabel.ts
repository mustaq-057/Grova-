import { useEffect, useMemo, useState } from "react";
import { formatPresence } from "@/lib/message-utils";
import { isShowPresenceEnabled, PREFS_CHANGED } from "@/lib/couple-sync";

/** Re-computes “Active X min ago” as time passes without a new heartbeat. */
export function usePresenceLabel(lastSeen: number | undefined, inLibrary?: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const showPresence = useShowPresence();

  return useMemo(() => {
    if (!showPresence) return { label: "", online: false };
    const presence = formatPresence(lastSeen);
    if (presence.online && inLibrary) {
      return { label: "In Library 📚", online: true };
    }
    return presence;
  }, [lastSeen, tick, showPresence, inLibrary]);
}

export function useShowPresence() {
  const [show, setShow] = useState(() => isShowPresenceEnabled());
  useEffect(() => {
    const handle = () => setShow(isShowPresenceEnabled());
    window.addEventListener(PREFS_CHANGED, handle);
    return () => window.removeEventListener(PREFS_CHANGED, handle);
  }, []);
  return show;
}
