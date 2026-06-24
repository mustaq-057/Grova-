import { randomUUID } from "crypto";
import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { deleteImage, deleteCloudinaryAsset } from "../lib/storage";

const router = Router();

/** Parse a Cloudinary URL into { publicId, resourceType } for precise deletion. */
function extractCloudinaryInfo(url: string): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  if (!url) return null;
  try {
    // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload[/v{version}]/{public_id}[.{ext}]
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean); // remove empty strings
    // parts: [cloud_name, resource_type, "upload", optional_version?, ...public_id_parts]
    const uploadIdx = parts.indexOf("upload");
    if (uploadIdx === -1) return null;
    const resourceType = (parts[1] ?? "image") as "image" | "video" | "raw";
    let startIdx = uploadIdx + 1;
    // Skip optional version segment like "v1234567890"
    if (parts[startIdx]?.match(/^v\d+$/)) startIdx++;
    // Join remaining parts as public_id (may include folder/filename)
    const publicId = parts.slice(startIdx).join("/");
    if (!publicId) return null;
    // Images: Cloudinary stores public_id WITHOUT extension; videos/raw WITH extension
    const finalPublicId =
      resourceType === "image" ? publicId.replace(/\.[^.]+$/, "") : publicId;
    return { publicId: finalPublicId, resourceType };
  } catch {
    // Fallback: try matching /grova/<key> pattern
    const match = url.match(/\/grova\/([^/?]+)/);
    if (match) return { publicId: `grova/${match[1].replace(/\.[^.]+$/, "")}`, resourceType: "image" };
    return null;
  }
}

router.post("/stories", authenticate, rateLimiters.messages, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    // Accept both camelCase (from frontend) and snake_case
    const media_url = req.body.mediaUrl ?? req.body.media_url;
    const kind = req.body.kind ?? "story";
    const text_overlay = req.body.text_overlay ?? req.body.textOverlay ?? null;

    if (!media_url) {
      res.status(400).json({ error: "media_url is required" });
      return;
    }

    if (media_url.startsWith("data:")) {
      res.status(400).json({ error: "To protect database storage, stories must be uploaded to Cloudinary instead of storing raw base64 data." });
      return;
    }

    const id = randomUUID();
    const created_at = Date.now().toString();
    const expires_at = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours from now

    await db.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at, text_overlay) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, media_url, kind, created_at, expires_at, text_overlay]
    );

    const result = await db.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE id = $1`, 
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Failed to create story" });
  }
});

router.get("/stories", authenticate, rateLimiters.read, async (req, res) => {
  try {
    const now = Date.now();
    
    // 1. Find and delete expired stories
    try {
      const expiredResult = await db.query(
        `SELECT id, media_url FROM stories WHERE CAST(expires_at AS BIGINT) <= $1`,
        [now]
      );
      if (expiredResult.rows.length > 0) {
        // Delete from DB using parameterized placeholders to avoid injection
        const placeholders = expiredResult.rows.map((_: any, i: number) => `$${i + 1}`).join(",");
        const ids = expiredResult.rows.map((r: any) => r.id);
        await db.execute(`DELETE FROM stories WHERE id IN (${placeholders})`, ids);
        
        // Delete from Cloudinary in background (fire-and-forget)
        expiredResult.rows.forEach((r: any) => {
          if (r.media_url) {
            const info = extractCloudinaryInfo(r.media_url);
            if (info) {
              deleteCloudinaryAsset(info.publicId, info.resourceType).catch(err =>
                console.error("Failed to delete expired story from Cloudinary:", err)
              );
            } else {
              // Fallback to legacy key-based delete
              deleteImage(r.media_url).catch(() => {});
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to clean up expired stories:", err);
    }

    // 2. Fetch active stories
    const result = await db.query(
      `SELECT 
        id, 
        author_id as "authorId", 
        media_url as "mediaUrl", 
        kind, 
        created_at as "createdAt", 
        expires_at as "expiresAt", 
        text_overlay as "textOverlay" 
      FROM stories 
      WHERE CAST(expires_at AS BIGINT) > $1 
      ORDER BY CAST(created_at AS BIGINT) ASC`,
      [now]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.delete("/stories/:id", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Fetch media_url BEFORE deleting, and confirm the story exists + belongs to user
    const storyRes = await db.query(
      "SELECT media_url FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );

    if (!storyRes.rows[0]) {
      res.status(404).json({ error: "Story not found or unauthorized" });
      return;
    }

    await db.execute(
      "DELETE FROM stories WHERE id = $1 AND author_id = $2",
      [id, userId]
    );

    // Delete from Cloudinary (fire-and-forget so response is instant)
    if (storyRes.rows[0]?.media_url) {
      const info = extractCloudinaryInfo(storyRes.rows[0].media_url);
      if (info) {
        deleteCloudinaryAsset(info.publicId, info.resourceType).catch(err =>
          console.error("Failed to delete story from Cloudinary:", err)
        );
      } else {
        deleteImage(storyRes.rows[0].media_url).catch(() => {});
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
