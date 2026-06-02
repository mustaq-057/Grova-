import { ensureFileNameWithExtension } from "./file-mime";
import { getAccessToken } from "./session";

export type MediaLinkMode = "inline" | "download";

function buildMediaUrl(fileUrl: string, fileName: string, mimeType?: string, mode: MediaLinkMode = "inline"): string {
  const name = ensureFileNameWithExtension(fileName, mimeType);
  const params = new URLSearchParams({
    url: fileUrl,
    name,
  });
  if (mimeType) params.set("type", mimeType);
  if (mode === "download") params.set("download", "1");
  const token = getAccessToken();
  if (token) params.set("token", token);
  return `/api/media/inline?${params.toString()}`;
}

/** Open in browser tab (PDF, images, video, Word, etc.) — not a blob URL. */
export function inlineMediaViewUrl(fileUrl: string, fileName: string, mimeType?: string): string {
  return buildMediaUrl(fileUrl, fileName, mimeType, "inline");
}

/** Save / download with correct filename and MIME (no Cloudinary page). */
export function inlineMediaDownloadUrl(fileUrl: string, fileName: string, mimeType?: string): string {
  return buildMediaUrl(fileUrl, fileName, mimeType, "download");
}

export function openFileInBrowser(fileUrl: string, fileName: string, mimeType?: string): void {
  const viewUrl = inlineMediaViewUrl(fileUrl, fileName, mimeType);
  const opened = window.open(viewUrl, "_blank", "noopener,noreferrer");
  if (!opened) window.location.assign(viewUrl);
}
