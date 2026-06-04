import type { PresenceResponse } from "./api";

/** Normalize presence API (legacy flat map or { lastSeen, typing }). */
export function parsePresenceResponse(raw: PresenceResponse | Record<string, number>): {
  lastSeen: Record<string, number>;
  typing: Record<string, boolean>;
} {
  if (raw && typeof raw === "object" && "lastSeen" in raw && typeof raw.lastSeen === "object") {
    const typed = raw as PresenceResponse;
    return {
      lastSeen: typed.lastSeen ?? {},
      typing: typed.typing ?? {},
    };
  }
  const flat = raw as Record<string, number>;
  const lastSeen: Record<string, number> = {};
  for (const [k, v] of Object.entries(flat)) {
    if (k === "typing" || k === "lastSeen") continue;
    if (typeof v === "number") lastSeen[k] = v;
  }
  return { lastSeen, typing: {} };
}

/** Partner considered online in chat (heartbeat + poll friendly). */
export function isPartnerActiveInChat(lastSeen: number | undefined, windowMs = 180_000): boolean {
  if (!lastSeen) return false;
  return Date.now() - lastSeen < windowMs;
}
