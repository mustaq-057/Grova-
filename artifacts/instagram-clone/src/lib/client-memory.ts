/** In-memory client state — app data lives in Neon, not localStorage. */

import type { CouplePrefs } from "./types";
import type { AppNotification } from "./api";

export type { AppNotification };

let couplePrefs: CouplePrefs | null = null;
let notifications: AppNotification[] = [];
let unreadChatBadge = 0;
let chatBlocked = false;
let cuteMode: string | null = null;

export function getCouplePrefsCache(): CouplePrefs | null {
  return couplePrefs;
}

export function setCouplePrefsCache(prefs: CouplePrefs): void {
  couplePrefs = prefs;
}

export function getNotificationsCache(): AppNotification[] {
  return notifications;
}

export function setNotificationsCache(list: AppNotification[]): void {
  notifications = list;
}

export function getUnreadChatBadge(): number {
  return unreadChatBadge;
}

export function setUnreadChatBadge(count: number): void {
  unreadChatBadge = count;
}

export function isChatBlocked(): boolean {
  return chatBlocked;
}

export function setChatBlocked(blocked: boolean): void {
  chatBlocked = blocked;
}

export function getCuteMode(): string | null {
  return cuteMode;
}

export function setCuteMode(mode: string | null): void {
  cuteMode = mode;
}

export function clearClientMemory(): void {
  couplePrefs = null;
  notifications = [];
  unreadChatBadge = 0;
  chatBlocked = false;
  cuteMode = null;
}

const LEGACY_PURGED_KEY = "grova_legacy_storage_purged_v1";

/** Run the full localStorage scan once per browser — not on every app open. */
export function purgeLegacyLocalStorageOnce(): void {
  try {
    if (sessionStorage.getItem(LEGACY_PURGED_KEY) === "1") return;
    sessionStorage.setItem(LEGACY_PURGED_KEY, "1");
  } catch {
    /* still purge */
  }
  purgeLegacyLocalStorage();
}

/** Remove legacy localStorage keys from older builds. */
export function purgeLegacyLocalStorage(): void {
  const legacyPrefixes = [
    "grova_user",
    "grova_messages",
    "grova_posts_",
    "grova_stories_",
    "grova_activity",
    "grova_offline",
    "grova_pending",
    "grova_request",
    "grova_sync",
    "grova_chat_cleared_at",
    "grova_chat_",
    "grova_receipts",
    "grova_show_presence",
    "grova_note_",
    "grova_last_read",
    "grova_blocked",
    "grova_cute_mode",
    "grova_notifs",
    "grova_app_theme",
    "grova_dark_mode",
    "grova_theme",
    /* keep grova_couple_prefs_v1 + grova_dark_mode_v1 — current settings cache */
    "grova_device_id",
    "grova_e2e_keys_",
  ];
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    for (const key of keys) {
      if (legacyPrefixes.some((p) => key === p || key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}
