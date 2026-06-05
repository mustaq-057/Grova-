import { getAccessToken } from "./session";

/** Backblaze B2 S3 URLs are not public — load through /api/media/inline (same as avatars). */
export function needsStorageProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("backblazeb2.com");
  } catch {
    return false;
  }
}

export function resolveStorageMediaUrl(
  url: string | undefined,
  opts?: { fileName?: string; mimeType?: string; download?: boolean },
): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/api/")) return trimmed;
  if (!needsStorageProxy(trimmed)) return trimmed;

  const params = new URLSearchParams({
    url: trimmed,
    name: opts?.fileName ?? "media",
  });
  const mime = opts?.mimeType ?? "application/octet-stream";
  params.set("type", mime);
  if (opts?.download) params.set("download", "1");
  const token = getAccessToken();
  if (token) params.set("token", token);
  return `/api/media/inline?${params.toString()}`;
}

export function resolveChatImageUrl(url: string | undefined): string | undefined {
  return resolveStorageMediaUrl(url, { fileName: "photo.jpg", mimeType: "image/jpeg" });
}

export function resolvePostMediaUrl(url: string | undefined): string | undefined {
  return resolveStorageMediaUrl(url, { fileName: "post.jpg", mimeType: "image/jpeg" });
}

export function resolveChatVideoUrl(
  url: string | undefined,
  fileName?: string,
  mimeType?: string,
): string | undefined {
  return resolveStorageMediaUrl(url, {
    fileName: fileName || "video.mp4",
    mimeType: mimeType || "video/mp4",
  });
}
