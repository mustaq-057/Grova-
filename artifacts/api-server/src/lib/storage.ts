import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";

const cloudinaryUrl = process.env.CLOUDINARY_URL;
const b2KeyId = process.env.B2_KEY_ID;
const b2ApplicationKey = process.env.B2_APPLICATION_KEY;
const b2BucketName = process.env.B2_BUCKET_NAME || "grova-images";
const b2Endpoint = process.env.B2_ENDPOINT;

const useCloudinary = Boolean(cloudinaryUrl);

if (!useCloudinary && (!b2KeyId || !b2ApplicationKey || !b2Endpoint)) {
  throw new Error("FATAL: Storage not configured. Set CLOUDINARY_URL or B2_KEY_ID + B2_APPLICATION_KEY + B2_ENDPOINT in .env");
}

if (useCloudinary) {
  cloudinary.config({ secure: true });
  console.info("[storage] Using Cloudinary for media uploads");
} else {
  console.info("[storage] Using Backblaze B2 for media uploads");
}

const s3Client =
  b2KeyId && b2ApplicationKey && b2Endpoint
    ? new S3Client({
        region: "us-east-1",
        endpoint: b2Endpoint,
        credentials: {
          accessKeyId: b2KeyId,
          secretAccessKey: b2ApplicationKey,
        },
      })
    : null;

if (!useCloudinary && !s3Client) {
  throw new Error("FATAL: S3 client failed to initialize. Check B2 credentials in .env");
}

function cloudinaryResourceType(contentType: string): "image" | "video" | "raw" {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "raw";
}

async function uploadToCloudinary(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const resourceType = cloudinaryResourceType(contentType);
  const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;

  const result = await cloudinary.uploader.upload(
    `data:${contentType};base64,${buffer.toString("base64")}`,
    {
      public_id: publicId,
      resource_type: resourceType,
      overwrite: true,
    },
  );

  return result.secure_url;
}

async function uploadToB2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  if (!s3Client) {
    throw new Error("Backblaze B2 client not configured");
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: b2BucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `${b2Endpoint}/${b2BucketName}/${key}`;
}

export async function uploadImage(key: string, buffer: Buffer, contentType: string): Promise<string> {
  return uploadMedia(key, buffer, contentType);
}

export async function uploadMedia(key: string, buffer: Buffer, contentType: string): Promise<string> {
  try {
    if (useCloudinary) {
      return await uploadToCloudinary(key, buffer, contentType);
    }
    return await uploadToB2(key, buffer, contentType);
  } catch (error) {
    console.error("Failed to upload media:", error);
    throw new Error("Failed to upload media");
  }
}

export async function getImageUrl(key: string): Promise<string> {
  if (useCloudinary) {
    throw new Error("Cloudinary URLs are returned directly from upload");
  }
  if (!s3Client) {
    throw new Error("Backblaze B2 client not configured");
  }
  return `${b2Endpoint}/${b2BucketName}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  if (useCloudinary) {
    const publicId = `grova/${key.replace(/\.[^.]+$/, "")}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" }).catch(() => {});
    return;
  }

  if (!s3Client) {
    throw new Error("Backblaze B2 client not configured");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: b2BucketName,
      Key: key,
    }),
  );
}
