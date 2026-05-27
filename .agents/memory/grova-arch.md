---
name: Grova app architecture
description: Key architecture decisions for the Grova couples app
---

## Auth
- Two fixed users: `{ id: "me", username: "mako" }` and `{ id: "wife", username: "luna" }` — hardcoded in API server `auth.ts`.
- Shared couple code (default `grova2024`) stored in API server memory; validated on login.
- `AuthProvider` in `src/lib/auth.tsx` persists user to `localStorage` key `grova_user`.
- Login screen (`/login`) shows pick-a-person → enter couple code; no route guard needed, `ProtectedRouter` in App.tsx shows Login if `user === null`.

## Data sync
- All messages, duas stored in API server in-memory arrays (resets on server restart).
- Frontend polls `/api/messages` every 3 seconds (full list refresh) — covers both new messages and like-state changes.
- Duas polled every 5 seconds.

**Why in-memory (no DB):** `DATABASE_URL` not configured; in-memory gives real cross-device sync as long as the server stays up.

## Nav order
Home → Chat (`/chat`) → Create → Profile → Dua → Settings

## Key files
- API routes: `artifacts/api-server/src/routes/{auth,messages,duas}.ts`
- Frontend auth: `src/lib/auth.tsx`, `src/lib/api.ts`
- Pages: Login, Home, Messages (`/chat`), Create, Profile, Dua, Memories, Settings
