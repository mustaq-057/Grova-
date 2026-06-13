import { api, type ApiMessage } from "./api";

const CLEARED_AT_STORAGE_PREFIX = "grova_chat_cleared_v1_";
const HIDDEN_IDS_STORAGE_PREFIX = "grova_hidden_msgs_v1_";

/** Per-user hidden message ids — synced from Neon, cached in sessionStorage for instant restore. */
const hiddenByUser = new Map<string, Set<string>>();
const clearedAtByUser = new Map<string, string | null>();

function persistHiddenIds(userId: string, ids: Set<string>): void {
  try {
    const key = `${HIDDEN_IDS_STORAGE_PREFIX}${userId}`;
    if (ids.size === 0) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* quota or private mode */
  }
}

function readPersistedHiddenIds(userId: string): Set<string> {
  try {
    const raw = sessionStorage.getItem(`${HIDDEN_IDS_STORAGE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function ensureHiddenSet(userId: string): Set<string> {
  let set = hiddenByUser.get(userId);
  if (!set) {
    set = readPersistedHiddenIds(userId);
    hiddenByUser.set(userId, set);
  }
  return set;
}

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
    const local = ensureHiddenSet(userId);
    const merged = new Set([...messageIds, ...local]);
    hiddenByUser.set(userId, merged);
    persistHiddenIds(userId, merged);
    clearedAtByUser.set(userId, clearedAt ?? null);
    persistClearedAt(userId, clearedAt ?? null);
    return merged;
  } catch {
    return ensureHiddenSet(userId);
  }
}

export function getHiddenMessageIds(userId: string): Set<string> {
  return ensureHiddenSet(userId);
}

export function getChatClearedAt(userId: string): string | null {
  if (clearedAtByUser.has(userId)) return clearedAtByUser.get(userId) ?? null;
  const persisted = readPersistedClearedAt(userId);
  clearedAtByUser.set(userId, persisted);
  return persisted;
}

export async function clearChatForUser(userId: string): Promise<string> {
  const res = await api.clearChatForMe();
  const clearedAt = res.clearedAt || new Date().toISOString();
  clearedAtByUser.set(userId, clearedAt);
  persistClearedAt(userId, clearedAt);
  hiddenByUser.set(userId, new Set());
  persistHiddenIds(userId, new Set());
  return clearedAt;
}

export async function hideMessageForUser(userId: string, messageId: string): Promise<void> {
  await api.hideMessage(userId, messageId);
  const set = ensureHiddenSet(userId);
  set.add(messageId);
  hiddenByUser.set(userId, set);
  persistHiddenIds(userId, set);
}

export function applyHiddenMessageId(userId: string, messageId: string): void {
  const set = ensureHiddenSet(userId);
  set.add(messageId);
  hiddenByUser.set(userId, set);
  persistHiddenIds(userId, set);
}

export function removeHiddenMessageId(userId: string, messageId: string): void {
  const set = ensureHiddenSet(userId);
  set.delete(messageId);
  hiddenByUser.set(userId, set);
  persistHiddenIds(userId, set);
}

function isAfterClear(userId: string, msg: { timestamp?: string }): boolean {
  const chatClearedAt = getChatClearedAt(userId);
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

export function filterMessagesForCache(userId: string, msgs: ApiMessage[]): ApiMessage[] {
  return filterVisibleMessages(userId, msgs);
}
