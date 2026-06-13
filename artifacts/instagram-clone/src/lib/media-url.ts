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

  // Re-resolve stored proxy URLs so token is fresh (share-to-chat used to save these).
  if (trimmed.startsWith("/api/media/inline")) {
    try {
      const inner = new URL(trimmed, "http://grova.local").searchParams.get("url");
      if (inner) return resolveStorageMediaUrl(inner, opts);
    } catch {
      /* fall through */
    }
  }

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

export function optimizeCloudinaryUrl(url: string | undefined, type: "image" | "video"): string | undefined {
  if (!url) return undefined;
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/upload/q_auto")) return url; // Already optimized
  
  const insert = type === "image" ? "q_auto,f_auto,w_1200,c_limit" : "q_auto,f_auto";
  return url.replace("/upload/", `/upload/${insert}/`);
}

export function resolveChatImageUrl(url: string | undefined): string | undefined {
  const resolved = resolveStorageMediaUrl(url, { fileName: "photo.jpg", mimeType: "image/jpeg" });
  return optimizeCloudinaryUrl(resolved, "image");
}

export function resolvePostMediaUrl(url: string | undefined): string | undefined {
  const resolved = resolveStorageMediaUrl(url, { fileName: "post.jpg", mimeType: "image/jpeg" });
  return optimizeCloudinaryUrl(resolved, "image");
}

export function resolveChatVideoUrl(
  url: string | undefined,
  fileName?: string,
  mimeType?: string,
): string | undefined {
  const resolved = resolveStorageMediaUrl(url, {
    fileName: fileName || "video.mp4",
    mimeType: mimeType || "video/mp4",
  });
  return optimizeCloudinaryUrl(resolved, "video");
}

export function resolveChatAudioUrl(url: string | undefined): string | undefined {
  return resolveStorageMediaUrl(url, { fileName: "voice.webm", mimeType: "audio/webm" });
}

/** Strip proxy wrapper to get the upstream storage URL. */
export function extractRawMediaUrl(url: string): string {
  if (url.includes("/api/media/inline")) {
    try {
      const inner = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://local")
        .searchParams.get("url");
      if (inner) return inner;
    } catch {
      /* fall through */
    }
  }
  return url;
}

/** Authenticated download URL — works for B2, Cloudinary, and other proxied media. */
export function resolveMediaDownloadUrl(url: string, kind: "image" | "video"): string {
  const raw = extractRawMediaUrl(url);
  const fileName = kind === "video" ? "video.mp4" : "photo.jpg";
  const mime = kind === "video" ? "video/mp4" : "image/jpeg";
  const proxied = resolveStorageMediaUrl(raw, { fileName, mimeType: mime, download: true });
  if (proxied?.includes("/api/media/inline")) return proxied;
  const params = new URLSearchParams({ url: raw, name: fileName, type: mime, download: "1" });
  const token = getAccessToken();
  if (token) params.set("token", token);
  return `/api/media/inline?${params.toString()}`;
}
