import { Readable } from "node:stream";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

let cloudinaryReady = false;
let s3Client: S3Client | null | undefined;

function b2BucketName(): string {
  return process.env.B2_BUCKET_NAME || "grova-images";
}

function useCloudinary(): boolean {
  const url = (process.env.CLOUDINARY_URL || "").trim();
  if (url.startsWith("cloudinary://")) return true;
  return Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME || "").trim() &&
      (process.env.CLOUDINARY_API_KEY || "").trim() &&
      (process.env.CLOUDINARY_API_SECRET || "").trim(),
  );
}

function useB2(): boolean {
  return Boolean(
    (process.env.B2_KEY_ID || "").trim() &&
      (process.env.B2_APPLICATION_KEY || "").trim() &&
      (process.env.B2_ENDPOINT || "").trim(),
  );
}

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
      "Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.",
    );
  }

  cloudinaryReady = true;
}

function getS3Client(): S3Client | null {
  if (s3Client !== undefined) return s3Client;

  const b2KeyId = (process.env.B2_KEY_ID || "").trim();
  const b2ApplicationKey = (process.env.B2_APPLICATION_KEY || "").trim();
  const b2Endpoint = (process.env.B2_ENDPOINT || "").trim();

  if (!b2KeyId || !b2ApplicationKey || !b2Endpoint) {
    s3Client = null;
    return null;
  }

  s3Client = new S3Client({
    region: "us-east-1",
    endpoint: b2Endpoint,
    credentials: {
      accessKeyId: b2KeyId,
      secretAccessKey: b2ApplicationKey,
    },
  });
  return s3Client;
}

export function isCloudinaryConfigured(): boolean {
  try {
    if (!useCloudinary()) return false;
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

async function uploadToB2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Backblaze B2 client not configured");
  }

  const b2Endpoint = process.env.B2_ENDPOINT!;
  await client.send(
    new PutObjectCommand({
      Bucket: b2BucketName(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${b2Endpoint}/${b2BucketName()}/${key}`;
}

export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  return uploadMedia(key, buffer, contentType);
}

export async function uploadMedia(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const attempts: Array<() => Promise<string>> = [];
  if (useCloudinary()) attempts.push(() => uploadToCloudinary(key, buffer, contentType));
  if (useB2()) attempts.push(() => uploadToB2(key, buffer, contentType));

  if (attempts.length === 0) {
    throw new Error(
      "Storage not configured. Set CLOUDINARY_URL or B2_KEY_ID + B2_APPLICATION_KEY + B2_ENDPOINT.",
    );
  }

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      console.warn("[storage] Upload attempt failed, trying fallback if available:", error);
    }
  }

  console.error("Failed to upload media (all backends):", lastError);
  throw new Error(lastError instanceof Error ? lastError.message : "Failed to upload media");
}

export async function getImageUrl(key: string): Promise<string> {
  if (useCloudinary()) {
    throw new Error("Cloudinary URLs are returned directly from upload");
  }
  const client = getS3Client();
  if (!client) {
    throw new Error("Backblaze B2 client not configured");
  }
  return `${process.env.B2_ENDPOINT}/${b2BucketName()}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  if (useCloudinary()) {
    ensureCloudinary();
    const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
    return;
  }

  const client = getS3Client();
  if (!client) {
    throw new Error("Backblaze B2 client not configured");
  }

  await client.send(
    new DeleteObjectCommand({
      Bucket: b2BucketName(),
      Key: key,
    }),
  );
}
