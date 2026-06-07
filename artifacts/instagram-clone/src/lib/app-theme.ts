/** App-wide color themes — nav, settings, profile chrome only (not chat bubbles). */

import { loadPersistedDarkMode, persistDarkMode } from "./couple-prefs-persist";

export type AppThemeId =
  | "grova"
  | "rose-love"
  | "ocean"
  | "midnight"
  | "golden"
  | "sakura-fall"
  | "sara-lavender"
  | "book-bouquet"
  | "moonlit-blossom";

const PREMIUM_ANIMATED_THEMES: AppThemeId[] = ["moonlit-blossom"];

const RETIRED_PREMIUM_THEMES = new Set([
  "eternal-aurora",
  "aurora-infinity",
  "ocean-aurora",
]);

const THEME_BACKGROUNDS: Partial<Record<AppThemeId, string>> = {
  "sara-lavender": "/themes/sara-lilies.jpg",
  "book-bouquet": "/themes/book-bouquet.jpg",
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
    id: "grova",
    name: "Grova Classic",
    description: "Warm espresso & amber",
    swatch: "bg-amber-500",
    dark: {
      "--app-background": "24 8% 7%",
      "--app-foreground": "35 18% 88%",
      "--app-primary": "38 88% 55%",
      "--app-card": "24 8% 10%",
      "--app-secondary": "24 8% 14%",
      "--app-border": "24 8% 15%",
    },
    light: {
      "--app-background": "40 20% 98%",
      "--app-foreground": "24 10% 12%",
      "--app-primary": "32 95% 44%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "40 15% 94%",
      "--app-border": "30 10% 88%",
    },
  },
  {
    id: "rose-love",
    name: "Rose Love",
    description: "Soft pink for her ♥",
    swatch: "bg-rose-500",
    dark: {
      "--app-background": "340 25% 8%",
      "--app-foreground": "350 20% 92%",
      "--app-primary": "350 75% 62%",
      "--app-card": "340 22% 11%",
      "--app-secondary": "340 18% 16%",
      "--app-border": "340 15% 18%",
    },
    light: {
      "--app-background": "350 40% 98%",
      "--app-foreground": "340 30% 15%",
      "--app-primary": "350 70% 52%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "350 35% 95%",
      "--app-border": "350 25% 90%",
    },
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    description: "Calm blue tones",
    swatch: "bg-sky-500",
    dark: {
      "--app-background": "220 30% 7%",
      "--app-foreground": "210 25% 90%",
      "--app-primary": "200 90% 55%",
      "--app-card": "220 28% 10%",
      "--app-secondary": "220 22% 14%",
      "--app-border": "220 20% 16%",
    },
    light: {
      "--app-background": "210 40% 98%",
      "--app-foreground": "220 30% 12%",
      "--app-primary": "200 85% 45%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "210 35% 95%",
      "--app-border": "210 25% 88%",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep purple night",
    swatch: "bg-violet-600",
    dark: {
      "--app-background": "260 30% 6%",
      "--app-foreground": "260 15% 92%",
      "--app-primary": "270 80% 65%",
      "--app-card": "260 28% 9%",
      "--app-secondary": "260 22% 13%",
      "--app-border": "260 20% 15%",
    },
    light: {
      "--app-background": "260 30% 98%",
      "--app-foreground": "260 25% 12%",
      "--app-primary": "270 70% 50%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "260 25% 95%",
      "--app-border": "260 20% 88%",
    },
  },
  {
    id: "golden",
    name: "Golden Hour",
    description: "Sunset warmth",
    swatch: "bg-orange-500",
    dark: {
      "--app-background": "25 20% 7%",
      "--app-foreground": "35 25% 90%",
      "--app-primary": "28 95% 55%",
      "--app-card": "25 18% 10%",
      "--app-secondary": "25 15% 14%",
      "--app-border": "25 12% 16%",
    },
    light: {
      "--app-background": "40 50% 98%",
      "--app-foreground": "25 30% 12%",
      "--app-primary": "28 90% 48%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "35 40% 94%",
      "--app-border": "30 25% 88%",
    },
  },
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
    id: "book-bouquet",
    name: "Book Bouquet",
    description: "Book photo only · soft blooms ♡",
    swatch: "bg-gradient-to-br from-rose-200 via-pink-100 to-amber-100",
    dark: {
      "--app-background": "25 14% 10%",
      "--app-foreground": "30 15% 96%",
      "--app-primary": "25 40% 75%",
      "--app-card": "25 12% 14%",
      "--app-secondary": "25 10% 17%",
      "--app-border": "25 10% 24%",
    },
    light: {
      "--app-background": "35 40% 97%",
      "--app-foreground": "25 30% 18%",
      "--app-primary": "25 45% 42%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "30 28% 95%",
      "--app-border": "30 18% 86%",
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
    id: "moonlit-blossom",
    name: "Moonlit Blossom",
    description: "Blue moonlit flower field with lightning green bees 🌙🐝",
    swatch: "bg-gradient-to-br from-indigo-950 via-blue-700 to-cyan-400",
    dark: {
      "--app-background": "228 45% 8%",
      "--app-foreground": "210 40% 96%",
      "--app-primary": "205 90% 62%",
      "--app-card": "225 38% 11%",
      "--app-secondary": "222 32% 15%",
      "--app-border": "220 28% 22%",
    },
    light: {
      "--app-background": "215 55% 99%",
      "--app-foreground": "225 35% 14%",
      "--app-primary": "205 80% 46%",
      "--app-card": "0 0% 100%",
      "--app-secondary": "210 45% 97%",
      "--app-border": "215 28% 90%",
    },
  },
];

let currentAppTheme: AppThemeId = "grova";
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

export function isBookBouquetTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "book-bouquet";
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
  if (id === "book-bouquet") return 0.28;
  if (id === "sara-lavender") return 0.32;
  return 0.28;
}

export function themeUsesPhotoScrim(themeId?: AppThemeId): boolean {
  return themeUsesPhotoBackground(themeId);
}

/** Readable gradient over the photo (avoids invalid hsl(var(--background) / …) scrims). */
export function getPhotoScrimGradient(themeId: AppThemeId, dark: boolean): string {
  if (themeId === "book-bouquet") {
    return dark
      ? "linear-gradient(180deg, rgba(18,14,12,0.72) 0%, rgba(18,14,12,0.88) 55%, rgba(18,14,12,0.94) 100%)"
      : "linear-gradient(180deg, rgba(255,252,248,0.72) 0%, rgba(255,252,248,0.88) 55%, rgba(255,252,248,0.94) 100%)";
  }
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
  const resolved =
    RETIRED_PREMIUM_THEMES.has(themeId) ? "moonlit-blossom" : themeId;
  currentAppTheme = APP_THEMES.some((t) => t.id === resolved) ? resolved : "grova";
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
  applyAppTheme("grova");
  applyColorMode(true);
}
