// End-to-end encryption using Web Crypto API

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKeyBuffer),
    privateKey: arrayBufferToBase64(privateKeyBuffer),
  };
}

export async function encryptMessage(message: string, publicKey: string): Promise<string> {
  const publicKeyBuffer = base64ToArrayBuffer(publicKey);
  const key = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(message);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encoded
  );

  return arrayBufferToBase64(encrypted);
}

export async function decryptMessage(encrypted: string, privateKey: string): Promise<string> {
  const privateKeyBuffer = base64ToArrayBuffer(privateKey);
  const key = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const encryptedBuffer = base64ToArrayBuffer(encrypted);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const keyPairs = new Map<string, KeyPair>();

export async function storeKeyPair(userId: string, keyPair: KeyPair): Promise<void> {
  keyPairs.set(userId, keyPair);
}

export async function getKeyPair(userId: string): Promise<KeyPair | null> {
  return keyPairs.get(userId) ?? null;
}

export async function deleteKeyPair(userId: string): Promise<void> {
  keyPairs.delete(userId);
}
