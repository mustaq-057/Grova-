import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { broadcast } from "../lib/sse";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_POSTS_PER_USER = 20;

const router = Router();

async function enrichPosts(userId: string) {
  const result = await db.execute(
    "SELECT * FROM posts ORDER BY created_at DESC LIMIT 50",
    [],
  );
  const posts = result.rows as Record<string, unknown>[];
  const enriched = await Promise.all(
    posts.map(async (row) => {
      const id = String(row.id);
      const likes = await db.execute(
        "SELECT user_id FROM post_likes WHERE post_id = $1",
        [id],
      );
      const comments = await db.execute(
        "SELECT COUNT(*) as cnt FROM post_comments WHERE post_id = $1",
        [id],
      );
      const likeRows = likes.rows as { user_id: string }[];
      const commentCount = Number((comments.rows[0] as { cnt?: number })?.cnt ?? 0);
      const reactionsResult = await db.execute(
        "SELECT emoji, user_id FROM post_reactions WHERE post_id = $1",
        [id],
      );
      const reactionRows = reactionsResult.rows as { emoji: string; user_id: string }[];
      const reactionCounts: Record<string, number> = {};
      for (const r of reactionRows) {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1;
      }
      const myReaction = reactionRows.find((r) => r.user_id === userId)?.emoji;
      return {
        id,
        authorId: String(row.author_id),
        mediaUrl: String(row.media_url),
        caption: String(row.caption ?? ""),
        location: String(row.location ?? ""),
        aspectRatio: String(row.aspect_ratio ?? "4:5"),
        createdAt: String(row.created_at),
        likeCount: likeRows.length,
        likedByMe: likeRows.some((l) => l.user_id === userId),
        commentCount,
        myReaction,
        reactionCounts,
      };
    }),
  );
  return enriched;
}

router.get("/posts", rateLimiters.read, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  try {
    res.json(await enrichPosts(userId));
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/posts", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const { mediaUrl, caption, location, aspectRatio } = req.body as {
    mediaUrl?: string;
    caption?: string;
    location?: string;
    aspectRatio?: string;
  };
  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  const countResult = await db.execute(
    "SELECT COUNT(*)::int AS cnt FROM posts WHERE author_id = $1",
    [userId],
  );
  const postCount = Number((countResult.rows[0] as { cnt?: number })?.cnt ?? 0);
  if (postCount >= MAX_POSTS_PER_USER) {
    res.status(400).json({
      error: `Maximum ${MAX_POSTS_PER_USER} photos allowed. Delete one from your grid to add more.`,
    });
    return;
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await db.execute(
      "INSERT INTO posts (id, author_id, media_url, caption, location, aspect_ratio, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, mediaUrl, caption ?? "", location ?? "", aspectRatio ?? "4:5", createdAt],
    );
    const post = {
      id,
      authorId: userId,
      mediaUrl,
      caption: caption ?? "",
      location: location ?? "",
      aspectRatio: aspectRatio ?? "4:5",
      createdAt,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    };
    broadcast("post-added", post);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("story", userId, fromName, "shared a new post").catch(() => {});
    res.json(post);
  } catch (err) {
    console.error("Failed to create post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.post("/posts/:id/react", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const postId = String(req.params.id);
  const { emoji } = req.body as { emoji?: string };
  if (!emoji?.trim()) {
    res.status(400).json({ error: "emoji required" });
    return;
  }
  try {
    const existing = await db.execute(
      "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
      [postId, userId],
    );
    const row = existing.rows[0] as { emoji?: string } | undefined;
    if (row?.emoji === emoji) {
      await db.execute("DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db.execute(
        `INSERT INTO post_reactions (post_id, user_id, emoji, created_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (post_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = EXCLUDED.created_at`,
        [postId, userId, emoji, new Date().toISOString()],
      );
    }
    const [post] = await enrichPosts(userId).then((p) => p.filter((x) => x.id === postId));
    if (post) broadcast("post-reacted", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to react" });
  }
});

router.post("/posts/:id/like", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const postId = String(req.params.id);
  try {
    const existing = await db.execute(
      "SELECT user_id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId],
    );
    if (existing.rows.length > 0) {
      await db.execute("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    } else {
      await db.execute(
        "INSERT INTO post_likes (post_id, user_id, created_at) VALUES ($1, $2, $3)",
        [postId, userId, new Date().toISOString()],
      );
    }
    const [post] = await enrichPosts(userId).then((p) => p.filter((x) => x.id === postId));
    if (post) broadcast("post-liked", post);
    res.json(post ?? { success: true });
  } catch {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

router.get("/posts/:id/comments", rateLimiters.read, authenticate, async (req, res) => {
  const postId = String(req.params.id);
  try {
    const result = await db.execute(
      "SELECT * FROM post_comments WHERE post_id = $1 ORDER BY created_at ASC",
      [postId],
    );
    res.json(
      result.rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        postId: String(row.post_id),
        authorId: String(row.author_id),
        text: String(row.text),
        createdAt: String(row.created_at),
      })),
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/posts/:id/comments", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const postId = String(req.params.id);
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await db.execute(
      "INSERT INTO post_comments (id, post_id, author_id, text, created_at) VALUES ($1, $2, $3, $4, $5)",
      [id, postId, userId, text.trim(), createdAt],
    );
    const comment = { id, postId, authorId: userId, text: text.trim(), createdAt };
    broadcast("post-commented", comment);
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity("comment", userId, fromName, text.trim().slice(0, 80)).catch(() => {});
    res.json(comment);
  } catch {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

router.delete("/posts/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const id = String(req.params.id);
  try {
    const existing = await db.execute("SELECT author_id FROM posts WHERE id = $1", [id]);
    const row = existing.rows[0] as { author_id?: string } | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.execute("DELETE FROM post_likes WHERE post_id = $1", [id]);
    await db.execute("DELETE FROM post_comments WHERE post_id = $1", [id]);
    await db.execute("DELETE FROM post_reactions WHERE post_id = $1", [id]);
    await db.execute("DELETE FROM posts WHERE id = $1", [id]);
    broadcast("post-deleted", { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

router.get("/stories", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const now = new Date().toISOString();
    await db.execute("DELETE FROM stories WHERE expires_at <= $1", [now]);
    const result = await db.execute(
      "SELECT * FROM stories WHERE expires_at > $1 ORDER BY created_at ASC",
      [now],
    );
    res.json(
      result.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        authorId: row.author_id,
        mediaUrl: row.media_url,
        kind: row.kind,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      })),
    );
  } catch (err) {
    console.error("Failed to fetch stories:", err);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

router.post("/stories", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const { mediaUrl, kind } = req.body as { mediaUrl?: string; kind?: "story" | "reel" };
  if (!mediaUrl) {
    res.status(400).json({ error: "mediaUrl required" });
    return;
  }
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + STORY_TTL_MS).toISOString();
  const storyKind = kind === "reel" ? "reel" : "story";
  try {
    await db.execute(
      "INSERT INTO stories (id, author_id, media_url, kind, created_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId, mediaUrl, storyKind, createdAt, expiresAt],
    );
    const story = { id, authorId: userId, mediaUrl, kind: storyKind, createdAt, expiresAt };
    broadcast("story-added", story);
    res.json(story);
  } catch (err) {
    console.error("Failed to create story:", err);
    res.status(500).json({ error: "Failed to create story" });
  }
});

router.delete("/stories/:id", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const id = String(req.params.id);
  try {
    const existing = await db.execute("SELECT author_id FROM stories WHERE id = $1", [id]);
    const row = existing.rows[0] as { author_id?: string } | undefined;
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (row.author_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.execute("DELETE FROM stories WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story" });
  }
});

export default router;
