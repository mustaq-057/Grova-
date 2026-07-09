import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Media } from "@capacitor-community/media";
import { toast } from "sonner";

/**
 * Safely downloads a file. 
 * On Web: uses the standard <a download> trick.
 * On Native (Android/iOS): uses @capacitor/filesystem to save and @capacitor/share to share/save to gallery.
 */
export async function downloadFileNative(blob: Blob, filename: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    // Web implementation
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

  // Native Android/iOS implementation
  try {
    const base64Data = await blobToBase64(blob);
    
    // Write to Cache directory first
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    const isImage = filename.toLowerCase().endsWith(".jpg") || 
                    filename.toLowerCase().endsWith(".jpeg") || 
                    filename.toLowerCase().endsWith(".png");

    if (isImage) {
      try {
        let albumId: string | undefined;
        if (Capacitor.getPlatform() === 'android') {
          try {
            const albumsResponse = await Media.getAlbums();
            // Try to find a standard album, or create one for our app
            let targetAlbum = albumsResponse.albums.find(a => a.name === 'Pictures' || a.name === 'Grovaa');
            if (!targetAlbum) {
              await Media.createAlbum({ name: 'Grovaa' });
              const newAlbums = await Media.getAlbums();
              targetAlbum = newAlbums.albums.find(a => a.name === 'Grovaa');
            }
            if (targetAlbum) albumId = targetAlbum.identifier;
          } catch (albumErr) {
            console.warn("Could not fetch albums", albumErr);
          }
        }

        // Save directly to the device gallery using the media plugin by passing base64 directly
        await Media.savePhoto({ 
          path: `data:image/jpeg;base64,${base64Data}`,
          ...(albumId ? { albumIdentifier: albumId } : {})
        });
        toast.success("Saved to gallery!");
      } catch (mediaErr) {
        console.error("Media save error, falling back to Share:", mediaErr);
        // Fallback to the native share sheet if the gallery API fails
        await Share.share({
          title: filename,
          url: writeResult.uri,
          dialogTitle: "Save Image",
        });
      }
    } else {
      // For non-images (or if we prefer), fallback to the native share sheet
      await Share.share({
        title: filename,
        url: writeResult.uri,
        dialogTitle: "Save or Share File",
      });
    }
    
  } catch (error) {
    console.error("Native download failed:", error);
    toast.error("Failed to save file. Check permissions.");
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data URI prefix (e.g., "data:image/jpeg;base64,")
        const b64 = reader.result.split(",")[1];
        resolve(b64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.readAsDataURL(blob);
  });
}
