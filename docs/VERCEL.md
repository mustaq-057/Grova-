# Deploy Grova on Vercel (frontend + API)

One Vercel project serves:

- **Static UI** → `artifacts/instagram-clone/dist`
- **API** → serverless Express at `/api/*` via `api/[[...path]].mjs`

## 1. Import repo

[https://github.com/mustaq-057/Grova-](https://github.com/mustaq-057/Grova-)

Root directory: **repo root** (default). Vercel reads `vercel.json` automatically.

## 2. Environment variables (Vercel dashboard)

**Never commit `.env`** — it stays on your machine only (`.gitignore`). Paste the same values into Vercel → Settings → Environment Variables.

Required:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** Postgres URL |
| `ENCRYPTION_KEY` | 64 hex characters |
| `ENCRYPTION_PASSWORD` | Unlocks server encryption |
| `DEFAULT_COUPLE_CODE` | First-time seed |
| `PRIMARY_AUTH_EMAILS` | Comma-separated emails |
| `PRIMARY_AUTH_PASSWORD_1` | Login password |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (+ custom domain). Optional on Vercel — `VERCEL_URL` is added automatically |
| `CLOUDINARY_URL` or `B2_*` | Media uploads |
| `VITE_GIPHY_API_KEY` | Build-time — enable GIF picker |

Optional: `VAPID_*`, `TURN_*`, `STUN_*`

## 3. Local vs production

| | Local (`pnpm dev:grova`) | Vercel |
|--|--------------------------|--------|
| Config | `.env` in repo root | Dashboard env vars |
| API | Port 5001 | `/api` same domain |
| Live updates | SSE | **Polling** (12s) — serverless-safe |
| Scheduled messages | Worker runs | Worker **off** — use VPS/Railway if needed |

Your local `.env` is **not** uploaded (`.gitignore` + `.vercelignore`).

## 4. After deploy

1. Open `https://your-project.vercel.app`
2. Log in with `PRIMARY_AUTH_*` credentials
3. Set couple code in Settings

If login fails: check `ALLOWED_ORIGINS` includes your exact Vercel URL (no trailing slash).

## 5. Build command (automatic)

```bash
pnpm install && pnpm run build:grova
```

Builds Vite + bundles API into `artifacts/api-server/dist/` for the serverless handler.

## 6. Heavier production (optional)

For 24/7 SSE, scheduled messages, and WebRTC TURN on one box:

```bash
pnpm start:grova
```

Host on Railway, Render, Fly.io, or a VPS with HTTPS.
