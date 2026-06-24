import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { parseCloudinaryCredentials, requireCloudinaryCredentials } from "./cloudinary-config";

let cloudinaryReady = false;

/** Configure Cloudinary once — lazy so login/API boot even if media env is wrong. */
function ensureCloudinary(): void {
  if (cloudinaryReady) return;

  const creds = parseCloudinaryCredentials();
  if (!creds) {
    throw new Error(
      "Cloudinary not configured. Set CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME in Vercel Environment Variables.",
    );
  }

  cloudinary.config({
    cloud_name: creds.cloudName,
    api_key: creds.apiKey,
    api_secret: creds.apiSecret,
    secure: true,
  });

  cloudinaryReady = true;
}

export { requireCloudinaryCredentials };

export function isCloudinaryConfigured(): boolean {
  try {
    ensureCloudinary();
    return true;
  } catch {
    return false;
  }
}

function cloudinaryResourceType(contentType: string): "image" | "video" | "raw" {
  if (contentType.startsWith("video/") || contentType.startsWith("audio/")) return "video";
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
  // Images are stored without extension in public_id, videos/raw with extension
  const publicIdNoExt = `grova/${key.replace(/\.[^.]+$/, "")}`;
  const publicIdWithExt = `grova/${key}`;
  await Promise.all([
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "image" }).catch(() => {}),
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "raw" }).catch(() => {}),
    cloudinary.uploader.destroy(publicIdNoExt, { resource_type: "video" }).catch(() => {}),
    // Also try with extension for video/raw which may have been uploaded with it
    cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "video" }).catch(() => {}),
    cloudinary.uploader.destroy(publicIdWithExt, { resource_type: "raw" }).catch(() => {}),
  ]);
}

/**
 * Delete a Cloudinary asset using the full public_id and resource_type
 * parsed directly from the Cloudinary URL. More reliable than deleteImage.
 */
export async function deleteCloudinaryAsset(publicId: string, resourceType: "image" | "video" | "raw"): Promise<void> {
  ensureCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {});
  // Try image as fallback in case the resource_type was incorrectly identified
  if (resourceType !== "image") {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
  }
}

