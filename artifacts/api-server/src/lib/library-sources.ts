/** Federated book catalog helpers — Internet Archive, Open Library, Arabic/English PDF discovery */

export type CatalogHit = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  epubUrl: string; // holds PDF download URL (legacy column name)
  totalPages: number;
  source: string;
};

function iaPdfUrl(identifier: string, filename: string): string {
  return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
}

export async function iaResolvePdfUrl(identifier: string): Promise<string | null> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}`, {
      headers: { "User-Agent": "Grova-Library/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { files?: { name?: string; format?: string }[] };
    const pdf = (data.files || []).find(
      (f) =>
        f.name?.toLowerCase().endsWith(".pdf") ||
        f.format === "Text PDF" ||
        f.format === "PDF",
    );
    if (pdf?.name) return iaPdfUrl(identifier, pdf.name);
    return null;
  } catch {
    return null;
  }
}

/** Score how well a book matches the search query (0–100). */
export function scoreBookMatch(query: string, hit: { title: string; author?: string }): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const title = hit.title.toLowerCase().trim();
  const author = (hit.author || "").toLowerCase().trim();

  if (title === q) return 100;
  if (title.includes(q)) return 85;
  if (author === q) return 80;
  if (author.includes(q)) return 75;

  const terms = q.split(/\s+/).filter((w) => w.length > 1);
  if (terms.length === 0) {
    return title.includes(q) || author.includes(q) ? 55 : 0;
  }

  let matched = 0;
  for (const term of terms) {
    if (title.includes(term) || author.includes(term)) matched++;
  }
  if (matched === terms.length) return 65 + Math.min(terms.length * 5, 20);
  if (matched > 0) return matched * 12;
  return 0;
}

/** Internet Archive — millions of PDF texts (Arabic + English) */
export async function searchInternetArchive(
  query: string,
  opts: { arabic?: boolean; limit?: number } = {},
): Promise<CatalogHit[]> {
  const limit = opts.limit ?? (opts.arabic ? 15 : 12);
  const langClause = opts.arabic ? "language:Arabic AND " : "";
  const q = `${langClause}mediatype:texts AND format:PDF AND (title:(${query}) OR creator:(${query}) OR ${query})`;
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

  const docs = data.response?.docs || [];
  const pdfUrls = await Promise.all(docs.map((d) => (d.identifier ? iaResolvePdfUrl(d.identifier) : Promise.resolve(null))));

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const pdfUrl = pdfUrls[i];
    if (!doc?.identifier || !pdfUrl) continue;

    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "Unknown";
    hits.push({
      id: `ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: (doc.description || "Free PDF from Internet Archive.").toString().slice(0, 200),
      epubUrl: pdfUrl,
      totalPages: 300,
      source: opts.arabic ? "Internet Archive (AR)" : "Internet Archive",
    });
  }
  return hits;
}

/** Open Library — resolve verified Internet Archive PDF */
export async function searchOpenLibrary(query: string, limit = 8): Promise<CatalogHit[]> {
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
    }[];
  };

  const hits: CatalogHit[] = [];
  for (const doc of data.docs || []) {
    if (!doc.title || !doc.ia?.length) continue;
    const pdfUrl = await iaResolvePdfUrl(doc.ia[0]!);
    if (!pdfUrl) continue;

    hits.push({
      id: `ol_${(doc.key || "").replace(/\//g, "_")}`,
      title: doc.title,
      author: doc.author_name?.[0] || "Unknown Author",
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      description: doc.first_sentence?.[0] || "Public domain PDF via Open Library.",
      epubUrl: pdfUrl,
      totalPages: 250,
      source: "Open Library",
    });
  }
  return hits;
}

/** Arabic Islamic library — 500k+ PDFs (Arabic queries only) */
export async function searchShamelaCatalog(query: string, limit = 12): Promise<CatalogHit[]> {
  const q = `collection:booksbylanguage_arabic AND format:PDF AND (title:(${query}) OR creator:(${query}) OR ${query})`;
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
  const docs = data.response?.docs || [];
  const pdfUrls = await Promise.all(docs.map((d) => (d.identifier ? iaResolvePdfUrl(d.identifier) : Promise.resolve(null))));

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const pdfUrl = pdfUrls[i];
    if (!doc?.identifier || !pdfUrl) continue;

    const author = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || "تراث";
    hits.push({
      id: `shamela_ia_${doc.identifier}`,
      title: doc.title || doc.identifier,
      author: String(author),
      coverUrl: `https://archive.org/services/img/${doc.identifier}`,
      description: "كتاب عربي PDF مجاني — مجموعة المكتبة العربية على Internet Archive.",
      epubUrl: pdfUrl,
      totalPages: 400,
      source: "Shamela / Arabic",
    });
  }
  return hits;
}

export const ARABIC_FEATURED: CatalogHit[] = [
  {
    id: "feat_hdesaddar",
    title: "حديث الدار",
    author: "السيد علي الحسيني الميلاني",
    coverUrl: "https://archive.org/services/img/hdesaddar",
    description: "حديث الدار — كتاب عربي PDF من Internet Archive.",
    epubUrl: "https://archive.org/download/hdesaddar/hdesaddar.pdf",
    totalPages: 38,
    source: "Arabic Classics",
  },
  {
    id: "feat_abu971",
    title: "الحركيون",
    author: "تراث",
    coverUrl: "https://archive.org/services/img/abu_971",
    description: "كتاب عربي PDF مجاني.",
    epubUrl: "https://archive.org/download/abu_971/abu_971.pdf",
    totalPages: 200,
    source: "Arabic Classics",
  },
];

export const ENGLISH_FEATURED: CatalogHit[] = [
  {
    id: "feat_pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    description: "Classic English novel — Project Gutenberg PDF.",
    epubUrl: "https://www.gutenberg.org/files/1342/1342-0.pdf",
    totalPages: 350,
    source: "English Classics",
  },
  {
    id: "feat_frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    description: "Gothic classic — Project Gutenberg PDF.",
    epubUrl: "https://www.gutenberg.org/files/84/84-0.pdf",
    totalPages: 280,
    source: "English Classics",
  },
  {
    id: "feat_alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    description: "Beloved children's classic — Project Gutenberg PDF.",
    epubUrl: "https://www.gutenberg.org/files/11/11-0.pdf",
    totalPages: 120,
    source: "English Classics",
  },
];

export function isPdfBookUrl(url: string): boolean {
  const lower = url.toLowerCase().split("?")[0] ?? "";
  if (lower.endsWith(".pdf") || lower.includes(".pdf/")) return true;
  // Cloudinary / uploaded PDFs often omit extension in URL
  if (/cloudinary\.com/i.test(url) && /\/raw\//i.test(url)) return true;
  if (/res\.cloudinary\.com/i.test(url)) return true;
  return false;
}
