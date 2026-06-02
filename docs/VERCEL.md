# Deploy Grova on Vercel

## Frontend (Vercel)

This repo’s `vercel.json` builds the **static UI** only. The API must run on a Node host (Railway, Render, Fly.io, VPS) because it uses Express, WebSockets, and long-lived DB connections.

1. Import [https://github.com/mustaq-057/Grova-](https://github.com/mustaq-057/Grova-) on Vercel.
2. Set **Root Directory** to the repo root (default).
3. Add environment variables in Vercel (see below). For the UI, you only need `VITE_GIPHY_API_KEY` if using GIFs.
4. After deploy, set your API host’s `ALLOWED_ORIGINS` to include your Vercel URL (e.g. `https://your-app.vercel.app`).

## API (separate host — recommended)

```bash
pnpm install
pnpm run build:grova
NODE_ENV=production PORT=5000 pnpm --filter @workspace/api-server run start
```

Required env on the API server:

- `DATABASE_URL` (Neon pooled Postgres)
- `ENCRYPTION_KEY`, `ENCRYPTION_PASSWORD`
- `DEFAULT_COUPLE_CODE`
- `PRIMARY_AUTH_EMAILS` (comma-separated)
- `PRIMARY_AUTH_PASSWORD_1` (password with `@` / `#` — do not use comma lists)
- `ALLOWED_ORIGINS` (your Vercel URL + custom domain)
- `CLOUDINARY_URL` (optional, for media)

## Same-origin production (UI + API on one server)

Use `pnpm start:grova` on a VPS instead of splitting Vercel + API. Point your domain to that server with HTTPS (Caddy/nginx).

## Auth

- Allowed emails are set via `PRIMARY_AUTH_EMAILS`.
- After **2 failed** email/password attempts, login is blocked for **30 minutes** per IP + email.
