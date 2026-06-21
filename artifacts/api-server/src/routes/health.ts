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

  const encryptionKey = (process.env.ENCRYPTION_KEY || "").trim();
  const encryptionConfigured =
    encryptionKey.length === 64 &&
    /^[0-9a-fA-F]{64}$/.test(encryptionKey) &&
    (process.env.ENCRYPTION_PASSWORD || "").trim().length >= 8;

  const cloudinaryUrl = (process.env.CLOUDINARY_URL || "").trim();
  const cloudinaryConfigured =
    cloudinaryUrl.startsWith("cloudinary://") ||
    Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );

  const ok = dbConnected && isDbReady() && authEmailsConfigured > 0 && hasPassword && encryptionConfigured;
  res.status(200).json({
    status: ok ? "ok" : "degraded",
    db: dbConnected && isDbReady(),
    dbConfigured: dbConnected && isDbReady(),
    authConfigured: authEmailsConfigured > 0 && hasPassword,
    encryptionConfigured,
    cloudinaryConfigured,
  });
});

export default router;
