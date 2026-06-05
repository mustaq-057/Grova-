/** Lightweight Vercel health probe — no Express bundle (2.7mb) required. */
export default function handler(_req, res) {
  const authEmails = (process.env.PRIMARY_AUTH_EMAILS || "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const hasPassword =
    [
      process.env.PRIMARY_AUTH_PASSWORD_1,
      process.env.PRIMARY_AUTH_PASSWORD_2,
    ].some((p) => String(p || "").trim()) ||
    Boolean((process.env.PRIMARY_AUTH_PASSWORDS || "").trim()) ||
    Boolean((process.env.PRIMARY_AUTH_PASSWORD_HASHES || "").trim());
  const dbConfigured = /^postgres(ql)?:\/\//.test(String(process.env.DATABASE_URL || ""));
  const cloudinaryUrl = String(process.env.CLOUDINARY_URL || "").trim();
  const cloudinaryConfigured =
    cloudinaryUrl.startsWith("cloudinary://") ||
    Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({
      status: "ok",
      api: true,
      dbConfigured,
      authConfigured: authEmails > 0 && hasPassword,
      encryptionConfigured:
        (process.env.ENCRYPTION_KEY || "").trim().length === 64 &&
        (process.env.ENCRYPTION_PASSWORD || "").trim().length >= 8,
      cloudinaryConfigured,
    }),
  );
}
