import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { AuthenticatedRequest } from "../types";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

// Mark message as read
router.post("/read-receipts", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
    const { messageId, userId } = req.body as { messageId?: string; userId?: string };

    if (!messageId || !userId) {
      res.status(400).json({ error: "messageId and userId required" });
      return;
    }

    if (userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }

    // Check if already read by this user
    const existing = await db.execute(
      "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
      [messageId, userId]
    );

    if (existing.rows.length === 0) {
      // Add read receipt
      const id = randomUUID();
      const readAt = new Date().toISOString();
      await db.execute(
        "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
        [id, messageId, userId, readAt]
      );

      const senderResult = await db.execute(
        "SELECT sender_id FROM messages WHERE id = $1",
        [messageId],
      );
      const senderId = (senderResult.rows[0] as { sender_id?: string } | undefined)?.sender_id;
      broadcast("message-read", { messageId, userId, readAt }, senderId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Failed to mark message as read:", err);
    res.status(500).json({ error: "Failed to mark message as read" });
  }
});

// Mark multiple messages as read in one request (performance)
router.post("/read-receipts/batch", rateLimiters.messages, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
    const { messageIds, userId } = req.body as { messageIds?: string[]; userId?: string };

    if (!userId || userId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only mark messages as read for yourself" });
      return;
    }
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      res.status(400).json({ error: "messageIds array required" });
      return;
    }

    const readAt = new Date().toISOString();
    const marked: { messageId: string; senderId?: string }[] = [];

    for (const messageId of messageIds.slice(0, 100)) {
      const existing = await db.execute(
        "SELECT * FROM message_read_receipts WHERE message_id = $1 AND user_id = $2",
        [messageId, userId],
      );
      if (existing.rows.length === 0) {
        const id = randomUUID();
        await db.execute(
          "INSERT INTO message_read_receipts (id, message_id, user_id, read_at) VALUES ($1, $2, $3, $4)",
          [id, messageId, userId, readAt],
        );
        const senderResult = await db.execute(
          "SELECT sender_id FROM messages WHERE id = $1",
          [messageId],
        );
        const senderId = (senderResult.rows[0] as { sender_id?: string } | undefined)?.sender_id;
        marked.push({ messageId, senderId });
      }
    }

    for (const { messageId, senderId } of marked) {
      broadcast("message-read", { messageId, userId, readAt }, senderId);
    }

    res.json({ success: true, marked: marked.length, readAt });
  } catch (err) {
    console.error("Failed to batch mark messages as read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// Get read receipts for a message
router.get("/read-receipts/:messageId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const normalizedMessageId = getParam(messageId);

    const result = await db.execute(
      "SELECT user_id, read_at FROM message_read_receipts WHERE message_id = $1",
      [normalizedMessageId]
    );

    const receipts = result.rows.map((row: any) => ({
      userId: row.user_id,
      readAt: row.read_at,
    }));

    res.json(receipts);
  } catch (err) {
    console.error("Failed to get read receipts:", err);
    res.status(500).json({ error: "Failed to get read receipts" });
  }
});

export default router;
