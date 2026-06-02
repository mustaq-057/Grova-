import { getCouplePrefsCache, setCouplePrefsCache } from "./client-memory";
import { applyAppTheme, type AppThemeId } from "./app-theme";
import type { CouplePrefs } from "./types";

export const CHAT_THEME_CHANGED = "grova-chat-theme-changed";
export const PARTNER_CHANGED = "grova-partner-changed";
export const PREFS_CHANGED = "grova-prefs-changed";

export type { CouplePrefs };

let chatThemeId = "default";
let readReceipts = true;
let showPresence = true;
let notifications = true;

export function getCachedChatTheme(): string {
  return getCouplePrefsCache()?.chatTheme ?? chatThemeId;
}

export function applyChatTheme(themeId: string) {
  chatThemeId = themeId;
  window.dispatchEvent(new CustomEvent(CHAT_THEME_CHANGED, { detail: themeId }));
}

export function applyCouplePrefs(prefs: CouplePrefs) {
  setCouplePrefsCache(prefs);
  applyChatTheme(prefs.chatTheme || "default");
  if (prefs.appTheme) {
    applyAppTheme(prefs.appTheme as AppThemeId);
  }
  readReceipts = prefs.readReceipts;
  showPresence = prefs.showPresence;
  notifications = prefs.notifications ?? true;
  window.dispatchEvent(new CustomEvent(PREFS_CHANGED, { detail: prefs }));
}

export function isReadReceiptsEnabled(): boolean {
  return getCouplePrefsCache()?.readReceipts ?? readReceipts;
}

export function isShowPresenceEnabled(): boolean {
  return getCouplePrefsCache()?.showPresence ?? showPresence;
}

export function areNotificationsEnabled(): boolean {
  return getCouplePrefsCache()?.notifications ?? notifications;
}
