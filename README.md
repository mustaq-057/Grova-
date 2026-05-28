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
| **App (use this)** | http://localhost:5173 |
| API (direct) | http://localhost:5000/api |

Default couple code: `grova2024`

`dev:grova` starts the API first, waits until it is healthy, then starts Vite. **Do not open port 5000 for the UI in dev** — that port is API-only until you run a production build.

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

## Troubleshooting

**Blank page or 404 on http://localhost:5000 in dev**  
Use http://localhost:5173 instead, or run `pnpm start:grova` for production mode.

**Login fails / network errors**  
Ensure the API is running (`pnpm --filter @workspace/api-server run dev` in a second terminal, or use `pnpm dev:grova`).

**Port already in use**  
Stop other Node processes or set `PORT=5001` (API) / `PORT=5174` (Vite) before starting.

**`pnpm` not found**  
Use `npx pnpm@9 <command>` or install pnpm globally.

## Project layout

| Path | Role |
|------|------|
| `artifacts/instagram-clone/` | Grova React UI (Vite) |
| `artifacts/api-server/` | Express API (in-memory data) |

Optional workspace packages (`lib/*`, `mockup-sandbox`) are not needed to run Grova.
