import { Router } from "express";
import { randomUUID } from "crypto";
import { uploadMedia, deleteImage } from "../lib/storage";
import db from "../lib/db";
import { authenticate, authenticateBearerOrQuery } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import {
  ensureFileNameWithExtension,
  extForContentType,
  resolveContentType,
} from "../lib/file-mime";

// Helper to normalize Express params (can be string or string[])
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

function allowedMediaHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "res.cloudinary.com" || host.endsWith(".cloudinary.com")) return true;
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
  req: { body: { data?: string; image?: string; contentType?: string } },
  res: import("express").Response,
) {
  try {
    if (!req.body?.data) {
      res.status(400).json({ error: "No media data provided" });
      return;
    }

    const { data, contentType } = req.body as { data: string; contentType?: string };
    const mime = contentType || "image/jpeg";
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 60 * 1024 * 1024) {
      res.status(400).json({ error: "File too large (max 60MB)" });
      return;
    }

    const key = `${randomUUID()}.${extForContentType(mime)}`;
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

router.post("/media/upload", rateLimiters.upload, authenticate, async (req, res) => {
  await handleMediaUpload(req, res);
});

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
