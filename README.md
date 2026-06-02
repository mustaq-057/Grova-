# Grova

A private couples app — chat, duas, memories, and profiles. **No Replit required.**

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (22 recommended)
- [pnpm](https://pnpm.io/) 9+ (`corepack enable` then `corepack prepare pnpm@9 --activate`)

## Quick start (development)

```bash
pnpm install
pnpm dev:grova
```

| What | URL |
|------|-----|
| **App (use this)** | http://localhost:5000 |
| API (direct, dev) | http://localhost:5001/api |

Set your shared unlock **code** in Settings (or `DEFAULT_COUPLE_CODE` in `.env` for first-time seed only).

`dev:grova` starts the API first, waits until it is healthy, then starts Vite.

## Production (one server)

```bash
pnpm install
pnpm start:grova
```

Open **http://localhost:5000** — UI and API on the same port.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:grova` | API + Vite dev servers |
| `pnpm build:grova` | Build frontend + API bundle |
| `pnpm start:grova` | Build (if needed) + serve everything on port 5000 |
| `pnpm typecheck:grova` | Typecheck frontend + API |

## Database & Storage Setup

### Turso Database (8GB free)

1. Create account at [turso.tech](https://turso.tech)
2. Create a database (free tier: 8GB storage)
3. Get your database URL and auth token
4. Add to `.env`:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_auth_token
```

### Backblaze B2 Storage (10GB free)

1. Go to [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Create a bucket (free tier: 10GB storage)
3. Create an Application Key with "Read and Write" permissions
4. Get your Key ID, Application Key, and S3 Endpoint
5. Add to `.env`:

```env
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_application_key
B2_BUCKET_NAME=grova-images
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
```

**Note:** The B2_ENDPOINT format is `https://s3.<region>.backblazeb2.com`. Check your bucket settings for the correct region.

### Server-side Encryption

Generate an encryption key and add to `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:

```env
ENCRYPTION_KEY=your_generated_key
```

## GIFs (Giphy)

1. Create a free account at [developers.giphy.com](https://developers.giphy.com/dashboard/)
2. Create an API key (Developer / Beta)
3. Add to `.env` in the project root:

```env
VITE_GIPHY_API_KEY=your_key_here
```

4. Restart `pnpm dev:grova`

Without a key, the GIF picker shows setup instructions instead of GIFs.

## End-to-end encryption

Messages are encrypted in the browser with **AES-256-GCM**. The key is derived from your shared **code** (PBKDF2) and kept in session storage for that browser session.

- Both partners must use the **same code** to read each other's messages
- The server only stores encrypted blobs — it cannot read message text
- Log out and log in again after changing the code in Settings

**Note:** Voice, video calls use WebRTC (not E2E through the chat encryption layer). For production-grade call privacy you would add a TURN server and optional DTLS.

## Stickers & cute messages

- **Stickers:** 200+ emoji stickers in 8 packs (tap the sticker icon in chat)
- **Cute messages:** 100+ greeting templates with pink bubbles and companion stickers (sparkle ✨ icon in chat)

## Troubleshooting

**Blank page or 404 on http://localhost:5000 in dev**  
Run `pnpm start:grova` for production mode.

**Login fails / network errors**  
Ensure the API is running (`pnpm --filter @workspace/api-server run dev` in a second terminal, or use `pnpm dev:grova`).

**Port already in use / localhost not loading**  
Stop stale servers, then start fresh:

```bash
pnpm stop:grova
pnpm dev:grova
```

Open **http://localhost:5000** (the Vite app). Port 5001 is API-only in dev.

**Blank page on localhost**  
You likely only started the API. Always use `pnpm dev:grova` so both API (5001) and UI (5000) run.

**`pnpm` not found**  
Use `npx pnpm@9 <command>` or install pnpm globally.

**Database not initialized**  
Ensure Turso credentials are set in `.env` and the server has permission to create tables.

**Image upload fails**  
Ensure R2 credentials are set in `.env` and the bucket exists.

## Project layout

| Path | Role |
|------|------|
| `artifacts/instagram-clone/` | Grova React UI (Vite) |
| `artifacts/api-server/` | Express API (Turso database + R2 storage) |

Optional workspace packages (`lib/*`, `mockup-sandbox`) are not needed to run Grova.
