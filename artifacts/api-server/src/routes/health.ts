import { Router, type IRouter } from "express";
import { isDbReady, pingDatabase } from "../lib/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const dbConnected = await pingDatabase();
  const authEmailsConfigured = (process.env.PRIMARY_AUTH_EMAILS || "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const hasPassword =
    [
      process.env.PRIMARY_AUTH_PASSWORD_1,
      process.env.PRIMARY_AUTH_PASSWORD_2,
      process.env.PRIMARY_AUTH_PASSWORD_3,
      process.env.PRIMARY_AUTH_PASSWORD_4,
    ].some((p) => String(p || "").trim()) ||
    Boolean((process.env.PRIMARY_AUTH_PASSWORDS || "").trim()) ||
    Boolean((process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim());

  const ok = dbConnected && isDbReady() && authEmailsConfigured > 0 && hasPassword;
  res.status(200).json({
    status: ok ? "ok" : "degraded",
    db: dbConnected && isDbReady(),
    authConfigured: authEmailsConfigured > 0 && hasPassword,
  });
});

export default router;
