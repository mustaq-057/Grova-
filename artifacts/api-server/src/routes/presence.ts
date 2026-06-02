import { Router } from "express";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import db from "../lib/db";

const lastSeen: Record<string, number> = {};

const router = Router();

router.post("/presence/heartbeat", rateLimiters.messages, authenticate, async (req, res) => {
  const authenticatedUserId = (req as { user?: { id: string } }).user?.id;
  if (!authenticatedUserId || (authenticatedUserId !== "me" && authenticatedUserId !== "wife")) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }
  const now = Date.now();
  lastSeen[authenticatedUserId] = now;
  const partnerId = authenticatedUserId === "me" ? "wife" : "me";
  try {
    await db.execute("UPDATE devices SET last_seen = ? WHERE user_id = ?", [now, authenticatedUserId]);
  } catch {
    /* ignore */
  }
  broadcast("presence", { userId: authenticatedUserId, lastSeen: now }, partnerId);
  res.json({ userId: authenticatedUserId, lastSeen: now });
});

router.get("/presence", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as { user?: { id: string } }).user?.id;
    if (!authenticatedUserId || (authenticatedUserId !== "me" && authenticatedUserId !== "wife")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const result = await db.execute(
      `
      SELECT user_id, MAX(last_seen) AS last_seen
      FROM devices
      WHERE user_id = ? OR user_id = ?
      GROUP BY user_id
      `,
      [authenticatedUserId, partnerId],
    );

    const response: Record<string, number> = { ...lastSeen };
    for (const row of result.rows as { user_id?: string; last_seen?: string | number | null }[]) {
      const id = row.user_id ? String(row.user_id) : "";
      if (!id) continue;
      const persisted = Number(row.last_seen ?? 0);
      if (!Number.isFinite(persisted) || persisted <= 0) continue;
      response[id] = Math.max(response[id] ?? 0, persisted);
    }

    res.json(response);
  } catch (err) {
    console.error("Failed to fetch presence:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
});

export default router;
