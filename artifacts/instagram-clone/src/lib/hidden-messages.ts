import { api } from "./api";

const CLEARED_AT_STORAGE_PREFIX = "grova_chat_cleared_v1_";

/** Per-user hidden message ids — synced from Neon only (no localStorage). */
const hiddenByUser = new Map<string, Set<string>>();
const clearedAtByUser = new Map<string, string | null>();

function persistClearedAt(userId: string, clearedAt: string | null): void {
  try {
    const key = `${CLEARED_AT_STORAGE_PREFIX}${userId}`;
    if (clearedAt) sessionStorage.setItem(key, clearedAt);
    else sessionStorage.removeItem(key);
  } catch {
    /* quota or private mode */
  }
}

function readPersistedClearedAt(userId: string): string | null {
  try {
    return sessionStorage.getItem(`${CLEARED_AT_STORAGE_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function hydrateHiddenMessages(userId: string): Promise<Set<string>> {
  try {
    const { messageIds, clearedAt } = await api.getHiddenMessageIds(userId);
    const set = new Set(messageIds);
    hiddenByUser.set(userId, set);
    clearedAtByUser.set(userId, clearedAt ?? null);
    persistClearedAt(userId, clearedAt ?? null);
    return set;
  } catch {
    hiddenByUser.set(userId, new Set());
    return hiddenByUser.get(userId)!;
  }
}

export function getHiddenMessageIds(userId: string): Set<string> {
  return hiddenByUser.get(userId) ?? new Set();
}

export function getChatClearedAt(userId: string): string | null {
  return clearedAtByUser.get(userId) ?? readPersistedClearedAt(userId);
}

export async function clearChatForUser(userId: string): Promise<string> {
  const res = await api.clearChatForMe();
  const clearedAt = res.clearedAt || new Date().toISOString();
  clearedAtByUser.set(userId, clearedAt);
  persistClearedAt(userId, clearedAt);
  hiddenByUser.set(userId, new Set());
  return clearedAt;
}

export async function hideMessageForUser(userId: string, messageId: string): Promise<void> {
  await api.hideMessage(userId, messageId);
  const set = hiddenByUser.get(userId) ?? new Set<string>();
  set.add(messageId);
  hiddenByUser.set(userId, set);
}

export function applyHiddenMessageId(userId: string, messageId: string): void {
  const set = hiddenByUser.get(userId) ?? new Set<string>();
  set.add(messageId);
  hiddenByUser.set(userId, set);
}

function isAfterClear(userId: string, msg: { timestamp?: string }): boolean {
  const chatClearedAt = clearedAtByUser.get(userId);
  if (!chatClearedAt || !msg.timestamp) return true;
  const msgMs = new Date(msg.timestamp).getTime();
  const clearMs = new Date(chatClearedAt).getTime();
  if (!Number.isNaN(msgMs) && !Number.isNaN(clearMs)) return msgMs > clearMs;
  return msg.timestamp > chatClearedAt;
}

export function filterVisibleMessages<T extends { id: string; timestamp?: string }>(
  userId: string,
  msgs: T[],
): T[] {
  const hidden = getHiddenMessageIds(userId);
  return msgs.filter((m) => !hidden.has(m.id) && isAfterClear(userId, m));
}
