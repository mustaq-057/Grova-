/** App-wide color themes — nav, settings, profile chrome only (not chat bubbles). */

export type AppThemeId = "grova" | "rose-love" | "ocean" | "midnight" | "golden" | "sakura-fall";

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

export function applyAppTheme(themeId: AppThemeId) {
  currentAppTheme = APP_THEMES.some((t) => t.id === themeId) ? themeId : "grova";
  const theme = APP_THEMES.find((t) => t.id === currentAppTheme) ?? APP_THEMES[0]!;
  const vars = darkMode ? theme.dark : theme.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  syncAppChromeFromTheme();
  window.dispatchEvent(new Event(APP_THEME_CHANGED));
}

/** Default chrome before Neon prefs load. */
export function initAppearance() {
  applyAppTheme("grova");
  applyColorMode(true);
}
