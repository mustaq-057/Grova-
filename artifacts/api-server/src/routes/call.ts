import { Router } from "express";
import { broadcast } from "../lib/sse";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { getWebRTCConfiguration } from "../lib/webrtc";
import { AuthenticatedRequest } from "../types";
import webpush from "web-push";

// Configure web-push if keys are present
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      "mailto:admin@example.com",
      process.env.VITE_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (err) {
    console.error("Failed to initialize web-push:", err);
  }
}

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
  
  const expiresAt = Date.now() + 60000; // 60 seconds expiration
  db.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, event, JSON.stringify(payload), Date.now(), expiresAt]
  ).catch(err => console.error("Failed to save call signal:", err));
  
  if (type === "offer") {
    // Send web push notification
    db.execute("SELECT subscription FROM push_subscriptions WHERE user_id = $1", [partnerId])
      .then(subRes => {
        if (subRes.rows.length > 0) {
          const sub = JSON.parse(subRes.rows[0].subscription);
          const notificationPayload = JSON.stringify({
            type: "call",
            title: "Incoming Call",
            body: `Incoming ${rest.callType === "video" ? "video" : "audio"} call...`,
            icon: "/favicon.svg",
          });
          webpush.sendNotification(sub, notificationPayload).catch(err => console.error("Web push failed:", err));
        }
      })
      .catch(err => console.error("Failed to fetch push subscription:", err));
  }
  
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
  
  const expiresAt = Date.now() + 60000;
  db.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, event, JSON.stringify(payload), Date.now(), expiresAt]
  ).catch(err => console.error("Failed to save call notification:", err));

  res.json({ ok: true });
});

router.get("/call/signals", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user.id;
    
    // Fetch pending signals that have not expired without deleting them immediately,
    // so multi-tab clients all ring simultaneously.
    const result = await db.execute(
      "SELECT * FROM call_signals WHERE receiver_id = $1 AND expires_at > $2",
      [authenticatedUserId, Date.now()]
    );
    
    // Also clean up any expired signals lazily
    db.execute("DELETE FROM call_signals WHERE expires_at <= $1", [Date.now()]).catch(() => {});
    
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
