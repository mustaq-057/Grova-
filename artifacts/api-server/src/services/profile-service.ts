import db from "../lib/db";
import { persistAvatarIfNeeded, sanitizeAvatarForClient } from "../lib/avatar-url";
import { broadcast } from "../lib/sse";
import { postCoupleActivity } from "../lib/activity-feed";
import { appConfig } from "../lib/config";
import { ProfileRow, ProfileUpdatePayload, RawProfileRow } from "../types";

function usernameFromDisplayName(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return slug.slice(0, 30) || "user";
}

export class ProfileService {
  /**
   * Get profiles for authenticated user and their partner
   */
  async getUserProfiles(userId: string): Promise<ProfileRow[]> {
    const partnerId = appConfig.partnerMapping[userId] || userId;
    
    const result = await db.execute(
      "SELECT * FROM profiles WHERE id = $1 OR id = $2",
      [userId, partnerId]
    );
    
    const rows: ProfileRow[] = [];
    for (const row of result.rows) {
      const r = row as RawProfileRow;
      const id = String(r.id);
      const avatar = sanitizeAvatarForClient(id, r.avatar);
      rows.push({
        id,
        username: r.username,
        name: r.name,
        bio: r.bio,
        avatar,
      });
    }
    return rows;
  }

  /**
   * Update a user's profile
   */
  async updateProfile(userId: string, updates: ProfileUpdatePayload): Promise<ProfileRow> {
    const { name, bio, avatar } = updates;
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let n = 1;

    let previousName: string | undefined;
    if (name !== undefined) {
      const existing = await db.execute("SELECT name FROM profiles WHERE id = $1", [userId]);
      previousName = (existing.rows[0] as { name?: string } | undefined)?.name;
      updateFields.push(`name = $${n++}`);
      params.push(name);
      updateFields.push(`username = $${n++}`);
      params.push(usernameFromDisplayName(name));
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${n++}`);
      params.push(bio);
    }
    if (avatar !== undefined) {
      if (typeof avatar === "string" && avatar.length > 3_000_000) {
        throw new Error("Avatar image is too large");
      }
      const storedAvatar = await persistAvatarIfNeeded(userId, avatar);
      updateFields.push(`avatar = $${n++}`);
      params.push(storedAvatar);
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    params.push(userId);
    await db.execute(
      `UPDATE profiles SET ${updateFields.join(", ")} WHERE id = $${n}`,
      params
    );

    const result = await db.execute("SELECT * FROM profiles WHERE id = $1", [userId]);
    const profile = result.rows[0] as unknown as RawProfileRow;

    const publicAvatar = await persistAvatarIfNeeded(userId, profile.avatar);
    broadcast("profile-updated", {
      userId,
      id: profile.id,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar,
    });

    if (name !== undefined) {
      await db.execute(
        `UPDATE activity_feed SET from_name = $1
         WHERE actor_id = $2 OR ($3::text IS NOT NULL AND from_name = $3)`,
        [profile.name, userId, previousName ?? null],
      );
    }

    const displayName = profile.name || userId;
    if (name !== undefined) {
      await postCoupleActivity("story", userId, displayName, `changed their name to ${name}`).catch(() => {});
    } else if (bio !== undefined) {
      await postCoupleActivity("story", userId, displayName, "updated their bio").catch(() => {});
    } else if (avatar !== undefined) {
      await postCoupleActivity("story", userId, displayName, "changed their profile photo").catch(() => {});
    }
    
    return {
      id: String(profile.id),
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: publicAvatar,
    };
  }

  /**
   * Validate profile update payload
   */
  validateProfileUpdate(payload: ProfileUpdatePayload): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (payload.name !== undefined) {
      if (typeof payload.name !== "string") {
        errors.push("Name must be a string");
      } else if (payload.name.length < 1 || payload.name.length > 100) {
        errors.push("Name must be between 1 and 100 characters");
      }
    }

    if (payload.bio !== undefined) {
      if (typeof payload.bio !== "string") {
        errors.push("Bio must be a string");
      } else if (payload.bio.length > 500) {
        errors.push("Bio must not exceed 500 characters");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const profileService = new ProfileService();
