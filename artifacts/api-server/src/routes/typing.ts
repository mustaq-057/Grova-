import { Router } from "express";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import db from "../lib/db";

const router = Router();

// Send typing indicator (SSE + DB for Vercel polling)
router.post("/typing", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const { userId, partnerId, typing, doodling } = req.body;
    const authenticatedUserId = (req as { user?: { id: string } }).user?.id;

    if (!userId || !partnerId || typeof typing !== "boolean") {
      res.status(400).json({ error: "userId, partnerId, and typing required" });
      return;
    }
    if (authenticatedUserId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const until = typing ? Date.now() + 8000 : 0;
    try {
      await db.execute("UPDATE devices SET typing_until = ? WHERE user_id = ?", [until, userId]);
    } catch {
      /* ignore if column missing on old DB */
    }

    broadcast("typing-indicator", { userId, typing, doodling: Boolean(doodling) }, partnerId);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send typing indicator:", err);
    res.status(500).json({ error: "Failed to send typing indicator" });
  }
});

export default router;
