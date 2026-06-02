const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v|3gp|mpeg|mpg)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
const DOCUMENT_EXT =
  /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf|odt|ods|odp|pages|numbers|key)$/i;
const GENERIC_CLIPBOARD_NAME = /^(?:image\.png|blob|file)$/i;

function isDocumentMime(type: string): boolean {
  if (!type) return false;
  if (type === "application/pdf") return true;
  if (type.includes("word") || type.includes("excel") || type.includes("spreadsheet")) return true;
  if (type.includes("powerpoint") || type.includes("presentation")) return true;
  return type.startsWith("text/") && type !== "text/html";
}

export function isDocumentFile(file: File, hintType?: string): boolean {
  const type = mimeType(file, hintType);
  if (isDocumentMime(type)) return true;
  if (type.startsWith("image/") || type.startsWith("video/") || type.startsWith("audio/")) return false;
  if (file.name && DOCUMENT_EXT.test(file.name)) return true;
  return false;
}

function mimeType(file: File, hintType?: string): string {
  return file.type || hintType || "";
}

/** Fix clipboard files that arrive with empty MIME type or generic names. */
export function normalizePastedFile(file: File, itemType?: string): File {
  const type = mimeType(file, itemType);
  let name = file.name;
  const genericName = !name || GENERIC_CLIPBOARD_NAME.test(name);

  if (genericName) {
    if (type.startsWith("video/")) name = `video-${Date.now()}.mp4`;
    else if (type.startsWith("image/")) name = `image-${Date.now()}.jpg`;
    else name = `file-${Date.now()}`;
  }

  if (!file.type && type) {
    return new File([file], name, { type, lastModified: file.lastModified });
  }
  if (genericName && name !== file.name) {
    return new File([file], name, { type: type || file.type, lastModified: file.lastModified });
  }
  return file;
}

export function extractClipboardFiles(cd: DataTransfer | null | undefined): { file: File; itemType?: string }[] {
  if (!cd) return [];

  const out: { file: File; itemType?: string }[] = [];
  const seenKeys = new Set<string>();
  const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

  for (const item of cd.items) {
    if (item.kind !== "file") continue;
    const f = item.getAsFile();
    if (!f) continue;
    const key = fileKey(f);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push({ file: f, itemType: item.type || undefined });
  }

  for (const f of cd.files) {
    const key = fileKey(f);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const matched = [...cd.items].find((item) => item.kind === "file" && item.getAsFile() === f);
    out.push({ file: f, itemType: matched?.type || f.type || undefined });
  }

  return out;
}

export function isVideoFile(file: File, hintType?: string): boolean {
  const type = mimeType(file, hintType);
  if (type.startsWith("video/")) return true;
  if (type.startsWith("image/")) return false;
  if (!file.name || GENERIC_CLIPBOARD_NAME.test(file.name)) return false;
  return VIDEO_EXT.test(file.name);
}

export function isImageFile(file: File, hintType?: string): boolean {
  const type = mimeType(file, hintType);
  if (type.startsWith("video/")) return false;
  if (type.startsWith("image/")) return true;
  if (!file.name || GENERIC_CLIPBOARD_NAME.test(file.name)) return false;
  return IMAGE_EXT.test(file.name);
}

async function detectMediaByMagicBytes(file: File): Promise<"image" | "video" | null> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (bytes.length < 4) return null;

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image";
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image";
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image";
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return "image";
    if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video";
    if (
      bytes.length >= 8 &&
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      return "video";
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function sniffVideoFile(file: File): Promise<boolean> {
  if (isVideoFile(file)) return true;
  if (isImageFile(file)) return false;

  const magic = await detectMediaByMagicBytes(file);
  if (magic === "video") return true;
  if (magic === "image") return false;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };

    const timer = setTimeout(() => finish(false), 2000);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) && video.duration > 0);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

export async function classifyMediaFile(file: File, hintType?: string): Promise<"image" | "video" | "other"> {
  const type = mimeType(file, hintType);
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";
  if (isDocumentFile(file, hintType)) return "other";

  const magic = await detectMediaByMagicBytes(file);
  if (magic) return magic;

  if (isVideoFile(file, hintType)) return "video";
  if (isImageFile(file, hintType)) return "image";

  // Large clipboard blobs without MIME are usually screen recordings / videos.
  const ambiguousName = !file.name || GENERIC_CLIPBOARD_NAME.test(file.name);
  if (file.size > 80_000 && ambiguousName) {
    if (await sniffVideoFile(file)) return "video";
  } else if (!ambiguousName && (await sniffVideoFile(file))) {
    return "video";
  }
  return "other";
}

export function guessVideoMime(file: File, hintType?: string): string {
  const type = mimeType(file, hintType);
  if (type.startsWith("video/")) return type;
  const ext = file.name.toLowerCase().match(/\.(\w+)$/)?.[1];
  const map: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m4v: "video/x-m4v",
    "3gp": "video/3gpp",
  };
  return (ext && map[ext]) || "video/mp4";
}

export function getVideoDurationSafe(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(duration);
    };

    const timer = setTimeout(() => finish(0), 2000);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? video.duration : 0);
    video.onerror = () => finish(0);
    video.src = url;
  });
}
