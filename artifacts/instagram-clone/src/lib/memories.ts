import { api, type ApiMessage } from "./api";

export type MemoryItem = {
  messageId: string;
  text?: string;
  type: string;
  senderId: string;
  timestamp: string;
  pinnedAt: string;
};

function toMemoryItem(msg: ApiMessage): MemoryItem {
  return {
    messageId: msg.id,
    text: msg.text,
    type: msg.type,
    senderId: msg.senderId,
    timestamp: msg.timestamp,
    pinnedAt: msg.timestamp,
  };
}

export async function getMemories(userId: string): Promise<MemoryItem[]> {
  try {
    const pinned = await api.getPinnedMessages(userId);
    return pinned.map(toMemoryItem);
  } catch {
    return [];
  }
}

export async function saveMemoryFromMessage(userId: string, msg: ApiMessage): Promise<void> {
  await api.pinMessage(userId, msg.id);
}

export async function removeMemory(userId: string, messageId: string): Promise<void> {
  await api.unpinMessage(userId, messageId);
}
