import { Router } from "express";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

const router = Router();

// Send typing indicator
router.post("/typing", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const { userId, partnerId, typing } = req.body;

    if (!userId || !partnerId || typeof typing !== "boolean") {
      res.status(400).json({ error: "userId, partnerId, and typing required" });
      return;
    }

    broadcast("typing-indicator", { userId, typing }, partnerId);

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to send typing indicator:", err);
    res.status(500).json({ error: "Failed to send typing indicator" });
  }
});

export default router;
