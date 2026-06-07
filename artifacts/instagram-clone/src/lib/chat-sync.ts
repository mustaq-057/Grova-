import type { ApiMessage } from "./api";
import { normalizeMessages } from "./message-utils";

/** Merge server messages with local state (newest wins per id), sorted by time. */
export function mergeMessagesById(existing: ApiMessage[], incoming: ApiMessage[]): ApiMessage[] {
  const map = new Map<string, ApiMessage>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) {
    const prev = map.get(m.id);
    if (!prev) {
      map.set(m.id, m);
      continue;
    }
    const incomingText = m.text ?? "";
    const prevText = prev.text ?? "";
    const text =
      incomingText === "…" && prevText && prevText !== "…" ? prevText : m.text ?? prev.text;
    map.set(m.id, {
      ...m,
      text,
      read: prev.read || m.read,
      readAt: prev.readAt ?? m.readAt,
      seenByPartner: m.seenByPartner || prev.seenByPartner,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/** Match an optimistic outgoing row to its server copy. */
export function findOptimisticMatch(
  optimistic: ApiMessage,
  serverMessages: ApiMessage[],
): ApiMessage | undefined {
  const optTime = new Date(optimistic.timestamp).getTime();
  return serverMessages.find(
    (f) =>
      f.senderId === optimistic.senderId &&
      f.type === optimistic.type &&
      f.id !== optimistic.id &&
      Math.abs(new Date(f.timestamp).getTime() - optTime) < 120_000,
  );
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
  const cleaned = prev.filter((m) => {
    if (!pendingIds.has(m.id)) return true;
    const match = findOptimisticMatch(m, fresh);
    if (match) {
      pendingIds.delete(m.id);
      return false;
    }
    return true;
  });
  return mergeMessagesById(cleaned, fresh);
}

/** Swap temp upload/send row for the server row without duplicate entries. */
export function replaceOptimisticMessage(
  prev: ApiMessage[],
  tempId: string,
  display: ApiMessage,
  senderId: string,
): ApiMessage[] {
  const displayTime = new Date(display.timestamp).getTime();
  const filtered = prev.filter((m) => {
    if (m.id === tempId || m.id === display.id) return false;
    if (
      m.senderId === senderId &&
      m.type === display.type &&
      Math.abs(new Date(m.timestamp).getTime() - displayTime) < 120_000
    ) {
      return false;
    }
    return true;
  });
  return [...filtered, display];
}

export async function fetchAndMergeMessages(current: ApiMessage[], getMessages: () => Promise<{ messages?: ApiMessage[] }>): Promise<ApiMessage[]> {
  const data = await getMessages();
  const normalized = await normalizeMessages(data.messages ?? []);
  return mergeMessagesById(current, normalized);
}
