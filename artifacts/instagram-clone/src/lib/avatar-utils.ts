import { AVATARS } from "./avatars";
import { getAccessToken } from "./session";

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

function needsStorageProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("backblazeb2.com");
  } catch {
    return false;
  }
}

/** Cloudinary URLs load in <img>; private B2 URLs need the authenticated API proxy. */
export function resolveAvatarDisplayUrl(
  url: string,
  userId: string,
  cacheBust?: number,
): string {
  if (url.startsWith("data:")) return url;

  let display = url;
  const v = cacheBust ?? 0;
  if (v) {
    const sep = display.includes("?") ? "&" : "?";
    display = `${display}${sep}v=${v}`;
  }

  if (!needsStorageProxy(url)) return display;

  const token = getAccessToken();
  if (!token) return display;

  const proxied = `/api/media/inline?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  return v ? `${proxied}&v=${v}` : proxied;
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
