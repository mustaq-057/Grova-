import type { ApiMessage } from "./api";
import { normalizeMessages } from "./message-utils";

export function tombstoneMessage(m: ApiMessage): ApiMessage {
  return {
    ...m,
    deleted: true,
    text: undefined,
    audioData: undefined,
    gifUrl: undefined,
    imageData: undefined,
    imageUrl: undefined,
    fileData: undefined,
  };
}

function pickMediaUrl(incoming?: string, prev?: string): string | undefined {
  if (!incoming) return prev;
  if (!prev) return incoming;
  const prevLocal = prev.startsWith("blob:") || prev.startsWith("data:");
  const incomingRemote = incoming.startsWith("http") || incoming.startsWith("/api/");
  if (prevLocal && incomingRemote) return incoming;
  return incoming;
}

/** Keep locally unsent rows tombstoned even if a stale poll returns full content. */
export function enforceUnsentMessages(
  messages: ApiMessage[],
  unsentIds: ReadonlySet<string>,
): ApiMessage[] {
  if (unsentIds.size === 0) return messages;
  return messages.map((m) => (unsentIds.has(m.id) ? tombstoneMessage(m) : m));
}

/** Merge server messages with local state (newest wins per id), sorted by time. */
export function mergeMessagesById(existing: ApiMessage[], incoming: ApiMessage[]): ApiMessage[] {
  const map = new Map<string, ApiMessage>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) {
    const prev = map.get(m.id);
    if (!prev) {
      map.set(m.id, m.deleted ? tombstoneMessage(m) : m);
      continue;
    }
    const deleted = Boolean(prev.deleted || m.deleted);
    if (deleted) {
      map.set(m.id, tombstoneMessage({ ...prev, ...m }));
      continue;
    }
    const incomingText = m.text ?? "";
    const prevText = prev.text ?? "";
    const text =
      incomingText === "…" && prevText && prevText !== "…" ? prevText : m.text ?? prev.text;
    map.set(m.id, {
      ...m,
      text,
      imageUrl: pickMediaUrl(m.imageUrl, prev.imageUrl),
      imageData: pickMediaUrl(m.imageData, prev.imageData),
      audioData: m.audioData ?? prev.audioData,
      fileData: pickMediaUrl(m.fileData, prev.fileData),
      fileType: m.fileType ?? prev.fileType,
      fileSize: m.fileSize ?? prev.fileSize,
      read: prev.read || m.read,
      readAt: prev.readAt ?? m.readAt,
      seenByPartner: m.seenByPartner || prev.seenByPartner,
      reaction: m.reaction ?? prev.reaction,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function hasLocalMediaPreview(m: ApiMessage): boolean {
  const urls = [m.imageUrl, m.imageData, m.fileData, m.audioData];
  return urls.some((u) => u?.startsWith("blob:") || u?.startsWith("data:"));
}

function outgoingContentMatches(optimistic: ApiMessage, server: ApiMessage): boolean {
  if (optimistic.type === "text") {
    const a = optimistic.text ?? "";
    const b = server.text ?? "";
    return a.length > 0 && a === b;
  }
  if (optimistic.type === "gif") {
    return Boolean(optimistic.gifUrl && optimistic.gifUrl === server.gifUrl);
  }
  if (optimistic.type === "image") {
    return Boolean(
      (optimistic.imageUrl && optimistic.imageUrl === server.imageUrl) ||
        (optimistic.imageData && optimistic.imageData === server.imageData),
    );
  }
  if (optimistic.type === "audio") {
    return Boolean(optimistic.audioData && optimistic.audioData === server.audioData);
  }
  if (optimistic.type === "video") {
    return (
      (optimistic.fileData && optimistic.fileData === server.fileData) ||
      (optimistic.text ?? "") === (server.text ?? "")
    );
  }
  return (optimistic.text ?? "") === (server.text ?? "");
}

/** Match an optimistic outgoing row to its server copy. */
export function findOptimisticMatch(
  optimistic: ApiMessage,
  serverMessages: ApiMessage[],
): ApiMessage | undefined {
  const optTime = new Date(optimistic.timestamp).getTime();
  return serverMessages.find((f) => {
    if (f.id === optimistic.id) return false;
    if (f.senderId !== optimistic.senderId || f.type !== optimistic.type) return false;
    const serverTime = new Date(f.timestamp).getTime();
    if (Math.abs(serverTime - optTime) > 30_000) return false;
    if (optimistic.type === "text" || optimistic.type === "gif") {
      return outgoingContentMatches(optimistic, f);
    }
    // Hosted uploads: optimistic row uses blob preview, server row uses Cloudinary URL.
    if (hasLocalMediaPreview(optimistic)) {
      return serverTime >= optTime - 5_000;
    }
    if (outgoingContentMatches(optimistic, f)) return true;
    return serverTime >= optTime - 5_000;
  });
}

export function isSameOutgoingMessage(a: ApiMessage, b: ApiMessage): boolean {
  return Boolean(findOptimisticMatch(a, [b]));
}

/** Drop optimistic rows once the server has the real message, then merge fresh data. */
export function reconcilePendingOptimistics(
  prev: ApiMessage[],
  fresh: ApiMessage[],
  pendingIds: Set<string>,
): ApiMessage[] {
  const pending = prev.filter((m) => pendingIds.has(m.id));
  const cleaned = prev.filter((m) => {
    if (!pendingIds.has(m.id)) return true;
    const match = findOptimisticMatch(m, fresh);
    if (match) {
      pendingIds.delete(m.id);
      return false;
    }
    return true;
  });
  const merged = mergeMessagesById(cleaned, fresh);
  const stillPending = pending.filter((m) => pendingIds.has(m.id));
  if (stillPending.length === 0) return merged;
  return mergeMessagesById(merged, stillPending);
}

/** Swap temp upload/send row for the server row without duplicate entries. */
export function replaceOptimisticMessage(
  prev: ApiMessage[],
  tempId: string,
  display: ApiMessage,
  _senderId: string,
): ApiMessage[] {
  const withoutTemp = prev.filter((m) => m.id !== tempId);
  if (withoutTemp.some((m) => m.id === display.id)) return withoutTemp;
  return [...withoutTemp, display];
}

export async function fetchAndMergeMessages(current: ApiMessage[], getMessages: () => Promise<{ messages?: ApiMessage[] }>): Promise<ApiMessage[]> {
  const data = await getMessages();
  const normalized = await normalizeMessages(data.messages ?? []);
  return mergeMessagesById(current, normalized);
}
