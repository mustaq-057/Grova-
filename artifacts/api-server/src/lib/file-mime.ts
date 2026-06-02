const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  rtf: "application/rtf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  json: "application/json",
  xml: "application/xml",
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
};

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "application/zip": "zip",
};

function extFromName(fileName: string): string | null {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m?.[1] ?? null;
}

export function extensionForMime(mime?: string): string | null {
  if (!mime) return null;
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (MIME_TO_EXT[base]) return MIME_TO_EXT[base];
  if (base.startsWith("image/")) return base.slice(6) === "jpeg" ? "jpg" : base.slice(6);
  if (base.startsWith("video/")) return base.slice(6);
  if (base.startsWith("audio/")) return base.slice(6) === "mpeg" ? "mp3" : base.slice(6);
  return null;
}

export function ensureFileNameWithExtension(fileName: string, mimeHint?: string): string {
  const trimmed = fileName.trim() || "file";
  if (extFromName(trimmed)) return trimmed;
  const ext = extensionForMime(mimeHint);
  return ext ? `${trimmed}.${ext}` : trimmed;
}

/** Pick the best Content-Type for inline viewing in the browser. */
export function resolveContentType(
  fileName: string,
  mimeHint?: string,
  upstreamType?: string | null,
): string {
  const ext = extFromName(fileName);
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

  const hint = mimeHint?.split(";")[0]?.trim().toLowerCase();
  if (hint && hint !== "application/octet-stream") return hint;

  const up = upstreamType?.split(";")[0]?.trim().toLowerCase();
  if (up && up !== "application/octet-stream") return up;

  return "application/octet-stream";
}

export function extForContentType(contentType: string): string {
  const c = contentType.toLowerCase();
  for (const [mime, ext] of Object.entries(MIME_TO_EXT)) {
    if (c.includes(mime.split("/")[1]!) || c === mime) return ext;
  }
  if (c.includes("png")) return "png";
  if (c.includes("webp")) return "webp";
  if (c.includes("gif")) return "gif";
  if (c.includes("jpeg") || c.includes("jpg")) return "jpg";
  if (c.includes("pdf")) return "pdf";
  if (c.includes("mp4")) return "mp4";
  if (c.includes("quicktime")) return "mov";
  if (c.includes("webm")) return "webm";
  if (c.includes("mpeg") || c.includes("mp3")) return "mp3";
  if (c.includes("wav")) return "wav";
  if (c.includes("zip")) return "zip";
  if (c.includes("word") || c.includes("document")) return "docx";
  if (c.includes("sheet") || c.includes("excel")) return "xlsx";
  if (c.includes("presentation") || c.includes("powerpoint")) return "pptx";
  if (c.includes("text/plain")) return "txt";
  if (c.includes("json")) return "json";
  return "bin";
}
