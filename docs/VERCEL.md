# Deploy Grova on Vercel

## One project (UI + API)

`vercel.json` builds the React app and exposes the Express API as a serverless function at `/api/*`.

1. Import [https://github.com/mustaq-057/Grova-](https://github.com/mustaq-057/Grova-) on Vercel.
2. Root directory: repo root (default).
3. Add **all** environment variables from `.env.example` (see below).
4. Deploy. Open your `*.vercel.app` URL — the UI calls `/api` on the same host.

### Required env (Project → Settings → Environment Variables)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon **pooled** Postgres URL |
| `ENCRYPTION_KEY` | 64 hex chars |
| `ENCRYPTION_PASSWORD` | Server encryption unlock |
| `DEFAULT_COUPLE_CODE` | First-time seed |
| `PRIMARY_AUTH_EMAILS` | Comma-separated |
| `PRIMARY_AUTH_PASSWORD_1` | Login password |
| `ALLOWED_ORIGINS` | Your Vercel URL + custom domain |
| `CLOUDINARY_URL` or B2 keys | Media uploads |
| `VITE_GIPHY_API_KEY` | GIF picker (build-time) |

Optional: `B2_*`, `VAPID_*`, `TURN_*`

### Limits on Vercel

- **SSE / live sync**: connections may drop after ~60s; the app falls back to polling where needed.
- **Scheduled messages worker**: not running on serverless — use a VPS cron or Railway for that if you rely on it.
- **WebRTC calls**: still need TURN env vars; calls are peer-to-peer.

For full-time SSE + workers, run `pnpm start:grova` on Railway/Render/Fly instead.

## Local production smoke test

```bash
pnpm install
pnpm run build:grova
VERCEL=1 NODE_ENV=production node artifacts/api-server/dist/vercel-entry.mjs
```

## Frontend-only (API elsewhere)

If the API runs on Railway/Render, set Vercel env `API_URL=https://your-api-host` and use a rewrite/proxy — or point the built app’s API base URL to that host in your deployment docs.
