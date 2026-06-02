import { api } from "./api";
import { PREFS_CHANGED } from "./couple-sync";
import { DEFAULT_QUICK_REACTION_EMOJIS } from "./reaction-emoji-catalog";

export const DEFAULT_QUICK_REACTIONS = [...DEFAULT_QUICK_REACTION_EMOJIS];

let cached: string[] = [...DEFAULT_QUICK_REACTIONS];

export function getQuickReactions(): string[] {
  return cached.length > 0 ? cached : DEFAULT_QUICK_REACTIONS;
}

export function applyQuickReactions(emojis: string[]) {
  cached = emojis.slice(0, 5);
  window.dispatchEvent(new CustomEvent("grova-quick-reactions-changed", { detail: cached }));
}

export async function hydrateQuickReactions(): Promise<string[]> {
  try {
    const prefs = await api.getCouplePrefs();
    if (prefs.quickEmojis?.length) {
      applyQuickReactions(prefs.quickEmojis);
    }
  } catch {
    /* keep cached */
  }
  return getQuickReactions();
}

export async function customizeQuickReactions(): Promise<void> {
  // This function is now handled by the UI modal (QuickReactionsCustomizeModal)
  // Kept for backward compatibility, but the UI modal should be used instead
  const current = getQuickReactions();
  const choice = window.prompt(
    `Customize quick emojis (max 5, comma-separated).\nCurrent: ${current.join(" ")}`,
    current.join(","),
  );
  if (choice == null) return;
  const parsed = choice
    .split(/[,|\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (parsed.length === 0) {
    window.alert("Add at least one emoji.");
    return;
  }
  try {
    const prefs = await api.updateCouplePrefs({ quickEmojis: parsed });
    applyQuickReactions(prefs.quickEmojis ?? parsed);
  } catch {
    window.alert("Could not save — check your connection.");
  }
}

export function onQuickReactionsChanged(cb: (emojis: string[]) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<string[]>).detail);
  const prefsHandler = (e: Event) => {
    const prefs = (e as CustomEvent<{ quickEmojis?: string[] }>).detail;
    if (prefs.quickEmojis?.length) applyQuickReactions(prefs.quickEmojis);
  };
  window.addEventListener("grova-quick-reactions-changed", handler);
  window.addEventListener(PREFS_CHANGED, prefsHandler);
  return () => {
    window.removeEventListener("grova-quick-reactions-changed", handler);
    window.removeEventListener(PREFS_CHANGED, prefsHandler);
  };
}
