import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { uploadMedia, deleteImage } from "../lib/storage";
import db from "../lib/db";
import { authenticate, authenticateBearerOrQuery } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import {
  ensureFileNameWithExtension,
  extForContentType,
  resolveContentType,
  sniffBufferMime,
} from "../lib/file-mime";
import { requireCloudinaryCredentials } from "../lib/cloudinary-config";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

function allowedMediaHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "res.cloudinary.com" || host.endsWith(".cloudinary.com")) return true;
  if (host.includes("backblazeb2.com")) return true;
  try {
    const b2 = process.env.B2_ENDPOINT ? new URL(process.env.B2_ENDPOINT).hostname : "";
    if (b2 && (host === b2 || host.endsWith(b2))) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** Stream chat files inline so mobile Chrome opens PDFs/docs instead of a Cloudinary page. */
router.get("/media/inline", rateLimiters.read, authenticateBearerOrQuery, async (req, res) => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  const fileNameRaw = typeof req.query.name === "string" ? req.query.name : "file";
  const mimeHint = typeof req.query.type === "string" ? req.query.type : undefined;
  const asDownload = req.query.download === "1";

  if (!rawUrl) {
    res.status(400).json({ error: "url required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    res.status(400).json({ error: "Invalid url scheme" });
    return;
  }

  if (!allowedMediaHostname(parsed.hostname)) {
    res.status(403).json({ error: "URL not allowed" });
    return;
  }

  try {
    const upstream = await fetch(rawUrl);
    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch file" });
      return;
    }

    const safeName =
      ensureFileNameWithExtension(
        fileNameRaw.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "file",
        mimeHint,
      );
    const contentType = resolveContentType(
      safeName,
      mimeHint,
      upstream.headers.get("content-type"),
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${asDownload ? "attachment" : "inline"}; filename="${safeName}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=3600");

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Media inline proxy error:", error);
    res.status(500).json({ error: "Failed to open file" });
  }
});

async function handleMediaUpload(
  req: { body: { data?: string; image?: string; contentType?: string; fileName?: string } },
  res: import("express").Response,
) {
  try {
    if (!req.body?.data) {
      res.status(400).json({ error: "No media data provided" });
      return;
    }

    const { data, contentType, fileName } = req.body as { data: string; contentType?: string; fileName?: string };
    const mime = contentType || "image/jpeg";
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 200 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 200MB)" });
      return;
    }

    // Try to get extension from sniffed mime first, fallback to filename extension
    let ext = extForContentType(mime);
    if (ext === "bin" && fileName) {
      const nameExt = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
      if (nameExt && nameExt !== fileName.toLowerCase()) {
        ext = nameExt;
      }
    }

    const key = `${randomUUID()}.${ext}`;
    const url = await uploadMedia(key, buffer, mime);

    res.json({ url, key });
  } catch (error) {
    console.error("Media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}

router.post("/images/upload", rateLimiters.upload, authenticate, async (req, res) => {
  if (req.body?.image && !req.body?.data) {
    req.body.data = req.body.image;
  }
  await handleMediaUpload(req, res);
});

router.get("/media/sign", authenticate, async (req, res) => {
  try {
    const creds = requireCloudinaryCredentials();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const resourceType =
      typeof req.query.resourceType === "string" && req.query.resourceType === "raw" ? "raw" : "auto";
    const paramsToSign: Record<string, string | number> = { timestamp };

    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true,
    });
    const signature = cloudinary.utils.api_sign_request(paramsToSign, creds.apiSecret);
    res.json({
      timestamp,
      signature,
      apiKey: creds.apiKey,
      cloudName: creds.cloudName,
      resourceType,
    });
  } catch (err) {
    console.error("Error generating signature:", err);
    const msg = err instanceof Error ? err.message : "Failed to generate upload signature";
    res.status(err instanceof Error && err.message.includes("not configured") ? 501 : 500).json({ error: msg });
  }
});

router.get("/media/b2-sign", authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      res.status(501).json({ error: "Backblaze B2 is not configured in Environment Variables." });
      return;
    }

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    // We generate a unique file key
    const fileId = crypto.randomUUID();
    const key = `pdfs/${fileId}.pdf`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/pdf",
    });

    const uploadUrl = await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });
    // The final URL where the file will be accessible (if public) or identifiable (for proxy)
    const fileUrl = `${endpoint}/${bucket}/${key}`;

    res.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error("Error generating B2 presigned URL:", err);
    res.status(500).json({ error: "Failed to generate B2 upload URL" });
  }
});

router.get("/media/b2-sign-story", authenticate, async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const region = process.env.AWS_REGION || "us-east-005";
    const endpoint = process.env.B2_ENDPOINT;
    const bucket = process.env.B2_BUCKET_NAME;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      res.status(501).json({ error: "Backblaze B2 is not configured in Environment Variables." });
      return;
    }

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    // We generate a unique file key for a story
    const fileId = crypto.randomUUID();
    const key = `stories/${fileId}.jpg`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "image/jpeg",
    });

    const uploadUrl = await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });
    // The final URL where the file will be accessible (if public) or identifiable (for proxy)
    const fileUrl = `${endpoint}/${bucket}/${key}`;

    res.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error("Error generating B2 story presigned URL:", err);
    res.status(500).json({ error: "Failed to generate B2 story upload URL" });
  }
});

router.post("/media/upload", rateLimiters.upload, authenticate, async (req, res) => {
  await handleMediaUpload(req, res);
});

/** Binary body upload (registered early in app.ts before JSON parser). */
export async function handleBinaryMediaUpload(req: Request, res: Response): Promise<void> {
  try {
    const raw = req.body;
    if (!raw || (typeof raw !== "object" && typeof raw !== "string")) {
      res.status(400).json({ error: "No media data provided" });
      return;
    }

    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
    if (buffer.length === 0) {
      res.status(400).json({ error: "Empty upload" });
      return;
    }
    if (buffer.length > 200 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 200MB)" });
      return;
    }

    const headerMime = String(req.headers["content-type"] || "application/octet-stream").split(";")[0].trim();
    const mime = sniffBufferMime(buffer, headerMime);
    
    let ext = extForContentType(mime);
    const fileNameHeader = req.headers["x-file-name"];
    if (ext === "bin" && fileNameHeader) {
      const fileName = decodeURIComponent(String(fileNameHeader));
      const nameExt = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
      if (nameExt && nameExt !== fileName.toLowerCase()) {
        ext = nameExt;
      }
    }

    const key = `${randomUUID()}.${ext}`;
    const url = await uploadMedia(key, buffer, mime);

    res.json({ url, key });
  } catch (error) {
    console.error("Binary media upload error:", error);
    const msg = error instanceof Error ? error.message : "Failed to upload media";
    res.status(500).json({ error: msg });
  }
}

router.delete("/images/:key", rateLimiters.upload, authenticate, async (req, res) => {
  try {
    const authenticatedUserId = (req as { user?: { id: string } }).user!.id;
    const key = getParam(req.params["key"]);

    const result = await db.execute(
      "SELECT sender_id FROM messages WHERE image_url LIKE $1 OR image_data LIKE $2 OR gif_url LIKE $3 LIMIT 1",
      [`%${key}%`, `%${key}%`, `%${key}%`],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const messageSenderId = (result.rows[0] as { sender_id: string }).sender_id;

    if (messageSenderId !== authenticatedUserId) {
      res.status(403).json({ error: "Forbidden: Can only delete your own images" });
      return;
    }

    await deleteImage(key);
    res.json({ success: true });
  } catch (error) {
    console.error("Image deletion error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

export default router;
