import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";

const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (!cloudinaryUrl?.startsWith("cloudinary://")) {
  throw new Error(
    "FATAL: CLOUDINARY_URL must be set (cloudinary://API_KEY:API_SECRET@CLOUD_NAME). Get it from https://console.cloudinary.com",
  );
}

const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (match) {
  cloudinary.config({
    cloud_name: match[3],
    api_key: match[1],
    api_secret: match[2],
    secure: true,
  });
}

console.info("[storage] Using Cloudinary for media uploads");

function cloudinaryResourceType(contentType: string): "image" | "video" | "raw" {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "raw";
}

async function uploadToCloudinary(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const resourceType = cloudinaryResourceType(contentType);
  const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
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
  const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
}
