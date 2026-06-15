export type ChatTheme = {
  id: string;
  name: string;
  /** Outgoing chat bubble fill */
  bubbleColor: string;
  /** Outgoing chat bubble border */
  bubbleBorder: string;
  swatch: string;
};

/** Darken a hex color — used for partner bubbles so both accounts see the same palette. */
export function darkenHex(hex: string, amount = 0.28): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.floor(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.floor(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.floor((n & 255) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function getPartnerBubbleColors(theme: Pick<ChatTheme, "bubbleColor" | "bubbleBorder"> & { id?: string }) {
  if (theme.id === "floura-override") {
    return {
      fill: "#5C7C49",
      border: "#5C7C49",
    };
  }
  return {
    fill: darkenHex(theme.bubbleColor, 0.32),
    border: darkenHex(theme.bubbleBorder, 0.15),
  };
}

export const THEMES: ChatTheme[] = [
  { id: "default", name: "Classic", bubbleColor: "#0095f6", bubbleBorder: "#0095f6", swatch: "bg-sky-500" },
  { id: "espresso", name: "Espresso", bubbleColor: "#d97706", bubbleBorder: "#fbbf24", swatch: "bg-amber-600" },
  { id: "midnight", name: "Midnight", bubbleColor: "#4338ca", bubbleBorder: "#818cf8", swatch: "bg-indigo-700" },
  { id: "rose", name: "Rose", bubbleColor: "#be123c", bubbleBorder: "#fb7185", swatch: "bg-rose-700" },
  { id: "forest", name: "Forest", bubbleColor: "#047857", bubbleBorder: "#34d399", swatch: "bg-emerald-700" },
  { id: "ocean", name: "Ocean", bubbleColor: "#0369a1", bubbleBorder: "#38bdf8", swatch: "bg-sky-700" },
  { id: "sakura", name: "Sakura", bubbleColor: "#be185d", bubbleBorder: "#f472b6", swatch: "bg-pink-700" },
  { id: "aurora", name: "Aurora", bubbleColor: "#0891b2", bubbleBorder: "#22d3ee", swatch: "bg-cyan-600" },
  { id: "sunset", name: "Sunset", bubbleColor: "#ea580c", bubbleBorder: "#fb923c", swatch: "bg-orange-600" },
  { id: "lavender", name: "Lavender", bubbleColor: "#7c3aed", bubbleBorder: "#a78bfa", swatch: "bg-violet-600" },
  { id: "mint", name: "Mint", bubbleColor: "#16a34a", bubbleBorder: "#4ade80", swatch: "bg-green-600" },
  { id: "cosmic", name: "Cosmic", bubbleColor: "#1d4ed8", bubbleBorder: "#60a5fa", swatch: "bg-blue-700" },
  { id: "candy", name: "Candy", bubbleColor: "#db2777", bubbleBorder: "#f472b6", swatch: "bg-pink-500" },
  { id: "nebula", name: "Nebula", bubbleColor: "#4f46e5", bubbleBorder: "#818cf8", swatch: "bg-indigo-600" },
  { id: "tropical", name: "Tropical", bubbleColor: "#65a30d", bubbleBorder: "#a3e635", swatch: "bg-lime-600" },
  { id: "berry", name: "Berry", bubbleColor: "#c026d3", bubbleBorder: "#e879f9", swatch: "bg-fuchsia-600" },
  { id: "arctic", name: "Arctic", bubbleColor: "#0284c7", bubbleBorder: "#7dd3fc", swatch: "bg-sky-600" },
  { id: "golden", name: "Golden", bubbleColor: "#ca8a04", bubbleBorder: "#facc15", swatch: "bg-yellow-600" },
  { id: "ruby", name: "Ruby", bubbleColor: "#dc2626", bubbleBorder: "#f87171", swatch: "bg-red-600" },
  { id: "sapphire", name: "Sapphire", bubbleColor: "#2563eb", bubbleBorder: "#60a5fa", swatch: "bg-blue-600" },
  { id: "emerald", name: "Emerald", bubbleColor: "#0d9488", bubbleBorder: "#2dd4bf", swatch: "bg-teal-600" },
  { id: "amethyst", name: "Amethyst", bubbleColor: "#9333ea", bubbleBorder: "#c084fc", swatch: "bg-purple-600" },
  { id: "coral", name: "Coral", bubbleColor: "#f97316", bubbleBorder: "#fdba74", swatch: "bg-orange-500" },
  { id: "jade", name: "Jade", bubbleColor: "#059669", bubbleBorder: "#34d399", swatch: "bg-emerald-600" },
  { id: "pearl", name: "Pearl", bubbleColor: "#6b7280", bubbleBorder: "#d1d5db", swatch: "bg-gray-500" },
  { id: "crimson", name: "Crimson", bubbleColor: "#b91c1c", bubbleBorder: "#f87171", swatch: "bg-red-700" },
  { id: "azure", name: "Azure", bubbleColor: "#0891b2", bubbleBorder: "#67e8f9", swatch: "bg-cyan-600" },
  { id: "cherry", name: "Cherry", bubbleColor: "#e11d48", bubbleBorder: "#fb7185", swatch: "bg-rose-600" },
  { id: "olive", name: "Olive", bubbleColor: "#4d7c0f", bubbleBorder: "#a3e635", swatch: "bg-lime-600" },
  { id: "plum", name: "Plum", bubbleColor: "#7e22ce", bubbleBorder: "#d8b4fe", swatch: "bg-purple-700" },
  { id: "steel", name: "Steel", bubbleColor: "#475569", bubbleBorder: "#94a3b8", swatch: "bg-slate-600" },
  { id: "honey", name: "Honey", bubbleColor: "#d97706", bubbleBorder: "#fcd34d", swatch: "bg-amber-500" },
  { id: "violet", name: "Violet", bubbleColor: "#7c3aed", bubbleBorder: "#c4b5fd", swatch: "bg-violet-600" },
  { id: "bronze", name: "Bronze", bubbleColor: "#c2410c", bubbleBorder: "#fdba74", swatch: "bg-orange-700" },
  { id: "peach", name: "Peach", bubbleColor: "#f43f5e", bubbleBorder: "#fda4af", swatch: "bg-rose-500" },
  { id: "mango", name: "Mango", bubbleColor: "#f59e0b", bubbleBorder: "#fcd34d", swatch: "bg-amber-500" },
  { id: "tangerine", name: "Tangerine", bubbleColor: "#ea580c", bubbleBorder: "#fdba74", swatch: "bg-orange-600" },
  { id: "lemon", name: "Lemon", bubbleColor: "#eab308", bubbleBorder: "#fef08a", swatch: "bg-yellow-500" },
  { id: "lime", name: "Lime", bubbleColor: "#84cc16", bubbleBorder: "#d9f99d", swatch: "bg-lime-500" },
  { id: "sky", name: "Sky", bubbleColor: "#0ea5e9", bubbleBorder: "#bae6fd", swatch: "bg-sky-500" },
  { id: "indigo", name: "Indigo", bubbleColor: "#6366f1", bubbleBorder: "#c7d2fe", swatch: "bg-indigo-500" },
  { id: "orchid", name: "Orchid", bubbleColor: "#d946ef", bubbleBorder: "#f5d0fe", swatch: "bg-fuchsia-500" },
  { id: "magenta", name: "Magenta", bubbleColor: "#ec4899", bubbleBorder: "#fbcfe8", swatch: "bg-pink-500" },
  { id: "teal2", name: "Teal", bubbleColor: "#14b8a6", bubbleBorder: "#99f6e4", swatch: "bg-teal-500" },
  { id: "cyan2", name: "Cyan", bubbleColor: "#06b6d4", bubbleBorder: "#a5f3fc", swatch: "bg-cyan-500" },
  { id: "creamy", name: "Creamy", bubbleColor: "#E0D1BE", bubbleBorder: "#DDD0BE", swatch: "bg-amber-200" },
  { id: "moonlight-saga", name: "Moonlight Saga", bubbleColor: "#1e293b", bubbleBorder: "#64748b", swatch: "bg-slate-700" },
];


export const THEME_SWATCHES: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.swatch]),
);

export const DEFAULT_BUBBLE = { bubbleColor: "#0095f6", bubbleBorder: "#0095f6" };
