# Deploy Grova (simple)

Your code: **https://github.com/mustaq-057/Grova-**

## 1. Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import **Grova-** from GitHub
3. **Root Directory** must be **`.`** (repo root — leave blank). Do **not** set it to `artifacts/instagram-clone` or the build will fail with `vite: command not found`.
4. **Build Command** can stay as `pnpm -w run build:grova` (locked is OK — that script installs deps and builds everything). **Output Directory**: `dist` or empty.
5. Click **Environment Variables** and paste everything from your local `.env` file (see list below)
6. Click **Deploy**

## 2. Environment variables (copy from your `.env`)

Paste these into Vercel (Production):

| Name | Required |
|------|----------|
| `DATABASE_URL` | Yes |
| `ENCRYPTION_KEY` | Yes |
| `ENCRYPTION_PASSWORD` | Yes |
| `DEFAULT_COUPLE_CODE` | Yes |
| `PRIMARY_AUTH_EMAILS` | Yes |
| `PRIMARY_AUTH_PASSWORD_1` | Yes |
| `CLOUDINARY_URL` or `B2_*` | Yes (for images) |
| `VITE_GIPHY_API_KEY` | Optional (GIFs) |
| `ALLOWED_ORIGINS` | After first deploy: `https://YOUR-NAME.vercel.app` |

Do **not** upload `.env` to GitHub.

## 3. After deploy

1. Click **Visit** on the deployment
2. You should see the **Grova login page** (not a page of code)
3. Log in with the email/password from `PRIMARY_AUTH_*` in your `.env`

## 4. If build fails (`build:grova` exited with 1, or `vite: command not found`)

1. Vercel → **Settings** → **General** → **Root Directory** → leave **empty** (monorepo root)
2. **Build Command** may stay **`pnpm -w run build:grova`** — latest `main` runs `node scripts/build-grova.mjs` under that script name.
3. **Redeploy** after pushing the latest `main` from GitHub

## 5. If you see JavaScript instead of the app

1. Vercel → **Settings** → **Build & Development**
2. Clear **Output Directory** (leave blank) or set it to `dist` only
3. Clear **Build Command** (leave blank)
4. **Redeploy**

## 6. If login always says "Invalid email or password" but env vars are set

1. Open **`https://YOUR-APP.vercel.app/api/healthz`** — you should see `{"status":"ok","db":true,"authConfigured":true}`. If `db` is false, fix **`DATABASE_URL`** (Neon **pooled** URL, `postgresql://...?sslmode=require`, no `channel_binding`).
2. If `authConfigured` is false, set **`PRIMARY_AUTH_EMAILS`** and **`PRIMARY_AUTH_PASSWORD_1`** in Vercel → Environment Variables → **Production**, then **Redeploy** (not just rebuild cache).
3. Emails in **`PRIMARY_AUTH_EMAILS`** must match **exactly** (lowercase). Example: `you@gmail.com,partner@gmail.com` — no spaces around `@`, no quotes.
4. Ensure **`ALLOWED_ORIGINS`** includes your live URL, e.g. `https://your-app.vercel.app` (no trailing slash).
5. After pushing latest `main`, Vercel must use **`api/[[...path]].mjs`** (catch-all) — not a rewrite that collapses `/api/*` to `/api` only.

## 7. If login fails

Add or fix `ALLOWED_ORIGINS` = your exact Vercel URL (no `/` at the end), then **Redeploy**.
