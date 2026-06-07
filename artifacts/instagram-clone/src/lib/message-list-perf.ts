import type { ApiMessage } from "./api";

/** Cheap signature to skip redundant list updates after polling. */
export function messagesListSignature(msgs: ApiMessage[]): string {
  if (msgs.length === 0) return "0";
  const tail = msgs.slice(-5);
  return `${msgs.length}|${tail.map((m) => `${m.id}:${m.timestamp}:${m.type}:${m.text?.length ?? 0}:${m.reaction ?? ""}:${m.deleted ? 1 : 0}:${m.seenByPartner ? 1 : 0}:${m.readAt ?? ""}:${m.read ? 1 : 0}`).join("|")}`;
}

export function mergeMessagesIfChanged(
  prev: ApiMessage[],
  incoming: ApiMessage[],
  merge: (a: ApiMessage[], b: ApiMessage[]) => ApiMessage[],
): ApiMessage[] | null {
  const next = merge(prev, incoming);
  if (messagesListSignature(prev) === messagesListSignature(next)) return null;
  return next;
}
