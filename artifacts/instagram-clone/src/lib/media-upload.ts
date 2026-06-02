import { getAuthHeaders } from "./session";

const BINARY_UPLOAD_MIN_BYTES = 200 * 1024;

function guessContentType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}

function uploadHeaders(contentType: string): Record<string, string> {
  const headers = { ...getAuthHeaders(), "Content-Type": contentType };
  return headers;
}

/** Raw body upload — much faster than base64 for photos and videos. */
export async function uploadMediaBinary(file: File | Blob, contentType: string): Promise<string> {
  const res = await fetch("/api/media/upload-binary", {
    method: "POST",
    credentials: "include",
    headers: uploadHeaders(contentType),
    body: await file.arrayBuffer(),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload base64 data URL to Backblaze B2 via API. Returns public URL. */
export async function uploadMediaToB2(dataUrl: string, contentType?: string): Promise<string> {
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
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload a File/Blob — binary path to B2/Cloudinary (best for mobile camera, docs, video). */
export async function uploadMediaFile(file: File | Blob, contentType?: string): Promise<string> {
  const mime =
    contentType ||
    (file instanceof File ? file.type : "") ||
    "application/octet-stream";
  const useBinary =
    file instanceof File ||
    mime.startsWith("video/") ||
    mime.startsWith("application/") ||
    file.size >= BINARY_UPLOAD_MIN_BYTES;
  if (useBinary) {
    return uploadMediaBinary(file, mime.startsWith("video/") ? mime : mime || "application/octet-stream");
  }
  const dataUrl = await readFileAsDataUrl(file);
  return uploadMediaToB2(dataUrl, mime || guessContentType(dataUrl));
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
