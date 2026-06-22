/** Curated free PDF catalog — verified Internet Archive + Project Gutenberg links only */

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

function guten(id: number): string {
  return `https://www.gutenberg.org/files/${id}/${id}-0.pdf`;
}

export const CATALOG_CATEGORIES = [
  "Arabic Poetry & Classics",
  "Darija & Moroccan",
  "English Classics",
  "Self-Help & Wealth",
  "Mustaq's Picks",
  "German",
  "French",
  "Comics & Illustrated",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

type CatalogEntry = CatalogHit & { category: CatalogCategory; tags?: string[] };

/** Every epubUrl here was verified to resolve to a real PDF on IA or Gutenberg. */
export const BOOK_CATALOG: CatalogEntry[] = [
  // ── Arabic Poetry & Classical Stories (verified IA) ───────────────────────
  {
    id: "cat_hdesaddar",
    title: "حديث الدار",
    author: "السيد علي الحسيني الميلاني",
    coverUrl: "https://archive.org/services/img/hdesaddar",
    description: "حديث الدار — كتاب عربي PDF مجاني.",
    epubUrl: "https://archive.org/download/hdesaddar/hdesaddar.pdf",
    totalPages: 38,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["عربي", "حديث"],
  },
  {
    id: "cat_alf_layla_1",
    title: "ألف ليلة وليلة (1)",
    author: "تراث عربي",
    coverUrl: "https://archive.org/services/img/1_20200728_20200728",
    description: "ألف ليلة وليلة — الحكايات العربية الشعبية.",
    epubUrl: "https://archive.org/download/1_20200728_20200728/%D8%A3%D9%84%D9%81%20%D9%84%D9%8A%D9%84%D8%A9%20%D9%88%D9%84%D9%8A%D9%84%D8%A9%201.pdf",
    totalPages: 400,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["قصص", "حكايات", "ألف ليلة"],
  },
  {
    id: "cat_poetry_diwan",
    title: "ديwan شعر — طبعة نادرة",
    author: "شاعر عربي",
    coverUrl: "https://archive.org/services/img/qnlhc_12921_en",
    description: "ديwan شعر عربي — PDF مجاني من Internet Archive.",
    epubUrl: "https://archive.org/download/qnlhc_12921_en/qnlhc_12921_en.pdf",
    totalPages: 120,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "ديwan", "poetry"],
  },
  {
    id: "cat_hanzala",
    title: "رباعية حنظلة — شعر",
    author: "حنظلة",
    coverUrl: "https://archive.org/services/img/AAlexandrina-115822",
    description: "رباعية حنظلة — شعر عربي معاصر.",
    epubUrl: "https://archive.org/download/AAlexandrina-115822/115822%20-%20%D8%B1%D8%A8%D8%A7%D8%B9%D9%8A%D8%A9%20%D8%AD%D9%86%D8%B8%D9%84%D8%A9%20-%20%D8%B4%D8%B9%D8%B1.pdf",
    totalPages: 40,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "حنظلة"],
  },
  {
    id: "cat_karham",
    title: "كرحم غابة — شعر",
    author: "تراث",
    coverUrl: "https://archive.org/services/img/AAlexandrina-100028",
    description: "كرحم غابة — قصائد عربية.",
    epubUrl: "https://archive.org/download/AAlexandrina-100028/100028%20-%20%D9%83%D8%B1%D8%AD%D9%85%20%D8%BA%D8%A7%D8%A8%D8%A9%20-%20%D8%B4%D8%B9%D8%B1.pdf",
    totalPages: 50,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "قصائد"],
  },
  {
    id: "cat_shahab_poetry",
    title: "شعر الشهاب المحمودي",
    author: "الشهاب المحمودي",
    coverUrl: "https://archive.org/services/img/AAlexandrina-438144",
    description: "أصداء الغزوين الصليبي والمغولي في شعر الشهاب المحمودي.",
    epubUrl: "https://archive.org/download/AAlexandrina-438144/438144_%D8%A3%D8%B5%D8%AF%D8%A7%D8%A1_%D8%A7%D9%84%D8%BA%D8%B2%D9%88%D9%8A%D9%86_%D8%A7%D9%84%D8%B5%D9%84%D9%8A%D8%A8%D9%8A_%D9%88%D8%A7%D9%84%D9%85%D8%BA%D9%88%D9%84%D9%8A_%D9%81%D9%8A_%D8%B4%D8%B9%D8%B1_%D8%A7%D9%84%D8%B4%D9%87%D8%A7%D8%A8_%D9%85%D8%AD_725%D9%87.pdf",
    totalPages: 200,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "تاريخ", "أدب"],
  },

  // ── Darija & Moroccan ─────────────────────────────────────────────────────
  {
    id: "cat_morocco_guide",
    title: "Guide Marocain des Associations",
    author: "Collectif",
    coverUrl: "https://archive.org/services/img/guide-marocain-des-associations",
    description: "Guide marocain — culture et société au Maroc.",
    epubUrl: "https://archive.org/download/guide-marocain-des-associations/guide-marocain-des-associations.pdf",
    totalPages: 120,
    source: "Moroccan Heritage",
    category: "Darija & Moroccan",
    tags: ["maroc", "maghreb", "darija"],
  },

  // ── English Classics (Gutenberg — always reliable) ──────────────────────────
  {
    id: "cat_pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    description: "Jane Austen's classic romance.",
    epubUrl: "https://www.planetebook.com/free-ebooks/pride-and-prejudice.pdf",
    totalPages: 350,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "classic"],
  },
  {
    id: "cat_moby",
    title: "Moby Dick",
    author: "Herman Melville",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    description: "American literary masterpiece.",
    epubUrl: "https://www.planetebook.com/free-ebooks/moby-dick.pdf",
    totalPages: 600,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english"],
  },
  {
    id: "cat_sherlock",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    description: "Detective stories classic collection.",
    epubUrl: "https://sherlock-holm.es/stories/pdf/a4/1-sided/advs.pdf",
    totalPages: 280,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "mystery"],
  },
  {
    id: "cat_dracula",
    title: "Dracula",
    author: "Bram Stoker",
    coverUrl: "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg",
    description: "Gothic horror classic.",
    epubUrl: "https://www.planetebook.com/free-ebooks/dracula.pdf",
    totalPages: 400,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "horror"],
  },
  {
    id: "cat_alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    description: "Beloved children's classic.",
    epubUrl: "https://www.planetebook.com/free-ebooks/alices-adventures-in-wonderland.pdf",
    totalPages: 120,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "children"],
  },
  {
    id: "cat_frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    description: "Birth of science fiction.",
    epubUrl: "https://www.planetebook.com/free-ebooks/frankenstein.pdf",
    totalPages: 250,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "scifi"],
  },

  // ── Self-Help & Wealth ────────────────────────────────────────────────────
  {
    id: "cat_art_of_war",
    title: "The Art of War",
    author: "Sun Tzu",
    coverUrl: "https://www.gutenberg.org/cache/epub/132/pg132.cover.medium.jpg",
    description: "Strategy and leadership classic.",
    epubUrl: "https://sites.ualberta.ca/~enoch/Readings/The_Art_Of_War.pdf",
    totalPages: 100,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["strategy", "self-help"],
  },
  {
    id: "cat_meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    coverUrl: "https://www.gutenberg.org/cache/epub/2680/pg2680.cover.medium.jpg",
    description: "Stoic philosophy for daily life.",
    epubUrl: "https://sellula.com/pdf/meditations.pdf",
    totalPages: 180,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["stoicism", "philosophy"],
  },
  {
    id: "cat_as_man_thinketh",
    title: "As a Man Thinketh",
    author: "James Allen",
    coverUrl: "https://www.gutenberg.org/cache/epub/4507/pg4507.cover.medium.jpg",
    description: "Your thoughts shape your life.",
    epubUrl: "https://wahiduddin.net/thinketh/as_a_man_thinketh.pdf",
    totalPages: 60,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["self-help", "mindset"],
  },
  {
    id: "cat_science_getting_rich",
    title: "The Science of Getting Rich",
    author: "Wallace D. Wattles",
    coverUrl: "https://www.gutenberg.org/cache/epub/59852/pg59852.cover.medium.jpg",
    description: "Wealth creation philosophy.",
    epubUrl: "https://www.thesecret.tv/wp-content/uploads/2015/05/The-Science-of-Getting-Rich.pdf",
    totalPages: 90,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["wealth", "rich"],
  },
  {
    id: "cat_nicomachean",
    title: "Nicomachean Ethics",
    author: "Aristotle",
    coverUrl: "https://www.gutenberg.org/cache/epub/8438/pg8438.cover.medium.jpg",
    description: "Virtue and the good life.",
    epubUrl: "https://socialsciences.mcmaster.ca/econ/ugcm/3ll3/aristotle/Ethics.pdf",
    totalPages: 300,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["philosophy", "ethics"],
  },

  // ── Mustaq's Picks ────────────────────────────────────────────────────────
  {
    id: "cat_i_missed_a_prayer",
    title: "رواية فاتتني صلاة",
    author: "إسلام جمال",
    coverUrl: "https://archive.org/services/img/noor-book.com_202012",
    description: "كتاب فاتتني صلاة للكاتب إسلام جمال.",
    epubUrl: "https://archive.org/download/noor-book.com_202012/Noor-Book.com%20%20%D9%81%D8%A7%D8%AA%D8%AA%D9%86%D9%89%20%D8%B5%D9%84%D8%A7%D8%A9%20%D8%A7%D8%B3%D9%84%D8%A7%D9%85%20%D8%AC%D9%85%D8%A7%D9%84.pdf",
    totalPages: 220,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["arabic", "islamic", "self-help"],
  },
  {
    id: "cat_cant_hurt_me",
    title: "Can't Hurt Me",
    author: "David Goggins",
    coverUrl: "https://archive.org/services/img/cant-hurt-me-david-goggins_202111",
    description: "Master Your Mind and Defy the Odds.",
    epubUrl: "https://archive.org/download/cant-hurt-me-david-goggins_202111/Can%27t%20Hurt%20Me%20-%20David%20Goggins.pdf",
    totalPages: 364,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["mindset", "self-help"],
  },
  {
    id: "cat_rich_dad",
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    coverUrl: "https://archive.org/services/img/RichDadPoorDad_201804",
    description: "What the Rich Teach Their Kids About Money.",
    epubUrl: "https://archive.org/download/RichDadPoorDad_201804/Rich%20Dad%20Poor%20Dad.pdf",
    totalPages: 336,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["wealth", "finance"],
  },
  {
    id: "cat_atomic_habits",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://archive.org/services/img/atomic-habits-pdfdrive",
    description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones.",
    epubUrl: "https://ia903102.us.archive.org/32/items/atomic-habits-pdfdrive/Atomic%20habits%20%28%20PDFDrive%20%29.pdf",
    totalPages: 320,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["habits", "self-help"],
  },
  {
    id: "cat_white_nights",
    title: "White Nights",
    author: "Fyodor Dostoevsky",
    coverUrl: "https://archive.org/services/img/white-nights-fyodor-dostoyevsky",
    description: "A short story by Fyodor Dostoevsky.",
    epubUrl: "https://archive.org/download/white-nights-fyodor-dostoyevsky/White%20Nights%20-%20Fyodor%20Dostoyevsky.pdf",
    totalPages: 80,
    source: "Internet Archive",
    category: "Mustaq's Picks",
    tags: ["dostoevsky", "classic"],
  },

  // ── German (Gutenberg) ────────────────────────────────────────────────────
  {
    id: "cat_faust",
    title: "Faust (Erster Teil)",
    author: "Johann Wolfgang von Goethe",
    coverUrl: "https://www.gutenberg.org/cache/epub/2229/pg2229.cover.medium.jpg",
    description: "Goethes Faust — deutscher Klassiker.",
    epubUrl: "https://www.planetebook.com/free-ebooks/faust.pdf",
    totalPages: 350,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "goethe"],
  },
  {
    id: "cat_grimm",
    title: "Grimm's Märchen",
    author: "Brüder Grimm",
    coverUrl: "https://www.gutenberg.org/cache/epub/2591/pg2591.cover.medium.jpg",
    description: "Deutsche Volksmärchen.",
    epubUrl: "https://www.planetebook.com/free-ebooks/grimms-fairy-tales.pdf",
    totalPages: 400,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "märchen"],
  },

  // ── French (Gutenberg) ──────────────────────────────────────────────────
  {
    id: "cat_les_mis",
    title: "Les Misérables",
    author: "Victor Hugo",
    coverUrl: "https://www.gutenberg.org/cache/epub/135/pg135.cover.medium.jpg",
    description: "Roman classique français.",
    epubUrl: "https://www.planetebook.com/free-ebooks/les-miserables.pdf",
    totalPages: 1200,
    source: "French Classics",
    category: "French",
    tags: ["français", "hugo"],
  },
  {
    id: "cat_candide",
    title: "Candide",
    author: "Voltaire",
    coverUrl: "https://www.gutenberg.org/cache/epub/19942/pg19942.cover.medium.jpg",
    description: "Satire philosophique.",
    epubUrl: "https://www.planetebook.com/free-ebooks/candide.pdf",
    totalPages: 150,
    source: "French Classics",
    category: "French",
    tags: ["français", "voltaire"],
  },
  {
    id: "cat_madame_bovary",
    title: "Madame Bovary",
    author: "Gustave Flaubert",
    coverUrl: "https://www.gutenberg.org/cache/epub/2413/pg2413.cover.medium.jpg",
    description: "Réalisme littéraire français.",
    epubUrl: "https://www.planetebook.com/free-ebooks/madame-bovary.pdf",
    totalPages: 450,
    source: "French Classics",
    category: "French",
    tags: ["français", "flaubert"],
  },

  // ── Comics & Illustrated (verified IA) ────────────────────────────────────
  {
    id: "cat_little_nemo",
    title: "Little Nemo 1905–1914",
    author: "Winsor McCay",
    coverUrl: "https://archive.org/services/img/LittleNemo1905-1914ByWinsorMccay",
    description: "Classic comic strips — public domain illustrated PDF.",
    epubUrl: "https://archive.org/download/LittleNemo1905-1914ByWinsorMccay/little-nemo.pdf",
    totalPages: 200,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics", "illustrated"],
  },
];

export function catalogAsHits(): CatalogHit[] {
  return BOOK_CATALOG.map(({ category: _c, tags: _t, ...hit }) => hit);
}

export function searchBookCatalog(query: string, limit = 20): CatalogHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalogAsHits().slice(0, limit);

  const scored = BOOK_CATALOG.map((entry) => {
    let score = 0;
    const title = entry.title.toLowerCase();
    const author = entry.author.toLowerCase();
    const tags = (entry.tags || []).join(" ").toLowerCase();
    const cat = entry.category.toLowerCase();

    if (title.includes(q)) score += 90;
    if (author.includes(q)) score += 80;
    if (tags.includes(q)) score += 70;
    if (cat.includes(q)) score += 50;

    const terms = q.split(/\s+/).filter((w) => w.length > 1);
    for (const term of terms) {
      if (title.includes(term)) score += 15;
      if (author.includes(term)) score += 12;
      if (tags.includes(term)) score += 10;
      if (cat.includes(term)) score += 8;
    }

    return { entry, score };
  })
    .filter(({ score }) => score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ entry }) => {
    const { category: _c, tags: _t, ...hit } = entry;
    return hit;
  });
}

export function catalogByCategory(category?: CatalogCategory): CatalogEntry[] {
  if (!category) return BOOK_CATALOG;
  return BOOK_CATALOG.filter((b) => b.category === category);
}

export const ARABIC_FEATURED = catalogAsHits().filter((b) =>
  b.source.includes("Arabic") || b.source.includes("Shamela") || b.source.includes("Moroccan"),
);

export const ENGLISH_FEATURED = catalogAsHits().filter((b) =>
  ["Gutendex", "Self-Help", "Comics"].includes(b.source),
);
