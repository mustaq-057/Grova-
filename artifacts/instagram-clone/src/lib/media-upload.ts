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
async function ensureReadableBlob(file: Blob | File): Promise<Blob | File> {
  // Skip for non-Android or very large files (>40MB) to prevent OOM
  if (!navigator.userAgent.toLowerCase().includes("android") || file.size > 40 * 1024 * 1024) {
    return file;
  }
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const res = await fetch(objectUrl);
    if (!res.ok) throw new Error("fetch failed");
    const buf = await res.arrayBuffer();
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
      const resolvedType = (file.type && file.type !== "application/octet-stream")
        ? file.type
        : sniffMimeFromBytes(buf);
      if (file instanceof File) {
        return new File([buf], file.name || `media.${resolvedType.split("/")[1] ?? "jpg"}`, { type: resolvedType, lastModified: file.lastModified });
      }
      return new Blob([buf], { type: resolvedType });
    } catch {
      return file; // Fallback to raw file if everything fails
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
  let res = await fetch("/api/media/upload-binary", {
    method: "POST",
    credentials: "include",
    headers: binaryUploadHeaders(mime, fileName),
    body: file,
    signal: controller.signal,
  });
  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    res = await fetch("/api/media/upload-binary", {
      method: "POST",
      credentials: "include",
      headers: binaryUploadHeaders(mime, fileName),
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
      throw new Error(`PDF upload failed. Details: ${combinedError || "Check Cloudinary settings on Vercel"}`);
    } else {
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
  const mime =
    normalizeUploadMime(contentType || (file instanceof File ? file.type : "") || "application/octet-stream");

  const fileName = file instanceof File ? file.name : undefined;
  const useBinary = isPdfMime(mime) || file.size >= BINARY_UPLOAD_MIN_BYTES;

  if (useBinary) {
    return uploadMediaBinary(file, mime, 0, fileName);
  }
  const dataUrl = await readFileAsDataUrl(file);
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

/**
 * Read a Blob/File as a data URL.
 *
 * Strategy (most-to-least reliable on Android WebViews):
 * 1. FileReader.readAsDataURL  — works on most devices
 * 2. fetch(objectURL) → arrayBuffer → manual base64  — fallback for Android
 *    WebViews where FileReader fails silently on content:// gallery URIs
 *    (common on Samsung One UI / MIUI / Android 13+ without READ_MEDIA_*)
 */
export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // ── Primary path: FileReader ─────────────────────────────────────────
    const reader = new FileReader();
    let settled = false;

    const done = (result: string) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const fail = (errMsg: string) => {
      if (settled) return;
      settled = true;
      // ── Fallback path: fetch objectURL → arrayBuffer → base64 ───────
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
      } catch {
        reject(new Error(errMsg));
        return;
      }
      fetch(objectUrl)
        .then((r) => {
          if (!r.ok) throw new Error(`fetch blob failed: ${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) => {
          const bytes = new Uint8Array(buf);
          const mime =
            (file instanceof File ? file.type : "") ||
            "application/octet-stream";
          const b64 = uint8ArrayToBase64(bytes);
          resolve(`data:${mime};base64,${b64}`);
        })
        .catch(() => reject(new Error(errMsg)))
        .finally(() => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        });
    };

    reader.onloadend = () => {
      if (reader.result) {
        done(reader.result as string);
      } else {
        fail("Failed to read file");
      }
    };
    reader.onerror = () => fail("Failed to read file");

    // Safety net: some Android WebViews never fire onloadend/onerror for
    // content:// URIs — trigger fallback after 8 s.
    const timeout = window.setTimeout(() => fail("Failed to read file"), 8000);
    reader.onloadend = () => {
      window.clearTimeout(timeout);
      if (reader.result) {
        done(reader.result as string);
      } else {
        fail("Failed to read file");
      }
    };
    reader.onerror = () => {
      window.clearTimeout(timeout);
      fail("Failed to read file");
    };

    reader.readAsDataURL(file);
  });
}
