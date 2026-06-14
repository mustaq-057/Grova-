import type { ApiMessage } from "./api";
import { isEphemeralMedia } from "./message-utils";
import { readSessionSnapshot } from "./profile-cache";

const CACHE_VERSION = 1;
const MAX_CACHED = 80;

type ChatCachePayload = {
  v: number;
  at: string;
  messages: ApiMessage[];
};

function cacheKey(userId: string): string {
  return `grova_chat_v${CACHE_VERSION}_${userId}`;
}

function keepUrlField(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const v = value.trim();
  if (v.startsWith("blob:") || v.startsWith("data:")) return undefined;
  if (v.startsWith("http") || v.startsWith("/api/")) return v;
  return undefined;
}

/** Strip heavy blobs so sessionStorage stays small and fast to parse. */
function slimMessage(m: ApiMessage): ApiMessage {
  const ephemeral = isEphemeralMedia(m);
  return {
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    type: m.type,
    timestamp: m.timestamp,
    liked: m.liked,
    deleted: m.deleted,
    variant: m.variant,
    companionSticker: m.companionSticker,
    reaction: m.reaction,
    replyToId: m.replyToId,
    replyToText: m.replyToText,
    replyToSenderId: m.replyToSenderId,
    gifUrl: m.gifUrl,
    imageUrl: ephemeral ? undefined : keepUrlField(m.imageUrl),
    imageData: ephemeral ? undefined : keepUrlField(m.imageData),
    audioData: keepUrlField(m.audioData),
    fileData: ephemeral ? undefined : keepUrlField(m.fileData),
    fileType: m.fileType,
    fileSize: m.fileSize,
    location: m.location,
    seenByPartner: m.seenByPartner,
    readAt: m.readAt,
    pinned: m.pinned,
    mediaViewMode: m.mediaViewMode,
    mediaOpenCount: m.mediaOpenCount,
    mediaOpenedAt: m.mediaOpenedAt,
    fontStyle: m.fontStyle,
    replyToFontStyle: m.replyToFontStyle,
    replyToImageUrl: m.replyToImageUrl,
  };
}

/** Sync read for first paint — avoids empty chat flash on enter. */
export function readChatCacheForCurrentUser(): ApiMessage[] {
  const uid = readSessionSnapshot()?.user?.id;
  if (!uid) return [];
  return readChatCache(uid) ?? [];
}

export function readChatCache(userId: string): ApiMessage[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatCachePayload;
    if (parsed.v !== CACHE_VERSION || !Array.isArray(parsed.messages)) return null;
    return parsed.messages.filter((m) => m?.id && m.timestamp);
  } catch {
    return null;
  }
}

export function clearChatCache(userId: string): void {
  try {
    sessionStorage.removeItem(cacheKey(userId));
  } catch {
    /* quota or private mode */
  }
}

export function writeChatCache(userId: string, messages: ApiMessage[]): void {
  try {
    const tail = messages.slice(-MAX_CACHED).map(slimMessage);
    const payload: ChatCachePayload = {
      v: CACHE_VERSION,
      at: new Date().toISOString(),
      messages: tail,
    };
    sessionStorage.setItem(cacheKey(userId), JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}
