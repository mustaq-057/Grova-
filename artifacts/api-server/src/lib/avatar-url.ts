import { randomUUID } from "crypto";
import { uploadMedia } from "./storage";
import db from "./db";

const FALLBACK: Record<string, string> = {
  me: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&h=150&fit=crop",
  wife: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&h=150&fit=crop",
};

/** Upload base64 avatar to Cloudinary/B2 and store URL in Neon (never huge blobs in API responses). */
export async function persistAvatarIfNeeded(userId: string, avatar: unknown): Promise<string> {
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return FALLBACK[userId] ?? FALLBACK.me;

  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }

  if (s.startsWith("data:")) {
    try {
      const base64 = s.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const key = `avatars/${userId}-${randomUUID()}.jpg`;
      const url = await uploadMedia(key, buffer, "image/jpeg");
      await db.execute("UPDATE profiles SET avatar = $1 WHERE id = $2", [url, userId]);
      return url;
    } catch (err) {
      console.error("[avatar] Failed to upload avatar:", err);
      return FALLBACK[userId] ?? FALLBACK.me;
    }
  }

  return s;
}

export function sanitizeAvatarForClient(userId: string, avatar: unknown): string {
  const fallback = FALLBACK[userId] ?? FALLBACK.me;
  const s = typeof avatar === "string" ? avatar.trim() : "";
  if (!s) return fallback;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // Never send raw base64 blobs or broken relative paths to the client
  return fallback;
}
