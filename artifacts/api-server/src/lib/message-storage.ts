import { encrypt, decrypt } from "./encryption";

/** Matches legacy 3-part (iv:tag:ciphertext) and versioned 4-part (v:iv:tag:ciphertext). */
const CIPHER_RE =
  /^(?:\d+:)?[0-9a-f]{16,}:[0-9a-f]{16,}:[0-9a-f]+$/i;

export function isEncryptedPayload(value: string): boolean {
  return CIPHER_RE.test(value);
}

/** Encrypt text, voice (base64), or image blobs before writing to neon DB. */
export function encryptStoredField(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isEncryptedPayload(value)) return value;
  return encrypt(value);
}

/** Decrypt on read; legacy plaintext rows still work until migration runs. */
export function decryptStoredField(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const s = String(value);
  if (!isEncryptedPayload(s)) return s;
  return decrypt(s);
}
