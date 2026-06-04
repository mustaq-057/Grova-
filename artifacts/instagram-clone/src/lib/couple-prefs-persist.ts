import type { CouplePrefs } from "./types";
import type { AppThemeId } from "./app-theme";

const PREFS_KEY = "grova_couple_prefs_v1";
const DARK_KEY = "grova_dark_mode_v1";

export function loadPersistedCouplePrefs(): CouplePrefs | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CouplePrefs;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistCouplePrefs(prefs: CouplePrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export function loadPersistedDarkMode(): boolean | null {
  try {
    const v = localStorage.getItem(DARK_KEY);
    if (v === null) return null;
    return v === "1";
  } catch {
    return null;
  }
}

export function persistDarkMode(dark: boolean): void {
  try {
    localStorage.setItem(DARK_KEY, dark ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function persistedAppThemeId(): AppThemeId | null {
  const prefs = loadPersistedCouplePrefs();
  const id = prefs?.appTheme;
  if (!id || typeof id !== "string") return null;
  return id as AppThemeId;
}
