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

export function getPartnerBubbleColors(theme: Pick<ChatTheme, "bubbleColor" | "bubbleBorder">) {
  return {
    fill: darkenHex(theme.bubbleColor, 0.32),
    border: darkenHex(theme.bubbleBorder, 0.15),
  };
}

export const THEMES: ChatTheme[] = [
  { id: "sara-lavender", name: "Sara", bubbleColor: "#7c3aed", bubbleBorder: "#a78bfa", swatch: "bg-violet-600" },
  { id: "sakura-fall", name: "Sakura Fall", bubbleColor: "#be185d", bubbleBorder: "#f472b6", swatch: "bg-pink-700" },
  { id: "midnight", name: "Midnight", bubbleColor: "#4338ca", bubbleBorder: "#818cf8", swatch: "bg-indigo-700" },
  { id: "moonlight-saga", name: "Moonlight Saga", bubbleColor: "#1e293b", bubbleBorder: "#64748b", swatch: "bg-slate-700" },
];


export const THEME_SWATCHES: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.swatch]),
);

export const DEFAULT_BUBBLE = { bubbleColor: "#7c3aed", bubbleBorder: "#a78bfa" };
