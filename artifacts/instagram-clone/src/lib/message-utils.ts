import type { ApiMessage } from "./api";
import {
  decryptPayload,
  E2E_PREFIX,
  type EncryptedMessageBody,
  isEncryptionReady,
} from "./crypto";
import { calendarDayKey, formatClockInZone, getUserTimeZone } from "./timezones";

/** Server AES blobs — legacy 3-part or versioned 4-part when decrypt fails. */
const SERVER_CIPHER_RE =
  /^(?:\d+:)?[0-9a-f]{16,}:[0-9a-f]{16,}:[0-9a-f]+$/i;

export function isE2ECiphertext(text?: string): boolean {
  return Boolean(text?.startsWith(E2E_PREFIX));
}

export function scrubUndecryptedServerText(msg: ApiMessage): ApiMessage {
  if (msg.text && SERVER_CIPHER_RE.test(msg.text)) {
    return { ...msg, text: "🔒 Could not read this message (encryption key changed?)" };
  }
  return msg;
}

function scrubLockedE2E(msg: ApiMessage): ApiMessage {
  if (isE2ECiphertext(msg.text)) {
    return {
      ...msg,
      text: "🔒 Encrypted message — log out and sign in again with your code.",
    };
  }
  return msg;
}

export async function decryptMessage(msg: ApiMessage): Promise<ApiMessage> {
  if (!isE2ECiphertext(msg.text)) {
    return scrubUndecryptedServerText(msg);
  }

  if (!isEncryptionReady()) {
    return scrubLockedE2E(msg);
  }

  try {
    const body = await decryptPayload<EncryptedMessageBody>(msg.text!.slice(E2E_PREFIX.length));
    return scrubUndecryptedServerText({
      ...msg,
      text: body.text,
      audioData: body.audioData,
      gifUrl: body.gifUrl,
      imageData: body.imageData,
      type: body.type as ApiMessage["type"],
      variant: body.variant as ApiMessage["variant"],
      companionSticker: body.companionSticker,
    });
  } catch {
    return scrubLockedE2E({ ...msg, text: "🔒 Could not decrypt this message" });
  }
}

export async function decryptMessages(msgs: ApiMessage[]): Promise<ApiMessage[]> {
  if (msgs.length <= 50) {
    return Promise.all(msgs.map(decryptMessage));
  }
  const CHUNK = 40;
  const out: ApiMessage[] = [];
  for (let i = 0; i < msgs.length; i += CHUNK) {
    const slice = msgs.slice(i, i + CHUNK);
    const decrypted = await Promise.all(slice.map(decryptMessage));
    out.push(...decrypted);
    if (i + CHUNK < msgs.length) {
      await new Promise<void>((r) => {
        requestAnimationFrame(() => r());
      });
    }
  }
  return out;
}

/** Fast first paint while full decrypt runs in the background. */
export function previewMessagesForDisplay(msgs: ApiMessage[]): ApiMessage[] {
  return msgs.map((m) => {
    if (!isE2ECiphertext(m.text)) return scrubUndecryptedServerText(m);
    if (!isEncryptionReady()) return scrubLockedE2E(m);
    return { ...m, text: "…" };
  });
}

export async function normalizeMessages(msgs: ApiMessage[]): Promise<ApiMessage[]> {
  if (msgs.length === 0) return [];
  const needsDecrypt = msgs.some((m) => isE2ECiphertext(m.text));
  if (!needsDecrypt) return msgs.map(scrubUndecryptedServerText);
  return decryptMessages(msgs);
}

/**
 * Plaintext for UI + API body. Server encrypts at rest (no client e2e: prefix) so chat never shows blobs.
 */
export async function prepareOutgoingMessage(
  partial: Partial<ApiMessage> & { senderId: string },
): Promise<Partial<ApiMessage>> {
  return {
    senderId: partial.senderId,
    text: partial.text,
    type: partial.type ?? "text",
    audioData: partial.audioData,
    gifUrl: partial.gifUrl,
    imageData: partial.imageData,
    imageUrl: partial.imageUrl,
    fileData: partial.fileData,
    fileType: partial.fileType,
    fileSize: partial.fileSize,
    location: partial.location,
    variant: partial.variant,
    companionSticker: partial.companionSticker,
    replyToId: partial.replyToId,
    replyToText: partial.replyToText,
    replyToSenderId: partial.replyToSenderId,
  };
}

export function parseMediaViewMode(companionSticker?: string): "keep" | "once" | "twice" {
  if (companionSticker === "__vm:once") return "once";
  if (companionSticker === "__vm:twice") return "twice";
  return "keep";
}

/** Optimistic row shown immediately while sending (always human-readable). */
export function buildOptimisticMessage(
  partial: Partial<ApiMessage> & { senderId: string },
  id: string,
): ApiMessage {
  const mediaViewMode = partial.mediaViewMode ?? parseMediaViewMode(partial.companionSticker);
  const ephemeral = mediaViewMode === "once" || mediaViewMode === "twice";

  const keepLocalPreview =
    Boolean(partial.fileData?.startsWith("blob:")) || Boolean(partial.imageUrl?.startsWith("blob:"));

  return {
    id,
    senderId: partial.senderId,
    text: partial.text,
    type: (partial.type as ApiMessage["type"]) ?? "text",
    audioData: partial.audioData,
    gifUrl: partial.gifUrl,
    imageData: ephemeral && !keepLocalPreview ? undefined : partial.imageData,
    imageUrl: ephemeral && !keepLocalPreview ? undefined : partial.imageUrl,
    fileData: ephemeral && !keepLocalPreview ? undefined : partial.fileData,
    fileType: partial.fileType,
    fileSize: partial.fileSize,
    location: partial.location,
    timestamp: new Date().toISOString(),
    liked: false,
    variant: partial.variant,
    companionSticker: partial.companionSticker,
    replyToId: partial.replyToId,
    replyToText: partial.replyToText,
    replyToSenderId: partial.replyToSenderId,
    mediaViewMode: ephemeral ? mediaViewMode : partial.mediaViewMode,
  };
}

/** Legacy replies stored as `↩ quoted…\nbody` in message text. */
export function parseLegacyReply(text: string): { quoted: string; body: string } | null {
  if (!text.startsWith("↩")) return null;
  const newline = text.indexOf("\n");
  if (newline < 0) return null;
  const quoted = text.slice(1).trimStart().replace(/…$/, "").trim();
  const body = text.slice(newline + 1);
  if (!quoted || !body) return null;
  return { quoted, body };
}

export function messagePreview(msg: ApiMessage): string {
  if (msg.type === "location") return "📍 Shared location";
  if (msg.type === "audio") return "Voice message";
  if (msg.type === "image") return "Photo";
  if (msg.type === "video") return "Video";
  if (msg.type === "gif") return "GIF";
  if (msg.type === "file") return msg.text || "File";
  if (msg.type === "sticker") return msg.text || "Sticker";
  if (msg.text && SERVER_CIPHER_RE.test(msg.text)) return "Message";
  return msg.text || "Message";
}

export function formatPresence(lastSeen: number | undefined): { label: string; online: boolean } {
  if (!lastSeen) return { label: "Active a while ago", online: false };

  const diff = Date.now() - lastSeen;
  if (diff < 0) return { label: "Active now", online: true };

  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);

  if (diff < 60_000) {
    const secs = Math.max(1, Math.floor(diff / 1000));
    if (secs < 15) return { label: "Active now", online: true };
    return { label: `Active ${secs} sec ago`, online: true };
  }

  if (mins < 60) {
    const online = diff < 120_000;
    const label = mins === 1 ? "Active 1 min ago" : `Active ${mins} min ago`;
    return { label, online };
  }

  if (hrs < 24) {
    const label = hrs === 1 ? "Active 1 hour ago" : `Active ${hrs} hours ago`;
    return { label, online: false };
  }

  if (diff < 172_800_000) return { label: "Active yesterday", online: false };

  const days = Math.floor(diff / 86_400_000);
  if (days < 7) {
    const label = days === 1 ? "Active 1 day ago" : `Active ${days} days ago`;
    return { label, online: false };
  }
  if (days < 14) return { label: "Active 1 week ago", online: false };

  const weeks = Math.floor(days / 7);
  const label = weeks === 1 ? "Active 1 week ago" : `Active ${weeks} weeks ago`;
  return { label, online: false };
}

/** Format read time in the reader's home timezone (partner country clock). */
export function formatSeenTime(iso: string, readerUserId?: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const timeZone = getUserTimeZone(readerUserId);
  const now = new Date();
  const readDay = calendarDayKey(d, timeZone);
  const todayDay = calendarDayKey(now, timeZone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = calendarDayKey(yesterday, timeZone);
  const time = formatClockInZone(d, timeZone, true);

  if (readDay === todayDay) return time;
  if (readDay === yesterdayDay) return `Yesterday ${time}`;
  const date = new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: "short",
    day: "numeric",
  }).format(d);
  return `${date} ${time}`;
}

/** "Just seen" or "Seen · 3:45 PM IST" — only on the last outgoing message in the thread that was read. */
export function buildSeenLabel(
  msg: ApiMessage,
  isMe: boolean,
  lastSeenOutgoingId: string | null,
  partnerId?: string,
): string | undefined {
  if (!isMe || !msg.seenByPartner || msg.deleted || msg.id !== lastSeenOutgoingId) return undefined;
  if (msg.readAt) {
    const readMs = Date.now() - new Date(msg.readAt).getTime();
    if (readMs >= 0 && readMs < 120_000) return "Just seen";
    const time = formatSeenTime(msg.readAt, partnerId);
    return time ? `Seen · ${time}` : "Seen";
  }
  return "Seen";
}

export function findLastSeenOutgoingId(messages: ApiMessage[], myId: string | undefined): string | null {
  if (!myId) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.deleted || m.pinned) continue;
    if (m.senderId === myId && m.seenByPartner) return m.id;
  }
  return null;
}
