import { Router } from "express";
import { broadcast } from "../lib/sse";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { getWebRTCConfiguration } from "../lib/webrtc";
import { AuthenticatedRequest } from "../types";

const router = Router();

function partnerIdFor(userId: string): string {
  return userId === "me" ? "wife" : "me";
}

router.get("/call/rtc-config", authenticate, (_req, res) => {
  res.json(getWebRTCConfiguration());
});

router.post("/call/signal", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = (req as AuthenticatedRequest).user.id;
  const { type, senderId, ...rest } = req.body as {
    type: "offer" | "answer" | "ice" | "end" | "reject";
    senderId: string;
    [k: string]: unknown;
  };

  if (senderId !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send signals as yourself" });
    return;
  }

  const partnerId = partnerIdFor(authenticatedUserId);
  const event = `call-${type}`;
  const payload = { from: senderId, ...rest };
  
  broadcast(event, payload, partnerId);
  
  db.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at) VALUES ($1, $2, $3, $4)",
    [partnerId, event, JSON.stringify(payload), Date.now()]
  ).catch(err => console.error("Failed to save call signal:", err));
  
  res.json({ ok: true });
});

// Optional ring notification (no SDP) — partner shows incoming UI before WebRTC offer lands
router.post("/call/notify", rateLimiters.messages, authenticate, (req, res) => {
  const authenticatedUserId = (req as AuthenticatedRequest).user.id;
  const { from, callType } = req.body as {
    from: string;
    callType: "audio" | "video";
  };

  if (from !== authenticatedUserId) {
    res.status(403).json({ error: "Forbidden: Can only send notifications as yourself" });
    return;
  }

  const partnerId = partnerIdFor(authenticatedUserId);
  const event = "call-ring";
  const payload = { from, callType };

  broadcast(event, payload, partnerId);
  
  db.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at) VALUES ($1, $2, $3, $4)",
    [partnerId, event, JSON.stringify(payload), Date.now()]
  ).catch(err => console.error("Failed to save call notification:", err));

  res.json({ ok: true });
});

router.get("/call/signals", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user.id;
    
    // Atomically fetch and delete pending signals
    const result = await db.execute(
      "DELETE FROM call_signals WHERE receiver_id = $1 RETURNING *",
      [authenticatedUserId]
    );
    
    const signals = result.rows.map((row: any) => ({
      event: row.event,
      data: JSON.parse(row.data),
    }));
    
    res.json(signals);
  } catch (err) {
    console.error("Failed to fetch call signals:", err);
    res.status(500).json({ error: "Failed to fetch call signals" });
  }
});

export default router;
