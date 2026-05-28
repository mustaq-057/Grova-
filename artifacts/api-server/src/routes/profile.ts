import { Router } from "express";
import { broadcast } from "../lib/sse";

const router = Router();

const profiles: Record<string, { name: string; bio: string; avatar: string }> = {
  me: { name: "Mustaq", bio: "Just us two ♥", avatar: "https://picsum.photos/seed/mustaq/150/150" },
  wife: { name: "Sara", bio: "My person ♥", avatar: "https://picsum.photos/seed/sara/150/150" },
};

router.get("/users", (_req, res) => {
  res.json([
    { id: "me", username: "mustaq", ...profiles["me"] },
    { id: "wife", username: "sara", ...profiles["wife"] },
  ]);
});

router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, bio } = req.body as { name?: string; bio?: string };

  if (!profiles[id]) { res.status(404).json({ error: "Not found" }); return; }
  if (name !== undefined) profiles[id]!.name = name;
  if (bio !== undefined) profiles[id]!.bio = bio;

  broadcast("profile-updated", { userId: id, ...profiles[id] });
  res.json({ id, ...profiles[id] });
});

export { profiles };
export default router;
