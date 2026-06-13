import { Router } from "express";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { broadcast } from "../lib/sse";
import { AuthenticatedRequest } from "../types";
import { logger } from "../lib/logger";
import { postCoupleActivity, profileDisplayName } from "../lib/activity-feed";

const router = Router();

function parseStoredNote(raw: string): { text: string; at: string } {
  if (!raw) return { text: "", at: "" };
  try {
    const parsed = JSON.parse(raw) as { text?: string; at?: string };
    if (parsed && typeof parsed.text === "string") {
      return { text: parsed.text, at: parsed.at || "" };
    }
  } catch {
    /* legacy plain text */
  }
  return { text: raw, at: new Date().toISOString() };
}

function noteIfFresh(raw: string): string {
  const { text, at } = parseStoredNote(raw);
  if (!text) return "";
  if (!at) return text;
  const age = Date.now() - new Date(at).getTime();
  if (age > 24 * 60 * 60 * 1000) return "";
  return text;
}

function prefsFromRows(rows: { key: string; value: string }[]) {
  const prefs: Record<string, string> = {};
  for (const row of rows) prefs[row.key] = row.value;
  let quickEmojis: string[] = [];
  try {
    if (prefs.quick_emojis) {
      const parsed = JSON.parse(prefs.quick_emojis) as unknown;
      if (Array.isArray(parsed)) {
        quickEmojis = parsed.filter((e): e is string => typeof e === "string").slice(0, 5);
      }
    }
  } catch {
    /* ignore */
  }
  return {
    chatTheme: prefs.chat_theme || "default",
    appTheme: prefs.app_theme || "grova",
    readReceipts: prefs.read_receipts !== "off",
    showPresence: prefs.show_presence !== "off",
    notifications: prefs.notifications !== "off",
    noteMe: noteIfFresh(prefs.note_me || ""),
    noteWife: noteIfFresh(prefs.note_wife || ""),
    quickEmojis,
  };
}

async function loadPrefsPayload() {
  const result = await db.execute("SELECT key, value FROM couple_prefs", []);
  return prefsFromRows(result.rows as { key: string; value: string }[]);
}

/** Shared couple preferences — both accounts see the same values. */
router.get("/couple/prefs", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    res.json(await loadPrefsPayload());
  } catch (err) {
    logger.error({ err }, "Failed to fetch couple prefs");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/couple/prefs", rateLimiters.messages, authenticate, async (req, res) => {
  const { chatTheme, appTheme, readReceipts, showPresence, notifications, quickEmojis } = req.body as {
    chatTheme?: string;
    appTheme?: string;
    readReceipts?: boolean;
    showPresence?: boolean;
    notifications?: boolean;
    quickEmojis?: string[];
  };
  try {
    const upsert = async (key: string, value: string) => {
      await db.execute(
        `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value],
      );
    };
    if (chatTheme !== undefined) await upsert("chat_theme", chatTheme);
    if (appTheme !== undefined) await upsert("app_theme", appTheme);
    if (readReceipts !== undefined) await upsert("read_receipts", readReceipts ? "on" : "off");
    if (showPresence !== undefined) await upsert("show_presence", showPresence ? "on" : "off");
    if (notifications !== undefined) await upsert("notifications", notifications ? "on" : "off");
    if (quickEmojis !== undefined) {
      await upsert("quick_emojis", JSON.stringify(quickEmojis.slice(0, 5)));
    }

    const payload = await loadPrefsPayload();
    broadcast("prefs-updated", payload);
    res.json(payload);
  } catch (err) {
    logger.error({ err }, "Failed to update couple prefs");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

router.get("/couple/notes", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const payload = await loadPrefsPayload();
    res.json({ me: payload.noteMe, wife: payload.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.put("/couple/notes", rateLimiters.messages, authenticate, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { text } = req.body as { text?: string };
  if (text === undefined) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const key = userId === "wife" ? "note_wife" : "note_me";
  const trimmed = text.slice(0, 60);
  const payload = JSON.stringify({ text: trimmed, at: new Date().toISOString() });
  try {
    await db.execute(
      `INSERT INTO couple_prefs (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, payload],
    );
    broadcast("note-updated", { userId, text: trimmed });
    const notes = await loadPrefsPayload();
    res.json({ me: notes.noteMe, wife: notes.noteWife });
  } catch (err) {
    res.status(500).json({ error: "Failed to save note" });
  }
});

/** Shared activity feed / notifications for both partners. */
router.get("/couple/activity", rateLimiters.read, authenticate, async (_req, res) => {
  try {
    const [result, profilesResult] = await Promise.all([
      db.execute(
        "SELECT id, type, actor_id, from_name, text, timestamp, read FROM activity_feed ORDER BY timestamp DESC LIMIT 50",
        [],
      ),
      db.execute("SELECT id, name FROM profiles WHERE id IN ('me', 'wife')", []),
    ]);
    const nameByActor = new Map(
      profilesResult.rows.map((row) => {
        const r = row as { id: string; name: string };
        return [r.id, r.name] as const;
      }),
    );
    res.json({
      notifications: result.rows.map((r: Record<string, unknown>) => {
        const actorId = r.actor_id ? String(r.actor_id) : undefined;
        const currentName = actorId ? nameByActor.get(actorId) : undefined;
        return {
          id: r.id,
          type: r.type,
          actorId,
          fromName: currentName || r.from_name,
          text: r.text,
          timestamp: r.timestamp,
          read: r.read === 1 || r.read === true,
        };
      }),
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch activity");
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/couple/activity", rateLimiters.messages, authenticate, async (req, res) => {
  const userId = (req as { user?: { id: string } }).user!.id;
  const { type, text } = req.body as {
    type:
      | "like"
      | "comment"
      | "story"
      | "dua"
      | "call"
      | "location"
      | "message"
      | "task"
      | "reaction"
      | "doodle"
      | "file"
      | "greeting";
    fromName?: string;
    text: string;
  };
  if (!type || !text) {
    res.status(400).json({ error: "type and text required" });
    return;
  }
  try {
    const fromName = await profileDisplayName(userId);
    await postCoupleActivity(type, userId, fromName, text);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to add activity");
    res.status(500).json({ error: "Failed to add notification" });
  }
});

router.put("/couple/activity/read-all", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db.execute("UPDATE activity_feed SET read = 1", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark read" });
  }
});

router.delete("/couple/activity", rateLimiters.messages, authenticate, async (_req, res) => {
  try {
    await db.execute("DELETE FROM activity_feed", []);
    broadcast("activity-read-all", {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

export default router;
