import { randomUUID } from "crypto";
import db from "./db";
import { broadcast } from "./sse";
import { encryptStoredField, decryptStoredField } from "./message-storage";
import { logger } from "./logger";

async function deliverScheduledRow(row: Record<string, unknown>): Promise<void> {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  const senderId = String(row.sender_id);
  const type = String(row.type || "text");
  const text = row.text ? decryptStoredField(row.text) : undefined;
  const audioData = decryptStoredField(row.audio_data);
  const gifUrl = row.gif_url ? String(row.gif_url) : undefined;
  const imageData = decryptStoredField(row.image_data);
  const variant = row.variant ? String(row.variant) : "default";
  const companionSticker = row.companion_sticker ? String(row.companion_sticker) : undefined;

  await db.execute(
    `INSERT INTO messages (id, sender_id, text, type, audio_data, gif_url, image_data, image_url, timestamp, liked, deleted, variant, companion_sticker)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      senderId,
      encryptStoredField(text) ?? null,
      type,
      encryptStoredField(audioData) ?? null,
      gifUrl ?? null,
      encryptStoredField(imageData) ?? null,
      null,
      timestamp,
      0,
      0,
      variant,
      companionSticker ?? null,
    ],
  );

  await db.execute("UPDATE scheduled_messages SET sent = 1 WHERE id = $1", [String(row.id)]);

  broadcast("new-message", {
    id,
    senderId,
    text,
    type,
    audioData,
    gifUrl,
    imageData,
    timestamp,
    liked: false,
    variant,
    companionSticker,
  });
}

export function startScheduleWorker(): void {
  const tick = async () => {
    try {
      const now = new Date().toISOString();
      const result = await db.execute(
        "SELECT * FROM scheduled_messages WHERE sent = 0 AND scheduled_at <= $1 ORDER BY scheduled_at ASC LIMIT 20",
        [now],
      );
      for (const row of result.rows as Record<string, unknown>[]) {
        try {
          await deliverScheduledRow(row);
        } catch (err) {
          logger.error({ err, id: row.id }, "Failed to deliver scheduled message");
        }
      }
    } catch (err) {
      logger.error({ err }, "Schedule worker tick failed");
    }
  };

  void tick();
  setInterval(tick, 30_000);
  logger.info("Schedule message worker started");
}
