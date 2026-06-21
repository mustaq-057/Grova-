import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Book, Plus, BookOpen, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Loader2, BookMarked, ExternalLink, Filter, X, MessageSquare, Send, Settings, Maximize, Download, Sparkles, Calendar, Flame, TrendingUp, Lightbulb, User, Medal, ArrowUpRight, BarChart3, Bookmark } from "lucide-react";
import { useLocation } from "wouter";
import { apiFetch, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { InAppBrowser } from "@/components/InAppBrowser";
import ePub from "epubjs";
import { motion, AnimatePresence } from "framer-motion";

type ApiBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  addedBy: string;
  addedAt: string;
  status: "reading" | "finished" | "wishlist" | "paused" | "gave_up";
  currentPage: number;
  totalPages: number;
  epubUrl?: string | null;
  source?: string;
  isLink?: boolean;
  isFavorite?: boolean;
};

type SearchResult = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string;
  totalPages: number;
  source: string;
  epubUrl?: string;
  isLink?: boolean;
};

type LibraryNote = {
  id: string;
  bookId: string;
  bookTitle?: string;
  chapterOrPage: string | null;
  text: string;
  authorId: string;
  timestamp: string;
};

type SearchMeta = {
  cached: boolean;
  total: number;
  sources: Record<string, "ok" | "timeout" | "skipped" | "empty">;
};

/** Generate a vibrant gradient from a string (for books without covers) */
function titleToGradient(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0xffffffff;
  const hue1 = Math.abs(h % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1},60%,25%), hsl(${hue2},70%,18%))`;
}

const SOURCE_COLORS: Record<string, string> = {
  "Open Library": "#4CAF50",
  "Gutendex": "#2196F3",
  "Internet Archive": "#FF9800",
  "Shamela": "#009688",
  "Wikisource (EN)": "#9E9E9E",
  "Wikisource (AR)": "#607D8B",
  "HathiTrust": "#E91E63"
};

const RANDOM_CATALOG = [
  { id: "c1", title: "كليلة ودمنة", author: "ابن المقفع", source: "Shamela", totalPages: 300, epubUrl: "https://shamela.ws/book/23846", description: "أشهر حكايات الحيوان الرمزية في التراث العربي.", coverUrl: null, isLink: true },
  { id: "c2", title: "Pride and Prejudice", author: "Jane Austen", source: "Gutendex", totalPages: 350, epubUrl: "https://www.gutenberg.org/ebooks/1342.epub3.images", description: "A classic romance novel.", coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg" },
  { id: "c3", title: "Les Misérables", author: "Victor Hugo", source: "Gutendex", totalPages: 1400, epubUrl: "https://www.gutenberg.org/ebooks/135.epub3.images", description: "A French historical novel.", coverUrl: "https://www.gutenberg.org/cache/epub/135/pg135.cover.medium.jpg" },
  { id: "c4", title: "Don Quijote", author: "Miguel de Cervantes", source: "Gutendex", totalPages: 1000, epubUrl: "https://www.gutenberg.org/ebooks/2000.epub3.images", description: "The classic Spanish novel.", coverUrl: "https://www.gutenberg.org/cache/epub/2000/pg2000.cover.medium.jpg" }
];

function BookCover({
  coverUrl,
  title,
  size = "md",
}: {
  coverUrl: string | null;
  title: string;
  size?: "sm" | "md";
}) {
  const [err, setErr] = useState(false);
  if (coverUrl && !err) {
    return (
      <img
        src={coverUrl}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        alt={title}
        onError={() => setErr(true)}
      />
    );
  }
  // Generative gradient cover from book title hash
  const gradient = titleToGradient(title);
  const initial = (title.match(/[\u0600-\u06FF]/) ? title : title).charAt(0).toUpperCase();
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center p-3 overflow-hidden transition-transform duration-700 group-hover:scale-105"
      style={{ background: gradient }}
    >
      {/* Book spine simulation */}
      <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-black/20 border-r border-white/10 z-0" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 z-0 mix-blend-overlay" />
      
      <span className={`${size === "sm" ? "text-3xl" : "text-5xl"} font-bold text-white/90 mb-2 font-serif z-10 drop-shadow-md`}>
        {initial}
      </span>
      <p className="text-[10px] text-white/80 text-center line-clamp-3 leading-tight px-2 z-10 font-medium tracking-wide drop-shadow-md">{title}</p>
    </div>
  );
}

export default function Library() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inAppBrowserUrl, setInAppBrowserUrl] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ bookId: string; x: number; y: number } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeNotesBook, setActiveNotesBook] = useState<ApiBook | null>(null);
  const [selectedPreviewBook, setSelectedPreviewBook] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<"myShelf" | "partnerShelf" | "finished" | "favorites" | "paused" | "gaveUp">("myShelf");
  const [libraryTab, setLibraryTab] = useState<"dashboard" | "memorize" | "achievements">("dashboard");
  const [allNotes, setAllNotes] = useState<LibraryNote[]>([]);
  const [stats, setStats] = useState<{
    streakDays: number;
    dailyMinutes: number;
    annualMinutes: number;
    weeklyData: { date: string; minutes: number }[];
    monthlyData: { month: string; minutes: number }[];
  }>({
    streakDays: 0,
    dailyMinutes: 0,
    annualMinutes: 0,
    weeklyData: [],
    monthlyData: []
  });
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [libLang, setLibLang] = useState<"en" | "ar">(() => (localStorage.getItem("grova-library-language") as "en" | "ar") || "en");
  const [libTheme, setLibTheme] = useState<"dark" | "light" | "sepia">(() => (localStorage.getItem("grova-library-theme") as "dark" | "light" | "sepia") || "dark");
  const [libraryMode, setLibraryMode] = useState(() => localStorage.getItem("libraryMode") === "true");

  const toggleLibraryMode = () => {
    const next = !libraryMode;
    setLibraryMode(next);
    localStorage.setItem("libraryMode", String(next));
    window.dispatchEvent(new Event("LIBRARY_MODE_CHANGED"));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Translations
  const t = {
    library: libLang === "ar" ? "المكتبة" : "Library",
    searchPlaceholder: libLang === "ar" ? "ابحث في أكثر من 20 مليون كتاب..." : "Search 20M+ books (Arabic, English, French…)",
    currentlyReading: libLang === "ar" ? "تقرأ حالياً" : "Currently Reading",
    myShelf: libLang === "ar" ? "رفي" : "My Shelf",
    partnerShelf: libLang === "ar" ? "رف الشريك" : "Partner's Shelf",
    catalog: libLang === "ar" ? "كتالوج الكتب" : "Book Catalog",
    finished: libLang === "ar" ? "تم الانتهاء" : "Finished",
    emptyShelf: libLang === "ar" ? "الرف فارغ." : "Shelf is empty.",
    loading: libLang === "ar" ? "جاري تحميل المكتبة..." : "Loading Library..."
  };

  useEffect(() => {
    localStorage.setItem("grova-library-language", libLang);
  }, [libLang]);

  useEffect(() => {
    localStorage.setItem("grova-library-theme", libTheme);
  }, [libTheme]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const loadBooks = useCallback(async () => {
    try {
      const data = await apiFetch<ApiBook[]>("/library");
      setBooks(data);
    } catch (err) {
      console.error("Failed to load library:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const data = await apiFetch<LibraryNote[]>("/library/notes");
      setAllNotes(data);
    } catch (err) {
      console.error("Failed to load notes:", err);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<any>("/library/stats");
      setStats({
        streakDays: data.streakDays || 0,
        dailyMinutes: data.dailyMinutes || 0,
        annualMinutes: data.annualMinutes || 0,
        weeklyData: data.weeklyData || [],
        monthlyData: data.monthlyData || []
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    loadBooks();
    loadNotes();
    loadStats();
    
    const handleNotesUpdate = () => loadNotes();
    window.addEventListener("LIBRARY_NOTES_UPDATED", handleNotesUpdate);
    return () => window.removeEventListener("LIBRARY_NOTES_UPDATED", handleNotesUpdate);
  }, [loadBooks, loadNotes, loadStats]);

  useEffect(() => {
    if (!user) return;
    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      api.heartbeat(user.id, { inLibrary: true }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      api.heartbeat(user.id, { inLibrary: false }).catch(() => {}); // clear when leaving
    };
  }, [user]);

  // Debounced auto-search — fires 600ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setSearchMeta(null); setActiveSource(null); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchResults([]);
      setActiveSource(null);
      try {
        const res = await apiFetch<{ results: SearchResult[]; meta?: SearchMeta }>(
          `/library/search?q=${encodeURIComponent(q)}`
        );
        setSearchResults(res.results || []);
        setSearchMeta(res.meta || null);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Keep form submit working too (instant search on Enter)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchResults([]);
    setActiveSource(null);
    try {
      const res = await apiFetch<{ results: SearchResult[]; meta?: SearchMeta }>(
        `/library/search?q=${encodeURIComponent(q)}`
      );
      setSearchResults(res.results || []);
      setSearchMeta(res.meta || null);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSearching(true); // use as loading state
    try {
      const buffer = await file.arrayBuffer();
      const book = ePub(buffer);
      await book.ready;
      const metadata = await book.loaded.metadata;
      
      let coverUrl = null;
      try {
        const coverUrlRaw = await book.coverUrl();
        if (coverUrlRaw) {
          // It's a blob url, we won't upload the cover right now since we need to extract it as a file.
          // Using generative gradient instead for simplicity.
        }
      } catch (err) {}

      // Upload binary to cloudinary
      const res = await apiFetch<{ url: string }>("/media/upload", {
        method: "POST",
        headers: { "Content-Type": file.type || "application/epub+zip" },
        body: buffer,
      });

      // Add to Library
      await apiFetch("/library", {
        method: "POST",
        body: JSON.stringify({
          title: metadata?.title || file.name.replace(".epub", ""),
          author: metadata?.creator || "Unknown Author",
          coverUrl: null,
          description: metadata?.description || "Uploaded manually.",
          epubUrl: res.url,
          totalPages: 100,
          source: "Uploaded",
        }),
      });

      await loadBooks();
    } catch (err) {
      console.error("Failed to upload EPUB:", err);
      alert("Failed to upload EPUB.");
    } finally {
      setIsSearching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addToLibrary = async (book: SearchResult) => {
    if (addingId === book.id || addedIds.has(book.id)) return;
    setAddingId(book.id);
    try {
      await apiFetch("/library", {
        method: "POST",
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          description: book.description,
          totalPages: book.totalPages,
          epubUrl: book.epubUrl,
          source: book.source,
        }),
      });
      setAddedIds((prev) => new Set([...prev, book.id]));
      await loadBooks();
      // DO NOT immediately open book. User wants to see the "Read Now" and "Download Cover" buttons instead.
    } catch (err) {
      console.error("Failed to add book:", err);
    } finally {
      setAddingId(null);
    }
  };

  const deleteBook = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/library/${id}`, { method: "DELETE" });
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete book:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const openBook = (book: ApiBook) => {
    // Shamela and HathiTrust are web pages, not direct epub files
    if (book.isLink || book.source === "Shamela" || book.source === "HathiTrust") {
      if (book.epubUrl) {
        setInAppBrowserUrl(book.epubUrl);
        return;
      }
    }
    // For standard EPUBs (or books without URLs that will use the fallback/error state), use our native EReader
    setLocation(`/read/${book.id}`);
  };

  const changeStatus = async (bookId: string, options: { status?: ApiBook["status"], favorite?: boolean }) => {
    setUpdatingStatus(bookId);
    setStatusMenu(null);
    try {
      await apiFetch(`/library/${bookId}/status`, {
        method: "PATCH",
        body: JSON.stringify(options),
      });
      setBooks((prev) => prev.map((b) => {
        if (b.id === bookId) {
          return {
            ...b,
            ...(options.status ? { status: options.status } : {}),
            ...(options.favorite !== undefined ? { isFavorite: options.favorite } : {})
          };
        }
        return b;
      }));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Dismiss status menu on outside click
  useEffect(() => {
    if (!statusMenu) return;
    const dismiss = () => setStatusMenu(null);
    window.addEventListener("click", dismiss);
    return () => window.removeEventListener("click", dismiss);
  }, [statusMenu]);

  // Filtered results based on active source chip
  const displayedResults = activeSource
    ? searchResults.filter((r) => r.source === activeSource)
    : searchResults;

  // Unique sources present in results
  const resultSources = [...new Set(searchResults.map((r) => r.source))];

  // Netflix-style shelves
  const { partner: authPartner } = useAuth();
  const myId = user?.id || "me";
  const partnerId = authPartner?.id || (myId === "me" ? "wife" : "me");
  const partnerDisplayName = authPartner?.name || (partnerId === "wife" ? "Sara" : "Mustaq");
  const currentlyReading = books.filter((b) => b.status === "reading");
  const myShelf = books.filter((b) => b.addedBy === myId);
  const partnerShelf = books.filter((b) => b.addedBy === partnerId);
  const finishedBooks = books.filter((b) => b.status === "finished");
  const hero = currentlyReading[0] || myShelf[0];

  // Stats
  const totalPagesRead = books.filter((b) => b.addedBy === myId).reduce((acc, b) => acc + (b.currentPage || 0), 0);
  const estimatedHours = Math.round((totalPagesRead * 1.5) / 60); // approx 1.5 min per page

  return (
    <>
      <style>{`
        .lib-theme-dark {
          --lib-bg: #000000;
          --lib-text: #ffffff;
          --lib-header: rgba(0,0,0,0.9);
          --lib-card: rgba(255,255,255,0.05);
          --lib-border: rgba(255,255,255,0.1);
          --lib-input: rgba(255,255,255,0.1);
          --lib-muted: #9ca3af;
          --lib-btn-hover: rgba(255,255,255,0.1);
        }
        .lib-theme-light {
          --lib-bg: #f9fafb;
          --lib-text: #111827;
          --lib-header: rgba(249,250,251,0.9);
          --lib-card: #ffffff;
          --lib-border: rgba(0,0,0,0.1);
          --lib-input: #ffffff;
          --lib-muted: #6b7280;
          --lib-btn-hover: rgba(0,0,0,0.05);
        }
        .lib-theme-sepia {
          --lib-bg: #f4ecd8;
          --lib-text: #5b4636;
          --lib-header: rgba(244,236,216,0.9);
          --lib-card: #eaddc5;
          --lib-border: rgba(91,70,54,0.15);
          --lib-input: #eaddc5;
          --lib-muted: #8b7355;
          --lib-btn-hover: rgba(91,70,54,0.1);
        }
      `}</style>
      <div className={`min-h-full pb-24 lib-theme-${libTheme} bg-[var(--lib-bg)] text-[var(--lib-text)] transition-colors duration-300`}>
        {/* ── Sticky Search Header ── */}
        <div className="sticky top-0 z-20 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-4 border-b border-[var(--lib-border)] bg-[var(--lib-header)] transition-colors duration-300">
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={() => setLocation("/")}
              className="p-1 -ml-1 rounded-full active:scale-90 transition-all hover:bg-[var(--lib-btn-hover)] text-[var(--lib-text)]"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h1 className="text-3xl font-bold font-serif italic text-primary leading-none flex-1">{t.library}</h1>
            <input 
              type="file" 
              accept=".epub" 
              ref={fileInputRef} 
              onChange={handleEpubUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full active:scale-90 transition-all bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Upload
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full active:scale-90 transition-all hover:bg-[var(--lib-btn-hover)] text-[var(--lib-text)]"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--lib-muted)]" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--lib-input)] border border-[var(--lib-border)] rounded-2xl py-3 pl-10 pr-12 text-[var(--lib-text)] placeholder-[var(--lib-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-colors duration-300"
            dir="auto"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--lib-muted)] hover:text-[var(--lib-text)] text-lg leading-none"
            >
              ×
            </button>
          )}
        </form>
        {/* Source Chips — active filters on search results */}
        {searchQuery && resultSources.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveSource(null)}
              className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                !activeSource
                  ? "bg-white text-black border-white"
                  : "bg-white/10 text-gray-400 border-white/20"
              }`}
            >
              All ({searchResults.length})
            </button>
            {resultSources.map((src) => {
              const color = SOURCE_COLORS[src] || "#607D8B";
              const isActive = activeSource === src;
              const count = searchResults.filter((r) => r.source === src).length;
              return (
                <button
                  key={src}
                  onClick={() => setActiveSource(isActive ? null : src)}
                  className="shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all"
                  style={{
                    backgroundColor: isActive ? color : `${color}22`,
                    color: isActive ? "white" : color,
                    borderColor: isActive ? color : `${color}44`,
                  }}
                >
                  {src} ({count})
                </button>
              );
            })}
            {searchMeta?.cached && (
              <span className="shrink-0 text-[9px] text-gray-600 flex items-center gap-1 px-1">
                ⚡ cached
              </span>
            )}
          </div>
        )}
        {/* Decorative chips when not searching - REMOVED per user request */}
      </div>

      {/* ── Search Results ── */}
      {searchQuery && (
        <div className="px-4 py-4 space-y-8">
          {/* Local Matches */}
          {(() => {
            const localMatches = books.filter(b => 
              b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              b.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (localMatches.length === 0) return null;
            return (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center text-primary">
                  <BookMarked className="w-5 h-5 mr-2" /> In Your Library
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {localMatches.map((result) => (
                    <div key={result.id} className="bg-[var(--lib-card)] rounded-2xl overflow-hidden border border-[var(--lib-border)] flex flex-col group cursor-pointer transition-colors duration-300" onClick={() => openBook(result)}>
                      <div className="aspect-[2/3] w-full bg-gray-900 relative overflow-hidden">
                        <BookCover coverUrl={result.coverUrl} title={result.title} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBook(result.id); }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex z-20 hover:bg-red-500/80"
                          title="Remove from Shelf"
                        >
                          {deletingId === result.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 flex flex-col gap-0.5">
                        <p className="font-bold text-xs line-clamp-1 leading-tight">{result.title}</p>
                        <p className="text-[11px] text-[var(--lib-muted)] line-clamp-1">{result.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Global Matches */}
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Search className="w-5 h-5 mr-2 text-muted-foreground" /> Global Catalog
            </h3>
            {isSearching ? (
              <div className="flex flex-col items-center py-12 gap-3 text-[var(--lib-muted)]">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm font-semibold">{t.loading}</p>
              </div>
          ) : displayedResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {displayedResults.map((result) => {
                const alreadyAdded = addedIds.has(result.id);
                const isAdding = addingId === result.id;
                return (
                  <div key={result.id} className="bg-[var(--lib-card)] rounded-2xl overflow-hidden border border-[var(--lib-border)] flex flex-col group cursor-pointer transition-colors duration-300" onClick={() => setSelectedPreviewBook(result)}>
                    <div className="aspect-[2/3] w-full bg-gray-900 relative overflow-hidden">
                      <BookCover coverUrl={result.coverUrl} title={result.title} />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 backdrop-blur-sm">
                        {result.isLink ? (
                          <a
                            href={result.epubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/20 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center gap-1 border border-white/30 hover:bg-white/30 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Open HathiTrust
                          </a>
                        ) : alreadyAdded ? (
                          <div className="flex flex-col gap-2 w-full px-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openBook(result as unknown as ApiBook); }}
                              className="bg-white text-black font-bold text-xs py-2 w-full rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <BookOpen className="w-3 h-3" /> Read Now
                            </button>
                            {result.coverUrl && (
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(result.coverUrl as string, "_blank"); }}
                                className="bg-white/20 text-white font-bold text-xs py-2 w-full rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-white/30 hover:bg-white/30"
                              >
                                <Download className="w-3 h-3" /> Cover
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); addToLibrary(result); }}
                            disabled={isAdding}
                            className="bg-primary text-primary-foreground font-bold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 disabled:opacity-70 transition-all active:scale-95 shadow-lg shadow-primary/20 hover:bg-primary/90"
                          >
                            {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Add to Shelf
                          </button>
                        )}
                        <p className="text-xs text-white text-center line-clamp-2 leading-tight">{result.description}</p>
                      </div>
                    </div>
                    <div className="p-2.5 flex flex-col gap-0.5">
                      <p className="font-bold text-xs line-clamp-1 leading-tight">{result.title}</p>
                      <p className="text-[11px] text-[var(--lib-muted)] line-clamp-1">{result.author}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="text-center py-10 text-[var(--lib-muted)]">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {activeSource} results.</p>
              <button onClick={() => setActiveSource(null)} className="text-xs text-primary mt-2">Show all results</button>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--lib-muted)]">
              <Book className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No results found across all sources.</p>
              <p className="text-xs mt-1 opacity-70">Try a different term or check your spelling.</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Main Dashboard ── */}
      {!searchQuery && libraryTab === "dashboard" && (
        <>
          {/* Random Catalog Discovery */}
          <div className="px-4 mt-6">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
              <span>{t.catalog}</span>
            </h3>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {RANDOM_CATALOG.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedPreviewBook(book as SearchResult)}
                  className="shrink-0 w-[120px] cursor-pointer group"
                >
                  <div className="aspect-[2/3] w-full bg-white/10 rounded-xl overflow-hidden shadow-md mb-2 relative group-hover:scale-105 transition-transform">
                    <BookCover coverUrl={book.coverUrl} title={book.title} size="sm" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <p className="font-bold text-xs line-clamp-2 leading-tight mb-0.5">{book.title}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-1">{book.author}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Library Stats / Widgets Grid */}
          <div className="px-4 mt-6">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                <p className="text-[10px] text-[var(--lib-muted)] uppercase tracking-wider font-bold mb-1">Reading Streak</p>
                <p className="text-xl font-serif font-bold text-[var(--lib-text)]">{stats.streakDays} <span className="text-xs font-normal">days</span></p>
              </div>
              <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-2xl p-4 flex flex-col justify-center items-center shadow-sm">
                <Calendar className="w-6 h-6 text-primary mb-2" />
                <p className="text-[10px] text-[var(--lib-muted)] uppercase tracking-wider font-bold mb-1">Today's Read</p>
                <p className="text-xl font-serif font-bold text-[var(--lib-text)]">{stats.dailyMinutes} <span className="text-xs font-normal">min</span></p>
              </div>
            </div>
            
            <LibraryStatsGraph weeklyData={stats.weeklyData} monthlyData={stats.monthlyData} />
          </div>

          {/* Hero – Currently Reading */}
          <AnimatePresence mode="wait">
          {hero && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="px-4 pt-6 pb-2"
            >
              <div
                className="relative w-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer active:scale-[0.98] transition-transform group"
                style={{ minHeight: "260px" }}
                onClick={() => openBook(hero)}
              >
                {/* Blurred BG with Animated Glow */}
                <div className="absolute inset-0 bg-black">
                  {hero.coverUrl ? (
                    <img
                      src={hero.coverUrl}
                      className="w-full h-full object-cover blur-2xl scale-125 opacity-60 group-hover:scale-150 transition-transform duration-1000"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-gray-900/20 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                
                {/* Top Right Delete Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteBook(hero.id); }}
                  className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full items-center justify-center flex z-20 hover:bg-red-500/80 transition-colors border border-white/10 shadow-lg"
                  title="Remove from Shelf"
                >
                  {deletingId === hero.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Content */}
                <div className="relative z-10 flex gap-5 items-end p-5 pt-10 h-full">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    className="w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/20 shrink-0 relative z-20"
                    style={{ perspective: "1000px" }}
                  >
                    <BookCover coverUrl={hero.coverUrl} title={hero.title} />
                  </motion.div>
                  <div className="flex-1 pb-1 min-w-0">
                    <p className="text-[10px] text-primary/90 font-bold mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      {hero.status === "reading" ? "Continue Reading" : "Up Next"}
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight mb-1 line-clamp-2 text-white drop-shadow-lg">{hero.title}</h2>
                    <p className="text-gray-300 text-sm line-clamp-1 mb-4 drop-shadow-md">{hero.author}</p>

                    {hero.totalPages > 0 && (
                      <div className="mb-4">
                        <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (hero.currentPage / hero.totalPages) * 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-primary h-full rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                          </motion.div>
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                          {hero.currentPage > 0
                            ? `${Math.round((hero.currentPage / hero.totalPages) * 100)}% Completed`
                            : `${hero.totalPages} Pages Total`}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); openBook(hero); }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-5 rounded-full text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        <BookOpen className="w-4 h-4" />
                        {hero.status === "reading" && hero.currentPage > 0 ? "Resume" : "Start"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveNotesBook(hero); }}
                        className="bg-white/10 backdrop-blur-md text-white border border-white/10 font-bold py-2 px-4 rounded-full text-sm flex items-center gap-1.5 active:scale-95 transition-all hover:bg-white/20"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          <div className="px-4 py-6 space-y-4">
            {/* Wishlist / Read Later Widget */}
            <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-2xl p-4 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[var(--lib-text)] flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" /> Books to read later
                </h3>
              </div>
              {books.filter(b => b.status === "wishlist").length > 0 ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {books.filter(b => b.status === "wishlist").map(b => (
                    <div key={b.id} onClick={() => openBook(b)} className="w-16 shrink-0 aspect-[2/3] rounded-lg overflow-hidden border border-[var(--lib-border)] cursor-pointer hover:scale-105 transition-transform">
                      <BookCover coverUrl={b.coverUrl} title={b.title} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} onClick={() => { /* maybe open search */ }} className="w-12 h-12 shrink-0 rounded-full bg-[var(--lib-input)] border border-[var(--lib-border)] flex items-center justify-center text-[var(--lib-muted)] cursor-pointer hover:bg-[var(--lib-btn-hover)] transition-colors">
                      <Plus className="w-5 h-5" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collection Tabs */}
            <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--lib-text)] flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-primary" /> Collections
                </h3>
              </div>
              <div className="flex gap-2 mb-4 bg-[var(--lib-input)] p-1 rounded-2xl border border-[var(--lib-border)] overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab("myShelf")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "myShelf" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  My Shelf
                </button>
                <button
                  onClick={() => setActiveTab("partnerShelf")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "partnerShelf" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  {partnerDisplayName}
                </button>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "favorites" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => setActiveTab("finished")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "finished" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  Finished
                </button>
                <button
                  onClick={() => setActiveTab("paused")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "paused" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  Paused
                </button>
                <button
                  onClick={() => setActiveTab("gaveUp")}
                  className={`shrink-0 min-w-[80px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${activeTab === "gaveUp" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
                >
                  Gave Up
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === "myShelf" && (
                    <ShelfRow
                      title=""
                      books={myShelf}
                      emptyMsg="Your shelf is empty."
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                  {activeTab === "partnerShelf" && (
                    <ShelfRow
                      title=""
                      books={partnerShelf}
                      emptyMsg={`${partnerDisplayName}'s shelf is empty.`}
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                  {activeTab === "finished" && (
                    <ShelfRow
                      title=""
                      books={finishedBooks}
                      emptyMsg="No finished books yet."
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      grayscale
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                  {activeTab === "favorites" && (
                    <ShelfRow
                      title=""
                      books={books.filter(b => b.isFavorite)}
                      emptyMsg="No favorites yet."
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                  {activeTab === "paused" && (
                    <ShelfRow
                      title=""
                      books={books.filter(b => b.status === "paused")}
                      emptyMsg="No paused books."
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                  {activeTab === "gaveUp" && (
                    <ShelfRow
                      title=""
                      books={books.filter(b => b.status === "gave_up")}
                      emptyMsg="No given up books."
                      onOpen={openBook}
                      onDelete={deleteBook}
                      deletingId={deletingId}
                      grayscale
                      onStatusChangeMenu={(e, bookId) => {
                        e.preventDefault();
                        setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
                      }}
                      updatingStatus={updatingStatus}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Empty state fallback */}
            {books.length === 0 && !loading && (
              <div className="flex flex-col items-center py-8 text-center text-[var(--lib-muted)]">
                <BookMarked className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm font-bold text-[var(--lib-text)]">Your library is empty</p>
                <p className="text-xs mt-1">Search millions of books above and add them to your shelf.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Memorize View ── */}
      {!searchQuery && libraryTab === "memorize" && (
        <div className="min-h-[80vh] flex flex-col bg-blue-600/10">
          <div className="bg-primary px-6 py-12 pb-24 text-primary-foreground rounded-b-[3rem] shadow-xl">
            <h2 className="text-4xl font-black mb-3">Memorize</h2>
            <p className="text-sm font-medium opacity-90 max-w-[80%] leading-relaxed">
              After reading books, write down some notes you want to remember. 
              <br/> If you don't have a book yet, how about adding it first?
            </p>
          </div>
          <div className="px-4 -mt-16 pb-12 space-y-4">
            {allNotes.length === 0 ? (
              <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Lightbulb className="w-16 h-16 text-primary opacity-50" />
                </div>
                <p className="text-[var(--lib-muted)] font-medium">There are no reading notes yet.</p>
              </div>
            ) : (
              allNotes.map((note) => (
                <div key={note.id} className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--lib-muted)] font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span className="line-clamp-1 flex-1 mr-2">{note.bookTitle || "Unknown Book"}</span>
                        <span className="shrink-0">{new Date(note.timestamp).toLocaleDateString()}</span>
                      </p>
                      <p className="text-sm text-[var(--lib-text)] leading-relaxed">{note.text}</p>
                      {note.chapterOrPage && (
                        <p className="text-xs text-[var(--lib-muted)] mt-2 font-mono bg-[var(--lib-input)] inline-block px-2 py-0.5 rounded-md border border-[var(--lib-border)]">
                          {note.chapterOrPage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Achievements View ── */}
      {!searchQuery && libraryTab === "achievements" && (
        <div className="min-h-[80vh] flex flex-col">
          <div className="bg-[#1976D2] px-6 py-12 pb-24 text-white rounded-b-[3rem] shadow-xl">
            <div className="flex items-center justify-between mb-3">
               <h2 className="text-4xl font-black">Achievement</h2>
               <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Settings className="w-5 h-5" /></button>
            </div>
            <p className="text-sm font-medium opacity-90 max-w-[80%] leading-relaxed">
              Books which you read are registered in achievement.
            </p>
          </div>
          <div className="px-4 -mt-16 pb-12">
            <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-3xl p-6 shadow-xl min-h-[400px] relative overflow-hidden">
              <h3 className="text-lg font-bold text-[var(--lib-text)] mb-6 flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 text-yellow-500" /> Your Badges
              </h3>
              
              <div className="relative z-10">
                <LibraryAchievements stats={stats} books={books} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Library Bottom Navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--lib-header)] border-t border-[var(--lib-border)] backdrop-blur-xl z-40 pb-[env(safe-area-inset-bottom)] px-6">
        <div className="flex justify-between items-center py-3 max-w-sm mx-auto">
          <button 
            onClick={() => setLibraryTab("dashboard")} 
            className={`flex flex-col items-center gap-1 transition-all ${libraryTab === "dashboard" ? "text-primary scale-110" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
          >
            <div className={`p-2 rounded-full ${libraryTab === "dashboard" ? "bg-primary text-white" : ""}`}>
              <BookOpen className="w-6 h-6" />
            </div>
          </button>
          <button 
            onClick={() => setLibraryTab("memorize")} 
            className={`flex flex-col items-center gap-1 transition-all ${libraryTab === "memorize" ? "text-primary scale-110" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
          >
            <div className={`p-2 rounded-full ${libraryTab === "memorize" ? "bg-primary text-white" : ""}`}>
              <Lightbulb className="w-6 h-6" />
            </div>
          </button>
          <button 
            onClick={() => setLibraryTab("achievements")} 
            className={`flex flex-col items-center gap-1 transition-all ${libraryTab === "achievements" ? "text-primary scale-110" : "text-[var(--lib-muted)] hover:text-[var(--lib-text)]"}`}
          >
            <div className={`p-2 rounded-full ${libraryTab === "achievements" ? "bg-primary text-white" : ""}`}>
              <Medal className="w-6 h-6" />
            </div>
          </button>
          <button 
            onClick={() => setLocation("/")} 
            className="flex flex-col items-center gap-1 text-[var(--lib-muted)] hover:text-[var(--lib-text)] transition-all"
          >
            <div className="p-2 rounded-full">
              <User className="w-6 h-6" />
            </div>
          </button>
        </div>
      </div>

      {/* ── Status Menu Modal ── */}
      <AnimatePresence>
      {statusMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 bg-gray-900/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            top: Math.min(statusMenu.y, window.innerHeight - 150),
            left: Math.min(statusMenu.x, window.innerWidth - 180),
            width: "160px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => changeStatus(statusMenu.bookId, { status: "reading" })}
            className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Reading
          </button>
          <button
            onClick={() => changeStatus(statusMenu.bookId, { status: "paused" })}
            className="px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Paused
          </button>
          <button
            onClick={() => changeStatus(statusMenu.bookId, { status: "gave_up" })}
            className="px-4 py-3 text-left text-sm font-bold text-red-400 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Give Up
          </button>
          <button
            onClick={() => changeStatus(statusMenu.bookId, { status: "finished" })}
            className="px-4 py-3 text-left text-sm font-bold text-green-400 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Finished ✓
          </button>
          <button
            onClick={() => {
              const b = books.find(b => b.id === statusMenu.bookId);
              if (b) {
                changeStatus(statusMenu.bookId, { favorite: !b.isFavorite });
              }
            }}
            className="px-4 py-3 text-left text-sm font-bold text-pink-400 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            {books.find(b => b.id === statusMenu.bookId)?.isFavorite ? "Unfavorite" : "Favorite ♥"}
          </button>
          <button
            onClick={() => {
              const b = books.find(b => b.id === statusMenu.bookId);
              if (b) setActiveNotesBook(b);
              setStatusMenu(null);
            }}
            className="px-4 py-3 text-left text-sm font-bold text-primary hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Reading Notes
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── Notes Modal ── */}
      {activeNotesBook && (
        <NotesModal
          book={activeNotesBook}
          onClose={() => setActiveNotesBook(null)}
          myId={myId}
          partnerName={partnerDisplayName}
        />
      )}

      {/* ── In-App Browser Modal ── */}
      {inAppBrowserUrl && (
        <InAppBrowser 
          url={inAppBrowserUrl} 
          onClose={() => setInAppBrowserUrl(null)} 
        />
      )}

      {/* ── Settings Modal ── */}
      <AnimatePresence>
      {showSettings && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-xl font-bold font-serif text-white">Library Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded-full text-white active:scale-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Theme Settings */}
              <div>
                <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Theme</p>
                <div className="flex gap-3">
                  {(["dark", "light", "sepia"] as const).map(th => (
                    <button
                      key={th}
                      onClick={() => setLibTheme(th)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase border-2 transition-all ${
                        libTheme === th ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-white/10 text-gray-500 hover:border-white/30"
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Settings */}
              <div>
                <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Language</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLibLang("en")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition-all ${
                      libLang === "en" ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-white/10 text-gray-500 hover:border-white/30"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLibLang("ar")}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition-all ${
                      libLang === "ar" ? "border-primary text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "border-white/10 text-gray-500 hover:border-white/30"
                    }`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              {/* Library Focus Mode */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5 flex items-center">
                      <BookOpen className="w-4 h-4 mr-1.5 text-primary" />
                      Focus Mode
                    </p>
                    <p className="text-[11px] text-gray-400">Blocks all incoming calls, notifications, and menus.</p>
                  </div>
                  <button 
                    onClick={toggleLibraryMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${libraryMode ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-white/20"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${libraryMode ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              {/* Fullscreen Toggle */}
              <div>
                <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Display</p>
                <button
                  onClick={toggleFullscreen}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 px-4 flex items-center justify-between text-sm font-bold text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Maximize className="w-5 h-5 text-gray-400" />
                    Toggle Fullscreen
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── Book Preview Modal ── */}
      <AnimatePresence>
      {selectedPreviewBook && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0" onClick={() => setSelectedPreviewBook(null)} />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
          >
            <div className="relative aspect-[4/3] w-full bg-black overflow-hidden flex items-end justify-center pb-8">
              {/* Blurred background */}
              <div className="absolute inset-0 opacity-50">
                {selectedPreviewBook.coverUrl ? (
                   <img src={selectedPreviewBook.coverUrl} className="w-full h-full object-cover blur-2xl scale-125" alt="" />
                ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/30 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent mix-blend-multiply" />
              </div>
              
              <button 
                onClick={() => setSelectedPreviewBook(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md z-10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Book Cover */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 w-32 aspect-[2/3] rounded-xl shadow-2xl shadow-black/60 overflow-hidden ring-1 ring-white/20"
              >
                <BookCover coverUrl={selectedPreviewBook.coverUrl} title={selectedPreviewBook.title} />
              </motion.div>
            </div>
            
            <div className="p-6 text-center space-y-2">
              <motion.h2 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-2xl font-bold font-serif text-white line-clamp-2 leading-tight"
              >{selectedPreviewBook.title}</motion.h2>
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                className="text-gray-400 text-sm font-medium"
              >{selectedPreviewBook.author}</motion.p>
              {selectedPreviewBook.description && (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-xs text-gray-500 line-clamp-4 mt-4 px-2 leading-relaxed"
                >{selectedPreviewBook.description}</motion.p>
              )}
            </div>

            <div className="p-6 pt-2 pb-8 flex gap-3">
              <button
                onClick={() => { addToLibrary(selectedPreviewBook); setSelectedPreviewBook(null); }}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <BookOpen className="w-5 h-5" />
                Add to Shelf
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
    </>
  );
}

// ── Shelf Row Component ────────────────────────────────────────────────────────

function ShelfRow({
  title,
  books,
  emptyMsg,
  onOpen,
  onDelete,
  deletingId,
  dimmed = false,
  grayscale = false,
  onStatusChangeMenu,
  updatingStatus,
}: {
  title: string;
  books: ApiBook[];
  emptyMsg: string;
  onOpen: (book: ApiBook) => void;
  onDelete: ((id: string) => void) | null;
  deletingId: string | null;
  dimmed?: boolean;
  grayscale?: boolean;
  onStatusChangeMenu?: (e: React.MouseEvent, bookId: string) => void;
  updatingStatus?: string | null;
}) {
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item: any = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
        <ChevronRight className="w-4 h-4 text-[var(--lib-muted)]" />
      </div>
      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-[var(--lib-card)] rounded-2xl border border-[var(--lib-border)] border-dashed">
          <BookMarked className="w-8 h-8 mb-2 opacity-20 text-[var(--lib-text)]" />
          <p className="text-xs font-medium text-[var(--lib-muted)]">{emptyMsg}</p>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-hide"
        >
          {books.map((book) => (
            <motion.div
              variants={item}
              key={book.id}
              className={`w-[100px] shrink-0 snap-start cursor-pointer group relative ${dimmed ? "opacity-75 hover:opacity-100 transition-opacity" : ""}`}
              onClick={() => onOpen(book)}
              onContextMenu={(e) => onStatusChangeMenu && onStatusChangeMenu(e, book.id)}
            >
              <div className={`aspect-[2/3] w-full bg-gray-900 rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 mb-2 relative ${grayscale ? "grayscale hover:grayscale-0" : ""}`}>
                {updatingStatus === book.id && (
                  <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <BookCover coverUrl={book.coverUrl} title={book.title} size="sm" />
                {/* Progress bar */}
                {book.totalPages > 0 && book.currentPage > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-10 backdrop-blur-sm">
                    <div
                      className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                      style={{ width: `${Math.min(100, (book.currentPage / book.totalPages) * 100)}%` }}
                    />
                  </div>
                )}
                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 backdrop-blur-md rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex z-10 hover:bg-red-500 hover:text-white"
                    title="Remove"
                  >
                    {deletingId === book.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-400 group-hover:text-white" />
                    )}
                  </button>
                )}
                {/* Finished badge */}
                {book.status === "finished" && (
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow-md bg-black/20 rounded-full" />
                  </div>
                )}
                {/* Paused badge */}
                {book.status === "paused" && (
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] font-bold text-black drop-shadow-md">II</span>
                  </div>
                )}
              </div>
              <p className="font-bold text-[11px] line-clamp-1 leading-tight group-hover:text-primary transition-colors">{book.title}</p>
              {book.source && (
                <p className="text-[9px] text-[var(--lib-muted)] mt-0.5 line-clamp-1">{book.source}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Notes Modal Component ────────────────────────────────────────────────────────

function NotesModal({
  book,
  onClose,
  myId,
  partnerName,
}: {
  book: ApiBook;
  onClose: () => void;
  myId?: string;
  partnerName: string;
}) {
  const [notes, setNotes] = useState<LibraryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotes() {
      try {
        const data = await apiFetch<LibraryNote[]>(`/library/${book.id}/notes`);
        setNotes(data);
      } catch (err) {
        console.error("Failed to load notes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, [book.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || adding) return;
    setAdding(true);
    try {
      const res = await apiFetch<{ success: boolean; id: string }>(`/library/${book.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ text: newNote.trim() }),
      });
      if (res.success) {
        setNotes((prev) => [
          ...prev,
          {
            id: res.id,
            bookId: book.id,
            chapterOrPage: null,
            text: newNote.trim(),
            authorId: myId || "me",
            timestamp: new Date().toISOString(),
          },
        ]);
        setNewNote("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col justify-end"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative bg-gray-900 w-full h-[80vh] rounded-t-3xl shadow-2xl flex flex-col border-t border-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0 bg-gray-900/50 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-primary" /> Notes
              </h3>
              <p className="text-xs text-gray-400 line-clamp-1">{book.title}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : notes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60"
              >
                <MessageSquare className="w-12 h-12 mb-3" />
                <p className="font-bold">No notes yet.</p>
                <p className="text-sm text-center px-4 mt-1">Leave a spoiler-free thought for {partnerName}.</p>
              </motion.div>
            ) : (
              notes.map((note) => {
                const isMine = note.authorId === myId;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={note.id} 
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-gray-500 mb-1 px-1 font-bold uppercase tracking-wider">
                      {isMine ? "You" : partnerName}
                    </span>
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${isMine ? "bg-primary text-primary-foreground rounded-tr-sm shadow-[0_4px_14px_rgba(var(--primary),0.25)]" : "bg-white/10 text-white rounded-tl-sm border border-white/5"}`}>
                      <p className="text-sm leading-snug">{note.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-600 mt-1 px-1">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-gray-900 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Leave a note..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={!newNote.trim() || adding}
                className="absolute right-1 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Statistics Graph Component ──────────────────────────────────────────────────

function LibraryStatsGraph({ weeklyData, monthlyData }: { weeklyData: { date: string; minutes: number }[], monthlyData: { month: string; minutes: number }[] }) {
  const [view, setView] = useState<"week" | "year">("week");
  
  const data = view === "week" ? weeklyData : monthlyData;
  const maxMinutes = Math.max(...data.map(d => d.minutes), 1); // Avoid division by zero

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getLabel = (d: any) => {
    if (view === "week") {
      const date = new Date(d.date);
      return daysOfWeek[date.getDay()];
    }
    return months[parseInt(d.month) - 1];
  }

  return (
    <div className="bg-[var(--lib-card)] border border-[var(--lib-border)] rounded-3xl p-5 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-[var(--lib-text)] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Activity
        </h3>
        <div className="flex bg-[var(--lib-input)] rounded-lg p-1 border border-[var(--lib-border)]">
          <button 
            onClick={() => setView("week")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "week" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)]"}`}
          >
            Week
          </button>
          <button 
            onClick={() => setView("year")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "year" ? "bg-[var(--lib-card)] text-[var(--lib-text)] shadow-sm" : "text-[var(--lib-muted)]"}`}
          >
            Year
          </button>
        </div>
      </div>

      <div className="h-40 flex items-end justify-between gap-1 sm:gap-2">
        {data.map((d, i) => {
          const heightPct = (d.minutes / maxMinutes) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full relative h-full flex flex-col justify-end">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {Math.round(d.minutes)} min
                </div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 2)}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.05 }}
                  className="w-full bg-primary rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-[var(--lib-muted)] uppercase">{getLabel(d)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Achievements Component ────────────────────────────────────────────────────

function LibraryAchievements({ stats, books }: { stats: any, books: ApiBook[] }) {
  const finishedCount = books.filter(b => b.status === "finished").length;
  
  const badges = [
    {
      id: "first_page",
      title: "First Page",
      desc: "Finish your first book",
      icon: <BookOpen className="w-8 h-8 text-blue-400" />,
      earned: finishedCount >= 1,
      progress: Math.min(finishedCount, 1) / 1,
      bg: "from-blue-500/20 to-blue-900/20",
      border: "border-blue-500/30"
    },
    {
      id: "bookworm",
      title: "Bookworm",
      desc: "Finish 10 books",
      icon: <BookMarked className="w-8 h-8 text-purple-400" />,
      earned: finishedCount >= 10,
      progress: Math.min(finishedCount, 10) / 10,
      bg: "from-purple-500/20 to-purple-900/20",
      border: "border-purple-500/30"
    },
    {
      id: "streak_master",
      title: "Streak Master",
      desc: "7-day reading streak",
      icon: <Flame className="w-8 h-8 text-orange-400" />,
      earned: stats.streakDays >= 7,
      progress: Math.min(stats.streakDays, 7) / 7,
      bg: "from-orange-500/20 to-orange-900/20",
      border: "border-orange-500/30"
    },
    {
      id: "marathon",
      title: "Marathon",
      desc: "100 hours total read time",
      icon: <TrendingUp className="w-8 h-8 text-green-400" />,
      earned: stats.annualMinutes >= 6000, // 100 hrs
      progress: Math.min(stats.annualMinutes, 6000) / 6000,
      bg: "from-green-500/20 to-green-900/20",
      border: "border-green-500/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {badges.map((b, i) => (
        <motion.div 
          key={b.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`relative overflow-hidden rounded-3xl p-5 border bg-gradient-to-br ${b.earned ? `${b.bg} ${b.border}` : "from-[var(--lib-card)] to-[var(--lib-card)] border-[var(--lib-border)] grayscale opacity-60"} flex flex-col items-center text-center shadow-sm`}
        >
          {b.earned && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mb-3 shadow-inner">
            {b.icon}
          </div>
          <h4 className="font-bold text-[var(--lib-text)] mb-1 leading-tight">{b.title}</h4>
          <p className="text-[10px] text-[var(--lib-muted)] mb-4 leading-tight">{b.desc}</p>
          
          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-white/80 h-full rounded-full" style={{ width: `${b.progress * 100}%` }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
