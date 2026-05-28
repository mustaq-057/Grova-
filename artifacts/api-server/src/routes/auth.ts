import { Router } from "express";
import { profiles } from "./profile";

let coupleCode = "grova2024";

const router = Router();

router.post("/auth/login", (req, res) => {
  const { userId, code } = req.body as { userId: string; code: string };
  if (!userId || !code) { res.status(400).json({ error: "userId and code required" }); return; }
  if (code !== coupleCode) { res.status(401).json({ error: "Wrong couple code" }); return; }

  const p = profiles[userId];
  if (!p) { res.status(404).json({ error: "User not found" }); return; }

  res.json({
    user: {
      id: userId,
      username: userId === "me" ? "mustaq" : "sara",
      name: p.name,
      bio: p.bio,
      avatar: p.avatar,
    },
  });
});

router.put("/auth/couple-code", (req, res) => {
  const { newCode, currentCode } = req.body as { newCode: string; currentCode: string };
  if (currentCode !== coupleCode) { res.status(401).json({ error: "Current code is wrong" }); return; }
  if (!newCode || newCode.length < 4) { res.status(400).json({ error: "Min 4 characters" }); return; }
  coupleCode = newCode;
  res.json({ success: true });
});

export default router;
