import { api, type AppNotification } from "./api";
import {
  getNotificationsCache,
  setNotificationsCache,
  getUnreadChatBadge as readUnreadChatBadge,
  setUnreadChatBadge as writeUnreadChatBadge,
} from "./client-memory";

export type { AppNotification };

export const NOTIFY_CHANGED = "grova-notify-changed";
export const UNREAD_CHAT_CHANGED = "grova-chat-unread-changed";

type NotificationViewer = { id: string; name: string } | null;
let viewer: NotificationViewer = null;

function emitNotifyChanged() {
  window.dispatchEvent(new Event(NOTIFY_CHANGED));
}

/** Call when the logged-in user is known so we never notify them about their own actions. */
export function setNotificationViewer(userId: string | null, userName?: string | null) {
  viewer = userId ? { id: userId, name: (userName ?? "").trim() } : null;
}

function isOwnActivity(n: Pick<AppNotification, "actorId" | "fromName">): boolean {
  if (!viewer) return false;
  if (n.actorId && n.actorId === viewer.id) return true;
  const from = n.fromName?.trim() ?? "";
  if (from && viewer.name && from.toLowerCase() === viewer.name.toLowerCase()) return true;
  return false;
}

function filterForViewer(list: AppNotification[]): AppNotification[] {
  return list.filter((n) => !isOwnActivity(n));
}

function isSecretNoteActivity(n: Pick<AppNotification, "type" | "text">): boolean {
  const text = (n.text ?? "").toLowerCase();
  return n.type === "story" && text.includes("secret note");
}

export function getNotifications(): AppNotification[] {
  return getNotificationsCache();
}

export async function hydrateNotifications(): Promise<void> {
  const { notifications } = await api.getActivityFeed();
  const filtered = filterForViewer(
    notifications
      .filter((n) => !isSecretNoteActivity(n))
      .filter((n) => ["like", "comment", "story", "dua", "call", "location", "message"].includes(n.type))
      .slice(0, 50),
  );
  setNotificationsCache(filtered);
  emitNotifyChanged();
}

export function addNotification(n: Omit<AppNotification, "id" | "read" | "timestamp">) {
  const allowedTypes = ["like", "comment", "share", "story", "dua", "call", "location", "message"];
  if (!allowedTypes.includes(n.type)) return;
  if (isSecretNoteActivity(n)) return;
  if (isOwnActivity(n)) return;

  const item: AppNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    timestamp: new Date().toISOString(),
  };
  const merged = filterForViewer([item, ...getNotifications()]).slice(0, 50);
  setNotificationsCache(merged);
  emitNotifyChanged();
}

export function markAllReadLocal() {
  setNotificationsCache(getNotifications().map((n) => ({ ...n, read: true })));
  emitNotifyChanged();
}

export async function markAllRead() {
  markAllReadLocal();
  await api.markActivityReadAll();
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function setUnreadChatBadge(count: number) {
  writeUnreadChatBadge(count);
  window.dispatchEvent(new Event(UNREAD_CHAT_CHANGED));
}

export { readUnreadChatBadge as getUnreadChatBadge };
