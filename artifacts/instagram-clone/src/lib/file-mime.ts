/** Client-side MIME helpers (keep in sync with api-server/src/lib/file-mime.ts). */

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  zip: "application/zip",
  rar: "application/vnd.rar",
};

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

function extFromName(fileName: string): string | null {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?.[1] ?? null;
}

export function extensionForMime(mime?: string): string | null {
  if (!mime) return null;
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (MIME_TO_EXT[base]) return MIME_TO_EXT[base];
  if (base.startsWith("image/")) {
    const sub = base.slice(6);
    return sub === "jpeg" ? "jpg" : sub;
  }
  return null;
}

export function ensureFileNameWithExtension(fileName: string, mimeHint?: string): string {
  const trimmed = fileName.trim() || "file";
  if (extFromName(trimmed)) return trimmed;
  const ext = extensionForMime(mimeHint);
  return ext ? `${trimmed}.${ext}` : trimmed;
}

export function canViewInlineInBrowser(fileName: string, mimeHint?: string): boolean {
  const ext = extFromName(ensureFileNameWithExtension(fileName, mimeHint));
  if (!ext) return true;
  const viewable = new Set([
    "pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp",
    "txt", "csv", "html", "htm", "json", "xml",
    "mp4", "webm", "mov", "mp3", "wav", "m4a", "ogg",
    "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  ]);
  return viewable.has(ext);
}

export function mimeFromFileName(fileName: string): string | undefined {
  const ext = extFromName(fileName);
  return ext ? EXT_TO_MIME[ext] : undefined;
}
