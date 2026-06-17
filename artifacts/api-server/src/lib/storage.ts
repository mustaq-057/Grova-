import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

let cloudinaryReady = false;

/** Configure Cloudinary once — lazy so login/API boot even if media env is wrong. */
function ensureCloudinary(): void {
  if (cloudinaryReady) return;

  const url = (process.env.CLOUDINARY_URL || "").trim();
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

  if (url.startsWith("cloudinary://")) {
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (!match) {
      throw new Error(
        "CLOUDINARY_URL format invalid. Use cloudinary://API_KEY:API_SECRET@CLOUD_NAME (no quotes). Or set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
      );
    }
    cloudinary.config({
      cloud_name: match[3]!.trim(),
      api_key: match[1]!.trim(),
      api_secret: match[2]!.trim(),
      secure: true,
    });
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } else {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in Vercel Environment Variables.",
    );
  }

  cloudinaryReady = true;
}

export function isCloudinaryConfigured(): boolean {
  try {
    ensureCloudinary();
    return true;
  } catch {
    return false;
  }
}

function cloudinaryResourceType(contentType: string): "image" | "video" | "raw" {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "raw";
}

async function uploadToCloudinary(key: string, buffer: Buffer, contentType: string): Promise<string> {
  ensureCloudinary();
  const resourceType = cloudinaryResourceType(contentType);
  // Cloudinary requires extensions for raw files, and prefers them for videos.
  const publicId = (resourceType === "raw" || resourceType === "video") 
    ? `grova/${key}` 
    : `grova/${key.replace(/\.[^.]+$/, "")}`;
  const opts = {
    public_id: publicId,
    resource_type: resourceType,
    overwrite: true,
  };

  if (resourceType === "video" || resourceType === "raw" || buffer.length > 512 * 1024) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(opts, (err, result) => {
        if (err) reject(err);
        else if (!result?.secure_url) reject(new Error("Cloudinary upload returned no URL"));
        else resolve(result.secure_url);
      });
      Readable.from(buffer).pipe(upload);
    });
  }

  const result = await cloudinary.uploader.upload(
    `data:${contentType};base64,${buffer.toString("base64")}`,
    opts,
  );

  return result.secure_url;
}

export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  return uploadMedia(key, buffer, contentType);
}

export async function uploadMedia(key: string, buffer: Buffer, contentType: string): Promise<string> {
  try {
    return await uploadToCloudinary(key, buffer, contentType);
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to upload media to Cloudinary");
  }
}

export async function deleteImage(key: string): Promise<void> {
  ensureCloudinary();
  const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
}
