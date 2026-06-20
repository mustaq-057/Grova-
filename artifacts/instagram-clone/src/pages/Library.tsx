import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Book, Plus, BookOpen, ChevronLeft, ChevronRight, Trash2, CheckCircle2, Loader2, BookMarked, ExternalLink, Filter, X, MessageSquare, Send } from "lucide-react";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { InAppBrowser } from "@/components/InAppBrowser";

type ApiBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  description: string | null;
  addedBy: string;
  addedAt: string;
  status: "reading" | "finished" | "wishlist" | "paused";
  currentPage: number;
  totalPages: number;
  epubUrl?: string | null;
  source?: string;
  isLink?: boolean;
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

const SHAMELA_CATEGORIES = [
  { id: 1, name: "التفسير", query: "تفسير" },
  { id: 2, name: "السيرة", query: "سيرة" },
  { id: 3, name: "الحديث", query: "حديث" },
  { id: 4, name: "الفقه", query: "فقه" },
  { id: 5, name: "التاريخ", query: "تاريخ" },
  { id: 6, name: "الشعر", query: "شعر" },
  { id: 7, name: "الأدب", query: "أدب" },
  { id: 8, name: "العقيدة", query: "عقيدة" }
];

function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] || "#607D8B";
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {source}
    </span>
  );
}

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
        className="w-full h-full object-cover"
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
      className="w-full h-full flex flex-col items-center justify-center p-2"
      style={{ background: gradient }}
    >
      <span className={`${size === "sm" ? "text-2xl" : "text-4xl"} font-bold text-white/80 mb-1 font-serif`}>
        {initial}
      </span>
      <p className="text-[9px] text-white/50 text-center line-clamp-2 leading-tight px-1">{title}</p>
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

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
    if (book.isLink && book.epubUrl) {
      setInAppBrowserUrl(book.epubUrl);
      return;
    }
    if (book.epubUrl && !book.isLink) {
       // if it's not a link but has an epubUrl, just use the in-app browser or the local reader? 
       // We'll trust the existing logic mostly but use the overlay for external links
       setInAppBrowserUrl(book.epubUrl);
       return;
    }
    // Fallback: use EReader
    setLocation(`/read/${book.id}`);
  };

  const changeStatus = async (bookId: string, status: ApiBook["status"]) => {
    setUpdatingStatus(bookId);
    setStatusMenu(null);
    try {
      await apiFetch(`/library/${bookId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setBooks((prev) => prev.map((b) => b.id === bookId ? { ...b, status } : b));
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
  const myId = user?.id as string | undefined;
  const partnerId = myId === "me" ? "wife" : "me";
  const partnerDisplayName = partnerId === "wife" ? "Sara" : "Mustaq";
  const currentlyReading = books.filter((b) => b.status === "reading");
  const myShelf = books.filter((b) => b.addedBy === myId);
  const partnerShelf = books.filter((b) => b.addedBy === partnerId);
  const finishedBooks = books.filter((b) => b.status === "finished");
  const hero = currentlyReading[0] || myShelf[0];

  return (
    <div className="min-h-full bg-black text-white pb-24">
      {/* ── Sticky Search Header ── */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={() => setLocation("/")}
            className="p-1 -ml-1 hover:bg-white/10 rounded-full text-white active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-bold font-serif italic text-primary leading-none">Library</h1>
        </div>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search 20M+ books (Arabic, English, French…)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-10 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            dir="auto"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
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
        {/* Decorative chips when not searching */}
        {!searchQuery && (
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
            {Object.entries(SOURCE_COLORS).map(([src, color]) => (
              <span
                key={src}
                className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Search Results ── */}
      {searchQuery && (
        <div className="px-4 py-4">
          {isSearching ? (
            <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm">Searching databases…</p>
              <p className="text-xs text-gray-600">Shamela · Open Library · Internet Archive · Wikisource · HathiTrust</p>
            </div>
          ) : displayedResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {displayedResults.map((result) => {
                const alreadyAdded = addedIds.has(result.id);
                const isAdding = addingId === result.id;
                return (
                  <div key={result.id} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex flex-col group">
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
                        ) : (
                          <button
                            onClick={() => addToLibrary(result)}
                            disabled={alreadyAdded || isAdding}
                            className="bg-primary text-primary-foreground font-bold text-xs py-2 px-4 rounded-full flex items-center gap-1.5 disabled:opacity-70 transition-all active:scale-95"
                          >
                            {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : alreadyAdded ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {alreadyAdded ? "Added" : "Add to Shelf"}
                          </button>
                        )}
                        <p className="text-xs text-gray-300 text-center line-clamp-2 leading-tight">{result.description}</p>
                      </div>
                    </div>
                    <div className="p-2.5 flex flex-col gap-0.5">
                      <p className="font-bold text-xs line-clamp-1 leading-tight">{result.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{result.author}</p>
                      <SourceBadge source={result.source} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No {activeSource} results.</p>
              <button onClick={() => setActiveSource(null)} className="text-xs text-primary mt-2">Show all results</button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Book className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No results found across all sources.</p>
              <p className="text-xs mt-1 text-gray-600">Try a different term or check your spelling.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Main Shelves (shown when not searching) ── */}
      {!searchQuery && (
        <>
          {/* Shamela Discovery Categories */}
          <div className="px-4 mt-6">
            <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
              <span>Browse Categories</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Powered by Shamela</span>
            </h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {SHAMELA_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSearchQuery(cat.query);
                    setActiveSource("Shamela");
                  }}
                  className="shrink-0 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all rounded-2xl px-5 py-3 text-center min-w-[90px]"
                >
                  <span className="block font-bold text-sm text-primary mb-1 font-serif" dir="rtl">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hero – Currently Reading */}
          {hero && (
            <div className="px-4 pt-6 pb-2">
              <div
                className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 cursor-pointer active:scale-[0.98] transition-transform"
                style={{ minHeight: "260px" }}
                onClick={() => openBook(hero)}
              >
                {/* Blurred BG */}
                <div className="absolute inset-0">
                  {hero.coverUrl ? (
                    <img
                      src={hero.coverUrl}
                      className="w-full h-full object-cover blur-xl scale-110 opacity-50"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex gap-5 items-end p-5 pt-10">
                  <div className="w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20 shrink-0">
                    <BookCover coverUrl={hero.coverUrl} title={hero.title} />
                  </div>
                  <div className="flex-1 pb-1 min-w-0">
                    <p className="text-[11px] text-primary font-bold mb-1 uppercase tracking-widest">
                      {hero.status === "reading" ? "Continue Reading" : "My Shelf"}
                    </p>
                    <h2 className="text-xl font-bold font-serif leading-tight mb-1 line-clamp-2">{hero.title}</h2>
                    <p className="text-gray-400 text-sm line-clamp-1 mb-3">{hero.author}</p>

                    {hero.totalPages > 0 && (
                      <>
                        <div className="w-full bg-white/10 rounded-full h-1 mb-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (hero.currentPage / hero.totalPages) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {hero.currentPage > 0
                            ? `Page ${hero.currentPage} of ${hero.totalPages}`
                            : `${hero.totalPages} pages`}
                        </p>
                      </>
                    )}

                    <div className="mt-3 flex gap-2 items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); openBook(hero); }}
                        className="bg-white text-black font-bold py-2 px-5 rounded-full text-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <BookOpen className="w-4 h-4" />
                        {hero.status === "reading" && hero.currentPage > 0 ? "Continue" : "Read"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveNotesBook(hero); }}
                        className="bg-white/10 text-white font-bold py-2 px-4 rounded-full text-sm flex items-center gap-1.5 active:scale-95 transition-transform hover:bg-white/20"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Notes
                      </button>
                      {hero.source && <SourceBadge source={hero.source} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8 px-4 py-6">
            {/* My Shelf */}
            <ShelfRow
              title="My Shelf"
              books={myShelf}
              emptyMsg="No books yet. Search above to add one!"
              onOpen={openBook}
              onDelete={deleteBook}
              deletingId={deletingId}
              onStatusChangeMenu={(e, bookId) => {
                e.preventDefault();
                setStatusMenu({ bookId, x: e.clientX, y: e.clientY });
              }}
              updatingStatus={updatingStatus}
            />

            {/* Partner's Shelf */}
            <ShelfRow
              title={`${partnerDisplayName}'s Shelf`}
              books={partnerShelf}
              emptyMsg="Partner hasn't added any books yet."
              onOpen={openBook}
              onDelete={null}
              deletingId={null}
              dimmed
            />

            {/* Finished */}
            {finishedBooks.length > 0 && (
              <ShelfRow
                title="Finished ✓"
                books={finishedBooks}
                emptyMsg=""
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

            {/* Empty state */}
            {books.length === 0 && !loading && (
              <div className="flex flex-col items-center py-16 text-center text-gray-600">
                <BookMarked className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold text-gray-500">Your library is empty</p>
                <p className="text-sm mt-1">Search millions of books above and add them to your shelf.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Status Menu Modal ── */}
      {statusMenu && (
        <div
          className="fixed z-50 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            top: Math.min(statusMenu.y, window.innerHeight - 150),
            left: Math.min(statusMenu.x, window.innerWidth - 180),
            width: "160px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => changeStatus(statusMenu.bookId, "reading")}
            className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Reading
          </button>
          <button
            onClick={() => changeStatus(statusMenu.bookId, "paused")}
            className="px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Paused
          </button>
          <button
            onClick={() => changeStatus(statusMenu.bookId, "finished")}
            className="px-4 py-3 text-left text-sm font-bold text-green-400 hover:bg-white/10 active:bg-white/20 transition-colors border-b border-white/5"
          >
            Finished ✓
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
        </div>
      )}

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

      {/* Floating Add Button (for future local ebook upload) */}
      <button
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center active:scale-90 transition-transform z-30"
        title="Add a local e-book"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{title}</h3>
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </div>
      {books.length === 0 ? (
        <p className="text-sm text-gray-600 py-4">{emptyMsg}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-hide">
          {books.map((book) => (
            <div
              key={book.id}
              className={`w-[100px] shrink-0 snap-start cursor-pointer group relative ${dimmed ? "opacity-75" : ""}`}
              onClick={() => onOpen(book)}
              onContextMenu={(e) => onStatusChangeMenu && onStatusChangeMenu(e, book.id)}
            >
              <div className={`aspect-[2/3] w-full bg-white/10 rounded-xl overflow-hidden shadow-md mb-1.5 relative ${grayscale ? "grayscale" : ""}`}>
                {updatingStatus === book.id && (
                  <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <BookCover coverUrl={book.coverUrl} title={book.title} size="sm" />
                {/* Progress bar */}
                {book.totalPages > 0 && book.currentPage > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-10">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (book.currentPage / book.totalPages) * 100)}%` }}
                    />
                  </div>
                )}
                {/* Delete button */}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex z-10"
                    title="Remove"
                  >
                    {deletingId === book.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-400" />
                    )}
                  </button>
                )}
                {/* Finished badge */}
                {book.status === "finished" && (
                  <div className="absolute top-1 left-1 z-10">
                    <CheckCircle2 className="w-4 h-4 text-green-400 drop-shadow" />
                  </div>
                )}
                {/* Paused badge */}
                {book.status === "paused" && (
                  <div className="absolute top-1 left-1 z-10">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] font-bold text-black drop-shadow">II</span>
                  </div>
                )}
              </div>
              <p className="font-bold text-[11px] line-clamp-1 leading-tight">{book.title}</p>
              {book.source && (
                <p className="text-[9px] text-gray-600 mt-0.5 line-clamp-1">{book.source}</p>
              )}
            </div>
          ))}
        </div>
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
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 w-full h-[80vh] rounded-t-3xl shadow-2xl flex flex-col border-t border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Notes
            </h3>
            <p className="text-xs text-gray-400 line-clamp-1">{book.title}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="font-bold">No notes yet.</p>
              <p className="text-sm text-center px-4 mt-1">Leave a spoiler-free thought for {partnerName}.</p>
            </div>
          ) : (
            notes.map((note) => {
              const isMine = note.authorId === myId;
              return (
                <div key={note.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-gray-500 mb-1 px-1 font-bold uppercase tracking-wider">
                    {isMine ? "You" : partnerName}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${isMine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm"}`}>
                    <p className="text-sm leading-snug">{note.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-600 mt-1 px-1">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                </div>
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
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!newNote.trim() || adding}
              className="absolute right-1 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
