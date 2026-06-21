import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import type { AuthenticatedRequest } from "../types";
import { searchGithubIndex } from "../lib/github-indexer";
import {
  searchInternetArchive,
  searchOpenLibrary,
  searchShamelaCatalog,
  ARABIC_FEATURED,
  ENGLISH_FEATURED,
  isPdfBookUrl,
  scoreBookMatch,
  iaResolvePdfUrl,
} from "../lib/library-sources";
import { appConfig } from "../lib/config";

const libraryRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Detect if query contains Arabic characters */
function isArabicQuery(q: string): boolean {
  return /[\u0600-\u06FF]/.test(q);
}

// ─── In-Memory Search Cache (TTL: 10 min) ───────────────────────────────────
// Avoids hammering 6 external APIs on every repeat search.
const CACHE_TTL_MS = 10 * 60 * 1000;
type CacheEntry = { results: any[]; meta: any; ts: number };
const searchCache = new Map<string, CacheEntry>();

function getCached(key: string): CacheEntry | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key: string, results: any[], meta: any): void {
  // Keep cache size bounded – evict oldest if over 200 entries
  if (searchCache.size >= 200) {
    const oldest = [...searchCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) searchCache.delete(oldest[0]);
  }
  searchCache.set(key, { results, meta, ts: Date.now() });
}

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "127.0.0.1" || h.startsWith("127.")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("169.254.")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

/** Block SSRF to internal networks; allow any public https/http book host. */
function isSafeBookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (isPrivateHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function guessBookContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return "application/pdf";
  if (lower.includes(".epub")) return "application/epub+zip";
  return "application/octet-stream";
}

function gutenbergFetchCandidates(url: string): string[] {
  const out = [url];
  const m = url.match(/gutenberg\.org\/ebooks\/(\d+)/i);
  if (m) {
    const id = m[1];
    out.push(`https://www.gutenberg.org/files/${id}/${id}-0.pdf`);
  }
  const filesMatch = url.match(/gutenberg\.org\/files\/(\d+)\//i);
  if (filesMatch) {
    const id = filesMatch[1];
    out.push(`https://www.gutenberg.org/files/${id}/${id}-0.pdf`);
  }
  return [...new Set(out)];
}

function isValidBookBuffer(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // PDF-only library
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

async function archivePdfCandidates(url: string): Promise<string[]> {
  const out = [url];
  const m = url.match(/archive\.org\/download\/([^/]+)/i);
  if (!m?.[1]) return out;
  const resolved = await iaResolvePdfUrl(m[1]);
  if (resolved && !out.includes(resolved)) out.unshift(resolved);
  return out;
}

async function fetchBookUpstream(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Grova-Library/1.0)",
      Accept: "application/epub+zip,application/pdf,*/*",
    },
    signal: AbortSignal.timeout(90_000),
    redirect: "follow",
  });
  if (!upstream.ok) return null;

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (!isValidBookBuffer(buffer)) return null;

  const contentType =
    upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
    guessBookContentType(url);
  return { buffer, contentType };
}

// ─── OMNI-SEARCH ENGINE (Federated 6-Source Aggregator) ─────────────────────
libraryRouter.get("/library/search", authenticate, async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) return res.json({ results: [], meta: { cached: false, sources: {} } });

  const enc = encodeURIComponent(query);
  const arabic = isArabicQuery(query);
  const exactLower = query.toLowerCase().trim();
  const MIN_MATCH_SCORE = 45;

  // ── Cache check ─────────────────────────────────────────────────────────
  const cacheKey = `pdf-v2:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ results: cached.results, meta: { ...cached.meta, cached: true } });
  }

  // ── Source diagnostics tracker ───────────────────────────────────────────
  const sourceMeta: Record<string, "ok" | "timeout" | "skipped" | "empty"> = {};

  // ── Arabic-first routing ──────────────────────────────────────────────────
  // Gutendex has zero Arabic/Islamic content (confirmed in tests).
  // Wikisource EN is irrelevant for Arabic queries. Skip them.
  // For English queries, Wikisource AR is also irrelevant — skip it too.
  const skipGutendex  = arabic;
  const skipWikiEn    = true; // EPUB-only export — PDF mode
  const skipWikiAr    = true;
  const skipWikiFr    = true;
  const skipWikiDe    = true;
  const skipStandard  = true; // EPUB-only
  const skipFeedbooks = true; // EPUB-only

  if (skipGutendex) sourceMeta["Gutendex"]      = "skipped";
  if (skipWikiEn)   sourceMeta["Wikisource EN"] = "skipped";
  if (skipWikiAr)   sourceMeta["Wikisource AR"] = "skipped";
  if (skipWikiFr)   sourceMeta["Wikisource FR"] = "skipped";
  if (skipWikiDe)   sourceMeta["Wikisource DE"] = "skipped";
  if (skipStandard) sourceMeta["Standard Ebooks"] = "skipped";
  if (skipFeedbooks) sourceMeta["Feedbooks"] = "skipped";

  // ── Concurrent fetch ──────────────────────────────────────────────────────

  // 1. Gutendex (English only)
  const gutendexFetch = skipGutendex
    ? Promise.resolve(null)
    : fetch(`https://gutendex.com/books/?search=${enc}`);

  // 2. Standard Ebooks — skipped (EPUB-only)
  const standardFetch = Promise.resolve(null);

  // 3. Feedbooks — skipped (EPUB-only)
  const feedbooksFetch = Promise.resolve(null);

  // 4. OAPEN Library (Academic PDFs)
  const oapenFetch = fetch(`https://library.oapen.org/rest/search?query=${enc}&expand=metadata,bitstreams`, { signal: AbortSignal.timeout(6000) }).catch(() => null);

  // 5. Wikisources — skipped (EPUB-only export)
  const wikiArFetch = Promise.resolve(null);
  const wikiEnFetch = Promise.resolve(null);
  const wikiFrFetch = Promise.resolve(null);
  const wikiDeFetch = Promise.resolve(null);

  const [
    gutendexRes,
    standardRes,
    feedbooksRes,
    oapenRes,
    wikiArRes,
    wikiEnRes,
    wikiFrRes,
    wikiDeRes,
  ] = await Promise.allSettled([
    gutendexFetch,
    standardFetch,
    feedbooksFetch,
    oapenFetch,
    wikiArFetch,
    wikiEnFetch,
    wikiFrFetch,
    wikiDeFetch,
  ]);

  const results: any[] = [];
  const seen = new Set<string>();

  function dedup(title: string): boolean {
    const key = title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  // ── Internet Archive + Open Library + Shamela/Arabic ──
  const shamelaPromise = arabic
    ? searchShamelaCatalog(query, 15)
    : Promise.resolve([]);

  const [iaSettled, olSettled, shamelaSettled] = await Promise.allSettled([
    searchInternetArchive(query, { arabic, limit: arabic ? 15 : 14 }),
    searchOpenLibrary(query, arabic ? 8 : 10),
    shamelaPromise,
  ]);

  const ingestCatalog = (settled: PromiseSettledResult<any[]>, label: string) => {
    if (settled.status !== "fulfilled") {
      sourceMeta[label] = "timeout";
      return;
    }
    let added = 0;
    for (const hit of settled.value) {
      if (!dedup(hit.title)) continue;
      results.push(hit);
      added++;
    }
    sourceMeta[label] = added > 0 ? "ok" : "empty";
  };

  ingestCatalog(iaSettled, arabic ? "Internet Archive (AR)" : "Internet Archive");
  if (arabic) ingestCatalog(shamelaSettled, "Shamela / Arabic");
  else sourceMeta["Shamela / Arabic"] = "skipped";
  ingestCatalog(olSettled, "Open Library");

  const featured = arabic ? ARABIC_FEATURED : ENGLISH_FEATURED;
  for (const feat of featured) {
    if (scoreBookMatch(query, feat) >= 60 && dedup(feat.title)) {
      results.unshift(feat);
    }
  }
  sourceMeta[arabic ? "Arabic Classics" : "English Classics"] =
    results.some((r) => r.source.includes("Classics")) ? "ok" : "empty";

  // ── 1. GitHub Curation Indexer (Blazing Fast In-Memory) ─────────────────
  try {
    const githubResults = await searchGithubIndex(query, arabic ? 12 : 8);
    let added = 0;
    for (const ghBook of githubResults) {
      if (!isPdfBookUrl(ghBook.epubUrl)) continue;
      if (!dedup(ghBook.title)) continue;
      results.push(ghBook);
      added++;
    }
    sourceMeta["GitHub Omni"] = added > 0 ? "ok" : "empty";
  } catch (err) {
    sourceMeta["GitHub Omni"] = "timeout";
  }

  // ── 1.1 Global GitHub Search (Dynamic) ────────────────────────────────────
  try {
    // Search repositories that match the query and contain epub
    const ghSearchRes = await fetch(`https://api.github.com/search/repositories?q=${enc}+pdf&per_page=2`, {
      headers: { "User-Agent": "Grova-App" },
      signal: AbortSignal.timeout(4000)
    });
    
    if (ghSearchRes.ok) {
      const ghSearchData = await ghSearchRes.json() as any;
      let added = 0;
      for (const repo of (ghSearchData.items || [])) {
        try {
          // Fetch the file tree of the found repo
          const treeRes = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`, {
            headers: { "User-Agent": "Grova-App" },
            signal: AbortSignal.timeout(3000)
          });
          if (treeRes.ok) {
            const treeData = await treeRes.json() as any;
            const pdfs = (treeData.tree || []).filter((f: any) => {
              const pathLower = f.path.toLowerCase();
              if (!pathLower.endsWith(".pdf")) return false;
              const fileTitle = pathLower.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") || "";
              return scoreBookMatch(query, { title: fileTitle, author: repo.name }) >= MIN_MATCH_SCORE;
            });
            if (pdfs.length > 0) {
              const file = pdfs[0];
              const title = file.path.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]/g, " ") || repo.name;
              if (dedup(title)) {
                results.push({
                  id: `gh_global_${repo.id}`,
                  title,
                  author: repo.owner?.login || "GitHub Open Source",
                  coverUrl: null,
                  description: repo.description || "Found via Global GitHub Search.",
                  epubUrl: `https://cdn.jsdelivr.net/gh/${repo.full_name}@${repo.default_branch}/${file.path.split("/").map(encodeURIComponent).join("/")}`,
                  totalPages: 250,
                  source: `GitHub (${repo.owner?.login})`,
                });
                added++;
              }
            }
          }
        } catch (e) { /* ignore tree fetch errors */ }
      }
      sourceMeta["GitHub Global"] = added > 0 ? "ok" : "empty";
    }
  } catch (err) {
    sourceMeta["GitHub Global"] = "timeout";
  }

  // ── 1.5 Standard Ebooks — skipped (PDF-only catalog) ─────────────────────

  // ── 2. Gutendex / Project Gutenberg (PDF only) ───────────────────────────
  if (!skipGutendex) {
    if (gutendexRes.status === "fulfilled" && (gutendexRes.value as Response | null)?.ok) {
      try {
        const data = await ((gutendexRes.value as Response)).json() as any;
        let added = 0;
        for (const item of (data.results || []).slice(0, 6)) {
          if (!item.title || !dedup(item.title)) continue;
          const fileUrl = item.formats?.["application/pdf"] || null;
          if (!fileUrl) continue;
          results.push({
            id: `guten_${item.id}`,
            title: item.title,
            author: item.authors?.[0]?.name || "Unknown Author",
            coverUrl: item.formats?.["image/jpeg"] || null,
            description: "Public domain PDF from Project Gutenberg.",
            epubUrl: fileUrl,
            totalPages: 200,
            source: "Gutendex",
          });
          added++;
        }
        sourceMeta["Gutendex"] = added > 0 ? "ok" : "empty";
      } catch { sourceMeta["Gutendex"] = "timeout"; }
    } else {
      sourceMeta["Gutendex"] = gutendexRes.status === "rejected" ? "timeout" : "empty";
    }
  }

  // ── 3. Feedbooks — skipped (PDF-only catalog) ──────────────────────────────

  // ── 4. OAPEN Library (Academic PDFs) ───────────────────────────────────────
  if (oapenRes.status === "fulfilled" && oapenRes.value?.ok) {
    try {
      const data = await (oapenRes.value as Response).json() as any;
      let added = 0;
      for (const item of (data || []).slice(0, 3)) {
        if (!item.name || !dedup(item.name)) continue;
        const metadata = item.metadata || [];
        const authorField = metadata.find((m: any) => m.key === "dc.contributor.author");
        const abstractField = metadata.find((m: any) => m.key === "dc.description.abstract");
        const bitstream = (item.bitstreams || []).find((b: any) => b.name?.endsWith(".pdf"));
        if (!bitstream) continue; // Only add if there is a real PDF

        results.push({
          id: `oapen_${item.uuid}`,
          title: item.name,
          author: authorField?.value || "Academic Authors",
          coverUrl: null,
          description: (abstractField?.value || "Open Access academic book from OAPEN Library.").substring(0, 200) + "...",
          epubUrl: `https://library.oapen.org${bitstream.link}`, // PDF bitstream!
          totalPages: 300,
          source: "OAPEN",
        });
        added++;
      }
      sourceMeta["OAPEN"] = added > 0 ? "ok" : "empty";
    } catch { sourceMeta["OAPEN"] = "timeout"; }
  } else {
    sourceMeta["OAPEN"] = oapenRes.status === "rejected" ? "timeout" : "empty";
  }

  // ── 5. Wikisources — skipped (PDF-only catalog) ────────────────────────────

  // ── Filter to verified PDF links + relevance score ───────────────────────
  let finalResults = results
    .filter((r) => r.epubUrl && isPdfBookUrl(r.epubUrl))
    .map((r) => ({ ...r, _score: scoreBookMatch(query, r) }))
    .filter((r) => r._score >= MIN_MATCH_SCORE);

  finalResults.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    const sourceRank = (s: string) => {
      if (s.includes("Classics")) return 0;
      if (s === "Gutendex" || s === "Open Library") return 1;
      if (s.includes("Internet Archive")) return 2;
      if (s.includes("Shamela")) return 2;
      if (s === "OAPEN") return 3;
      return 4;
    };
    return sourceRank(a.source) - sourceRank(b.source);
  });

  finalResults = finalResults.slice(0, 24).map(({ _score, ...r }) => r);
  // ── Cache and respond ──────────────────────────────────────────────────────
  const meta = { cached: false, sources: sourceMeta, total: finalResults.length };
  setCache(cacheKey, finalResults, { cached: false, sources: sourceMeta, total: finalResults.length });
  return res.json({ results: finalResults, meta });
});

// ─── GET ALL BOOKS (with camelCase mapping) ──────────────────────────────────
libraryRouter.get("/library", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, author,
              cover_url AS "coverUrl",
              description,
              epub_url AS "epubUrl",
              source,
              added_by AS "addedBy",
              added_at AS "addedAt",
              status,
              current_page AS "currentPage",
              total_pages AS "totalPages",
              is_favorite AS "isFavorite"
       FROM library_books
       ORDER BY added_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library GET error:", err);
    return res.status(500).json({ error: "Failed to fetch library" });
  }
});

// ─── GET LIBRARY STATS ───────────────────────────────────────────────────────
libraryRouter.get("/library/stats", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const sessions = await db.query(
      `SELECT DISTINCT date FROM library_reading_sessions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );

    let streakDays = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < sessions.rows.length; i++) {
      const rowDate = new Date(sessions.rows[i].date);
      rowDate.setUTCHours(0, 0, 0, 0);
      const diffTime = today.getTime() - rowDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === streakDays || diffDays === streakDays + 1) {
        if (diffDays !== streakDays) streakDays++;
      } else if (diffDays > streakDays + 1) {
        break; // streak broken
      }
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const currentYear = todayDate.split("-")[0];

    const dailyResult = await db.query(
      `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND date = $2`,
      [userId, todayDate]
    );
    
    const annualResult = await db.query(
      `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND CAST(date AS TEXT) LIKE $2`,
      [userId, `${currentYear}-%`]
    );

    const totalMetricsResult = await db.query(
      `SELECT SUM(duration_minutes) as total_duration, SUM(pages_read) as total_pages FROM library_reading_sessions WHERE user_id = $1`,
      [userId]
    );
    const totalDuration = Number(totalMetricsResult.rows[0]?.total_duration) || 0;
    const totalPagesRead = Number(totalMetricsResult.rows[0]?.total_pages) || 0;
    const avgTimePerPage = totalPagesRead > 0 ? (totalDuration / totalPagesRead).toFixed(1) : 0;

    // Compute weekly data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const sumRes = await db.query(
        `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND date = $2`,
        [userId, dateStr]
      );
      weeklyData.push({
        date: dateStr,
        minutes: Number(sumRes.rows[0]?.total || 0)
      });
    }

    // Compute monthly data (12 months of current year)
    const monthlyData = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, "0");
      const sumRes = await db.query(
        `SELECT SUM(duration_minutes) as total FROM library_reading_sessions WHERE user_id = $1 AND CAST(date AS TEXT) LIKE $2`,
        [userId, `${currentYear}-${monthStr}-%`]
      );
      monthlyData.push({
        month: monthStr,
        minutes: Number(sumRes.rows[0]?.total || 0)
      });
    }

    const finishedResult = await db.query(
      `SELECT COUNT(*) as total FROM library_books WHERE added_by = $1 AND status = 'finished'`,
      [userId]
    );
    const booksRead = Number(finishedResult.rows[0]?.total || 0);

    return res.json({
      streakDays,
      dailyMinutes: Number(dailyResult.rows[0]?.total || 0),
      annualMinutes: Number(annualResult.rows[0]?.total || 0),
      totalPagesRead,
      avgTimePerPage: Number(avgTimePerPage),
      weeklyData,
      monthlyData,
      booksRead
    });
  } catch (err) {
    console.error("Library stats GET error:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── GET ALL LIBRARY NOTES ───────────────────────────────────────────────────
libraryRouter.get("/library/notes", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const partnerId = userId ? appConfig.partnerMapping[userId] : undefined;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await db.query(
      `SELECT n.id, n.book_id AS "bookId", n.chapter_or_page AS "chapterOrPage",
              n.text, n.author_id AS "authorId", n.timestamp,
              b.title AS "bookTitle"
       FROM library_notes n
       JOIN library_books b ON n.book_id = b.id
       WHERE b.added_by = $1 OR b.added_by = $2
       ORDER BY n.timestamp DESC`,
      [userId, partnerId || userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library all notes GET error:", err);
    return res.status(500).json({ error: "Failed to fetch all notes" });
  }
});

// ─── STREAM BOOK FILE (proxy — fixes CORS + PDF loading) ───────────────────
libraryRouter.get("/library/:id/file", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT epub_url AS "epubUrl" FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    const epubUrl = result.rows[0]?.epubUrl as string | undefined;
    if (!epubUrl?.trim()) {
      return res.status(404).json({ error: "No file URL for this book" });
    }
    if (!isSafeBookUrl(epubUrl)) {
      return res.status(400).json({ error: "Book URL is not a valid public link" });
    }

    const candidates = epubUrl.includes("archive.org")
      ? await archivePdfCandidates(epubUrl)
      : epubUrl.includes("gutenberg.org")
        ? gutenbergFetchCandidates(epubUrl)
        : [epubUrl];

    for (const url of candidates) {
      if (!isSafeBookUrl(url)) continue;
      try {
        const fetched = await fetchBookUpstream(url);
        if (!fetched) continue;
        res.setHeader("Content-Type", fetched.contentType);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.setHeader("Content-Disposition", "inline");
        return res.send(fetched.buffer);
      } catch {
        /* try next candidate */
      }
    }

    return res.status(502).json({ error: "Could not download book file from source" });
  } catch (err) {
    console.error("Library file proxy error:", err);
    return res.status(500).json({ error: "Failed to fetch book file" });
  }
});

// ─── GET SINGLE BOOK ─────────────────────────────────────────────────────────
libraryRouter.get("/library/:id", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, author,
              cover_url AS "coverUrl",
              description,
              epub_url AS "epubUrl",
              source,
              added_by AS "addedBy",
              added_at AS "addedAt",
              current_page AS "currentPage",
              total_pages AS "totalPages",
              is_favorite AS "isFavorite"
       FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Book not found" });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Library GET/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch book" });
  }
});

// ─── BATCH ADD BOOKS ───────────────────────────────────────────────────────────
libraryRouter.post("/library/batch", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const books = Array.isArray(req.body?.books) ? req.body.books : [];
    if (books.length === 0) return res.status(400).json({ error: "books array required" });

    const authorId = req.user?.id || "mustaq";
    const added: { id: string; title: string }[] = [];

    for (const body of books.slice(0, 25)) {
      if (!body?.title || !body?.epubUrl?.trim() || !isPdfBookUrl(body.epubUrl)) continue;
      const id = randomUUID();
      const timestamp = new Date().toISOString();
      await db.execute(
        `INSERT INTO library_books
           (id, title, author, cover_url, description, epub_url, source, added_by, added_at, current_page, total_pages)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          body.title,
          body.author || "Unknown Author",
          body.coverUrl || null,
          body.description || null,
          body.epubUrl,
          body.source || "Unknown",
          authorId,
          timestamp,
          0,
          body.totalPages || 100,
        ],
      );
      added.push({ id, title: body.title });
    }

    return res.json({ success: true, added: added.length, books: added });
  } catch (err) {
    console.error("Library batch POST error:", err);
    return res.status(500).json({ error: "Failed to batch add books" });
  }
});

// ─── ADD BOOK TO LIBRARY ─────────────────────────────────────────────────────
libraryRouter.post("/library", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: "title is required" });
    if (body.epubUrl?.trim() && !isPdfBookUrl(body.epubUrl)) {
      return res.status(400).json({ error: "Only PDF books are supported" });
    }

    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const authorId = req.user?.id || "mustaq";

    await db.execute(
      `INSERT INTO library_books
         (id, title, author, cover_url, description, epub_url, source, added_by, added_at, current_page, total_pages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        body.title,
        body.author || "Unknown Author",
        body.coverUrl || null,
        body.description || null,
        body.epubUrl || null,
        body.source || "Unknown",
        authorId,
        timestamp,
        0,
        body.totalPages || 100,
      ]
    );
    return res.json({ success: true, id });
  } catch (err) {
    console.error("Library POST error:", err);
    return res.status(500).json({ error: "Failed to add book" });
  }
});

// ─── UPDATE READING PROGRESS ─────────────────────────────────────────────────
libraryRouter.put("/library/:id/progress", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { page, status, totalPages } = req.body;
    if (page === undefined) return res.status(400).json({ error: "page is required" });

    const newStatus = status || (page > 0 ? "reading" : "reading");
    
    if (totalPages !== undefined && totalPages > 0) {
      await db.execute(
        `UPDATE library_books SET current_page = $1, status = $2, total_pages = $3 WHERE id = $4`,
        [page, newStatus, totalPages, req.params.id]
      );
    } else {
      await db.execute(
        `UPDATE library_books SET current_page = $1, status = $2 WHERE id = $3`,
        [page, newStatus, req.params.id]
      );
    }
    
    return res.json({ success: true });
  } catch (err) {
    console.error("Library PUT progress error:", err);
    return res.status(500).json({ error: "Failed to update progress" });
  }
});

// ─── DUET PAGE SYNC ──────────────────────────────────────────────────────────
import { broadcast } from "../lib/sse";

libraryRouter.post("/library/:id/sync", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { epubcifi } = req.body;
    const partnerId = req.user?.id === "me" ? "wife" : "me";
    broadcast("page-sync", { bookId: req.params.id, epubcifi }, partnerId);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library POST sync error:", err);
    return res.status(500).json({ error: "Failed to sync page" });
  }
});

// ─── ADD READING SESSION ───────────────────────────────────────────────────────
libraryRouter.post("/library/:id/session", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { durationMinutes, pagesRead } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const id = randomUUID();

    await db.execute(
      `INSERT INTO library_reading_sessions (id, user_id, book_id, date, duration_minutes, pages_read)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, req.params.id, date, durationMinutes || 1, pagesRead || 0]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Library POST session error:", err);
    return res.status(500).json({ error: "Failed to log session" });
  }
});

// ─── UPDATE BOOK STATUS ───────────────────────────────────────────────────────
libraryRouter.patch("/library/:id/status", authenticate, async (req, res) => {
  try {
    const { status, favorite } = req.body;
    
    if (status) {
      const validStatuses = ["reading", "finished", "wishlist", "paused", "gave_up"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await db.execute(`UPDATE library_books SET status = $1 WHERE id = $2`, [status, req.params.id]);
    }
    
    if (favorite !== undefined) {
      await db.execute(`UPDATE library_books SET is_favorite = $1 WHERE id = $2`, [Boolean(favorite), req.params.id]);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Library PATCH status error:", err);
    return res.status(500).json({ error: "Failed to update status" });
  }
});

// ─── DELETE BOOK ──────────────────────────────────────────────────────────────
libraryRouter.delete("/library/:id", authenticate, async (req, res) => {
  try {
    await db.execute(`DELETE FROM library_books WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library DELETE error:", err);
    return res.status(500).json({ error: "Failed to delete book" });
  }
});

// ─── GET LIBRARY NOTES ────────────────────────────────────────────────────────
libraryRouter.get("/library/:id/notes", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, book_id AS "bookId", chapter_or_page AS "chapterOrPage",
              text, author_id AS "authorId", timestamp
       FROM library_notes WHERE book_id = $1 ORDER BY timestamp ASC`,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library notes GET error:", err);
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// ─── ADD NOTE ────────────────────────────────────────────────────────────────
libraryRouter.post("/library/:id/notes", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, chapterOrPage } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const id = randomUUID();
    const timestamp = new Date().toISOString();
    const authorId = req.user?.id || "mustaq";

    await db.execute(
      `INSERT INTO library_notes (id, book_id, chapter_or_page, text, author_id, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, req.params.id, chapterOrPage || null, text, authorId, timestamp]
    );
    return res.json({ success: true, id });
  } catch (err) {
    console.error("Library notes POST error:", err);
    return res.status(500).json({ error: "Failed to add note" });
  }
});

export default libraryRouter;
