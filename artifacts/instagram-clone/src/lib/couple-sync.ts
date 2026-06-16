import { getCouplePrefsCache, setCouplePrefsCache } from "./client-memory";

export { getCouplePrefsCache } from "./client-memory";
import { applyAppTheme, applyColorMode, type AppThemeId } from "./app-theme";
import {
  loadPersistedCouplePrefs,
  loadPersistedDarkMode,
  persistCouplePrefs,
} from "./couple-prefs-persist";
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
  persistCouplePrefs(prefs);
  applyChatTheme(prefs.chatTheme || "default");
  if (prefs.appTheme) {
    applyAppTheme(prefs.appTheme as AppThemeId);
  }
  readReceipts = prefs.readReceipts;
  showPresence = prefs.showPresence;
  notifications = prefs.notifications ?? true;
  window.dispatchEvent(new CustomEvent(PREFS_CHANGED, { detail: prefs }));
}

/** Restore theme + toggles from localStorage on cold start (before Neon). */
export function bootstrapAppearance(): void {
  const prefs = loadPersistedCouplePrefs();
  const dark = loadPersistedDarkMode() ?? true;
  applyColorMode(dark);
  if (prefs) {
    applyCouplePrefs(prefs);
    return;
  }
  applyAppTheme("sara-lavender");
}

/** Restore toggles from disk before Neon responds (survives refresh). */
export function hydrateCouplePrefsFromDisk(): CouplePrefs | null {
  const prefs = loadPersistedCouplePrefs();
  if (!prefs) return null;
  applyCouplePrefs(prefs);
  return prefs;
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

function couplePrefsEqual(a: CouplePrefs, b: CouplePrefs): boolean {
  return (
    (a.chatTheme || "default") === (b.chatTheme || "default") &&
    (a.appTheme || "sara-lavender") === (b.appTheme || "sara-lavender") &&
    a.readReceipts === b.readReceipts &&
    a.showPresence === b.showPresence &&
    (a.notifications ?? true) === (b.notifications ?? true)
  );
}

export async function applyCouplePrefsWithReconcile(
  server: CouplePrefs,
  sync: (patch: Partial<CouplePrefs>) => Promise<CouplePrefs>,
): Promise<CouplePrefs> {
  // Always accept server prefs to prevent reverting partner's changes.
  applyCouplePrefs(server);
  return server;
}
