import type { ApiMessage } from "./api";

function messageRowSig(m: ApiMessage): string {
  return `${m.id}:${m.timestamp}:${m.type}:${m.text?.length ?? 0}:${m.imageUrl ? 1 : 0}:${m.audioData ? 1 : 0}:${m.reaction ?? ""}:${m.deleted ? 1 : 0}:${m.seenByPartner ? 1 : 0}:${m.readAt ?? ""}:${m.read ? 1 : 0}`;
}

/** Cheap signature to skip redundant list updates after polling. */
export function messagesListSignature(msgs: ApiMessage[]): string {
  if (msgs.length === 0) return "0";
  return `${msgs.length}|${msgs.map(messageRowSig).join("|")}`;
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
