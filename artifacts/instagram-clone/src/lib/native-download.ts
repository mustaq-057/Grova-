import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Media } from "@capacitor-community/media";
import { Share } from "@capacitor/share";
import { toast } from "sonner";

/** In-flight guard — prevents double-tap from triggering two concurrent downloads. */
let _downloadInProgress = false;

/**
 * Save a file to the device.
 * - Images → saved DIRECTLY to the photo gallery (no share sheet, no dialog).
 * - Other files → use native share sheet (only option without a Files app API).
 * - Web → standard <a download> trick.
 */
export async function downloadFileNative(blob: Blob, filename: string): Promise<void> {
  if (_downloadInProgress) return;
  _downloadInProgress = true;

  try {
    if (!Capacitor.isNativePlatform()) {
      // Web: standard anchor download
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      return;
    }

    // ── Native Android/iOS ────────────────────────────────────────────
    const base64Data = await blobToBase64(blob);

    // Write the file to the Cache directory first
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    const lc = filename.toLowerCase();
    const isImage =
      lc.endsWith(".jpg") || lc.endsWith(".jpeg") ||
      lc.endsWith(".png") || lc.endsWith(".webp") ||
      lc.endsWith(".gif") || lc.endsWith(".heic");

    if (isImage) {
      // ── Save image straight to gallery — NO share dialog ────────────
      // NOTE: Do NOT call Media.checkPermissions() first!
      // On Android 13+ it checks WRITE_EXTERNAL_STORAGE (capped at API 32),
      // which always returns 'denied' even when READ_MEDIA_IMAGES is granted.
      // Just call savePhoto() directly — the OS enforces permissions itself.
      try {
        await Media.savePhoto({ path: writeResult.uri });
        toast.success("Saved to gallery! ✓");
      } catch (mediaErr: any) {
        console.error("Media.savePhoto failed:", mediaErr);
        // Only show a permissions message if it's actually a permission error
        const errMsg = (mediaErr?.message ?? "").toLowerCase();
        if (errMsg.includes("permission") || errMsg.includes("denied") || errMsg.includes("access")) {
          toast.error("Gallery access denied. Go to Settings → Apps → Grovaa → Permissions → Photos and allow.");
        } else {
          toast.error("Could not save to gallery. Please try again.");
        }
      }
    } else {
      // Non-image files: share sheet is the correct Android UX here
      try {
        await Share.share({
          title: filename,
          url: writeResult.uri,
          dialogTitle: "Save or Share File",
        });
      } catch {
        toast.error("Could not share file.");
      }
    }
  } catch (error) {
    console.error("downloadFileNative failed:", error);
    toast.error("Download failed. Check permissions and try again.");
  } finally {
    _downloadInProgress = false;
  }
}

/**
 * Convert a Blob to a base64 string (without the data: prefix).
 * Uses arrayBuffer path on Android WebViews where FileReader can fail silently.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  // Primary: FileReader (fast, works everywhere except some Samsung WebViews)
  try {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      const timeout = window.setTimeout(() => reject(new Error("timeout")), 6000);
      reader.onloadend = () => {
        window.clearTimeout(timeout);
        const r = reader.result;
        if (typeof r === "string" && r.includes(",")) {
          resolve(r.split(",")[1]!);
        } else {
          reject(new Error("bad result"));
        }
      };
      reader.onerror = () => { window.clearTimeout(timeout); reject(reader.error); };
      reader.readAsDataURL(blob);
    });
    return result;
  } catch {
    // Fallback: arrayBuffer → manual base64 (always works in WebViews)
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const CHUNK = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
  }
}

