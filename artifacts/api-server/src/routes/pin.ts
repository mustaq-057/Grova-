import { Router } from "express";
import db from "../lib/db";
import { decryptStoredField } from "../lib/message-storage";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Pin a message
router.post("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId, messageId } = req.body;

    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }

    // Ensure user can only pin messages for themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only pin messages for yourself" });
      return;
    }

    const pinnedAt = new Date().toISOString();
    await db.execute(
      "INSERT INTO pinned_messages (user_id, message_id, pinned_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, message_id) DO UPDATE SET pinned_at = $3",
      [userId, messageId, pinnedAt]
    );

    res.json({ success: true, pinnedAt });
  } catch (err) {
    console.error("Failed to pin message:", err);
    res.status(500).json({ error: "Failed to pin message" });
  }
});

// Unpin a message
router.delete("/pin", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId, messageId } = req.body;

    if (!userId || !messageId) {
      res.status(400).json({ error: "userId and messageId required" });
      return;
    }

    // Ensure user can only unpin messages for themselves
    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only unpin messages for yourself" });
      return;
    }

    await db.execute(
      "DELETE FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [userId, messageId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to unpin message:", err);
    res.status(500).json({ error: "Failed to unpin message" });
  }
});

// Get pinned messages for a user
router.get("/pin/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);

    // Ensure user can only read their own pinned messages
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only read your own pinned messages" });
      return;
    }

    const result = await db.execute(
      `SELECT m.* FROM messages m
       INNER JOIN pinned_messages p ON m.id = p.message_id
       WHERE p.user_id = $1
       ORDER BY p.pinned_at DESC`,
      [normalizedUserId]
    );

    const pinnedMessages = result.rows.map((row: any) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      deleted: row.deleted === 1,
      deletedAt: row.deleted_at,
      variant: row.variant,
      companionSticker: row.companion_sticker,
    }));

    res.json(pinnedMessages);
  } catch (err) {
    console.error("Failed to get pinned messages:", err);
    res.status(500).json({ error: "Failed to get pinned messages" });
  }
});

// Check if a message is pinned
router.get("/pin/:userId/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const { userId, messageId } = req.params;
    const normalizedUserId = getParam(userId);
    const normalizedMessageId = getParam(messageId);

    // Ensure user can only check their own pin status
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only check your own pin status" });
      return;
    }

    const result = await db.execute(
      "SELECT pinned_at FROM pinned_messages WHERE user_id = $1 AND message_id = $2",
      [normalizedUserId, normalizedMessageId]
    );

    if (result.rows.length === 0) {
      res.json({ pinned: false });
      return;
    }

    res.json({ pinned: true, pinnedAt: result.rows[0].pinned_at });
  } catch (err) {
    console.error("Failed to check pin status:", err);
    res.status(500).json({ error: "Failed to check pin status" });
  }
});

export default router;
