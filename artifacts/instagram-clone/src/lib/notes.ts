import { api } from "./api";

export const NOTE_MAX = 60;
export const NOTES_CHANGED = "grova-notes-changed";

export type NotesMap = { me: string; wife: string };

let cache: NotesMap | null = null;

export function getCachedNotes(): NotesMap {
  return cache ?? { me: "", wife: "" };
}

export async function hydrateNotes(): Promise<NotesMap> {
  try {
    const notes = await api.getCoupleNotes();
    cache = notes;
    window.dispatchEvent(new Event(NOTES_CHANGED));
    return notes;
  } catch {
    return getCachedNotes();
  }
}

export async function saveNote(userId: string, text: string): Promise<void> {
  try {
    const notes = await api.updateCoupleNote(text.slice(0, NOTE_MAX));
    cache = notes;
    window.dispatchEvent(new Event(NOTES_CHANGED));
  } catch (err) {
    console.error("Failed to save note:", err);
    throw err;
  }
}

export function getNote(userId: string): string {
  const notes = getCachedNotes();
  return userId === "wife" ? notes.wife : notes.me;
}

export function getPartnerNote(partnerId: string): string {
  return getNote(partnerId);
}
