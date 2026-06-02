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

// Export all data for a user
router.get("/export/:userId", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only export their own data
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }

    // Get user profile
    const profileResult = await db.execute(
      "SELECT * FROM profiles WHERE id = $1",
      [normalizedUserId]
    );

    // Get messages for this user only (filter by sender_id)
    const messagesResult = await db.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );

    // Get duas for this user only (assuming duas are user-specific)
    const duasResult = await db.execute(
      "SELECT * FROM duas WHERE user_id = $1 ORDER BY timestamp DESC",
      [normalizedUserId]
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      user: profileResult.rows[0] || null,
      messages: messagesResult.rows.map((row: any) => ({
        id: row.id,
        senderId: row.sender_id,
        text: decryptStoredField(row.text),
        type: row.type,
        audioData: decryptStoredField(row.audio_data),
        gifUrl: row.gif_url,
        imageData: decryptStoredField(row.image_data),
        timestamp: row.timestamp,
        liked: row.liked === 1,
        variant: row.variant,
        companionSticker: row.companion_sticker,
      })),
      duas: duasResult.rows.map((row: any) => ({
        id: row.id,
        arabic: row.arabic,
        translation: row.translation,
        author: row.author,
        timestamp: row.timestamp,
      })),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="grova-export-${normalizedUserId}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error("Failed to export data:", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Export messages only
router.get("/export/:userId/messages", rateLimiters.read, authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const normalizedUserId = getParam(userId);
    const authenticatedUserId = (req as any).user.id;

    // Ensure user can only export their own data
    if (normalizedUserId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only export your own data" });
      return;
    }

    const result = await db.execute(
      "SELECT * FROM messages WHERE deleted = 0 AND sender_id = $1 ORDER BY timestamp ASC",
      [normalizedUserId]
    );

    const messages = result.rows.map((row: any) => ({
      id: row.id,
      senderId: row.sender_id,
      text: decryptStoredField(row.text),
      type: row.type,
      audioData: decryptStoredField(row.audio_data),
      gifUrl: row.gif_url,
      imageData: decryptStoredField(row.image_data),
      timestamp: row.timestamp,
      liked: row.liked === 1,
      variant: row.variant,
      companionSticker: row.companion_sticker,
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="grova-messages-${normalizedUserId}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(messages);
  } catch (err) {
    console.error("Failed to export messages:", err);
    res.status(500).json({ error: "Failed to export messages" });
  }
});

export default router;
