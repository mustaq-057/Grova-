import { Router } from "express";

let coupleCode = "grova2024";

const USERS = [
  { id: "me", username: "mako", name: "Mako", avatar: "https://picsum.photos/seed/okaymako/150/150" },
  { id: "wife", username: "luna", name: "Luna", avatar: "https://picsum.photos/seed/lunavault/150/150" },
];

const router = Router();

router.post("/auth/login", (req, res) => {
  const { userId, code } = req.body as { userId: string; code: string };
  if (!userId || !code) {
    res.status(400).json({ error: "userId and code required" });
    return;
  }
  if (code !== coupleCode) {
    res.status(401).json({ error: "Wrong couple code" });
    return;
  }
  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

router.put("/auth/couple-code", (req, res) => {
  const { newCode, currentCode } = req.body as { newCode: string; currentCode: string };
  if (currentCode !== coupleCode) {
    res.status(401).json({ error: "Current code is wrong" });
    return;
  }
  if (!newCode || newCode.length < 4) {
    res.status(400).json({ error: "New code must be at least 4 characters" });
    return;
  }
  coupleCode = newCode;
  res.json({ success: true });
});

export default router;
