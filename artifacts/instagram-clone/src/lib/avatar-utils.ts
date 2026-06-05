import { AVATARS } from "./avatars";
import { resolveStorageMediaUrl } from "./media-url";

/** Stock Unsplash placeholder — not a user-uploaded photo. */
export function isStockAvatar(url: string | undefined, userId: string): boolean {
  const stock = userId === "wife" ? AVATARS.wife : AVATARS.me;
  const s = url?.trim() || "";
  if (!s) return true;
  if (s === stock) return true;
  return (
    s.includes("images.unsplash.com/photo-1526170375885") ||
    s.includes("images.unsplash.com/photo-1486406146926")
  );
}

/** Cloudinary URLs load in <img>; private B2 URLs need the authenticated API proxy. */
export function resolveAvatarDisplayUrl(
  url: string,
  userId: string,
  cacheBust?: number,
): string {
  if (url.startsWith("data:")) return url;

  let display = resolveStorageMediaUrl(url, { fileName: "avatar.jpg", mimeType: "image/jpeg" }) ?? url;
  const v = cacheBust ?? 0;
  if (v) {
    const sep = display.includes("?") ? "&" : "?";
    display = `${display}${sep}v=${v}`;
  }
  return display;
}

/** Prefer the newer custom upload over a stale stock URL from a racey refetch. */
export function pickAvatarUrl(
  incoming: string | undefined,
  current: string | undefined,
  userId: string,
): string {
  const inc = incoming?.trim() || "";
  const cur = current?.trim() || "";
  if (!inc) return cur;
  if (!cur) return inc;
  if (isStockAvatar(inc, userId) && !isStockAvatar(cur, userId)) return cur;
  return inc;
}
