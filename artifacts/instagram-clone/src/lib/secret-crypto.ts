const SALT = "grova-secret-notes-v1";

async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(SALT), iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export const SECRET_PREFIX = "locked:";

export async function encryptSecret(text: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return SECRET_PREFIX + btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(payload: string, password: string): Promise<string> {
  if (!payload.startsWith(SECRET_PREFIX)) return payload;
  const key = await deriveKey(password);
  const combined = Uint8Array.from(atob(payload.slice(SECRET_PREFIX.length)), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

export function isEncryptedSecret(content: string): boolean {
  return content.startsWith(SECRET_PREFIX);
}
