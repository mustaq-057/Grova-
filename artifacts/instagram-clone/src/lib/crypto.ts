const SALT = "grova-couples-e2e-v1";
const KEY_STORAGE = "grova_e2e_key";

let cachedKey: CryptoKey | null = null;

async function deriveKey(coupleCode: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(coupleCode),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(SALT), iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function importKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function initEncryption(coupleCode: string): Promise<void> {
  const key = await deriveKey(coupleCode);
  cachedKey = key;
  sessionStorage.setItem(KEY_STORAGE, await exportKey(key));
}

export async function loadEncryptionKey(): Promise<boolean> {
  const stored = sessionStorage.getItem(KEY_STORAGE);
  if (!stored) return false;
  try {
    cachedKey = await importKey(stored);
    return true;
  } catch {
    return false;
  }
}

export function clearEncryption(): void {
  cachedKey = null;
  sessionStorage.removeItem(KEY_STORAGE);
}

export function isEncryptionReady(): boolean {
  return cachedKey !== null;
}

export async function encryptPayload(data: unknown): Promise<string> {
  if (!cachedKey) throw new Error("Encryption not initialized");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cachedKey, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptPayload<T>(payload: string): Promise<T> {
  if (!cachedKey) throw new Error("Encryption not initialized");
  const combined = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cachedKey, cipher);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export const E2E_PREFIX = "e2e:";

export type EncryptedMessageBody = {
  text?: string;
  audioData?: string;
  gifUrl?: string;
  imageData?: string;
  type: string;
  variant?: string;
  companionSticker?: string;
};
