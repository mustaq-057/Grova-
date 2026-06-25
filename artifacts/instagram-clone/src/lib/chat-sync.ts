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

function isLocalMediaUrl(url?: string): boolean {
  return Boolean(url?.startsWith("blob:") || url?.startsWith("data:"));
}

function isRemoteMediaUrl(url?: string): boolean {
  return Boolean(url?.startsWith("http") || url?.startsWith("/api/"));
}

export function mergeOptimisticWithServer(optimistic: ApiMessage, server: ApiMessage): ApiMessage {
  return {
    ...server,
    clientUniqueId: optimistic.clientUniqueId || optimistic.id,
    text: server.text ?? optimistic.text,
    gifUrl: server.gifUrl || optimistic.gifUrl,
    imageUrl: server.imageUrl || optimistic.imageUrl,
    imageData: server.imageData || optimistic.imageData,
    fileData: server.fileData || optimistic.fileData,
    audioData: server.audioData ?? optimistic.audioData,
    fileType: server.fileType ?? optimistic.fileType,
    fileSize: server.fileSize ?? optimistic.fileSize,
    companionSticker: server.companionSticker ?? optimistic.companionSticker,
    mediaViewMode: server.mediaViewMode ?? optimistic.mediaViewMode,
    fontStyle: server.fontStyle ?? optimistic.fontStyle,
  };
}

/** Re-attach rows that vanished during a bad optimistic reconcile / poll race. */
export function preserveDroppedMessages(
  prev: ApiMessage[],
  next: ApiMessage[],
  opts?: { keepIds?: ReadonlySet<string> },
): ApiMessage[] {
  const nextIds = new Set(next.map((m) => m.id));
  const missing = prev.filter((m) => {
    if (nextIds.has(m.id) || m.deleted) return false;
    if (opts?.keepIds && !opts.keepIds.has(m.id)) return false;
    return true;
  });
  if (missing.length === 0) return next;
  return mergeMessagesById(next, missing);
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
      clientUniqueId: prev.clientUniqueId || m.clientUniqueId,
      text,
      imageUrl: m.imageUrl || prev.imageUrl,
      imageData: m.imageData || prev.imageData,
      audioData: m.audioData ?? prev.audioData,
      fileData: m.fileData || prev.fileData,
      fileType: m.fileType ?? prev.fileType,
      fileSize: m.fileSize ?? prev.fileSize,
      read: prev.read || m.read,
      readAt: prev.readAt ?? m.readAt,
      seenByPartner: m.seenByPartner || prev.seenByPartner,
      reaction: m.reaction ?? prev.reaction,
      fontStyle: m.fontStyle ?? prev.fontStyle,
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
    if (optimistic.fileData && server.fileData && optimistic.fileData === server.fileData) {
      return true;
    }
    if (
      optimistic.fileSize != null &&
      server.fileSize != null &&
      optimistic.fileSize === server.fileSize &&
      (optimistic.text ?? "") === (server.text ?? "")
    ) {
      return true;
    }
    return false;
  }
  if (optimistic.type === "file") {
    const optText = (optimistic.text ?? "").replace(/ · Uploading…$/, "");
    return optText === (server.text ?? "");
  }
  return (optimistic.text ?? "") === (server.text ?? "");
}

/** Match an optimistic outgoing row to its server copy. */
export function findOptimisticMatch(
  optimistic: ApiMessage,
  serverMessages: ApiMessage[],
  opts?: { allowBlobMatch?: boolean },
): ApiMessage | undefined {
  const optTime = new Date(optimistic.timestamp).getTime();
  const allowBlob = opts?.allowBlobMatch ?? false;

  const candidates = serverMessages.filter((f) => {
    if (f.id === optimistic.id) return false;
    if (f.senderId !== optimistic.senderId || f.type !== optimistic.type) return false;
    const serverTime = new Date(f.timestamp).getTime();
    const dt = Math.abs(serverTime - optTime);

    if (optimistic.type === "text") {
      return dt <= 120_000 && outgoingContentMatches(optimistic, f);
    }
    if (optimistic.type === "gif") {
      return dt <= 120_000 && outgoingContentMatches(optimistic, f);
    }
    // Never guess blob uploads during poll merge — wait for send/SSE confirmation.
    if (hasLocalMediaPreview(optimistic)) {
      if (!allowBlob) return false;
      if (optimistic.type === "video" || optimistic.type === "file") {
        return (
          dt <= 120_000 &&
          serverTime >= optTime - 10_000 &&
          outgoingContentMatches(optimistic, f)
        );
      }
      return dt <= 120_000 && serverTime >= optTime - 5_000;
    }
    if (outgoingContentMatches(optimistic, f)) return dt <= 120_000;
    return dt <= 120_000 && serverTime >= optTime - 3_000;
  });

  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, f) => {
    const d = Math.abs(new Date(f.timestamp).getTime() - optTime);
    const bd = Math.abs(new Date(best.timestamp).getTime() - optTime);
    return d < bd ? f : best;
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
      match.clientUniqueId = m.clientUniqueId || m.id;
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

/** Swap temp upload/send row for the server row in-place (stable scroll + no flash). */
export function replaceOptimisticMessage(
  prev: ApiMessage[],
  tempId: string,
  display: ApiMessage,
  _senderId: string,
): ApiMessage[] {
  const idx = prev.findIndex((m) => m.id === tempId);
  const merged = idx >= 0 ? mergeOptimisticWithServer(prev[idx]!, display) : display;

  if (prev.some((m) => m.id === merged.id && m.id !== tempId)) {
    return prev
      .map((m) => (m.id === merged.id ? { ...m, clientUniqueId: tempId } : m))
      .filter((m) => m.id !== tempId);
  }

  if (idx >= 0) {
    const next = [...prev];
    next[idx] = merged;
    return next;
  }

  if (prev.some((m) => m.id === merged.id)) return prev.filter((m) => m.id !== tempId);
  return [...prev, merged];
}

/** After remote media finishes loading, swap local preview for the hosted URL. */
export function commitRemoteMediaUrl(
  prev: ApiMessage[],
  messageId: string,
  field: "imageUrl" | "imageData" | "gifUrl" | "fileData",
  remoteUrl: string,
): ApiMessage[] {
  const idx = prev.findIndex((m) => m.id === messageId);
  if (idx < 0) return prev;
  const row = prev[idx]!;
  if (!isRemoteMediaUrl(remoteUrl)) return prev;
  const hasLocal =
    isLocalMediaUrl(row.imageUrl) ||
    isLocalMediaUrl(row.imageData) ||
    isLocalMediaUrl(row.fileData);
  if (!hasLocal) return prev;
  const next = [...prev];
  const patch: Partial<ApiMessage> = {};
  if (field === "imageUrl" || field === "imageData") {
    patch.imageUrl = remoteUrl;
    if (isLocalMediaUrl(row.imageData)) patch.imageData = undefined;
    if (isLocalMediaUrl(row.imageUrl) && field === "imageData") patch.imageUrl = remoteUrl;
  } else if (field === "fileData") {
    patch.fileData = remoteUrl;
  } else {
    patch[field] = remoteUrl;
  }
  next[idx] = { ...row, ...patch };
  return next;
}

export async function fetchAndMergeMessages(current: ApiMessage[], getMessages: () => Promise<{ messages?: ApiMessage[] }>): Promise<ApiMessage[]> {
  const data = await getMessages();
  const normalized = await normalizeMessages(data.messages ?? []);
  return mergeMessagesById(current, normalized);
}
