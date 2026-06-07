import { getAuthHeaders } from "./session";
import { tryRefreshSession } from "./api";

/** Always prefer raw binary upload (no base64 bloat). */
const BINARY_UPLOAD_MIN_BYTES = 0;

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function normalizeUploadMime(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function binaryUploadHeaders(contentType: string): Record<string, string> {
  const auth = getAuthHeaders();
  // auth includes Content-Type: application/json — must override with real file mime
  return { ...auth, "Content-Type": contentType };
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

/** Raw body upload — much faster than base64 for photos and videos. */
export async function uploadMediaBinary(
  file: File | Blob,
  contentType: string,
  attempt = 0,
): Promise<string> {
  const mime = normalizeUploadMime(contentType);
  const controller = new AbortController();
  const timeoutMs = mime.startsWith("video/") ? 300_000 : 120_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch("/api/media/upload-binary", {
      method: "POST",
      credentials: "include",
      headers: binaryUploadHeaders(mime),
      body: file,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Upload timed out — try a shorter video or better connection.");
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      return uploadMediaBinary(file, contentType, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (await refreshSessionIfUnauthorized(res.status, attempt)) {
    return uploadMediaBinary(file, contentType, attempt + 1);
  }
  if (RETRYABLE_STATUS.has(res.status) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    return uploadMediaBinary(file, contentType, attempt + 1);
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload base64 data URL to Cloudinary via API. Returns public URL. */
export async function uploadMedia(dataUrl: string, contentType?: string, attempt = 0): Promise<string> {
  const mime = contentType ?? guessContentType(dataUrl);
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const approxBytes = Math.floor((base64Data.length * 3) / 4);
  if (approxBytes >= BINARY_UPLOAD_MIN_BYTES) {
    const bin = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    return uploadMediaBinary(new Blob([bin], { type: mime }), mime);
  }

  const res = await fetch("/api/media/upload", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      data: dataUrl,
      contentType: mime,
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
  const mime = normalizeUploadMime(
    contentType ||
      (file instanceof File ? file.type : "") ||
      "application/octet-stream",
  );
  const useBinary =
    file instanceof File ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime.startsWith("application/") ||
    file.size >= BINARY_UPLOAD_MIN_BYTES;
  if (useBinary) {
    return uploadMediaBinary(file, mime);
  }
  const dataUrl = await readFileAsDataUrl(file);
  return uploadMedia(dataUrl, mime || guessContentType(dataUrl));
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
