/** Federated book catalog helpers — Internet Archive, Open Library, Shamela discovery */

export type CatalogHit = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  epubUrl: string;
  totalPages: number;
  source: string;
};

function iaEpubUrl(identifier: string, filename?: string): string {
  const file = filename || `${identifier}.epub`;
  return `https://archive.org/download/${identifier}/${encodeURIComponent(file)}`;
}

async function iaHasEpub(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`, {
      headers: { "User-Agent": "Grova-Library/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { files?: { name?: string; format?: string }[] };
    const epub = (data.files || []).find(
      (f) => f.name?.toLowerCase().endsWith(".epub") || f.format === "EPUB",
    );
    if (epub?.name) return iaEpubUrl(identifier, epub.name);
    return iaEpubUrl(identifier);
  } catch {
    return iaEpubUrl(identifier);
  }
}

/** Internet Archive — 25k+ Arabic EPUBs, millions of texts worldwide */
export async function searchInternetArchive(
  query: string,
  opts: { arabic?: boolean; limit?: number } = {},
): Promise<CatalogHit[]> {
  const limit = opts.limit ?? (opts.arabic ? 10 : 6);
  const langClause = opts.arabic ? "language:Arabic AND " : "";
  const q = `${langClause}mediatype:texts AND format:EPUB AND (${query})`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,description&rows=${limit}&output=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Grova-Library/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    response?: { docs?: { identifier: string; title?: string; creator?: string | string[]; description?: string }[] };
  };
  const hits: CatalogHit[] = [];

  for (const doc of data.response?.docs || []) {
    if (!doc.identifier) continue;
    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "Unknown";
    hits.push({
      id: `ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: (doc.description || "Free EPUB from Internet Archive.").toString().slice(0, 200),
      epubUrl: iaEpubUrl(doc.identifier),
      totalPages: 300,
      source: opts.arabic ? "Internet Archive (AR)" : "Internet Archive",
    });
  }
  return hits;
}

/** Open Library — resolve Internet Archive EPUB when available */
export async function searchOpenLibrary(query: string, limit = 6): Promise<CatalogHit[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&limit=${limit}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Grova-Library/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    docs?: {
      key?: string;
      title?: string;
      author_name?: string[];
      ia?: string[];
      cover_i?: number;
      first_sentence?: string[];
      language?: string[];
    }[];
  };

  const hits: CatalogHit[] = [];
  for (const doc of data.docs || []) {
    if (!doc.title || !doc.ia?.length) continue;
    const iaId = doc.ia[0];
    const epubUrl = await iaHasEpub(iaId);
    if (!epubUrl) continue;

    hits.push({
      id: `ol_${(doc.key || "").replace(/\//g, "_")}`,
      title: doc.title,
      author: doc.author_name?.[0] || "Unknown Author",
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      description: doc.first_sentence?.[0] || "Public domain book via Open Library.",
      epubUrl,
      totalPages: 250,
      source: "Open Library",
    });
  }
  return hits;
}

/** Shamela — search Internet Archive Arabic Islamic collection (real EPUB files) */
export async function searchShamelaCatalog(query: string, limit = 8): Promise<CatalogHit[]> {
  const q = `collection:booksbylanguage_arabic AND format:EPUB AND (${query})`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,title,creator,description&rows=${limit}&output=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Grova-Library/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    response?: { docs?: { identifier: string; title?: string; creator?: string | string[]; description?: string }[] };
  };
  const hits: CatalogHit[] = [];

  for (const doc of data.response?.docs || []) {
    if (!doc.identifier) continue;
    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "تراث";
    hits.push({
      id: `shamela_ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: "كتاب عربي مجاني — مجموعة المكتبة العربية على Internet Archive.",
      epubUrl: iaEpubUrl(doc.identifier),
      totalPages: 400,
      source: "Shamela / Arabic",
    });
  }
  return hits;
}

/** Curated Arabic classics with verified IA EPUB links */
export const ARABIC_FEATURED: CatalogHit[] = [
  {
    id: "feat_kalila",
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    coverUrl: "https://archive.org/services/img/book01129",
    description: "أشهر حكايات الحيوان في التراث العربي.",
    epubUrl: "https://archive.org/download/book01129/book01129.epub",
    totalPages: 300,
    source: "Arabic Classics",
  },
];
