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
  searchBookCatalog,
  catalogAsHits,
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

function isGermanQuery(q: string): boolean {
  return /[äöüßÄÖÜ]/.test(q) || /\b(und|der|die|das|ein|eine|nicht|mit|für|deutsch)\b/i.test(q);
}

function isFrenchQuery(q: string): boolean {
  return /[àâçéèêëïîôùûü]/i.test(q) || /\b(les|des|une|dans|pour|français|avec)\b/i.test(q);
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
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

async function findExistingLibraryBook(
  addedBy: string,
  title: string,
  epubUrl?: string | null,
): Promise<{ id: string } | null> {
  const normTitle = title.toLowerCase().trim();
  const url = epubUrl?.trim() || "";
  const result = await db.query(
    `SELECT id FROM library_books
     WHERE added_by = $1
       AND (
         LOWER(TRIM(title)) = $2
         OR ($3 <> '' AND epub_url = $3)
       )
     LIMIT 1`,
    [addedBy, normTitle, url],
  );
  return (result.rows[0] as { id: string } | undefined) ?? null;
}

// ─── GET CURATED CATALOG ─────────────────────────────────────────────────────
libraryRouter.get("/library/catalog", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const q = (req.query.q as string || "").trim();
  try {
    const books = q ? searchBookCatalog(q, 40) : catalogAsHits();
    const filtered = category
      ? books.filter((b) => b.source.toLowerCase().includes(category.toLowerCase()))
      : books;
    return res.json({ books: filtered.slice(0, 40) });
  } catch (err) {
    console.error("Library catalog GET error:", err);
    return res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// ─── OMNI-SEARCH ENGINE (Federated 6-Source Aggregator) ─────────────────────
libraryRouter.get("/library/search", authenticate, async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) return res.json({ results: [], meta: { cached: false, sources: {} } });

  const enc = encodeURIComponent(query);
  const arabic = isArabicQuery(query);
  const german = !arabic && isGermanQuery(query);
  const french = !arabic && !german && isFrenchQuery(query);
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

  // ── Curated catalog (instant, no network) ───────────────────────────────
  let catalogAdded = 0;
  for (const hit of searchBookCatalog(query, 16)) {
    if (!dedup(hit.title)) continue;
    results.push(hit);
    catalogAdded++;
  }
  sourceMeta["Curated Catalog"] = catalogAdded > 0 ? "ok" : "empty";

  // ── Internet Archive + Open Library + Shamela/Arabic ──
  const shamelaPromise = arabic
    ? searchShamelaCatalog(query, 15)
    : Promise.resolve([]);

  const githubIndexPromise = searchGithubIndex(query, arabic ? 12 : 8).catch(() => [] as Awaited<ReturnType<typeof searchGithubIndex>>);

  const iaLangOpts = arabic
    ? { arabic: true, limit: 15 }
    : german
      ? { german: true, limit: 12 }
      : french
        ? { french: true, limit: 12 }
        : { limit: arabic ? 15 : 14 };

  const [iaSettled, olSettled, shamelaSettled, githubSettled] = await Promise.allSettled([
    searchInternetArchive(query, iaLangOpts),
    searchOpenLibrary(query, arabic ? 8 : 10),
    shamelaPromise,
    githubIndexPromise,
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

  // GitHub in-memory index (runs in parallel with IA / OL above)
  if (githubSettled.status === "fulfilled") {
    let added = 0;
    for (const ghBook of githubSettled.value) {
      if (!isPdfBookUrl(ghBook.epubUrl)) continue;
      if (!dedup(ghBook.title)) continue;
      results.push(ghBook);
      added++;
    }
    sourceMeta["GitHub Omni"] = added > 0 ? "ok" : "empty";
  } else {
    sourceMeta["GitHub Omni"] = "timeout";
  }

  // GitHub Global tree walk removed — too slow on serverless; GitHub Omni + catalog cover millions of titles.
  sourceMeta["GitHub Global"] = "skipped";

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
    .map((r) => {
      let score = scoreBookMatch(query, r);
      // Massive priority boost for Internet Archive to guarantee they surface first
      if (r.source.includes("Internet Archive") || r.source.includes("Shamela")) {
        score += 30; 
      }
      return { ...r, _score: score };
    })
    .filter((r) => r._score >= MIN_MATCH_SCORE);

  finalResults.sort((a, b) => {
    // 1. Sort by score first
    if (b._score !== a._score) return b._score - a._score;
    
    // 2. Tie-breaker: strict source priority (Tiered System)
    const sourceRank = (s: string) => {
      if (s.includes("Internet Archive")) return 0; // Tier 1: IA (Primary Source)
      if (s.includes("Shamela")) return 0;          // Tier 1: IA Arabic
      if (s === "Open Library") return 1;           // Tier 2: Open Library
      if (s.includes("Classics") || s === "Curated Catalog" || s.includes("Self-Help") || s.includes("Comics")) return 2; // Tier 3: Local Fallback
      if (s === "Gutendex") return 3;
      if (s === "OAPEN") return 4;
      return 5;
    };
    return sourceRank(a.source) - sourceRank(b.source);
  });

  finalResults = finalResults.slice(0, 28).map(({ _score, ...r }) => r);
  // ── Cache and respond ──────────────────────────────────────────────────────
  const meta = { cached: false, sources: sourceMeta, total: finalResults.length };
  setCache(cacheKey, finalResults, { cached: false, sources: sourceMeta, total: finalResults.length });
  return res.json({ results: finalResults, meta });
});

// ─── GET ALL BOOKS (with camelCase mapping) ──────────────────────────────────
libraryRouter.get("/library", authenticate, async (req, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
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
  res.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const sessions = await db.query(
      `SELECT DISTINCT date FROM library_reading_sessions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );

    let streakDays = 0;
    const todayStr = new Date().toISOString().split("T")[0]!;
    const sessionDateSet = new Set(
      sessions.rows.map((r) => {
        const raw = r.date as string | Date;
        if (typeof raw === "string") return raw.split("T")[0]!;
        return raw.toISOString().split("T")[0]!;
      }),
    );

    let cursor = new Date(todayStr + "T00:00:00.000Z");
    if (!sessionDateSet.has(todayStr)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (true) {
      const key = cursor.toISOString().split("T")[0]!;
      if (!sessionDateSet.has(key)) break;
      streakDays++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const todayDate = todayStr;
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

    // Weekly totals in one query (last 7 days)
    const weekStart = new Date(todayDate + "T00:00:00.000Z");
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const weekStartStr = weekStart.toISOString().split("T")[0]!;
    const weeklyRows = await db.query(
      `SELECT date, SUM(pages_read) AS total
       FROM library_reading_sessions
       WHERE user_id = $1 AND date >= $2
       GROUP BY date`,
      [userId, weekStartStr],
    );
    const weeklyMap = new Map<string, number>();
    for (const row of weeklyRows.rows) {
      const d = row.date as string | Date;
      const key = typeof d === "string" ? d.split("T")[0]! : d.toISOString().split("T")[0]!;
      weeklyMap.set(key, Number(row.total) || 0);
    }
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate + "T00:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split("T")[0]!;
      weeklyData.push({ date: dateStr, pages: weeklyMap.get(dateStr) || 0 });
    }

    // Monthly totals in one query (current year)
    const monthlyRows = await db.query(
      `SELECT SUBSTRING(CAST(date AS TEXT), 6, 2) AS month, SUM(pages_read) AS total
       FROM library_reading_sessions
       WHERE user_id = $1 AND CAST(date AS TEXT) LIKE $2
       GROUP BY SUBSTRING(CAST(date AS TEXT), 6, 2)`,
      [userId, `${currentYear}-%`],
    );
    const monthlyMap = new Map<string, number>();
    for (const row of monthlyRows.rows) {
      monthlyMap.set(String(row.month), Number(row.total) || 0);
    }
    const monthlyData = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, "0");
      monthlyData.push({ month: monthStr, pages: monthlyMap.get(monthStr) || 0 });
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

// ─── RESOLVE DIRECT FILE URL (bypass Vercel 4.5MB proxy limit) ───────────────
libraryRouter.get("/library/:id/file-url", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT epub_url AS "epubUrl" FROM library_books WHERE id = $1`,
      [req.params.id]
    );
    const epubUrl = result.rows[0]?.epubUrl as string | undefined;
    if (!epubUrl?.trim()) return res.status(404).json({ error: "No file URL" });

    // Always proxy cloud storage through API to handle private buckets/CORS
    if (/cloudinary\.com|backblazeb2\.com/i.test(epubUrl)) {
      return res.json({ proxy: true, url: epubUrl });
    }

    if (epubUrl.includes("archive.org/download/")) {
      const upstream = await fetch(epubUrl, { redirect: "manual" });
      if (upstream.status >= 300 && upstream.status < 400) {
        const loc = upstream.headers.get("location");
        if (loc) return res.json({ proxy: false, url: loc });
      }
    }

    return res.json({ proxy: false, url: epubUrl });
  } catch (err) {
    console.error("Library file-url error:", err);
    return res.status(500).json({ error: "Failed to resolve file URL" });
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

    // Always proxy through the API — HTTP redirects break CORS when the client reads the PDF as a blob.
    // Cloudinary / B2 — server-side fetch (client may also use /api/media/inline).
    if (/cloudinary\.com|backblazeb2\.com/i.test(epubUrl)) {
      try {
        let fetchUrl = epubUrl;
        
        // If it's B2 and we have keys, sign the URL to access private buckets
        if (/backblazeb2\.com/i.test(epubUrl) && process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY) {
          const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
          const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
          
          const s3 = new S3Client({
            region: process.env.AWS_REGION || "us-east-005",
            endpoint: process.env.B2_ENDPOINT,
            credentials: { 
              accessKeyId: process.env.B2_KEY_ID, 
              secretAccessKey: process.env.B2_APPLICATION_KEY 
            },
          });
          
          const bucket = process.env.B2_BUCKET_NAME!;
          const urlObj = new URL(epubUrl);
          // Extract the S3 Key from the URL path
          const key = urlObj.pathname.split(`/${bucket}/`)[1] || urlObj.pathname.replace(/^\//, '');
          
          const command = new GetObjectCommand({ Bucket: bucket, Key: key });
          fetchUrl = await getSignedUrl(s3 as any, command as any, { expiresIn: 3600 });
        }

        const upstream = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(60_000),
          headers: { Accept: "application/pdf,*/*" },
        });
        if (upstream.ok) {
          const raw = Buffer.from(await upstream.arrayBuffer());
          // Decompress gzip if Cloudinary delivers it compressed
          let buffer = raw;
          if (raw[0] === 0x1f && raw[1] === 0x8b) {
            const { gunzipSync } = await import("zlib");
            try { buffer = Buffer.from(gunzipSync(raw)); } catch { buffer = raw; }
          }
          if (isValidBookBuffer(buffer)) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Cache-Control", "private, max-age=3600");
            res.setHeader("Content-Disposition", "inline");
            return res.send(buffer);
          } else {
            console.error("Buffer not a valid PDF (first 4 bytes):", Array.from(buffer.slice(0,4)));
          }
        } else {
           console.error("Upstream B2/Cloudinary fetch failed:", upstream.status, await upstream.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Error fetching from B2/Cloudinary:", err);
        /* fall through to candidates loop */
      }
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
      const dup = await findExistingLibraryBook(authorId, body.title, body.epubUrl);
      if (dup) {
        added.push({ id: dup.id, title: body.title });
        continue;
      }
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

    const existing = await findExistingLibraryBook(authorId, body.title, body.epubUrl);
    if (existing) {
      return res.json({ success: true, id: existing.id, duplicate: true });
    }

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

    const date = new Date().toISOString().split("T")[0];
    const mins = Math.max(0, Number(durationMinutes) || 1);
    const pages = Math.max(0, Number(pagesRead) || 0);

    const existing = await db.query(
      `SELECT id FROM library_reading_sessions WHERE user_id = $1 AND book_id = $2 AND date = $3 LIMIT 1`,
      [userId, req.params.id, date],
    );

    if (existing.rows[0]) {
      await db.execute(
        `UPDATE library_reading_sessions
         SET duration_minutes = duration_minutes + $1, pages_read = pages_read + $2
         WHERE id = $3`,
        [mins, pages, existing.rows[0].id],
      );
    } else {
      const id = randomUUID();
      await db.execute(
        `INSERT INTO library_reading_sessions (id, user_id, book_id, date, duration_minutes, pages_read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, userId, req.params.id, date, mins, pages],
      );
    }
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

// ─── GET ALL COLLECTIONS ────────────────────────────────────────────────────────
libraryRouter.get("/library/collections", authenticate, async (req: AuthenticatedRequest, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await db.query(
      `SELECT c.id, c.name, c.banner_url AS "bannerUrl", c.created_at AS "createdAt",
              (SELECT COUNT(*) FROM library_collection_books cb WHERE cb.collection_id = c.id) AS "bookCount"
       FROM library_collections c
       WHERE c.created_by = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library collections GET error:", err);
    return res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// ─── CREATE COLLECTION ───────────────────────────────────────────────────────
libraryRouter.post("/library/collections", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, bannerUrl } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = randomUUID();
    const timestamp = new Date().toISOString();

    await db.execute(
      `INSERT INTO library_collections (id, name, banner_url, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, bannerUrl || null, userId, timestamp]
    );
    
    return res.json({ id, name, bannerUrl, createdAt: timestamp, bookCount: 0 });
  } catch (err) {
    console.error("Library collection POST error:", err);
    return res.status(500).json({ error: "Failed to create collection" });
  }
});

// ─── DELETE COLLECTION ───────────────────────────────────────────────────────
libraryRouter.delete("/library/collections/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await db.execute(`DELETE FROM library_collections WHERE id = $1`, [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection DELETE error:", err);
    return res.status(500).json({ error: "Failed to delete collection" });
  }
});

// ─── GET COLLECTION DETAILS AND BOOKS ────────────────────────────────────────
libraryRouter.get("/library/collections/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  res.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=86400");
  try {
    // Get collection metadata
    const colResult = await db.query(
      `SELECT id, name, banner_url AS "bannerUrl", created_at AS "createdAt"
       FROM library_collections WHERE id = $1`,
      [req.params.id]
    );
    if (!colResult.rows[0]) return res.status(404).json({ error: "Collection not found" });

    // Get books in collection
    const booksResult = await db.query(
      `SELECT b.id, b.title, b.author, b.cover_url AS "coverUrl", b.description,
              b.epub_url AS "epubUrl", b.source, b.added_by AS "addedBy",
              b.added_at AS "addedAt", b.status, b.current_page AS "currentPage",
              b.total_pages AS "totalPages", b.is_favorite AS "isFavorite",
              cb.added_at AS "collectionAddedAt"
       FROM library_collection_books cb
       JOIN library_books b ON cb.book_id = b.id
       WHERE cb.collection_id = $1
       ORDER BY cb.added_at DESC`,
      [req.params.id]
    );

    return res.json({
      ...colResult.rows[0],
      books: booksResult.rows
    });
  } catch (err) {
    console.error("Library collection details GET error:", err);
    return res.status(500).json({ error: "Failed to fetch collection details" });
  }
});

// ─── ADD BOOK TO COLLECTION ──────────────────────────────────────────────────
libraryRouter.post("/library/collections/:id/books", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ error: "bookId is required" });

    const timestamp = new Date().toISOString();

    await db.execute(
      `INSERT INTO library_collection_books (collection_id, book_id, added_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, book_id) DO NOTHING`,
      [req.params.id, bookId, timestamp]
    );
    
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection book POST error:", err);
    return res.status(500).json({ error: "Failed to add book to collection" });
  }
});

// ─── REMOVE BOOK FROM COLLECTION ─────────────────────────────────────────────
libraryRouter.delete("/library/collections/:id/books/:bookId", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await db.execute(
      `DELETE FROM library_collection_books WHERE collection_id = $1 AND book_id = $2`,
      [req.params.id, req.params.bookId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("Library collection book DELETE error:", err);
    return res.status(500).json({ error: "Failed to remove book from collection" });
  }
});

export default libraryRouter;
