import { Router } from "express";
import { randomUUID } from "crypto";
import { broadcast } from "../lib/sse";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";
import db from "../lib/db";
import { encryptStoredField, decryptStoredField } from "../lib/message-storage";
import { authenticate, optionalAuth } from "../lib/auth-middleware";
import type { AuthenticatedRequest } from "../types";
import { rateLimiters } from "../lib/security";
import { validators, validateBody } from "../lib/validation";
import { getChatClearedAtForUser } from "../lib/chat-clear";

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: "text" | "audio" | "heart" | "sticker" | "gif" | "image" | "video" | "file" | "location";
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  imageUrl?: string;
  fileData?: string;
  fileType?: string;
  fileSize?: number;
  location?: { lat: number; lng: number };
  timestamp: string;
  liked: boolean;
  deleted?: boolean;
  deletedAt?: string;
  variant?: "cute" | "default";
  companionSticker?: string;
  reaction?: string;
  threadId?: string;
  threadParentId?: string;
  threadReplyCount?: number;
  mediaViewMode?: "keep" | "once" | "twice";
  mediaOpenCount?: number;
  mediaOpenedAt?: string;
}

const router = Router();

// Rate limiting disabled for development
// router.use(rateLimiters.messages);

// Input validation
function validateMessageType(type: string): type is Message["type"] {
  return ["text", "audio", "heart", "sticker", "gif", "image", "video", "file", "location"].includes(type);
}

function validateVariant(variant: unknown): variant is Message["variant"] {
  return typeof variant === "string" && (variant === "cute" || variant === "default");
}

function parseMediaViewMode(companionSticker?: string): "keep" | "once" | "twice" {
  if (companionSticker === "__vm:once") return "once";
  if (companionSticker === "__vm:twice") return "twice";
  return "keep";
}

// Helper function to convert database row to Message
function rowToMessage(row: Record<string, unknown>): Message & { readAt?: string; seenByPartner?: boolean } {
  const partnerRead = row.partner_read_at ? String(row.partner_read_at) : undefined;
  let location: { lat: number; lng: number } | undefined;
  if (row.location) {
    try {
      location = JSON.parse(String(row.location));
    } catch {
      location = undefined;
    }
  }
  const mediaViewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : undefined);
  const mediaOpenCount = Number(row.viewer_media_open_count || 0);
  const mediaOpenedAt = row.partner_media_opened_at ? String(row.partner_media_opened_at) : undefined;
  return {
    id: String(row.id),
    senderId: String(row.sender_id),
    text: row.text ? decryptStoredField(row.text) : undefined,
    type: row.type as Message["type"],
    audioData: decryptStoredField(row.audio_data),
    gifUrl: row.gif_url ? String(row.gif_url) : undefined,
    imageData: decryptStoredField(row.image_data),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    fileData: decryptStoredField(row.file_data),
    fileType: row.file_type ? String(row.file_type) : undefined,
    fileSize: row.file_size ? Number(row.file_size) : undefined,
    location,
    timestamp: String(row.timestamp),
    liked: row.liked === 1 || row.liked === true,
    deleted: row.deleted === 1 || row.deleted === true,
    deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
    variant: row.variant === "cute" || row.variant === "default" ? row.variant : undefined,
    companionSticker: row.companion_sticker ? String(row.companion_sticker) : undefined,
    reaction: row.reaction ? String(row.reaction) : undefined,
    threadId: row.thread_id ? String(row.thread_id) : undefined,
    threadParentId: row.thread_parent_id ? String(row.thread_parent_id) : undefined,
    threadReplyCount: row.thread_reply_count ? Number(row.thread_reply_count) : undefined,
    mediaViewMode,
    mediaOpenCount,
    mediaOpenedAt,
    readAt: partnerRead,
    seenByPartner: Boolean(partnerRead),
  };
}

router.get("/messages", optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user?.id ?? "me";
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    // Enhanced pagination with cursor-based support and total count
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100 per request
    const offset = parseInt(req.query.offset as string) || 0;
    const cursor = req.query.cursor as string | undefined;

    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);

    let query = `
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction,
             (SELECT read_at FROM message_read_receipts WHERE message_id = m.id AND user_id = ? LIMIT 1) as partner_read_at,
             (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count,
             (SELECT MAX(opened_at) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as partner_media_opened_at
      FROM messages m
      WHERE m.deleted = 0 AND (m.sender_id = ? OR m.sender_id = ?)
    `;
    const params: unknown[] = [partnerId, authenticatedUserId, partnerId, authenticatedUserId, partnerId];

    if (chatClearedAt) {
      query += " AND m.timestamp > ?";
      params.push(chatClearedAt);
    }

    // Cursor-based pagination for better performance
    if (cursor) {
      query += " AND m.timestamp < ?";
      params.push(cursor);
    }

    query += " ORDER BY m.timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const result = await db.query(query, params);
    console.log("Database query result:", result.rows.length, "messages found");
    const messages = result.rows.map(rowToMessage).reverse();

    let countSql =
      "SELECT COUNT(*) as total FROM messages WHERE deleted = 0 AND (sender_id = ? OR sender_id = ?)";
    const countParams: unknown[] = [authenticatedUserId, partnerId];
    if (chatClearedAt) {
      countSql += " AND timestamp > ?";
      countParams.push(chatClearedAt);
    }
    const countResult = await db.query(countSql, countParams);
    const total = Number(countResult.rows[0]?.total || 0);
    
    // Return pagination metadata
    res.json({
      messages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        nextCursor: messages.length > 0 ? messages[messages.length - 1].timestamp : null
      }
    });
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/messages/unread-count", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const chatClearedAt = await getChatClearedAtForUser(authenticatedUserId);
    const sinceRaw = typeof req.query.since === "string" ? req.query.since : undefined;
    const sinceOpened = sinceRaw && !Number.isNaN(new Date(sinceRaw).getTime()) ? sinceRaw : undefined;

    let effectiveSince = chatClearedAt;
    if (sinceOpened) {
      if (!effectiveSince || sinceOpened > effectiveSince) {
        effectiveSince = sinceOpened;
      }
    }

    let sql = `
      SELECT COUNT(*) AS count
      FROM messages m
      WHERE m.deleted = 0
        AND m.sender_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM message_read_receipts r
          WHERE r.message_id = m.id AND r.user_id = ?
        )
    `;
    const params: unknown[] = [partnerId, authenticatedUserId];
    if (effectiveSince) {
      sql += " AND m.timestamp > ?";
      params.push(effectiveSince);
    }

    const result = await db.query(sql, params);
    const row = result.rows[0] as { count?: number | string };
    const count = Number(row?.count ?? 0);
    res.json({ count: Number.isFinite(count) ? count : 0 });
  } catch (err) {
    console.error("Failed to fetch unread chat count:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

router.post("/messages", authenticate, validateBody({
  senderId: validators.nonEmptyString,
  type: validators.enum(["text", "audio", "heart", "sticker", "gif", "image", "video", "file", "location"]),
}), async (req, res) => {
  const body = req.body as Partial<Message>;
  const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
  let { senderId, text, type, audioData, gifUrl, imageData, imageUrl, fileData, fileType, fileSize, location, variant, companionSticker } = body;

  if (senderId !== authenticatedUserId) {
    senderId = authenticatedUserId;
  }

  // Additional validation
  if (text && text.length > 10000) {
    res.status(400).json({ error: "text is too long (max 10000 characters)" });
    return;
  }

  if (audioData && audioData.length > 10_000_000) {
    res.status(400).json({ error: "audio data is too large (max 10MB)" });
    return;
  }

  if (imageData && imageData.length > 10_000_000) {
    res.status(400).json({ error: "image data is too large (max 10MB)" });
    return;
  }

  if (fileData && fileData.length > 28_000_000) {
    res.status(400).json({ error: "file data is too large (max 20MB)" });
    return;
  }

  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const encryptedText = encryptStoredField(text ?? undefined);
  const encryptedAudio = encryptStoredField(audioData);
  const encryptedImage = encryptStoredField(imageData);
  const encryptedFile = encryptStoredField(fileData);
  const locationJson = location ? JSON.stringify(location) : null;

  try {
    await db.execute(
      `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, file_data, file_type, file_size, location, timestamp, liked, deleted, variant, companion_sticker)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        senderId!,
        encryptedText ?? null,
        type || "text",
        encryptedAudio ?? null,
        gifUrl ?? null,
        encryptedImage ?? null,
        imageUrl ?? null,
        encryptedFile ?? null,
        fileType ?? null,
        fileSize ?? null,
        locationJson,
        timestamp,
        0,
        0,
        variant ?? "default",
        companionSticker ?? null,
      ]
    );
    const msg: Message = {
      id,
      senderId: senderId!,
      text,
      type: (type as Message["type"]) || "text",
      audioData,
      gifUrl,
      imageData,
      imageUrl,
      fileData,
      fileType,
      fileSize,
      location,
      timestamp,
      liked: false,
      variant: variant ?? "default",
      companionSticker,
    };

    const partnerId = senderId === "me" ? "wife" : "me";
    broadcast("new-message", msg, partnerId);

    const fromName = await profileDisplayName(senderId!);
    if (companionSticker === "🤲") {
      await postCoupleActivity("dua", senderId!, fromName, "shared a dua with you 🤲").catch(() => {});
    } else if (type === "location") {
      await postCoupleActivity("location", senderId!, fromName, "shared their location").catch(() => {});
    } else if (type === "text" && text && /^📞 (Audio|Video) call (started|ended)/.test(text)) {
      const snippet = text.includes("ended") ? "ended a call" : "started a call";
      await postCoupleActivity("call", senderId!, fromName, snippet).catch(() => {});
    }

    res.json(msg);
  } catch (err) {
    console.error("Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});

router.post("/messages/:id/open-media", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db.query(
      `SELECT m.*,
              (SELECT COUNT(*) FROM message_media_opens WHERE message_id = m.id AND user_id = ?) as viewer_media_open_count
       FROM messages m
       WHERE m.id = ?`,
      [authenticatedUserId, messageId],
    );
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row || row.deleted === 1 || row.deleted === true) {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    const senderId = String(row.sender_id);
    if (senderId !== authenticatedUserId && senderId !== partnerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const viewMode = parseMediaViewMode(row.companion_sticker ? String(row.companion_sticker) : undefined);
    const limit = viewMode === "once" ? 1 : viewMode === "twice" ? 2 : 0;
    const currentCount = Number(row.viewer_media_open_count || 0);
    const mediaUrl =
      (row.type === "image" ? (row.image_url ? String(row.image_url) : decryptStoredField(row.image_data)) : undefined) ||
      (row.type === "video" ? decryptStoredField(row.file_data) : undefined);
    if (!mediaUrl || (row.type !== "image" && row.type !== "video")) {
      res.status(400).json({ error: "Message does not contain viewable media" });
      return;
    }
    let newCount = currentCount;
    let openedAt: string | undefined;
    if (limit > 0 && senderId !== authenticatedUserId) {
      if (currentCount >= limit) {
        res.status(410).json({ error: "Media no longer available" });
        return;
      }
      openedAt = new Date().toISOString();
      await db.execute(
        "INSERT INTO message_media_opens (id, message_id, user_id, opened_at) VALUES (?, ?, ?, ?)",
        [randomUUID(), messageId, authenticatedUserId, openedAt],
      );
      newCount = currentCount + 1;
      broadcast("message-media-opened", { messageId, userId: authenticatedUserId, mediaOpenCount: newCount, mediaOpenedAt: openedAt });
    }
    res.json({ ok: true, url: mediaUrl, kind: row.type === "video" ? "video" : "image", mediaOpenCount: newCount, mediaOpenedAt: openedAt });
  } catch (err) {
    console.error("Failed to open media message:", err);
    res.status(500).json({ error: "Failed to open media" });
  }
});

router.patch("/messages/:id/like", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const partnerId = authenticatedUserId === "me" ? "wife" : "me";
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0];

    if (!row || row.deleted === 1) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Only allow liking messages from the user or their partner
    if (row.sender_id !== authenticatedUserId && row.sender_id !== partnerId) {
      res.status(403).json({ error: "Forbidden: Can only like messages from you or your partner" });
      return;
    }

    const newLiked = row.liked === 1 || row.liked === true ? 0 : 1;
    await db.execute("UPDATE messages SET liked = ? WHERE id = ?", [newLiked, messageId]);

    const msg = rowToMessage(row);
    msg.liked = newLiked === 1;

    broadcast("message-liked", { ...msg, likedBy: authenticatedUserId }, String(row.sender_id));
    res.json({ ...msg, likedBy: authenticatedUserId });
  } catch (err) {
    res.status(500).json({ error: "Failed to like message" });
  }
});

router.patch("/messages/:id/edit", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id;
    if (!authenticatedUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { text, userId } = req.body as { text?: string; userId?: string };
    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0];

    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Only allow editing own messages
    if (row.sender_id !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only edit your own messages" });
      return;
    }

    // Only allow editing text messages
    if (row.type !== "text") {
      res.status(400).json({ error: "Can only edit text messages" });
      return;
    }

    const encryptedText = encryptStoredField(text.trim());
    await db.execute(
      "UPDATE messages SET text = ? WHERE id = ?",
      [encryptedText, messageId]
    );

    const msg = rowToMessage(row);
    msg.text = text.trim();

    broadcast("message-edited", msg);
    res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("Failed to edit message:", err);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

router.delete("/messages/:id", authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as AuthenticatedRequest).user!.id;
    const messageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await db.query(`
      SELECT m.*,
             (SELECT emoji FROM message_reactions WHERE message_id = m.id ORDER BY timestamp DESC LIMIT 1) as reaction
      FROM messages m
      WHERE m.id = ?
    `, [messageId]);
    const row = result.rows[0] as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    if (String(row.sender_id) !== authenticatedUserId) {
      res.status(403).json({ error: "You can only unsend your own messages" });
      return;
    }

    const alreadyDeleted = row.deleted === 1 || row.deleted === true;
    const deletedAt = row.deleted_at ? String(row.deleted_at) : new Date().toISOString();

    if (!alreadyDeleted) {
      try {
        await db.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ?, text = NULL, audio_data = NULL, gif_url = NULL, image_data = NULL, image_url = NULL, file_data = NULL, location = NULL WHERE id = ?",
          [deletedAt, messageId]
        );
      } catch (updateErr) {
        console.error("Full message delete update failed, retrying minimal:", updateErr);
        await db.execute(
          "UPDATE messages SET deleted = 1, deleted_at = ? WHERE id = ?",
          [deletedAt, messageId]
        );
      }
    }

    const msg = rowToMessage(row);
    msg.text = undefined;
    msg.audioData = undefined;
    msg.gifUrl = undefined;
    msg.imageData = undefined;
    msg.imageUrl = undefined;
    msg.fileData = undefined;
    msg.location = undefined;
    msg.deleted = true;
    msg.deletedAt = deletedAt;

    broadcast("message-deleted", msg);
    res.json(msg);
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// DELETE /messages endpoint removed - too dangerous as it allows any authenticated user to delete ALL messages
// Individual message deletion is still available via DELETE /messages/:id

export default router;
