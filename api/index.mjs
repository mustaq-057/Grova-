/**
 * Vercel API entry — /api/* (except /api/healthz) rewrite here (see vercel.json).
 * Bundle lives in ./_dist/ (copied at build time).
 */
import handler from "./_dist/vercel-entry.mjs";

export default handler;
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
