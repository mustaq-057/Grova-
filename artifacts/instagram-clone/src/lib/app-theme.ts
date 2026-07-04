/** App-wide color themes — nav, settings, profile chrome only (not chat bubbles). */

import { loadPersistedDarkMode, persistDarkMode } from "./couple-prefs-persist";

export type AppThemeId =
  | "sakura-fall"
  | "sara-lavender"
  | "moonlight-saga"
  | "floura"
  | "mint"
  | "library"
  | "mustaq"
  | "autumn-amber"
  | "petrichor"
  | "snowfall"
  | "tangled";

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
  "floura": "/themes/saralikedtheme.png",
  "mint": "/mint-home.png",
  "library": "/themes/library-bg.png",
  "mustaq": "/themes/mustaq-bg.png",
  "autumn-amber": "/themes/autumn-amber-bg.png",
  "petrichor": "/themes/petrichor-bg.png",
  "snowfall": "/themes/snowfall-bg.png",
  "tangled": "/themes/tangled1.png",
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
      id: "floura",
      name: "Floura",
      description: "A beautiful floral landscape ♡",
      swatch: "bg-gradient-to-br from-pink-300 via-green-200 to-green-600",
      dark: {
        "--app-background": "100 20% 12%",
        "--app-foreground": "0 0% 98%",
        "--app-primary": "330 75% 78%",
        "--app-card": "100 22% 16%",
        "--app-secondary": "100 18% 20%",
        "--app-border": "100 14% 28%",
      },
      light: {
        "--app-background": "100 30% 98%",
        "--app-foreground": "100 25% 16%",
        "--app-primary": "330 65% 52%",
        "--app-card": "0 0% 100%",
        "--app-secondary": "100 28% 95%",
        "--app-border": "100 22% 88%",
      },
    },
    {
      id: "mint",
      name: "Mint",
      description: "A calming creamy mint aesthetic 🌿",
      swatch: "bg-gradient-to-br from-green-100 via-emerald-200 to-green-300",
      dark: {
        "--app-background": "120 15% 12%",
        "--app-foreground": "120 15% 95%",
        "--app-primary": "140 40% 30%",
        "--app-card": "120 15% 16%",
        "--app-secondary": "120 15% 20%",
        "--app-border": "120 10% 25%",
      },
      light: {
        "--app-background": "45 25% 94%",
        "--app-foreground": "120 40% 18%",
        "--app-primary": "120 45% 22%",
        "--app-card": "45 25% 90%",
        "--app-secondary": "45 30% 88%",
        "--app-border": "45 20% 84%",
      },
    },
    {
      id: "library",
      name: "Library",
      description: "A cozy, vintage reading sanctuary 🕰️",
      swatch: "bg-gradient-to-br from-[#4d3a2e] via-[#3b2b23] to-[#2c1e16]",
      dark: {
        "--app-background": "25 25% 10%",
        "--app-foreground": "35 30% 90%",
        "--app-primary": "25 40% 30%",
        "--app-card": "25 20% 14%",
        "--app-secondary": "25 20% 18%",
        "--app-border": "25 15% 25%",
      },
      light: {
        "--app-background": "40 30% 95%",
        "--app-foreground": "25 40% 15%",
        "--app-primary": "25 50% 25%",
        "--app-card": "40 25% 98%",
        "--app-secondary": "40 20% 90%",
        "--app-border": "40 15% 85%",
      },
    },
    {
      id: "sara-lavender",
      name: "Sara",
      description: "Sara falls · lavender photo ♡",
      swatch: "bg-gradient-to-br from-pink-300 via-fuchsia-200 to-violet-300",
      dark: {
        "--app-background": "260 15% 10%", // Very dark soft purple
        "--app-foreground": "260 20% 96%", // Soft purpleish white
        "--app-primary": "260 60% 70%", // Elegant soft lavender
        "--app-card": "260 15% 14%",
        "--app-secondary": "260 12% 18%",
        "--app-border": "260 12% 24%",
      },
      light: {
        "--app-background": "260 30% 98%", // Extremely soft lilac white
        "--app-foreground": "260 40% 16%", // Dark purple-brown
        "--app-primary": "260 55% 55%", // Muted purple
        "--app-card": "0 0% 100%",
        "--app-secondary": "260 25% 94%",
        "--app-border": "260 20% 88%",
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
    {
      id: "mustaq",
      name: "Mustaq",
      description: "Dark, sleek, and premium obsidian vibes ✦",
      swatch: "bg-gradient-to-br from-neutral-900 via-zinc-900 to-amber-900/50",
      dark: {
        "--app-background": "240 10% 4%",
        "--app-foreground": "45 20% 90%",
        "--app-primary": "40 80% 60%", // Gold/Amber accent
        "--app-card": "240 8% 8%",
        "--app-secondary": "240 6% 12%",
        "--app-border": "240 5% 18%",
      },
      light: {
        "--app-background": "240 5% 96%",
        "--app-foreground": "240 20% 10%",
        "--app-primary": "35 90% 40%", // Darker gold for light mode
        "--app-card": "0 0% 100%",
        "--app-secondary": "240 5% 90%",
        "--app-border": "240 5% 85%",
      },
    },
    {
      id: "autumn-amber",
      name: "Autumn Amber",
      description: "Warm, cozy golden canopy 🍂",
      swatch: "bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-600",
      dark: {
        "--app-background": "25 25% 10%",
        "--app-foreground": "35 30% 95%",
        "--app-primary": "25 80% 60%", // Warm amber/orange
        "--app-card": "25 20% 12%",
        "--app-secondary": "25 15% 18%",
        "--app-border": "25 15% 24%",
      },
      light: {
        "--app-background": "35 20% 96%",
        "--app-foreground": "25 30% 15%",
        "--app-primary": "25 85% 50%", // Darker amber for light mode
        "--app-card": "0 0% 100%",
        "--app-secondary": "35 15% 92%",
        "--app-border": "35 10% 88%",
      },
    },
    {
      id: "petrichor",
      name: "Petrichor",
      description: "Calm, rainy forest window 🌧️",
      swatch: "bg-gradient-to-br from-slate-700 via-zinc-600 to-gray-700",
      dark: {
        "--app-background": "200 15% 12%",
        "--app-foreground": "200 10% 95%",
        "--app-primary": "180 30% 60%", // Muted teal/silver
        "--app-card": "200 12% 16%",
        "--app-secondary": "200 10% 20%",
        "--app-border": "200 8% 28%",
      },
      light: {
        "--app-background": "200 10% 94%",
        "--app-foreground": "200 15% 15%",
        "--app-primary": "180 35% 45%", // Muted teal for light mode
        "--app-card": "0 0% 100%",
        "--app-secondary": "200 12% 88%",
        "--app-border": "200 10% 82%",
      },
    },
    {
      id: "snowfall",
      name: "Snowfall",
      description: "Deep winter parallax snow ❄️",
      swatch: "bg-gradient-to-br from-slate-300 via-blue-100 to-white",
      dark: {
        "--app-background": "220 30% 10%",
        "--app-foreground": "210 20% 95%",
        "--app-primary": "210 80% 80%", // Frosty blue
        "--app-card": "220 25% 14%",
        "--app-secondary": "220 20% 18%",
        "--app-border": "220 15% 24%",
      },
      light: {
        "--app-background": "210 20% 96%",
        "--app-foreground": "220 30% 15%",
        "--app-primary": "210 70% 50%", // Deep icy blue
        "--app-card": "0 0% 100%",
        "--app-secondary": "210 15% 92%",
        "--app-border": "210 10% 88%",
      },
    },
    {
      id: "tangled",
      name: "Tangled",
      description: "Rapunzel's enchanted forest 🌿✨",
      swatch: "bg-gradient-to-br from-[#1a3d2b] via-[#2d5a3d] to-[#c9a227]",
      dark: {
        "--app-background": "150 35% 8%",   // Deep forest green
        "--app-foreground": "45 30% 93%",   // Warm parchment white
        "--app-primary": "42 75% 52%",      // Rapunzel gold
        "--app-card": "150 30% 11%",
        "--app-secondary": "150 25% 15%",
        "--app-border": "150 20% 20%",
      },
      light: {
        "--app-background": "45 25% 96%",
        "--app-foreground": "150 35% 12%",
        "--app-primary": "38 80% 42%",      // Deeper gold for light
        "--app-card": "0 0% 100%",
        "--app-secondary": "150 20% 92%",
        "--app-border": "150 15% 86%",
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

export function isMustaqTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "mustaq";
}

export function isAutumnAmberTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "autumn-amber";
}

export function isPetrichorTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "petrichor";
}

export function isSnowfallTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "snowfall";
}

export function isTangledTheme(themeId?: AppThemeId): boolean {
  return (themeId ?? getStoredAppTheme()) === "tangled";
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
  if (id === "sara-lavender") return 0.95;
  if (id === "floura") return 1.0;
  if (id === "mint") return 1.0;
  if (id === "library") return 1.0;
  if (id === "mustaq") return 1.0;
  if (id === "autumn-amber") return 1.0;
  if (id === "petrichor") return 1.0;
  if (id === "snowfall") return 1.0;
  if (id === "tangled") return 1.0;
  return 0.28;
}

export function themeUsesPhotoScrim(themeId?: AppThemeId): boolean {
  return themeUsesPhotoBackground(themeId);
}

/** Readable gradient over the photo (avoids invalid hsl(var(--background) / …) scrims). */
export function getPhotoScrimGradient(themeId: AppThemeId, dark: boolean): string {
  if (themeId === "sara-lavender") {
    return dark
      ? "linear-gradient(180deg, rgba(30,20,40,0.6) 0%, rgba(20,10,30,0.85) 100%)"
      : "linear-gradient(180deg, rgba(250,240,250,0.5) 0%, rgba(240,230,245,0.8) 100%)";
  }
  if (themeId === "floura") {
    return dark
      ? "linear-gradient(180deg, rgba(30,40,25,0.1) 0%, rgba(30,40,25,0.4) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 100%)";
  }
  if (themeId === "mint") {
    return dark
      ? "linear-gradient(180deg, rgba(20,30,20,0.4) 0%, rgba(20,30,20,0.6) 100%)"
      : "linear-gradient(180deg, rgba(235,235,225,0.3) 0%, rgba(225,230,215,0.5) 100%)";
  }
  if (themeId === "library") {
    return dark
      ? "linear-gradient(180deg, rgba(30,20,15,0.5) 0%, rgba(20,10,5,0.85) 100%)"
      : "linear-gradient(180deg, rgba(250,240,230,0.4) 0%, rgba(240,230,215,0.7) 100%)";
  }
  if (themeId === "mustaq") {
    return dark
      ? "linear-gradient(180deg, rgba(10,10,12,0.4) 0%, rgba(5,5,8,0.85) 100%)"
      : "linear-gradient(180deg, rgba(250,250,252,0.3) 0%, rgba(240,240,245,0.6) 100%)";
  }
  if (themeId === "autumn-amber") {
    return dark
      ? "linear-gradient(180deg, rgba(20,10,5,0.6) 0%, rgba(10,5,2,0.92) 100%)" // Darker
      : "linear-gradient(180deg, rgba(250,240,230,0.5) 0%, rgba(235,225,210,0.85) 100%)";
  }
  if (themeId === "petrichor") {
    return dark
      ? "linear-gradient(180deg, rgba(20,25,30,0.4) 0%, rgba(15,20,25,0.8) 100%)"
      : "linear-gradient(180deg, rgba(230,235,240,0.3) 0%, rgba(220,225,230,0.6) 100%)";
  }

  if (themeId === "tangled") {
    return dark
      ? "linear-gradient(180deg, rgba(10,28,18,0.35) 0%, rgba(8,22,14,0.75) 100%)"
      : "linear-gradient(180deg, rgba(240,245,235,0.3) 0%, rgba(230,240,225,0.65) 100%)";
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
  root.dataset.themeId = currentAppTheme;
  syncAppChromeFromTheme();
  window.dispatchEvent(new Event(APP_THEME_CHANGED));
}

/** Default chrome before Neon prefs load. */
export function initAppearance() {
  applyAppTheme("sara-lavender");
  applyColorMode(true);
}
