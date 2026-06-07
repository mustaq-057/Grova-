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
    // Server does not return client read flags — keep local read/seen state.
    map.set(m.id, {
      ...m,
      read: prev.read || m.read,
      readAt: prev.readAt ?? m.readAt,
      seenByPartner: m.seenByPartner || prev.seenByPartner,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export async function fetchAndMergeMessages(current: ApiMessage[], getMessages: () => Promise<{ messages?: ApiMessage[] }>): Promise<ApiMessage[]> {
  const data = await getMessages();
  const normalized = await normalizeMessages(data.messages ?? []);
  return mergeMessagesById(current, normalized);
}
