import { Router } from "express";
import { broadcast } from "../lib/sse";
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
  broadcast(`call-${type}`, { from: senderId, ...rest }, partnerId);
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
  broadcast("call-ring", { from, callType }, partnerId);
  res.json({ ok: true });
});

export default router;
