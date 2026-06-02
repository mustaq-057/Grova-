import db from "./db";

export async function getChatClearedAtForUser(userId: string): Promise<string | null> {
  const result = await db.execute("SELECT cleared_at FROM chat_clear_state WHERE user_id = $1", [userId]);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row?.cleared_at ? String(row.cleared_at) : null;
}

export async function setChatClearedForUser(userId: string, clearedAt: string): Promise<void> {
  await db.execute(
    `INSERT INTO chat_clear_state (user_id, cleared_at) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET cleared_at = EXCLUDED.cleared_at`,
    [userId, clearedAt],
  );
}
