import { getAuthHeaders } from "./session";
import { tryRefreshSession } from "./api";

/** Use binary upload for files > 5MB to avoid base64 bloat; smaller files use base64 for better compatibility in strict WebViews. */
const BINARY_UPLOAD_MIN_BYTES = 5 * 1024 * 1024;

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function normalizeUploadMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function binaryUploadHeaders(contentType: string, fileName?: string): Record<string, string> {
  const auth = getAuthHeaders();
  // auth includes Content-Type: application/json — must override with real file mime
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

/** PDFs must use the backend raw upload — Cloudinary auto/upload mishandles PDFs and JSON base64 hits Vercel body limits. */
function preferBackendBinaryUpload(mime: string): boolean {
  return mime === "application/pdf" || mime.startsWith("application/pdf;");
}

async function uploadViaBackendBinary(
  file: File | Blob,
  mime: string,
  fileName: string | undefined,
  controller: AbortController,
  attempt: number,
): Promise<Response> {
  const res = await fetch("/api/media/upload-binary", {
    method: "POST",
    credentials: "include",
    headers: binaryUploadHeaders(mime, fileName),
    body: file,
    signal: controller.signal,
  });
  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    return fetch("/api/media/upload-binary", {
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
  file: File | Blob,
  contentType: string,
  attempt = 0,
  fileName?: string,
): Promise<string> {
  const mime = normalizeUploadMime(contentType);
  const controller = new AbortController();
  const timeoutMs = mime.startsWith("video/") ? 300_000 : 180_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    if (preferBackendBinaryUpload(mime)) {
      res = await uploadViaBackendBinary(file, mime, fileName, controller, attempt);
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

        res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
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
      return uploadMediaBinary(file, contentType, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  // Only refresh session if the request hit our backend (401/403)
  if (!res.url.includes("api.cloudinary.com") && await refreshSessionIfUnauthorized(res.status, attempt)) {
    return uploadMediaBinary(file, contentType, attempt + 1);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return uploadMediaBinary(file, contentType, attempt + 1);
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
    return uploadMediaBinary(new Blob([bytes], { type: mime }), mime);
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
    return uploadMedia(dataUrl, contentType, attempt + 1);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 1) {
    await new Promise((r) => setTimeout(r, 600));
    return uploadMedia(dataUrl, contentType, attempt + 1);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload a File/Blob — binary path to Cloudinary (best for mobile camera, docs, video). */
export async function uploadMediaFile(file: File | Blob, contentType?: string): Promise<string> {
  const mime =
    normalizeUploadMime(contentType || (file instanceof File ? file.type : "") || "application/octet-stream");

  const fileName = file instanceof File ? file.name : undefined;
  const useBinary = preferBackendBinaryUpload(mime) || file.size >= BINARY_UPLOAD_MIN_BYTES;

  if (useBinary) {
    return uploadMediaBinary(file, mime, 0, fileName);
  }
  const dataUrl = await readFileAsDataUrl(file);
  return uploadMedia(dataUrl, mime || guessContentType(dataUrl), 0, fileName);
}

/** @deprecated Use uploadMedia — kept for older imports */
export const uploadMediaToB2 = uploadMedia;

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
