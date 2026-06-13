import { randomUUID } from "crypto";
import db from "./db";
import { broadcast } from "./sse";

export type ActivityType =
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

export async function postCoupleActivity(
  type: ActivityType,
  actorId: string,
  fromName: string,
  text: string,
): Promise<void> {
  const id = randomUUID();
  const timestamp = new Date().toISOString();
  await db.execute(
    "INSERT INTO activity_feed (id, type, actor_id, from_name, text, timestamp, read) VALUES ($1, $2, $3, $4, $5, $6, 0)",
    [id, type, actorId, fromName, text, timestamp],
  );
  broadcast("activity-added", { id, type, actorId, fromName, text, timestamp, read: false });
}

export async function profileDisplayName(userId: string): Promise<string> {
  const result = await db.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
  const row = result.rows[0] as { name?: string } | undefined;
  return row?.name || userId;
}
