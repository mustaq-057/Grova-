import type { ApiMessage } from "./api";

function mediaUrlSig(url?: string): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return "local";
  return url.length > 48 ? url.slice(-48) : url;
}

function messageRowSig(m: ApiMessage): string {
  const img = mediaUrlSig(m.imageUrl ?? m.imageData);
  const file = mediaUrlSig(m.fileData);
  const vm = m.mediaViewMode ?? m.companionSticker ?? "";
  return `${m.id}:${m.timestamp}:${m.type}:${m.text?.length ?? 0}:${img}:${file}:${m.audioData ? 1 : 0}:${m.reaction ?? ""}:${m.deleted ? 1 : 0}:${m.seenByPartner ? 1 : 0}:${m.readAt ?? ""}:${m.read ? 1 : 0}:${vm}:${m.mediaOpenCount ?? 0}:${m.mediaOpenedAt ?? ""}`;
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
