import crypto from "crypto";

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || "").trim();
const ENCRYPTION_PASSWORD = (process.env.ENCRYPTION_PASSWORD || "").trim();
const ALGORITHM = "aes-256-gcm";

// Key version tracking for rotation
interface KeyVersion {
  version: number;
  key: string;
  createdAt: Date;
}

let currentKeyVersion = 1;
const keyVersions: Map<number, KeyVersion> = new Map();
let isAuthenticated = false;

// Initialize with the primary key
if (ENCRYPTION_KEY) {
  keyVersions.set(1, {
    version: 1,
    key: ENCRYPTION_KEY,
    createdAt: new Date()
  });
}

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

if (ENCRYPTION_KEY.length !== 64) {
  throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
}

// Validate encryption password is set
if (!ENCRYPTION_PASSWORD) {
  throw new Error("ENCRYPTION_PASSWORD environment variable is required to access encryption key");
}
const REQUIRED_ENCRYPTION_PASSWORD = ENCRYPTION_PASSWORD;

function getKey(version?: number): Buffer {
  const keyVersion = version || currentKeyVersion;
  const keyData = keyVersions.get(keyVersion);
  if (!keyData) {
    throw new Error(`Key version ${keyVersion} not found`);
  }
  return Buffer.from(keyData.key, "hex");
}

// Authentication function - must be called before encrypt/decrypt
export function authenticateEncryption(password: string): boolean {
  // Hash the provided password and compare with the stored password hash
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const storedPasswordHash = crypto.createHash("sha256").update(REQUIRED_ENCRYPTION_PASSWORD).digest("hex");
  
  if (passwordHash === storedPasswordHash) {
    isAuthenticated = true;
    console.log("[encryption] ✅ Encryption access granted");
    return true;
  }
  
  isAuthenticated = false;
  console.error("[encryption] ❌ Authentication failed - incorrect password");
  return false;
}

// Check if authenticated before allowing encryption operations
function checkAuthentication(): void {
  if (!isAuthenticated) {
    throw new Error("🔒 Encryption access denied. Must authenticate with password first. Call authenticateEncryption(password)");
  }
}

export function encrypt(text: string, version?: number): string {
  checkAuthentication();
  const key = getKey(version);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  const keyVersion = version || currentKeyVersion;
  
  return `${keyVersion}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  checkAuthentication();
  if (!encryptedText) {
    return "";
  }
  
  const parts = encryptedText.split(":");
  
  // Handle old format (no version) - 3 parts
  if (parts.length === 3) {
    const key = getKey();
    try {
      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  
  // Handle new format (with version) - 4 parts
  if (parts.length === 4) {
    const version = parseInt(parts[0], 10);
    try {
      const key = getKey(version);
      const iv = Buffer.from(parts[1], "hex");
      const authTag = Buffer.from(parts[2], "hex");
      const encrypted = parts[3];
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      
      return decrypted;
    } catch (err) {
      console.error("Decryption failed, returning original text:", err);
      return encryptedText;
    }
  }
  
  // If format is unrecognized, return as-is
  return encryptedText;
}

// ENCRYPTION KEY IS LOCKED - Only one permanent key allowed
export function generateEncryptionKey(): never {
  throw new Error("🔒 Encryption key is locked permanently. Key generation is disabled.");
}

export function addKeyVersion(newKey: string): never {
  throw new Error("🔒 Encryption key is locked permanently. Cannot add new key versions.");
}

export function rotateKey(newKey?: string): never {
  throw new Error("🔒 Encryption key is locked permanently. Key rotation is disabled.");
}

export function getCurrentKeyVersion(): number {
  return currentKeyVersion;
}

export function getKeyVersions(): KeyVersion[] {
  return Array.from(keyVersions.values()).sort((a, b) => a.version - b.version);
}

export function removeOldKeyVersion(version: number): never {
  throw new Error("🔒 Encryption key is locked permanently. Cannot remove key versions.");
}
