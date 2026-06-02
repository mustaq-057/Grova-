import { canViewInlineInBrowser, ensureFileNameWithExtension, mimeFromFileName } from "./file-mime";
import { getAccessToken } from "./session";

export type MediaLinkMode = "inline" | "download";

const OFFICE_VIEWER_EXT = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf"]);

function fileExt(fileName: string, mimeType?: string): string | null {
  const name = ensureFileNameWithExtension(fileName, mimeType);
  const m = name.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?.[1] ?? null;
}

function absoluteMediaUrl(relativePath: string): string {
  if (typeof window === "undefined") return relativePath;
  return new URL(relativePath, window.location.origin).href;
}

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

/** Best URL for viewing in Chrome — PDF/images inline; Office via Google viewer when needed. */
export function browserViewUrl(fileUrl: string, fileName: string, mimeType?: string): string {
  const mime = mimeType || mimeFromFileName(fileName);
  const viewUrl = inlineMediaViewUrl(fileUrl, fileName, mime);
  const ext = fileExt(fileName, mime);
  if (ext && OFFICE_VIEWER_EXT.has(ext)) {
    const abs = absoluteMediaUrl(viewUrl);
    return `https://docs.google.com/viewer?url=${encodeURIComponent(abs)}`;
  }
  if (canViewInlineInBrowser(fileName, mime)) return viewUrl;
  return viewUrl;
}

export function openFileInBrowser(fileUrl: string, fileName: string, mimeType?: string): void {
  const viewUrl = browserViewUrl(fileUrl, fileName, mimeType);
  const opened = window.open(viewUrl, "_blank", "noopener,noreferrer");
  if (!opened) window.location.assign(viewUrl);
}
