import { getAuthHeaders } from "./session";
import { tryRefreshSession } from "./api";

/** Use binary upload for files > 5MB to avoid base64 bloat; smaller files use base64 for better compatibility in strict WebViews. */
const BINARY_UPLOAD_MIN_BYTES = 5 * 1024 * 1024;
/** Vercel request body limit is ~4.5MB — keep JSON uploads under this. */
const JSON_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function normalizeUploadMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function binaryUploadHeaders(contentType: string, fileName?: string): Record<string, string> {
  const auth = getAuthHeaders();
  const headers: Record<string, string> = { ...auth, "Content-Type": contentType };
  if (fileName) {
    headers["X-File-Name"] = encodeURIComponent(fileName);
  }
  return headers;
}

function guessContentType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}

async function refreshSessionIfUnauthorized(status: number, attempt: number): Promise<boolean> {
  if ((status === 401 || status === 403) && attempt === 0) {
    return tryRefreshSession();
  }
  return false;
}

function isPdfMime(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("application/pdf;");
}
/** Sniff MIME type from the first bytes of a buffer (magic bytes). */
function sniffMimeFromBytes(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf, 0, Math.min(12, buf.byteLength));
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  // GIF: 47 49 46
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  // WEBP: RIFF????WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  // HEIC/HEIF: ftyp box
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "image/heic";
  // MP4: ftyp
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return "video/mp4";
  // WebM: 1A 45 DF A3
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  return "image/jpeg"; // Safe default for gallery picks
}

/**
 * Safely copies a Blob/File into memory for Android WebViews. 
 * Prevents strict Android 13+ WebView errors where streaming a raw 
 * content:// URI directly to a network POST request fails.
 * Also sniffs MIME type from magic bytes when file.type is empty (Android 15).
 */
/**
 * Cache of already-materialized blobs — prevents re-reading the same file
 * multiple times through the pipeline (resolveGalleryPick → readFileAsDataUrl).
 * WeakMap so entries are GC'd automatically when the blob is no longer referenced.
 */
const materializedCache = new WeakMap<Blob, Blob | File>();

/** Copy content:// gallery picks into memory — required on Android 13–15 WebViews (Samsung One UI). */
export async function materializeGalleryFile(file: Blob | File): Promise<Blob | File> {
  // Return the cached copy if we already read this blob into memory.
  const cached = materializedCache.get(file);
  if (cached) return cached;
  const result = await ensureReadableBlob(file);
  if (result !== file) {
    // Cache original → result (so calling with original file again is fast)
    materializedCache.set(file, result);
    // Cache result → result (so downstream stages that receive the materialized
    // file also skip re-reading — they get a different object reference than
    // the original content:// File, so without this they'd miss the cache)
    materializedCache.set(result as Blob, result);
  }
  return result;
}

function isAndroid(): boolean {
  return navigator.userAgent.toLowerCase().includes("android");
}

/** Materialize multiple gallery picks sequentially — parallel reads break on Vivo/Samsung WebViews. */
export async function materializeGalleryFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const raw = files[i]!;
    if (!raw || raw.size <= 0) continue;
    try {
      const materialized = (await materializeGalleryFile(raw)) as File;
      const ext = materialized.type?.split("/")[1] || "jpg";
      const stem =
        materialized.name && !/^blob|^image\.|^file$/i.test(materialized.name)
          ? materialized.name.replace(/\.[^.]+$/, "")
          : `photo-${Date.now()}-${i}`;
      const name = /\.[a-z0-9]+$/i.test(materialized.name) ? materialized.name : `${stem}.${ext}`;
      out.push(
        name === materialized.name
          ? materialized
          : new File([materialized], name, { type: materialized.type, lastModified: materialized.lastModified }),
      );
    } catch (err) {
      console.warn("[gallery] failed to read file", i, err);
    }
  }
  return out;
}

async function ensureReadableBlob(file: Blob | File, attempt = 0): Promise<Blob | File> {
  // Skip for non-Android or very large files (>40MB) to prevent OOM
  if (!isAndroid() || file.size > 40 * 1024 * 1024) {
    return file;
  }
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const res = await fetch(objectUrl);
    if (!res.ok) throw new Error("fetch failed");
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error("empty file");
    // Resolve MIME — sniff from magic bytes if type is empty (Android 15 content:// URIs)
    const resolvedType = (file.type && file.type !== "application/octet-stream")
      ? file.type
      : sniffMimeFromBytes(buf);
    if (file instanceof File) {
      return new File([buf], file.name || `media.${resolvedType.split("/")[1] ?? "jpg"}`, { type: resolvedType, lastModified: file.lastModified });
    }
    return new Blob([buf], { type: resolvedType });
  } catch (err) {
    try {
      const buf = await file.arrayBuffer();
      if (!buf.byteLength) throw new Error("empty file");
      const resolvedType = (file.type && file.type !== "application/octet-stream")
        ? file.type
        : sniffMimeFromBytes(buf);
      if (file instanceof File) {
        return new File([buf], file.name || `media.${resolvedType.split("/")[1] ?? "jpg"}`, { type: resolvedType, lastModified: file.lastModified });
      }
      return new Blob([buf], { type: resolvedType });
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
        return ensureReadableBlob(file, attempt + 1);
      }
      throw new Error("Failed to read file");
    }
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Upload PDF directly to Backblaze B2 via presigned URL — bypasses Vercel body limits. */
async function uploadPdfToB2(
  file: File | Blob,
  controller: AbortController,
  attempt = 0,
): Promise<string> {
  // 1. Get presigned upload URL from backend
  const signRes = await fetch("/api/media/b2-sign", {
    headers: getAuthHeaders(),
    credentials: "include",
    signal: controller.signal,
  });

  if (!signRes.ok) {
    const err = (await signRes.json().catch(() => ({ error: "B2 sign failed" }))) as { error?: string };
    throw new Error(err.error || `Upload setup failed (HTTP ${signRes.status}). Check B2 Environment Variables.`);
  }

  const { uploadUrl, fileUrl } = (await signRes.json()) as {
    uploadUrl: string;
    fileUrl: string;
  };

  if (!uploadUrl || !fileUrl) {
    throw new Error("B2 is misconfigured — uploadUrl or fileUrl missing from sign response.");
  }

  // 2. PUT the file directly to Backblaze B2
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": "application/pdf",
    },
    signal: controller.signal,
  });

  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    return uploadPdfToB2(file, controller, attempt + 1);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return uploadPdfToB2(file, controller, attempt + 1);
  }
  if (!res.ok) {
    const msg = `Backblaze B2 PDF upload failed (HTTP ${res.status})`;
    throw new Error(msg);
  }

  return fileUrl;
}

async function uploadViaBackendBinary(
  file: File | Blob,
  mime: string,
  fileName: string | undefined,
  controller: AbortController,
  attempt: number,
): Promise<Response> {
  const authHeaders = binaryUploadHeaders(mime, fileName);
  const csrfToken = authHeaders["X-CSRF-Token"] || "";
  const uploadUrl = `/api/media/upload-binary?csrf_token=${encodeURIComponent(csrfToken)}`;

  let res = await fetch(uploadUrl, {
    method: "POST",
    credentials: "include",
    headers: authHeaders,
    body: file,
    signal: controller.signal,
  });
  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    const newHeaders = binaryUploadHeaders(mime, fileName);
    const newCsrf = newHeaders["X-CSRF-Token"] || "";
    res = await fetch(`/api/media/upload-binary?csrf_token=${encodeURIComponent(newCsrf)}`, {
      method: "POST",
      credentials: "include",
      headers: newHeaders,
      body: file,
      signal: controller.signal,
    });
  }
  return res;
}

export async function uploadMediaBinary(
  rawFile: File | Blob,
  contentType: string,
  attempt = 0,
  fileName?: string,
): Promise<string> {
  const file = attempt === 0 ? await ensureReadableBlob(rawFile) : rawFile;
  const mime = normalizeUploadMime(contentType);
  const controller = new AbortController();
  const timeoutMs = isPdfMime(mime)
    ? 3600_000 // 1 hour
    : mime.startsWith("video/") || mime.startsWith("audio/")
      ? 3600_000 // 1 hour
      : 300_000; // 5 minutes
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    if (isPdfMime(mime)) {
      const errors: string[] = [];

      try {
        return await uploadPdfToB2(file, controller, attempt);
      } catch (err) {
        errors.push(`Direct upload: ${err instanceof Error ? err.message : String(err)}`);
      }

      if (file.size <= 200 * 1024 * 1024) {
        try {
          res = await uploadViaBackendBinary(file, mime, fileName, controller, attempt);
          if (res.ok) {
            const body = (await res.json()) as { url?: string; secure_url?: string };
            const url = body.secure_url || body.url || "";
            if (url) return url;
          } else {
            const errBody = await res.json().catch(() => ({}));
            const msg = errBody.error || errBody.message || `HTTP ${res.status}`;
            errors.push(`Backend upload: ${msg}`);
          }
        } catch (err) {
          errors.push(`Backend upload: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (file.size <= JSON_UPLOAD_MAX_BYTES) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          return await uploadMedia(dataUrl, mime, 0, fileName);
        } catch (jsonErr) {
          const msg = jsonErr instanceof Error ? jsonErr.message : "Upload failed";
          errors.push(`JSON upload: ${msg}`);
        }
      }

      const combinedError = errors.join(" | ");
      throw new Error(`Media upload failed. Details: ${combinedError || "Check Cloudinary settings on Vercel"}`);
    } else {
      // On Android WebViews, skip direct Cloudinary upload — FormData with blob
      // data is unreliable and causes HTTP 400 for photos 3+ (bytes get corrupted).
      // Always route through the backend binary endpoint on Android.
      if (!isAndroid()) {
        const signRes = await fetch("/api/media/sign", {
          headers: getAuthHeaders(),
          credentials: "include",
          signal: controller.signal,
        });

        if (signRes.ok) {
          const { signature, timestamp, apiKey, cloudName } = await signRes.json();
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey);
          formData.append("timestamp", String(timestamp));
          formData.append("signature", signature);

          const resourceType = (mime.startsWith("video/") || mime.startsWith("audio/")) ? "video" : "image";
          res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
        } else {
          res = await uploadViaBackendBinary(file, mime, fileName, controller, attempt);
        }
      } else {
        // Android: always use backend to avoid WebView FormData blob corruption
        res = await uploadViaBackendBinary(file, mime, fileName, controller, attempt);
      }
    }
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      const timeoutSec = Math.round(timeoutMs / 1000);
      throw new Error(`Media upload timed out after ${timeoutSec}s. Try a smaller file or better connection.`);
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      return uploadMediaBinary(file, contentType, attempt + 1, fileName);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.url.includes("api.cloudinary.com") && (await refreshSessionIfUnauthorized(res.status, attempt))) {
    return uploadMediaBinary(file, contentType, attempt + 1, fileName);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return uploadMediaBinary(file, contentType, attempt + 1, fileName);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? "Failed to upload to cloud storage");
  }

  const body = (await res.json()) as { url?: string; secure_url?: string };
  return body.secure_url || body.url || "";
}

/** Upload base64 data URL to Cloudinary via API. Returns public URL. */
export async function uploadMedia(dataUrl: string, contentType?: string, attempt = 0, fileName?: string): Promise<string> {
  const mime = contentType ?? guessContentType(dataUrl);
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const approxBytes = Math.floor((base64Data.length * 3) / 4);
  if (approxBytes >= BINARY_UPLOAD_MIN_BYTES) {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return uploadMediaBinary(new Blob([bytes], { type: mime }), mime, 0, fileName);
  }

  const res = await fetch("/api/media/upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      data: dataUrl,
      contentType: mime,
      fileName,
    }),
  });
  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    return uploadMedia(dataUrl, contentType, attempt + 1, fileName);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 1) {
    await new Promise((r) => setTimeout(r, 600));
    return uploadMedia(dataUrl, contentType, attempt + 1, fileName);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload a File/Blob — PDFs go to Cloudinary raw; other media uses auto/binary paths. */
export async function uploadMediaFile(file: File | Blob, contentType?: string): Promise<string> {
  const materialized = await materializeGalleryFile(file);
  const mime = normalizeUploadMime(
    contentType ||
    (materialized instanceof File ? materialized.type : "") ||
    "application/octet-stream",
  );

  const fileName = materialized instanceof File ? materialized.name : undefined;
  const useBinary = isPdfMime(mime) || materialized.size >= BINARY_UPLOAD_MIN_BYTES;

  if (useBinary) {
    return uploadMediaBinary(materialized, mime, 0, fileName);
  }
  const dataUrl = await readFileAsDataUrl(materialized);
  return uploadMedia(dataUrl, mime || guessContentType(dataUrl), 0, fileName);
}

/** @deprecated Use uploadMedia — kept for older imports */
export const uploadMediaToB2 = uploadMedia;

/** Convert a Uint8Array to a base64 string without stack overflow for large buffers. */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function blobToDataUrl(file: Blob, buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const declared =
    file instanceof File && file.type && file.type !== "application/octet-stream" ? file.type : "";
  const mime = declared || sniffMimeFromBytes(buf);
  return `data:${mime};base64,${uint8ArrayToBase64(bytes)}`;
}

async function readDataUrlViaArrayBuffer(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  if (!buf.byteLength) throw new Error("Failed to read file");
  return blobToDataUrl(file, buf);
}

function readDataUrlViaFileReader(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    let settled = false;

    const done = (result: string) => {
      if (settled) return;
      settled = true;
      if (!result || result.length < 32) {
        reject(new Error("Failed to read file"));
        return;
      }
      resolve(result);
    };

    const fail = (errMsg: string) => {
      if (settled) return;
      settled = true;
      readDataUrlViaArrayBuffer(file).then(done).catch(() => reject(new Error(errMsg)));
    };

    const timeout = window.setTimeout(() => fail("Failed to read file"), 8000);
    reader.onloadend = () => {
      window.clearTimeout(timeout);
      if (reader.result) done(reader.result as string);
      else fail("Failed to read file");
    };
    reader.onerror = () => {
      window.clearTimeout(timeout);
      fail("Failed to read file");
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Read a Blob/File as a data URL.
 *
 * On Android WebViews, reads via arrayBuffer first (FileReader often fails on
 * content:// gallery URIs, especially when multiple files are selected).
 */
export async function readFileAsDataUrl(file: Blob): Promise<string> {
  // materializeGalleryFile is cached via WeakMap — no re-read if already done.
  const ready = await materializeGalleryFile(file);
  if (isAndroid()) {
    try {
      return await readDataUrlViaArrayBuffer(ready);
    } catch {
      return readDataUrlViaFileReader(ready);
    }
  }
  return readDataUrlViaFileReader(ready);
}
