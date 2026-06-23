import { Router } from "express";
import { authenticate } from "../lib/auth-middleware";
import { broadcast } from "../lib/sse";

const router = Router();

router.post("/sync", authenticate, (req, res) => {
  const { strokes, partnerId, color, brushSize, clear } = req.body;
  const authenticatedUserId = (req as any).user.id;

  if (!partnerId) {
    res.status(400).json({ error: "partnerId required" });
    return;
  }

  // Broadcast to the partner
  broadcast("doodle_sync", {
    senderId: authenticatedUserId,
    strokes,
    color,
    brushSize,
    clear,
  }, partnerId);

  res.json({ success: true });
});

export default router;
