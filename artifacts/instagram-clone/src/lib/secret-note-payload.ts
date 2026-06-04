/** Plaintext secret note body — text, voice, or both (JSON before encryption). */

export type SecretNotePayload = {
  text?: string;
  audio?: string;
};

export function formatSecretNotePlain(payload: SecretNotePayload): string {
  return JSON.stringify({
    v: 1,
    text: payload.text?.trim() || undefined,
    audio: payload.audio || undefined,
  });
}

export function parseSecretNotePlain(plain: string): SecretNotePayload {
  const trimmed = plain.trim();
  if (!trimmed.startsWith("{")) return { text: plain };
  try {
    const data = JSON.parse(trimmed) as { v?: number; text?: string; audio?: string };
    if (data && typeof data === "object" && (data.text || data.audio)) {
      return { text: data.text, audio: data.audio };
    }
  } catch {
    /* legacy plain text */
  }
  return { text: plain };
}

export function secretNotePreview(payload: SecretNotePayload): string {
  if (payload.text?.trim()) return payload.text.trim().slice(0, 80);
  if (payload.audio) return "Voice note";
  return "Secret note";
}
