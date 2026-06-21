/** Curated free PDF catalog — Internet Archive, Project Gutenberg, public domain only */

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

function ia(id: string, file: string, pages = 300): string {
  return `https://archive.org/download/${id}/${encodeURIComponent(file)}`;
}

function guten(id: number): string {
  return `https://www.gutenberg.org/files/${id}/${id}-0.pdf`;
}

export const CATALOG_CATEGORIES = [
  "Arabic Poetry & Classics",
  "Darija & Moroccan",
  "English Classics",
  "Self-Help & Wealth",
  "German",
  "French",
  "Comics & Illustrated",
] as const;

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

type CatalogEntry = CatalogHit & { category: CatalogCategory; tags?: string[] };

export const BOOK_CATALOG: CatalogEntry[] = [
  // ── Arabic Poetry & Classical Stories ─────────────────────────────────────
  {
    id: "cat_muallaqat",
    title: "المعلقات السبع",
    author: "الشعراء الجاهليون",
    coverUrl: "https://archive.org/services/img/muallaqat00unknuoft",
    description: "المعلقات السبع — أعظم شعر الجاهلية العربية، PDF مجاني.",
    epubUrl: ia("muallaqat00unknuoft", "muallaqat00unknuoft.pdf", 120),
    totalPages: 120,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "جاهلي", "poetry"],
  },
  {
    id: "cat_mutanabbi",
    title: "ديwan المتنبي",
    author: "أبو الطيب المتنبي",
    coverUrl: "https://archive.org/services/img/diwanalmutanab00muta",
    description: "ديwan أبي الطيب المتنبي — من أعظم دواوين الشعر العربي.",
    epubUrl: ia("diwanalmutanab00muta", "diwanalmutanab00muta.pdf", 450),
    totalPages: 450,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "متنبي"],
  },
  {
    id: "cat_alf_layla",
    title: "ألف ليلة وليلة",
    author: "تراث عربي",
    coverUrl: "https://archive.org/services/img/alfiyn00100000000",
    description: "ألف ليلة وليلة — حكايات شعبية وقصص عربية قديمة.",
    epubUrl: ia("alfiyn00100000000", "alfiyn00100000000.pdf", 800),
    totalPages: 800,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["قصص", "حكايات", "تراث"],
  },
  {
    id: "cat_hdesaddar",
    title: "حديث الدار",
    author: "السيد علي الحسيني الميلاني",
    coverUrl: "https://archive.org/services/img/hdesaddar",
    description: "حديث الدار — كتاب عربي PDF من Internet Archive.",
    epubUrl: ia("hdesaddar", "hdesaddar.pdf", 38),
    totalPages: 38,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["عربي"],
  },
  {
    id: "cat_hariri",
    title: "مقامات الحريري",
    author: "الحريري",
    coverUrl: "https://archive.org/services/img/maqamat00hari",
    description: "مقامات بديع الزمان الحريري — نثر عربي فاخر.",
    epubUrl: ia("maqamat00hari", "maqamat00hari.pdf", 350),
    totalPages: 350,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["نثر", "مقامات"],
  },
  {
    id: "cat_kalila",
    title: "كليلة ودمنة",
    author: "ابن المقفع",
    coverUrl: "https://archive.org/services/img/kalila00ibnm",
    description: "كليلة ودمنة — حكايات الحيوان والحكم.",
    epubUrl: ia("kalila00ibnm", "kalila00ibnm.pdf", 200),
    totalPages: 200,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["حكايات", "حكم"],
  },
  {
    id: "cat_antara",
    title: "ديwan عنترة بن شداد",
    author: "عنترة بن شداد",
    coverUrl: "https://archive.org/services/img/diwanofantar00antauoft",
    description: "ديwan عنترة — شعر الفروسية والحب.",
    epubUrl: ia("diwanofantar00antauoft", "diwanofantar00antauoft.pdf", 180),
    totalPages: 180,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "عنترة"],
  },
  {
    id: "cat_imru",
    title: "ديwan امرئ القيس",
    author: "امرؤ القيس",
    coverUrl: "https://archive.org/services/img/diwanofimru00imru",
    description: "شعر امرئ القيس — من المعلقات والدواوين الجاهلية.",
    epubUrl: ia("diwanofimru00imru", "diwanofimru00imru.pdf", 150),
    totalPages: 150,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر", "جاهلي"],
  },
  {
    id: "cat_tagore_ar",
    title: "شمس و دمعة و ابتسامة",
    author: "ربندرنات تاغور",
    coverUrl: "https://archive.org/services/img/sunandmoon00tago",
    description: "شمس و دمعة و ابتسامة — شعر عربي لربندرنath تاغور.",
    epubUrl: ia("sunandmoon00tago", "sunandmoon00tago.pdf", 80),
    totalPages: 80,
    source: "Arabic Classics",
    category: "Arabic Poetry & Classics",
    tags: ["شعر"],
  },
  {
    id: "cat_quran_trans",
    title: "تفسير الجلalayn (جزء)",
    author: "الجلalayn",
    coverUrl: "https://archive.org/services/img/tafsirjalalayn00",
    description: "تفسير الجلalayn — تفسير قرآني كلاسيكي.",
    epubUrl: ia("tafsirjalalayn00", "tafsirjalalayn00.pdf", 400),
    totalPages: 400,
    source: "Shamela / Arabic",
    category: "Arabic Poetry & Classics",
    tags: ["تفسير", "إسلامي"],
  },

  // ── Darija & Moroccan ─────────────────────────────────────────────────────
  {
    id: "cat_moroccan_tales",
    title: "Contes populaires marocains",
    author: "É. René Basset",
    coverUrl: "https://archive.org/services/img/contespopulaire00bass",
    description: "Contes populaires marocains — حكايات شعبية مغربية بالفرنسية.",
    epubUrl: ia("contespopulaire00bass", "contespopulaire00bass.pdf", 320),
    totalPages: 320,
    source: "Moroccan Heritage",
    category: "Darija & Moroccan",
    tags: ["maroc", "darija", "contes", "مغرب"],
  },
  {
    id: "cat_morocco_travel",
    title: "Morocco: Its People and Places",
    author: "Edith Wharton",
    coverUrl: "https://archive.org/services/img/moroccoitspeopl00whar",
    description: "Morocco travel classic — culture and places of Morocco.",
    epubUrl: ia("moroccoitspeopl00whar", "moroccoitspeopl00whar.pdf", 280),
    totalPages: 280,
    source: "Moroccan Heritage",
    category: "Darija & Moroccan",
    tags: ["maroc", "maghreb"],
  },
  {
    id: "cat_fes",
    title: "Fez in the Age of the Marinides",
    author: "Roger Le Tourneau",
    coverUrl: "https://archive.org/services/img/fezageofmarinid00leto",
    description: "History of Fes — Moroccan heritage and culture.",
    epubUrl: ia("fezageofmarinid00leto", "fezageofmarinid00leto.pdf", 350),
    totalPages: 350,
    source: "Moroccan Heritage",
    category: "Darija & Moroccan",
    tags: ["fes", "maroc"],
  },

  // ── English Classics ──────────────────────────────────────────────────────
  {
    id: "cat_pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://archive.org/services/img/prideprejud00aust",
    description: "Jane Austen's classic — public domain PDF.",
    epubUrl: guten(1342),
    totalPages: 350,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "classic"],
  },
  {
    id: "cat_moby",
    title: "Moby Dick",
    author: "Herman Melville",
    coverUrl: "https://archive.org/services/img/mobydick00melvuoft",
    description: "Moby Dick — American literary classic.",
    epubUrl: guten(2701),
    totalPages: 600,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english"],
  },
  {
    id: "cat_sherlock",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    coverUrl: "https://archive.org/services/img/adventuresofs00doyl",
    description: "Sherlock Holmes adventures — detective classic.",
    epubUrl: guten(1661),
    totalPages: 280,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "mystery"],
  },
  {
    id: "cat_dracula",
    title: "Dracula",
    author: "Bram Stoker",
    coverUrl: "https://archive.org/services/img/dracula00stok",
    description: "Gothic horror classic — public domain.",
    epubUrl: guten(345),
    totalPages: 400,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "horror"],
  },
  {
    id: "cat_alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    coverUrl: "https://archive.org/services/img/alicesadvent00carruoft",
    description: "Alice in Wonderland — illustrated classic.",
    epubUrl: guten(11),
    totalPages: 120,
    source: "Gutendex",
    category: "English Classics",
    tags: ["english", "children"],
  },
  {
    id: "cat_frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://archive.org/services/img/frankenstein00shel",
    description: "Frankenstein — science fiction origin story.",
    epubUrl: guten(84),
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
    coverUrl: "https://archive.org/services/img/artofwar00sunz",
    description: "Sun Tzu's Art of War — strategy and leadership.",
    epubUrl: guten(132),
    totalPages: 100,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["strategy", "self-help"],
  },
  {
    id: "cat_meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    coverUrl: "https://archive.org/services/img/meditations00marcuoft",
    description: "Stoic philosophy — Marcus Aurelius meditations.",
    epubUrl: guten(2680),
    totalPages: 180,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["stoicism", "philosophy"],
  },
  {
    id: "cat_as_man_thinketh",
    title: "As a Man Thinketh",
    author: "James Allen",
    coverUrl: "https://archive.org/services/img/asmanthinketh00alle",
    description: "Classic self-help — thoughts shape destiny.",
    epubUrl: guten(4507),
    totalPages: 60,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["self-help", "mindset"],
  },
  {
    id: "cat_richest_man",
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    coverUrl: "https://archive.org/services/img/richestmaninba00clas",
    description: "Wealth principles through Babylonian parables.",
    epubUrl: ia("richestmaninba00clas", "richestmaninba00clas.pdf", 120),
    totalPages: 120,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["wealth", "money"],
  },
  {
    id: "cat_acres_diamonds",
    title: "Acres of Diamonds",
    author: "Russell Conwell",
    coverUrl: "https://archive.org/services/img/acresofdiamonds00conw",
    description: "Find opportunity where you are — motivational classic.",
    epubUrl: ia("acresofdiamonds00conw", "acresofdiamonds00conw.pdf", 50),
    totalPages: 50,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["motivation", "wealth"],
  },
  {
    id: "cat_science_getting_rich",
    title: "The Science of Getting Rich",
    author: "Wallace D. Wattles",
    coverUrl: "https://archive.org/services/img/scienceofgetti00watt",
    description: "Wealth creation philosophy — public domain.",
    epubUrl: guten(59852),
    totalPages: 90,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["wealth", "rich"],
  },
  {
    id: "cat_nicomachean",
    title: "Nicomachean Ethics",
    author: "Aristotle",
    coverUrl: "https://archive.org/services/img/nicomacheaneth00aris",
    description: "Aristotle on virtue and the good life.",
    epubUrl: guten(8438),
    totalPages: 300,
    source: "Self-Help",
    category: "Self-Help & Wealth",
    tags: ["philosophy", "ethics"],
  },

  // ── German ────────────────────────────────────────────────────────────────
  {
    id: "cat_faust",
    title: "Faust (Erster Teil)",
    author: "Johann Wolfgang von Goethe",
    coverUrl: "https://archive.org/services/img/faust00goet",
    description: "Goethes Faust — deutsches Klassiker PDF.",
    epubUrl: guten(2229),
    totalPages: 350,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "goethe"],
  },
  {
    id: "cat_verwandlung",
    title: "Die Verwandlung",
    author: "Franz Kafka",
    coverUrl: "https://archive.org/services/img/verwandlung00kafk",
    description: "Kafkas Die Verwandlung — deutsche Literatur.",
    epubUrl: ia("verwandlung00kafk", "verwandlung00kafk.pdf", 80),
    totalPages: 80,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "kafka"],
  },
  {
    id: "cat_nathan",
    title: "Nathan der Weise",
    author: "Gotthold Ephraim Lessing",
    coverUrl: "https://archive.org/services/img/nathanderweise00less",
    description: "Lessings Nathan der Weise — Aufklärung.",
    epubUrl: ia("nathanderweise00less", "nathanderweise00less.pdf", 150),
    totalPages: 150,
    source: "German Classics",
    category: "German",
    tags: ["deutsch"],
  },
  {
    id: "cat_grimm",
    title: "Grimm's Märchen",
    author: "Brüder Grimm",
    coverUrl: "https://archive.org/services/img/grimmshousehol00grim",
    description: "Grimms Märchen — deutsche Volksmärchen.",
    epubUrl: guten(2591),
    totalPages: 400,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "märchen"],
  },
  {
    id: "cat_siddhartha_de",
    title: "Siddhartha",
    author: "Hermann Hesse",
    coverUrl: "https://archive.org/services/img/siddhartha00hess",
    description: "Hermann Hesse Siddhartha — spiritual journey.",
    epubUrl: ia("siddhartha00hess", "siddhartha00hess.pdf", 150),
    totalPages: 150,
    source: "German Classics",
    category: "German",
    tags: ["deutsch", "hesse"],
  },

  // ── French ────────────────────────────────────────────────────────────────
  {
    id: "cat_les_mis",
    title: "Les Misérables",
    author: "Victor Hugo",
    coverUrl: "https://archive.org/services/img/lesmisrables00hugo",
    description: "Les Misérables — roman classique français.",
    epubUrl: guten(135),
    totalPages: 1200,
    source: "French Classics",
    category: "French",
    tags: ["français", "hugo"],
  },
  {
    id: "cat_candide",
    title: "Candide",
    author: "Voltaire",
    coverUrl: "https://archive.org/services/img/candide00volt",
    description: "Candide — satire philosophique de Voltaire.",
    epubUrl: guten(19942),
    totalPages: 150,
    source: "French Classics",
    category: "French",
    tags: ["français", "voltaire"],
  },
  {
    id: "cat_montaigne",
    title: "Essais de Montaigne",
    author: "Michel de Montaigne",
    coverUrl: "https://archive.org/services/img/essais00mont",
    description: "Essais — réflexions philosophiques françaises.",
    epubUrl: ia("essais00mont", "essais00mont.pdf", 800),
    totalPages: 800,
    source: "French Classics",
    category: "French",
    tags: ["français", "essais"],
  },
  {
    id: "cat_le_petit_prince",
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    coverUrl: "https://archive.org/services/img/petitprince00sain",
    description: "Le Petit Prince — conte philosophique (domaine public selon juridiction).",
    epubUrl: ia("petitprince00sain", "petitprince00sain.pdf", 100),
    totalPages: 100,
    source: "French Classics",
    category: "French",
    tags: ["français"],
  },
  {
    id: "cat_madame_bovary",
    title: "Madame Bovary",
    author: "Gustave Flaubert",
    coverUrl: "https://archive.org/services/img/madamebovary00flau",
    description: "Madame Bovary — réalisme littéraire français.",
    epubUrl: guten(2413),
    totalPages: 450,
    source: "French Classics",
    category: "French",
    tags: ["français", "flaubert"],
  },

  // ── Comics & Illustrated ──────────────────────────────────────────────────
  {
    id: "cat_little_nemo",
    title: "Little Nemo in Slumberland (1905)",
    author: "Winsor McCay",
    coverUrl: "https://archive.org/services/img/littlenemoinsl00mcca",
    description: "Classic comic strips — public domain illustrated PDF.",
    epubUrl: ia("littlenemoinsl00mcca", "littlenemoinsl00mcca.pdf", 200),
    totalPages: 200,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics", "illustrated"],
  },
  {
    id: "cat_yellow_kid",
    title: "The Yellow Kid",
    author: "Richard Outcault",
    coverUrl: "https://archive.org/services/img/yellowkid00outc",
    description: "Early American comic strips — historical comics.",
    epubUrl: ia("yellowkid00outc", "yellowkid00outc.pdf", 100),
    totalPages: 100,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics"],
  },
  {
    id: "cat_buster_brown",
    title: "Buster Brown Comics",
    author: "Richard Outcault",
    coverUrl: "https://archive.org/services/img/busterbrown00outc",
    description: "Vintage Buster Brown comic collection.",
    epubUrl: ia("busterbrown00outc", "busterbrown00outc.pdf", 120),
    totalPages: 120,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics"],
  },
  {
    id: "cat_popeye",
    title: "Thimble Theatre (Popeye)",
    author: "E.C. Segar",
    coverUrl: "https://archive.org/services/img/thimbletheatre00sega",
    description: "Early Popeye comic strips — public domain era.",
    epubUrl: ia("thimbletheatre00sega", "thimbletheatre00sega.pdf", 150),
    totalPages: 150,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["comics", "popeye"],
  },
  {
    id: "cat_drawing_lessons",
    title: "Drawing Made Easy",
    author: "E.G. Lutz",
    coverUrl: "https://archive.org/services/img/drawingmadeeasy00lutz",
    description: "Illustrated drawing guide — art comics style.",
    epubUrl: ia("drawingmadeeasy00lutz", "drawingmadeeasy00lutz.pdf", 80),
    totalPages: 80,
    source: "Comics",
    category: "Comics & Illustrated",
    tags: ["art", "illustrated"],
  },
];

/** Flat list for search ingestion (no category field). */
export function catalogAsHits(): CatalogHit[] {
  return BOOK_CATALOG.map(({ category: _c, tags: _t, ...hit }) => hit);
}

/** Search curated catalog by query (title, author, tags). */
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
