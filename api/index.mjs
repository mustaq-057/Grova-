/**
 * Vercel API entry — all /api/* (except /api/healthz) rewrite to /api (this file).
 * Bundle lives in ./_dist/ (copied at build time).
 */
import handler from "./_dist/vercel-entry.mjs";

export default handler;
