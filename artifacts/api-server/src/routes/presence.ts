import { Router } from "express";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import db from "../lib/db";
import { runScheduleTick } from "../lib/schedule-worker";

const lastSeen: Record<string, number> = {};
const inLibraryState: Record<string, boolean> = {};

const router = Router();

router.post("/presence/heartbeat", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = (req as { user?: { id: string } }).user?.id;
  if (!authenticatedUserId || (authenticatedUserId !== "me" && authenticatedUserId !== "wife")) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  
  const { inLibrary } = req.body || {};
  
  const now = Date.now();
  lastSeen[authenticatedUserId] = now;
  inLibraryState[authenticatedUserId] = !!inLibrary;
  
  const partnerId = authenticatedUserId === "me" ? "wife" : "me";
  try {
    await db.execute("UPDATE devices SET last_seen = ? WHERE user_id = ?", [now, authenticatedUserId]);
  } catch {
    /* ignore */
  }
  broadcast("presence", { userId: authenticatedUserId, lastSeen: now, inLibrary: !!inLibrary }, partnerId);
  
  // Return the full presence map so the client can use heartbeat to fetch presence
  const lastSeenMap: Record<string, number> = { ...lastSeen };
  const typing: Record<string, boolean> = {};
  
  let result;
  try {
    result = await db.execute(
      `
      SELECT user_id, MAX(last_seen) AS last_seen, MAX(typing_until) AS typing_until
      FROM devices
      WHERE user_id = ? OR user_id = ?
      GROUP BY user_id
      `,
      [authenticatedUserId, partnerId],
    );
  } catch {
    result = await db.execute(
      `
      SELECT user_id, MAX(last_seen) AS last_seen
      FROM devices
      WHERE user_id = ? OR user_id = ?
      GROUP BY user_id
      `,
      [authenticatedUserId, partnerId],
    );
  }

  for (const row of result.rows as any[]) {
    const id = row.user_id ? String(row.user_id) : "";
    if (!id) continue;
    const persisted = Number(row.last_seen ?? 0);
    if (Number.isFinite(persisted) && persisted > 0) {
      lastSeenMap[id] = Math.max(lastSeenMap[id] ?? 0, persisted);
    }
    const typingUntil = Number(row.typing_until ?? 0);
    typing[id] = Number.isFinite(typingUntil) && typingUntil > now;
  }

  res.json({ lastSeen: lastSeenMap, typing, inLibrary: inLibraryState });
});

router.get("/presence", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as { user?: { id: string } }).user?.id;
    if (!authenticatedUserId || (authenticatedUserId !== "me" && authenticatedUserId !== "wife")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const lastSeenMap: Record<string, number> = { ...lastSeen };
    const typing: Record<string, boolean> = {};
    const now = Date.now();

    let result;
    try {
      result = await db.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen, MAX(typing_until) AS typing_until
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId],
      );
    } catch {
      result = await db.execute(
        `
        SELECT user_id, MAX(last_seen) AS last_seen
        FROM devices
        WHERE user_id = ? OR user_id = ?
        GROUP BY user_id
        `,
        [authenticatedUserId, partnerId],
      );
    }

    for (const row of result.rows as {
      user_id?: string;
      last_seen?: string | number | null;
      typing_until?: string | number | null;
    }[]) {
      const id = row.user_id ? String(row.user_id) : "";
      if (!id) continue;
      const persisted = Number(row.last_seen ?? 0);
      if (Number.isFinite(persisted) && persisted > 0) {
        lastSeenMap[id] = Math.max(lastSeenMap[id] ?? 0, persisted);
      }
      const typingUntil = Number(row.typing_until ?? 0);
      typing[id] = Number.isFinite(typingUntil) && typingUntil > now;
    }

    res.json({ lastSeen: lastSeenMap, typing, inLibrary: inLibraryState });

    // Trigger scheduled messages tick on Vercel
    void runScheduleTick().catch(() => {});
  } catch (err) {
    console.error("Failed to fetch presence:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});

export default router;
