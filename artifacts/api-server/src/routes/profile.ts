import { Router } from "express";
import { authenticate } from "../lib/auth-middleware";
import { rateLimiters } from "../lib/security";
import { profileService } from "../services/profile-service";
import { AuthenticatedRequest, ProfileUpdatePayload } from "../types";
import { logger } from "../lib/logger";

function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

const router = Router();

router.get("/users", rateLimiters.read, authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profiles = await profileService.getUserProfiles(userId);
    res.json(profiles);
  } catch (err) {
    logger.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.put("/users/:id", rateLimiters.messages, authenticate, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const normalizedId = getParam(id);
  const authId = req.user!.id;

  if (normalizedId !== "me" && normalizedId !== "wife") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (normalizedId !== authId) {
    res.status(403).json({ error: "Can only update your own profile" });
    return;
  }

  const { name, bio, avatar } = req.body as ProfileUpdatePayload;

  const validation = profileService.validateProfileUpdate({ name, bio });
  if (!validation.valid) {
    res.status(400).json({ error: "Validation failed", details: validation.errors });
    return;
  }

  try {
    const profile = await profileService.updateProfile(normalizedId, { name, bio, avatar });
    res.json(profile);
  } catch (err) {
    logger.error({ err, userId: normalizedId }, "Failed to update profile");
    if (err instanceof Error && err.message === "No fields to update") {
      res.status(400).json({ error: "No fields to update" });
    } else {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
});

export default router;
