import { Router } from "express";
import { authenticate } from "../lib/auth-middleware";
import { broadcast } from "../lib/sse";
import db from "../lib/db";

const router = Router();

router.post("/sync", authenticate, (req, res) => {
  const { strokes, partnerId, color, brushSize, clear, canvasBg } = req.body;
  const authenticatedUserId = (req as any).user.id;

  if (!partnerId) {
    res.status(400).json({ error: "partnerId required" });
    return;
  }

  const payload = {
    senderId: authenticatedUserId,
    strokes,
    color,
    brushSize,
    clear,
    canvasBg,
  };

  // Broadcast to the partner (works on local/single-instance)
  broadcast("doodle_sync", payload, partnerId);

  // Save to DB for Vercel multi-instance fallback
  const expiresAt = Date.now() + 10000; // 10 seconds expiration
  db.execute(
    "INSERT INTO call_signals (receiver_id, event, data, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [partnerId, "doodle_sync", JSON.stringify(payload), Date.now(), expiresAt]
  ).catch(err => console.error("Failed to save doodle signal:", err));

  res.json({ success: true });
});

router.get("/signals", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    
    const result = await db.execute(
      "SELECT id, data FROM call_signals WHERE receiver_id = $1 AND event = 'doodle_sync' AND expires_at > $2 ORDER BY id ASC",
      [authenticatedUserId, Date.now()]
    );
    
    if (result.rows.length > 0) {
      const ids = result.rows.map(r => r.id);
      // Delete the fetched signals so we don't return them again
      await db.execute(
        `DELETE FROM call_signals WHERE id IN (${ids.join(',')})`
      );
    }
    
    // Also clean up any expired signals lazily
    db.execute("DELETE FROM call_signals WHERE event = 'doodle_sync' AND expires_at <= $1", [Date.now()]).catch(() => {});
    
    const signals = result.rows.map((row: any) => JSON.parse(row.data));
    res.json({ signals });
  } catch (err) {
    console.error("Failed to fetch doodle signals:", err);
    res.status(500).json({ error: "Failed to fetch doodle signals" });
  }
});

export default router;
