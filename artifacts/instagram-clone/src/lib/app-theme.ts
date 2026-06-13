/** App-wide color themes — nav, settings, profile chrome only (not chat bubbles). */

import { loadPersistedDarkMode, persistDarkMode } from "./couple-prefs-persist";

export type AppThemeId =
  | "sakura-fall"
  | "sara-lavender"
  | "moonlight-saga";

const PREMIUM_ANIMATED_THEMES: AppThemeId[] = ["moonlight-saga"];

const RETIRED_THEME_ALIASES: Record<string, AppThemeId> = {
  "eternal-aurora": "moonlight-saga",
  "aurora-infinity": "moonlight-saga",
  "ocean-aurora": "moonlight-saga",
  "moonlit-blossom": "moonlight-saga",
  "book-bouquet": "sara-lavender",
  grova: "sara-lavender",
  "creamy-minimal": "sara-lavender",
};

const THEME_BACKGROUNDS: Partial<Record<AppThemeId, string>> = {
  "sara-lavender": "/themes/sara-lilies.jpg",
};

export const APP_THEME_CHANGED = "grova-app-theme-changed";

export const APP_THEMES: {
  id: AppThemeId;
  name: string;
  description: string;
  swatch: string;
  dark: Record<string, string>;
  light: Record<string, string>;
}[] = [
    {
      id: "sara-lavender",
      name: "Sara",
      description: "Sara falls · lavender photo ♡",
      swatch: "bg-gradient-to-br from-pink-300 via-fuchsia-200 to-violet-300",
      dark: {
        "--app-background": "270 22% 9%",
        "--app-foreground": "0 0% 98%",
        "--app-primary": "330 75% 78%",
        "--app-card": "270 20% 13%",
        "--app-secondary": "270 18% 16%",
        "--app-border": "270 14% 22%",
      },
      light: {
        "--app-background": "270 35% 97%",
        "--app-foreground": "270 25% 16%",
        "--app-primary": "330 65% 52%",
        "--app-card": "0 0% 100%",
        "--app-secondary": "270 28% 94%",
        "--app-border": "270 22% 88%",
      },
    },
    {
      id: "sakura-fall",
      name: "Sakura Fall",
      description: "3D cherry blossoms ♡",
      swatch: "bg-gradient-to-br from-pink-200 via-rose-300 to-pink-400",
      dark: {
        "--app-background": "330 22% 9%",
        "--app-foreground": "350 30% 94%",
        "--app-primary": "350 70% 75%",
        "--app-card": "330 20% 12%",
        "--app-secondary": "330 18% 16%",
        "--app-border": "330 15% 20%",
      },
      light: {
        "--app-background": "350 50% 97%",
        "--app-foreground": "340 28% 22%",
        "--app-primary": "350 65% 68%",
        "--app-card": "350 45% 99%",
        "--app-secondary": "350 40% 95%",
        "--app-border": "350 30% 90%",
      },
    },

    {
      id: "moonlight-saga",
      name: "Moonlight Saga",
      description: "Mystical twilight romance 🌙",
      swatch: "bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950",
      dark: {
        "--app-background": "225 35% 8%",
        "--app-foreground": "210 20% 95%",
        "--app-primary": "210 90% 70%",
        "--app-card": "225 30% 12%",
        "--app-secondary": "225 25% 16%",
        "--app-border": "225 20% 22%",
      },
      light: {
        "--app-background": "210 30% 96%",
        "--app-foreground": "225 40% 16%",
        "--app-primary": "215 85% 45%",
        "--app-card": "0 0% 100%",
        "--app-secondary": "210 25% 92%",
        "--app-border": "210 18% 85%",
      },
    },

  ];

let currentAppTheme: AppThemeId = "sara-lavender";
let darkMode = true;

export function getStoredAppTheme(): AppThemeId {
  return currentAppTheme;
}

export function getStoredDarkMode(): boolean {
  return darkMode;
}

export function applyColorMode(dark: boolean) {
  darkMode = dark;
  document.documentElement.classList.toggle("dark", dark);
  persistDarkMode(dark);
  syncAppChromeFromTheme();
}

const SEMANTIC_MAP: Array<[app: string, token: string]> = [
  ["--app-background", "--background"],
  ["--app-foreground", "--foreground"],
  ["--app-primary", "--primary"],
  ["--app-card", "--card"],
  ["--app-secondary", "--secondary"],
  ["--app-border", "--border"],
];

function syncAppChromeFromTheme() {
  const root = document.documentElement;
  for (const [appVar, token] of SEMANTIC_MAP) {
    const value = root.style.getPropertyValue(appVar).trim();
    if (value) root.style.setProperty(token, value);
  }
  // Keep sidebar / popover in sync with app chrome
  const bg = root.style.getPropertyValue("--app-background").trim();
  const fg = root.style.getPropertyValue("--app-foreground").trim();
  const card = root.style.getPropertyValue("--app-card").trim();
  const primary = root.style.getPropertyValue("--app-primary").trim();
  const secondary = root.style.getPropertyValue("--app-secondary").trim();
  const border = root.style.getPropertyValue("--app-border").trim();
  if (bg) {
    root.style.setProperty("--sidebar", bg);
    root.style.setProperty("--popover", card || bg);
  }
  if (fg) {
    root.style.setProperty("--card-foreground", fg);
    root.style.setProperty("--sidebar-foreground", fg);
    root.style.setProperty("--popover-foreground", fg);
    root.style.setProperty("--secondary-foreground", fg);
  }
  if (primary) {
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--ring", primary);
  }
  if (secondary) {
    root.style.setProperty("--sidebar-accent", secondary);
    root.style.setProperty("--muted", secondary);
    root.style.setProperty("--accent", secondary);
  }
  if (border) {
    root.style.setProperty("--sidebar-border", border);
    root.style.setProperty("--card-border", border);
  }
}

export function isSakuraFallTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "sakura-fall";
}

export function isMoonlightSagaTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "moonlight-saga";
}

export function isPremiumAnimatedTheme(themeId?: AppThemeId): boolean {
  return PREMIUM_ANIMATED_THEMES.includes(themeId ?? getStoredAppTheme());
}

export function getPremiumChatThemeClass(themeId?: AppThemeId): string | null {
  const id = themeId ?? getStoredAppTheme();
  if (!PREMIUM_ANIMATED_THEMES.includes(id)) return null;
  return `${id}-chat`;
}

export function isSaraLavenderTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "sara-lavender";
}

export function getThemeBackgroundUrl(themeId?: AppThemeId): string | null {
  const id = themeId ?? getStoredAppTheme();
  return THEME_BACKGROUNDS[id] ?? null;
}

export function themeUsesPhotoBackground(themeId?: AppThemeId): boolean {
  return getThemeBackgroundUrl(themeId) != null;
}

/** Photo layer strength — kept low so nav/cards stay readable. */
export function getThemeBackgroundOpacity(themeId?: AppThemeId): number {
  const id = themeId ?? getStoredAppTheme();
  if (id === "sara-lavender") return 0.32;
  return 0.28;
}

export function themeUsesPhotoScrim(themeId?: AppThemeId): boolean {
  return themeUsesPhotoBackground(themeId);
}

/** Readable gradient over the photo (avoids invalid hsl(var(--background) / …) scrims). */
export function getPhotoScrimGradient(themeId: AppThemeId, dark: boolean): string {
  if (themeId === "sara-lavender") {
    return dark
      ? "linear-gradient(180deg, rgba(28,14,32,0.68) 0%, rgba(28,14,32,0.84) 55%, rgba(28,14,32,0.92) 100%)"
      : "linear-gradient(180deg, rgba(255,246,252,0.7) 0%, rgba(255,246,252,0.86) 55%, rgba(255,246,252,0.93) 100%)";
  }
  return dark
    ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.88) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.88) 100%)";
}

export function applyAppTheme(themeId: AppThemeId) {
  // Redirect retired/aliased theme IDs to their successors
  const resolved = (RETIRED_THEME_ALIASES[themeId as string] ?? themeId) as AppThemeId;
  currentAppTheme = APP_THEMES.some((t) => t.id === resolved) ? resolved : "sara-lavender";
  const theme = APP_THEMES.find((t) => t.id === currentAppTheme) ?? APP_THEMES[0]!;
  const vars = darkMode ? theme.dark : theme.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  if (themeUsesPhotoBackground(currentAppTheme)) {
    root.dataset.photoTheme = "true";
  } else {
    delete root.dataset.photoTheme;
  }
  syncAppChromeFromTheme();
  window.dispatchEvent(new Event(APP_THEME_CHANGED));
}

/** Default chrome before Neon prefs load. */
export function initAppearance() {
  applyAppTheme("sara-lavender");
  applyColorMode(true);
}
