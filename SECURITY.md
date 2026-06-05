# Security (public repo)

- **Never commit** `.env`, `.env.local`, or any file with real passwords, API keys, or `DATABASE_URL`.
- This repo only ships `.env.example` with placeholders.
- Set secrets in **Vercel → Settings → Environment Variables** (Production).
- If you accidentally committed a secret, rotate it immediately (Neon password, Cloudinary, auth passwords) and remove it from git history.
