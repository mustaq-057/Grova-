import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../lib/db";
import { authenticate } from "../lib/auth-middleware";
import type { AuthenticatedRequest } from "../types";
import * as cheerio from "cheerio";

const libraryRouter = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeText(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

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

// ─── OMNI-SEARCH ENGINE (Federated 6-Source Aggregator) ─────────────────────
libraryRouter.get("/library/search", authenticate, async (req, res) => {
  const query = (req.query.q as string || "").trim();
  if (!query) return res.json({ results: [], meta: { cached: false, sources: {} } });

  const enc = encodeURIComponent(query);
  const arabic = isArabicQuery(query);

  // ── Cache check ─────────────────────────────────────────────────────────
  const cacheKey = query.toLowerCase();
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
  const skipWikiEn    = arabic;
  const skipWikiAr    = !arabic;

  if (skipGutendex) sourceMeta["Gutendex"]      = "skipped";
  if (skipWikiEn)   sourceMeta["Wikisource EN"] = "skipped";
  if (skipWikiAr)   sourceMeta["Wikisource AR"] = "skipped";
  sourceMeta["HathiTrust"] = "skipped"; // always deep-link only

  // ── Concurrent fetch ──────────────────────────────────────────────────────

  // 1. Open Library (always)
  const openLibFetch = fetch(
    `https://openlibrary.org/search.json?q=${enc}&limit=10&fields=key,title,author_name,cover_i,number_of_pages_median`
  );

  // 2. Gutendex (English only)
  const gutendexFetch = skipGutendex
    ? Promise.resolve(null)
    : fetch(`https://gutendex.com/books/?search=${enc}`);

  // 3. Internet Archive (always)
  const archiveFetch = fetch(
    `https://archive.org/advancedsearch.php?q=${enc}+AND+mediatype%3Atexts&output=json&rows=4&fl[]=identifier,title,creator,description,imagecount`
  );

  // 4. Shamela — POST to their real AJAX endpoint (always, great for Arabic)
  const shamelaFetch = fetch(
    `https://shamela.ws/ajax/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://shamela.ws/search",
      },
      body: `term=${enc}`,
      signal: AbortSignal.timeout(8000),
    }
  ).catch(() => null);

  // 5a. Wikisource Arabic (Arabic queries only)
  const wikiArFetch = skipWikiAr
    ? Promise.resolve(null)
    : fetch(`https://ar.wikisource.org/w/api.php?action=query&list=search&srsearch=${enc}&format=json&srlimit=3`);

  // 5b. Wikisource English (English queries only)
  const wikiEnFetch = skipWikiEn
    ? Promise.resolve(null)
    : fetch(`https://en.wikisource.org/w/api.php?action=query&list=search&srsearch=${enc}&format=json&srlimit=3`);

  // 6. HathiTrust — always a deep-link card (403 from server)
  const hathiFetch: Promise<Response | null> = Promise.resolve(null);

  // 1.5. Standard Ebooks
  const standardUrl = `https://standardebooks.org/ebooks?query=${enc}`;
  const standardFetch = skipGutendex ? Promise.resolve(null) : fetch(standardUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null);

  const [
    openLibRes,
    standardRes,
    gutendexRes,
    archiveRes,
    shamelaRawRes,
    wikiArRes,
    wikiEnRes,
    hathiRawRes,
  ] = await Promise.allSettled([
    openLibFetch,
    standardFetch,
    gutendexFetch,
    archiveFetch,
    shamelaFetch,
    wikiArFetch,
    wikiEnFetch,
    hathiFetch,
  ]);

  const results: any[] = [];
  const seen = new Set<string>();

  function dedup(title: string): boolean {
    const key = title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  // ── 1. Open Library ────────────────────────────────────────────────────────
  if (openLibRes.status === "fulfilled" && openLibRes.value?.ok) {
    try {
      const data = await (openLibRes.value as Response).json() as any;
      const docs = (data.docs || []);
      let added = 0;
      for (const doc of docs) {
        if (!doc.title || !dedup(doc.title)) continue;
        results.push({
          id: `ol_${(doc.key || "").replace("/works/", "") || randomUUID()}`,
          title: doc.title,
          author: doc.author_name?.[0] || "Unknown Author",
          coverUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null,
          description: "Available on Open Library.",
          totalPages: doc.number_of_pages_median || 100,
          source: "Open Library",
        });
        added++;
        if (added >= 4) break;
      }
      sourceMeta["Open Library"] = added > 0 ? "ok" : "empty";
    } catch { sourceMeta["Open Library"] = "timeout"; }
  } else {
    sourceMeta["Open Library"] = openLibRes.status === "rejected" ? "timeout" : "empty";
  }

  // ── 1.5 Standard Ebooks (English, High Quality EPUBs) ─────────────────────────
  if (!skipGutendex) {
    if (standardRes.status === "fulfilled" && (standardRes.value as Response | null)?.ok) {
      try {
        const html = await (standardRes.value as Response).text();
        const $ = cheerio.load(html);
        let added = 0;
        $('ol.list > li').each((_, el) => {
          if (added >= 3) return;
          const title = $(el).find('p[property="schema:name"]').text().trim() || $(el).find('p.title a').text().trim();
          const author = $(el).find('p.author').text().trim() || "Unknown Author";
          const link = $(el).find('a').first().attr('href');
          const cover = $(el).find('img').attr('src');
          if (title && link && dedup(title)) {
            const epubLinkId = link.replace('/ebooks/', '').replace(/\//g, '_');
            results.push({
              id: `se_${epubLinkId}`,
              title,
              author,
              coverUrl: cover ? `https://standardebooks.org${cover.replace('/downloads/cover-thumbnail.jpg', '/downloads/cover.jpg')}` : null,
              description: "High-quality public domain ebook.",
              epubUrl: `https://standardebooks.org${link}/downloads/${epubLinkId}.epub`,
              totalPages: 250,
              source: "Standard Ebooks",
            });
            added++;
          }
        });
        sourceMeta["Standard Ebooks"] = added > 0 ? "ok" : "empty";
      } catch { sourceMeta["Standard Ebooks"] = "timeout"; }
    } else {
      sourceMeta["Standard Ebooks"] = standardRes.status === "rejected" ? "timeout" : "empty";
    }
  }

  // ── 2. Gutendex / Project Gutenberg (English queries only) ───────────────
  if (!skipGutendex) {
    if (gutendexRes.status === "fulfilled" && (gutendexRes.value as Response | null)?.ok) {
      try {
        const data = await ((gutendexRes.value as Response)).json() as any;
        let added = 0;
        for (const item of (data.results || []).slice(0, 3)) {
          if (!item.title || !dedup(item.title)) continue;
          results.push({
            id: `guten_${item.id}`,
            title: item.title,
            author: item.authors?.[0]?.name || "Unknown Author",
            coverUrl: item.formats?.["image/jpeg"] || null,
            description: "Public domain ebook from Project Gutenberg.",
            epubUrl: item.formats?.["application/epub+zip"] || null,
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

  // ── 3. Internet Archive ───────────────────────────────────────────────────
  if (archiveRes.status === "fulfilled" && archiveRes.value?.ok) {
    try {
      const data = await (archiveRes.value as Response).json() as any;
      let added = 0;
      for (const doc of (data.response?.docs || []).slice(0, 3)) {
        if (!doc.title || !dedup(doc.title)) continue;
        results.push({
          id: `ia_${doc.identifier}`,
          title: doc.title,
          author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || "Unknown Author"),
          coverUrl: doc.identifier
            ? `https://archive.org/services/img/${doc.identifier}`
            : null,
          description: safeText(Array.isArray(doc.description) ? doc.description[0] : doc.description) || "Archived digitized book.",
          totalPages: doc.imagecount || 100,
          source: "Internet Archive",
        });
        added++;
      }
      sourceMeta["Internet Archive"] = added > 0 ? "ok" : "empty";
    } catch { sourceMeta["Internet Archive"] = "timeout"; }
  } else {
    sourceMeta["Internet Archive"] = archiveRes.status === "rejected" ? "timeout" : "empty";
  }

  // ── 4. Shamela (Arabic / Islamic Books — المكتبة الشاملة) ────────────────
  // Real endpoint: POST https://shamela.ws/ajax/search with body { term: query }
  // Returns HTML. We extract book IDs and titles via regex.
  let shamelaOk = false;
  if (shamelaRawRes.status === "fulfilled" && shamelaRawRes.value && (shamelaRawRes.value as Response).ok) {
    try {
      const html = await (shamelaRawRes.value as Response).text();
      // HTML pattern: href="https://shamela.ws/book/{id}/{page}"><b><span class="text-primaryy">{title}</span></b> <span class="text-gray">[{author}]</span>
      const bookRegex = /href="https:\/\/shamela\.ws\/book\/(\d+)\/\d+"[^>]*><b><span[^>]*>([^<]+)<\/span><\/b>\s*<span[^>]*>\[([^\]]+)\]/g;
      const seen2 = new Set<string>();
      let match: RegExpExecArray | null;
      let count = 0;

      while ((match = bookRegex.exec(html)) !== null && count < 5) {
        const bookId = match[1];
        const title   = match[2].trim();
        const author  = match[3].trim();
        const dedupKey = `shamela_${bookId}`;
        if (seen2.has(dedupKey) || !dedup(title)) continue;
        seen2.add(dedupKey);
        results.push({
          id: `shamela_${bookId}`,
          title,
          author,
          // Shamela book covers follow a predictable URL pattern
          coverUrl: `https://shamela.ws/covers/${bookId}.jpg`,
          description: "كتاب إسلامي من المكتبة الشاملة — Islamic book from Al-Maktaba Al-Shamela.",
          totalPages: 500,
          epubUrl: `https://shamela.ws/book/${bookId}`,
          source: "Shamela",
        });
        shamelaOk = true;
        count++;
      }
    } catch { /* ignore */ }
  }

  // Shamela fallback → Arabic Wikisource if Shamela failed (e.g. timeout)
  if (!shamelaOk && wikiArRes.status === "fulfilled" && wikiArRes.value?.ok) {
    try {
      const data = await (wikiArRes.value as Response).json() as any;
      for (const item of (data.query?.search || []).slice(0, 3)) {
        if (!item.title || !dedup(item.title)) continue;
        results.push({
          id: `shamela_wiki_${item.pageid}`,
          title: item.title,
          author: "تراث إسلامي / Islamic Heritage",
          coverUrl: null,
          description: safeText(item.snippet) || "نص عربي من ويكي مصدر — Arabic text from Wikisource.",
          totalPages: 50,
          source: "Shamela / Wikisource AR",
        });
      }
    } catch { /* ignore */ }
  } else if (shamelaOk && !skipWikiAr && wikiArRes.status === "fulfilled" && (wikiArRes.value as Response | null)?.ok) {
    // Also include Arabic Wikisource alongside Shamela for Arabic queries
    try {
      const data = await ((wikiArRes.value as Response)).json() as any;
      let added = 0;
      for (const item of (data.query?.search || []).slice(0, 2)) {
        if (!item.title || !dedup(item.title)) continue;
        results.push({
          id: `wiki_ar_${item.pageid}`,
          title: item.title,
          author: "ويكي مصدر / Wikisource AR",
          coverUrl: null,
          description: safeText(item.snippet) || "Arabic Wikisource text.",
          totalPages: 50,
          source: "Wikisource AR",
        });
        added++;
      }
      sourceMeta["Wikisource AR"] = added > 0 ? "ok" : "empty";
    } catch { sourceMeta["Wikisource AR"] = "timeout"; }
  }

  // ── 5. Wikisource English (English queries only) ─────────────────────────
  if (!skipWikiEn) {
    if (wikiEnRes.status === "fulfilled" && (wikiEnRes.value as Response | null)?.ok) {
      try {
        const data = await ((wikiEnRes.value as Response)).json() as any;
        let added = 0;
        for (const item of (data.query?.search || []).slice(0, 2)) {
          if (!item.title || !dedup(item.title)) continue;
          results.push({
            id: `wiki_en_${item.pageid}`,
            title: item.title,
            author: "Public Domain / Wikisource",
            coverUrl: null,
            description: safeText(item.snippet) || "Full-text from English Wikisource.",
            totalPages: 50,
            source: "Wikisource EN",
          });
          added++;
        }
        sourceMeta["Wikisource EN"] = added > 0 ? "ok" : "empty";
      } catch { sourceMeta["Wikisource EN"] = "timeout"; }
    } else {
      sourceMeta["Wikisource EN"] = wikiEnRes.status === "rejected" ? "timeout" : "empty";
    }
  }

  // ── 6. HathiTrust ─────────────────────────────────────────────────────────
  // HathiTrust's Bibliographic API requires OCLC/ISBN identifiers, not text search.
  // Instead we hit their SOLR-based catalog search which returns HTML, so we
  // extract what we can, or use their Partner API if JSON is supported.
  if (hathiRawRes.status === "fulfilled" && hathiRawRes.value && (hathiRawRes.value as Response).ok) {
    try {
      const ct = (hathiRawRes.value as Response).headers.get("content-type") || "";
      if (ct.includes("json")) {
        const data = await (hathiRawRes.value as Response).json() as any;
        const records = data.records || data.items || [];
        for (const [key, record] of Object.entries(records).slice(0, 2) as any) {
          const title = (record as any).titles?.[0] || (record as any).title || query;
          if (!dedup(title)) continue;
          results.push({
            id: `hathi_${key}`,
            title,
            author: (record as any).publishDates?.[0] ? `Published ${(record as any).publishDates[0]}` : "Various Authors",
            coverUrl: null,
            description: "Academic & historical scan from HathiTrust.",
            totalPages: 300,
            source: "HathiTrust",
          });
        }
      }
    } catch { /* ignore */ }
  }

  // If HathiTrust returned nothing (HTML response), add a placeholder result pointing
  // to their catalog – useful so users know the source exists
  const hathiInResults = results.some(r => r.source === "HathiTrust");
  if (!hathiInResults) {
    // Only add HathiTrust deep-link if we have at least some results (avoid noise on empty searches)
    if (results.length > 0) {
      results.push({
        id: `hathi_link_${Date.now()}`,
        title: `Search "${query}" on HathiTrust`,
        author: "HathiTrust Digital Library",
        coverUrl: null,
        description: "Millions of digitized academic & historical books. Click to explore on HathiTrust.",
        totalPages: 0,
        epubUrl: `https://catalog.hathitrust.org/Search/Home?lookfor=${enc}&type=title`,
        source: "HathiTrust",
        isLink: true,
      });
    }
  }

  // ── Cache and respond ──────────────────────────────────────────────────────
  const meta = { cached: false, sources: sourceMeta, total: results.length };
  setCache(cacheKey, results, { cached: false, sources: sourceMeta, total: results.length });
  return res.json({ results, meta });
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
              total_pages AS "totalPages"
       FROM library_books
       ORDER BY added_at DESC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("Library GET error:", err);
    return res.status(500).json({ error: "Failed to fetch library" });
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
              status,
              current_page AS "currentPage",
              total_pages AS "totalPages"
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

// ─── ADD BOOK TO LIBRARY ─────────────────────────────────────────────────────
libraryRouter.post("/library", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: "title is required" });

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
    const { page, status } = req.body;
    if (page === undefined) return res.status(400).json({ error: "page is required" });

    const newStatus = status || (page > 0 ? "reading" : "reading");
    await db.execute(
      `UPDATE library_books SET current_page = $1, status = $2 WHERE id = $3`,
      [page, newStatus, req.params.id]
    );
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

// ─── UPDATE BOOK STATUS ───────────────────────────────────────────────────────
libraryRouter.patch("/library/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["reading", "finished", "wishlist", "paused"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    await db.execute(`UPDATE library_books SET status = $1 WHERE id = $2`, [status, req.params.id]);
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
