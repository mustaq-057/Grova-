const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v|3gp|mpeg|mpg)$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
const HEIC_IMAGE_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heis",
  "heim",
  "mif1",
  "msf1",
  "avif",
  "avis",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
  bmp: "image/bmp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4v: "video/x-m4v",
  "3gp": "video/3gpp",
};

function readIsoFtypBrand(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) return null;
  return String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
}

function classifyIsoFtypBrand(brand: string): "image" | "video" {
  return HEIC_IMAGE_BRANDS.has(brand) ? "image" : "video";
}
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

/** Gallery / file-picker picks often have empty MIME — infer from extension. */
export function normalizeGalleryFile(file: File, hintType?: string): File {
  let normalized = normalizePastedFile(file, hintType);
  const type = normalized.type?.split(";")[0]?.trim().toLowerCase() || "";
  if (type && type !== "application/octet-stream") return normalized;

  const ext = normalized.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const inferred = ext ? EXT_TO_MIME[ext] : undefined;
  if (!inferred) return normalized;

  return new File([normalized], normalized.name, {
    type: inferred,
    lastModified: normalized.lastModified,
  });
}

export function isHeicOrHeif(file: File): boolean {
  const type = file.type?.toLowerCase() || "";
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}

export function isAcceptedGalleryImage(file: File): boolean {
  const normalized = normalizeGalleryFile(file);
  if (normalized.type.startsWith("image/")) return true;
  if (normalized.name && IMAGE_EXT.test(normalized.name)) return true;
  return false;
}

export function extractClipboardFiles(cd: DataTransfer | null | undefined): { file: File; itemType?: string }[] {
  if (!cd) return [];

  const out: { file: File; itemType?: string }[] = [];
  const seenKeys = new Set<string>();
  const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

  const itemTypes = [...cd.items]
    .filter((item) => item.kind === "file")
    .map((item) => item.type || undefined);

  // Some browsers expose a single video only on items (not files).
  for (const item of cd.items) {
    if (item.kind !== "file") continue;
    const type = item.type || "";
    if (!type.startsWith("video/") && type !== "application/octet-stream") continue;
    const f = item.getAsFile();
    if (!f || f.size <= 0) continue;
    const key = fileKey(f);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push({ file: f, itemType: type || undefined });
  }
  if (out.length > 0) return out;

  // Windows / Chrome often expose pasted videos only via clipboardData.files.
  for (const f of cd.files) {
    if (!f || f.size <= 0) continue;
    const key = fileKey(f);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const matched = [...cd.items].find((item) => item.kind === "file" && item.getAsFile() === f);
    let itemType = matched?.type || f.type || itemTypes[0] || undefined;
    if (!itemType && f.size > 200 * 1024) itemType = "application/octet-stream";
    out.push({ file: f, itemType });
  }
  if (out.length > 0) return out;

  for (const item of cd.items) {
    if (item.kind !== "file") continue;
    const f = item.getAsFile();
    if (!f || f.size <= 0) continue;
    const key = fileKey(f);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    out.push({ file: f, itemType: item.type || undefined });
  }

  return out;
}

/** Async clipboard read when paste event has no files (common for screen recordings on Windows). */
export async function readClipboardFilesAsync(): Promise<{ file: File; itemType?: string }[]> {
  if (!navigator.clipboard?.read) return [];
  try {
    const items = await navigator.clipboard.read();
    const out: { file: File; itemType?: string }[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      for (const type of item.types) {
        if (!type.startsWith("video/") && !type.startsWith("image/") && type !== "application/octet-stream") {
          continue;
        }
        const blob = await item.getType(type);
        if (!blob || blob.size <= 0) continue;
        const ext = type.startsWith("video/") ? "mp4" : "png";
        const file = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: blob.type || type });
        const key = `${file.name}|${file.size}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ file, itemType: type });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function isVideoFile(file: File, hintType?: string): boolean {
  const type = mimeType(file, hintType);
  if (type.startsWith("video/")) return true;
  if (type.startsWith("image/")) return false;
  if (file.name && VIDEO_EXT.test(file.name)) return true;
  if ((!file.name || GENERIC_CLIPBOARD_NAME.test(file.name)) && file.size > 256 * 1024 && hintType?.startsWith("video/")) {
    return true;
  }
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

export async function detectMediaByMagicBytes(file: File): Promise<"image" | "video" | null> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (bytes.length < 4) return null;

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image";
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image";
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image";
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes.length >= 12) {
      const riffTag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (riffTag === "WEBP") return "image";
      if (riffTag === "AVI ") return "video";
      return null;
    }
    if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video";
    if (
      bytes.length >= 12 &&
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      const brand = readIsoFtypBrand(bytes);
      return brand ? classifyIsoFtypBrand(brand) : "video";
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

const CAMERA_PHOTO_NAME = /^(IMG_|DSC_|DCIM|PXL_|MVIMG_|photo_|image_|Screenshot)/i;

export async function classifyMediaFile(file: File, hintType?: string): Promise<"image" | "video" | "other"> {
  const normalized = normalizeGalleryFile(file, hintType);
  const type = mimeType(normalized, hintType);
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";
  if (isDocumentFile(normalized, hintType)) return "other";

  const magic = await detectMediaByMagicBytes(normalized);
  if (magic === "video") return "video";
  if (magic === "image") return "image";
  if (isAcceptedGalleryImage(normalized)) return "image";

  if (isVideoFile(normalized, hintType)) return "video";
  if (isImageFile(normalized, hintType)) return "image";

  if (CAMERA_PHOTO_NAME.test(normalized.name)) return "image";

  // Pasted screen recordings often lack MIME/filename — prefer magic bytes, then video sniff.
  const ambiguousName = !normalized.name || GENERIC_CLIPBOARD_NAME.test(normalized.name);
  if (ambiguousName && normalized.size > 200 * 1024 && !isDocumentFile(normalized, hintType)) {
    if (await sniffVideoFile(normalized)) return "video";
    return "image";
  }
  if (ambiguousName || normalized.size > 32_000) {
    if (await sniffVideoFile(normalized)) return "video";
  }
  return "other";
}

/** Infer MIME/extension for camera/gallery picks that arrive as octet-stream with no name. */
export async function resolveGalleryPick(file: File, hintType?: string): Promise<File> {
  let normalized = normalizeGalleryFile(file, hintType);
  const baseType = normalized.type?.split(";")[0]?.trim().toLowerCase() || "";
  if (baseType && baseType !== "application/octet-stream") return normalized;

  const magic = await detectMediaByMagicBytes(normalized);
  if (magic === "image") {
    const heic = isHeicOrHeif(normalized);
    const mime = heic ? "image/heic" : "image/jpeg";
    const ext = heic ? "heic" : "jpg";
    const stem = normalized.name.replace(/\.[^.]+$/, "") || `photo-${Date.now()}`;
    const name = /\.[a-z0-9]+$/i.test(normalized.name) ? normalized.name : `${stem}.${ext}`;
    normalized = new File([normalized], name, { type: mime, lastModified: normalized.lastModified });
    return normalized;
  }
  if (magic === "video") {
    const stem = normalized.name.replace(/\.[^.]+$/, "") || `video-${Date.now()}`;
    const name = /\.[a-z0-9]+$/i.test(normalized.name) ? normalized.name : `${stem}.mp4`;
    return new File([normalized], name, { type: "video/mp4", lastModified: normalized.lastModified });
  }
  return normalized;
}

async function canBrowserDecodeImage(file: File): Promise<boolean> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      bmp.close();
      return true;
    } catch {
      return false;
    }
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

async function fileToJpegBlob(file: File, maxDim = 4096, quality = 0.88): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  const url = URL.createObjectURL(file);
  try {
    if (typeof createImageBitmap === "function") {
      try {
        source = await createImageBitmap(file);
      } catch {
        source = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Could not read photo. Try a different image."));
          img.src = url;
        });
      }
    } else {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read photo. Try a different image."));
        img.src = url;
      });
    }
  } finally {
    URL.revokeObjectURL(url);
  }

  const w = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const h = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  let tw = w;
  let th = h;
  if (Math.max(w, h) > maxDim) {
    const scale = maxDim / Math.max(w, h);
    tw = Math.round(w * scale);
    th = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process photo.");
  ctx.drawImage(source as CanvasImageSource, 0, 0, tw, th);
  if ("close" in source && typeof source.close === "function") source.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare photo."))),
      "image/jpeg",
      quality,
    );
  });
}

/** Normalize gallery/camera picks into a browser-friendly JPEG for upload. */
export async function prepareImageForUpload(file: File, hintType?: string): Promise<File> {
  const normalized = await resolveGalleryPick(file, hintType);

  const magic = await detectMediaByMagicBytes(normalized);
  if (magic === "video") throw new Error("That file is a video, not a photo.");
  if (magic !== "image" && !isAcceptedGalleryImage(normalized)) {
    throw new Error("Could not read photo. Try a different image.");
  }

  // HEIC from iPhone camera — upload raw; Cloudinary converts server-side.
  if (isHeicOrHeif(normalized)) {
    const baseName = normalized.name.replace(/\.[^.]+$/, "") || `photo-${Date.now()}`;
    const name = /\.hei[cf]$/i.test(normalized.name) ? normalized.name : `${baseName}.heic`;
    return new File([normalized], name, {
      type: normalized.type || "image/heic",
      lastModified: normalized.lastModified,
    });
  }

  if (
    normalized.type === "image/jpeg" &&
    normalized.size < 12 * 1024 * 1024 &&
    (await canBrowserDecodeImage(normalized))
  ) {
    return normalized;
  }

  try {
    const blob = await fileToJpegBlob(normalized);
    const baseName = normalized.name.replace(/\.[^.]+$/, "") || `photo-${Date.now()}`;
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    const baseName = normalized.name.replace(/\.[^.]+$/, "") || `photo-${Date.now()}`;
    const mime = normalized.type?.startsWith("image/") ? normalized.type : "image/jpeg";
    const ext = mime.includes("png") ? "png" : "jpg";
    return new File([normalized], `${baseName}.${ext}`, { type: mime, lastModified: normalized.lastModified });
  }
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
