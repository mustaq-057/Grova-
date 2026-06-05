# Grova

Private couple chat app. Deploy on [Vercel](https://vercel.com) from this repo.

**Repo:** [github.com/mahaboobfarooq01-ship-it/grovaa](https://github.com/mahaboobfarooq01-ship-it/grovaa)

## Deploy on Vercel (public repo)

1. Import this GitHub repo on Vercel.
2. **Root Directory:** `Grova-` / repo **root** (not `artifacts/`).
3. **Build Command:** `pnpm -w run build:grova` (or leave empty if `vercel.json` applies).
4. **Output Directory:** `dist`
5. Copy every value from your local `.env` into **Settings → Environment Variables → Production** (see `.env.example` for names). **Do not commit `.env`.**
6. Add `ALLOWED_ORIGINS` = `https://YOUR-PROJECT.vercel.app`
7. **Redeploy** after adding env vars.

## Required environment variables

See [`.env.example`](.env.example) and [`DEPLOY.md`](DEPLOY.md).

## Login issues after deploy

- Ensure latest code is deployed (`api/index.mjs` + `/api/*` rewrite in `vercel.json`).
- Env vars must be in **Production**, then **Redeploy**.
- Login uses `PRIMARY_AUTH_EMAILS` + `PRIMARY_AUTH_PASSWORD_1` from Vercel, not your laptop `.env` file.
