import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Forward a message
router.post("/forward", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { messageId, fromUserId, toUserId } = req.body;

    if (!messageId || !fromUserId || !toUserId) {
      res.status(400).json({ error: "messageId, fromUserId, and toUserId required" });
      return;
    }

    // Ensure user can only forward messages as themselves
    if (fromUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only forward messages as yourself" });
      return;
    }

    // Get the original message
    const originalMsg = await db.execute(
      "SELECT * FROM messages WHERE id = $1",
      [messageId]
    );

    if (originalMsg.rows.length === 0) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const msg = originalMsg.rows[0];

    // Create a new message as a forwarded copy
    const newId = randomUUID();
    const timestamp = new Date().toISOString();

    await db.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, timestamp, liked, deleted, variant, companion_sticker)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newId,
        fromUserId,
        msg.text,
        msg.type,
        msg.audio_data,
        msg.gif_url,
        msg.image_data,
        timestamp,
        0,
        0,
        msg.variant,
        msg.companion_sticker,
      ]
    );

    // Record the forward
    const forwardId = randomUUID();
    await db.execute(
      "INSERT INTO forwarded_messages (id, original_message_id, from_user_id, to_user_id, forwarded_at) VALUES ($1, $2, $3, $4, $5)",
      [forwardId, messageId, fromUserId, toUserId, timestamp]
    );

    res.json({ success: true, messageId: newId });
  } catch (err) {
    console.error("Failed to forward message:", err);
    res.status(500).json({ error: "Failed to forward message" });
  }
});

// Get forwarded messages for a message
router.get("/forward/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam(messageId);

    const result = await db.execute(
      "SELECT * FROM forwarded_messages WHERE original_message_id = $1",
      [normalizedMessageId]
    );

    const forwards = result.rows.map((row: any) => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      forwardedAt: row.forwarded_at,
    }));

    res.json(forwards);
  } catch (err) {
    console.error("Failed to get forwarded messages:", err);
    res.status(500).json({ error: "Failed to get forwarded messages" });
  }
});

export default router;
