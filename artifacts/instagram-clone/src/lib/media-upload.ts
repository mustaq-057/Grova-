import { getAuthHeaders } from "./session";

function guessContentType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}

/** Upload base64 data URL to Backblaze B2 via API. Returns public URL. */
export async function uploadMediaToB2(dataUrl: string, contentType?: string): Promise<string> {
  const res = await fetch("/api/media/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({
      data: dataUrl,
      contentType: contentType ?? guessContentType(dataUrl),
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Upload failed" }))) as { error?: string };
    throw new Error(err.error ?? "Failed to upload to cloud storage");
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

/** Upload a File/Blob in one read — avoids duplicate conversions for video paste. */
export async function uploadMediaFile(file: File | Blob, contentType?: string): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const mime = contentType || (file instanceof File ? file.type : "") || guessContentType(dataUrl);
  return uploadMediaToB2(dataUrl, mime);
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
