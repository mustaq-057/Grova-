import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { ReactReader, ReactReaderStyle } from "react-reader";
import { ChevronLeft, Settings, Info, Type, Link as LinkIcon, MessageSquare, Send, X, Minus, Plus, Maximize, Minimize } from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api";
import { getAuthHeaders } from "@/lib/session";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type LibraryBook = {
  epubUrl?: string | null;
  title?: string;
  author?: string;
  currentPage?: number;
  totalPages?: number;
};

function isPdfUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes(".pdf")) return true;
  if (/cloudinary\.com/i.test(url)) return true;
  if (/backblazeb2\.com/i.test(url)) return true;
  return false;
}

function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const v = new Uint8Array(buffer);
  return v[0] === 0x25 && v[1] === 0x50 && v[2] === 0x44 && v[3] === 0x46;
}

function isPdfContent(_contentType: string, buffer?: ArrayBuffer): boolean {
  if (buffer) return isPdfBuffer(buffer);
  return false;
}

async function fetchViaMediaInline(url: string): Promise<{ blob: Blob; contentType: string }> {
  const params = new URLSearchParams({
    url,
    type: "application/pdf",
    name: "book.pdf",
  });
  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`/api/media/inline?${params}`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Could not load PDF" }))) as { error?: string };
    throw new Error(err.error || `Could not load PDF (HTTP ${res.status})`);
  }
  const buf = await res.arrayBuffer();
  if (!isPdfBuffer(buf)) {
    throw new Error("Stored file is not a valid PDF. Re-upload or pick a catalog book.");
  }
  return { blob: new Blob([buf], { type: "application/pdf" }), contentType: "application/pdf" };
}

async function fetchPdfBlob(
  bookId: string,
  url: string,
): Promise<{ blob: Blob; contentType: string }> {
  const errors: string[] = [];

  // Try direct fetch first for Cloudinary/B2 to bypass Vercel 4.5MB limits
  if (/cloudinary\.com|backblazeb2\.com/i.test(url)) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (isPdfBuffer(buf)) {
          return {
            blob: new Blob([buf], { type: "application/pdf" }),
            contentType: "application/pdf",
          };
        }
        errors.push("Direct fetch returned a file that is not a valid PDF.");
      } else {
        errors.push(`Direct fetch failed with HTTP ${res.status}`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Direct fetch failed (CORS/Network).");
    }
  }

  // Always load through our API — direct browser fetch hits CORS on archive.org, Gutenberg, Cloudinary, etc.
  try {
    const proxied = await apiFetchBlob(`/library/${bookId}/file`);
    const buf = await proxied.blob.arrayBuffer();
    if (isPdfBuffer(buf)) {
      return {
        blob: new Blob([buf], { type: "application/pdf" }),
        contentType: proxied.contentType || "application/pdf",
      };
    }
    errors.push("Server returned a file that is not a valid PDF.");
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Could not download book from server.");
  }

  if (/cloudinary\.com|backblazeb2\.com/i.test(url)) {
    try {
      return await fetchViaMediaInline(url);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Cloud storage download failed.");
    }
  }

  throw new Error(
    errors[0] ||
      "Could not open this book. Try again, or remove it and re-add from search or upload.",
  );
}

const PDF_PAGE_BUFFER = 3;

type Theme = "parchment" | "sepia" | "obsidian" | "midnight";

const THEMES: Record<Theme, { bg: string; text: string; name: string; page: string; readerStyles: Record<string, Record<string, string>> }> = {
  parchment: {
    name: "Parchment",
    bg: "#2c2416",
    page: "#f4ead5",
    text: "#2a2118",
    readerStyles: {
      body: { background: "#f4ead5", color: "#2a2118" },
      p: { color: "#2a2118" },
      h1: { color: "#1a1208" },
      h2: { color: "#1a1208" },
    },
  },
  sepia: {
    name: "Sepia",
    bg: "#1f1610",
    page: "#e8d4b8",
    text: "#3d2e1e",
    readerStyles: {
      body: { background: "#e8d4b8", color: "#3d2e1e" },
      p: { color: "#3d2e1e" },
    },
  },
  obsidian: {
    name: "Obsidian",
    bg: "#0a0a0a",
    page: "#141414",
    text: "#d4d4d4",
    readerStyles: {
      body: { background: "#141414", color: "#d4d4d4" },
      p: { color: "#d4d4d4" },
      h1: { color: "#ffffff" },
    },
  },
  midnight: {
    name: "Midnight",
    bg: "#050d1a",
    page: "#0f1e33",
    text: "#c8d6f0",
    readerStyles: {
      body: { background: "#0f1e33", color: "#c8d6f0" },
      p: { color: "#c8d6f0" },
    },
  },
};

const BOOK_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
  html { padding: 0 !important; margin: 0 !important; }
  body {
    font-family: 'Lora', 'Amiri', 'Georgia', 'Times New Roman', serif !important;
    font-size: 1.35em !important;
    line-height: 2 !important;
    text-align: justify !important;
    hyphens: auto !important;
    padding: 2.5em 2em 3em !important;
    max-width: 42em !important;
    margin: 0 auto !important;
    box-sizing: border-box !important;
    letter-spacing: 0.01em !important;
  }
  body[dir="rtl"], [dir="rtl"] body {
    font-family: 'Amiri', 'Traditional Arabic', serif !important;
    text-align: right !important;
    line-height: 2.2 !important;
  }
  p, div, li {
    margin-bottom: 1.1em !important;
    orphans: 3 !important;
    widows: 3 !important;
  }
  h1, h2, h3 {
    font-family: 'Lora', 'Amiri', Georgia, serif !important;
    line-height: 1.4 !important;
    margin: 1.5em 0 0.75em !important;
    text-align: center !important;
  }
  img { max-width: 100% !important; height: auto !important; margin: 1em auto !important; display: block !important; }
`;

function applyBookRendition(rendition: any, theme: Theme, fontSize: number, lineHeight: number) {
  const t = THEMES[theme];
  rendition.themes.register("book", {
    ...t.readerStyles,
    body: {
      ...t.readerStyles.body,
      "font-size": `${fontSize}% !important`,
      "line-height": `${lineHeight} !important`,
    },
  });
  rendition.themes.select("book");
  rendition.themes.fontSize(`${fontSize}%`);

  rendition.hooks.content.register((contents: any) => {
    const doc = contents.document;
    const body = doc.body;
    if (!body) return;
    const text = body.textContent || "";
    const isRtl = /[\u0600-\u06FF\u0750-\u077F]/.test(text.slice(0, 500));
    doc.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
    doc.documentElement.setAttribute("lang", isRtl ? "ar" : "en");

    const style = doc.createElement("style");
    style.textContent = BOOK_CSS.replace(
      "line-height: 2 !important",
      `line-height: ${lineHeight} !important`,
    );
    doc.head.appendChild(style);
  });
}

export default function EReader() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [bookLocation, setBookLocation] = useState<string | number>(0);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("grova-reader-theme") as Theme) || "parchment");
  const [showMenu, setShowMenu] = useState(true);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("grova-reader-font")) || 155);
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem("grova-reader-line")) || 2.1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duetMode, setDuetMode] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const renditionRef = useRef<any>(null);
  const isRemoteSync = useRef(false);
  const sessionPagesReadRef = useRef(0);
  const lastPageRef = useRef<number | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [epubData, setEpubData] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const blobUrlRef = useRef<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const savedPageRef = useRef(0);
  const [pdfWindow, setPdfWindow] = useState({ start: 1, end: 1 });
  const pdfExpandedRef = useRef(false);

  const flushReadingSession = useCallback(() => {
    if (!id) return;
    const pagesRead = sessionPagesReadRef.current;
    sessionPagesReadRef.current = 0;
    if (pagesRead <= 0) return;
    apiFetch(`/library/${id}/session`, {
      method: "POST",
      body: JSON.stringify({ durationMinutes: 1, pagesRead }),
    })
      .then(() => window.dispatchEvent(new Event("LIBRARY_STATS_UPDATED")))
      .catch(() => {});
  }, [id]);

  const openPageNote = useCallback((pageNum: number) => {
    setCurrentPage(pageNum);
    setShowNoteModal(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("grova-reader-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("grova-reader-font", String(fontSize));
    localStorage.setItem("grova-reader-line", String(lineHeight));
    if (renditionRef.current) {
      applyBookRendition(renditionRef.current, theme, fontSize, lineHeight);
    }
  }, [theme, fontSize, lineHeight]);

  useEffect(() => {
    if (!id || loading || !epubData) return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        const pagesRead = sessionPagesReadRef.current;
        sessionPagesReadRef.current = 0;
        apiFetch(`/library/${id}/session`, {
          method: "POST",
          body: JSON.stringify({ durationMinutes: 1, pagesRead }),
        })
          .then(() => window.dispatchEvent(new Event("LIBRARY_STATS_UPDATED")))
          .catch(() => {});
      }
    }, 60000);
    return () => {
      clearInterval(intervalId);
      flushReadingSession();
    };
  }, [id, loading, epubData, flushReadingSession]);

  useEffect(() => {
    const loc = new URLSearchParams(window.location.search).get("location");
    if (loc) setBookLocation(loc);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      setIsPdf(false);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      try {
        const book = await apiFetch<LibraryBook>(`/library/${id}`);
        setBookTitle(book.title || "");
        savedPageRef.current = book.currentPage || 0;
        if (book.totalPages && book.totalPages > 0) setTotalPages(book.totalPages);

        if (!book.epubUrl?.trim()) {
          if (!cancelled) { setEpubData(null); setLoading(false); }
          return;
        }

        if (!isPdfUrl(book.epubUrl)) {
          if (!cancelled) {
            setLoadError("This book is not a PDF. Only PDF books can be opened.");
            setLoading(false);
          }
          return;
        }

        let blob: Blob;
        let contentType = "";
        const fetched = await fetchPdfBlob(id, book.epubUrl);
        blob = fetched.blob;
        contentType = fetched.contentType;

        const buf = await blob.arrayBuffer();
        if (!isPdfContent(contentType, buf)) {
          throw new Error("This file is not a valid PDF. Try removing the book and adding it again from search.");
        }

        const blobUrl = URL.createObjectURL(new Blob([buf], { type: "application/pdf" }));
        blobUrlRef.current = blobUrl;

        if (!cancelled) {
          setIsPdf(true);
          setEpubData(blobUrl);
          if (savedPageRef.current > 0 && book.totalPages) {
            setCurrentPage(savedPageRef.current);
            setProgressPct(Math.round((savedPageRef.current / book.totalPages) * 100));
          }
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (e) {
        if (!cancelled) {
          setEpubData(null);
          setLoadError(e instanceof Error ? e.message : "Failed to load book");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [id, retryCount]);

  useEffect(() => {
    window.localStorage.setItem("DND_LIBRARY_MODE", "true");
    const timer = setTimeout(() => setShowMenu(false), 3500);

    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute("content", "width=device-width, initial-scale=1.0, viewport-fit=cover, height=device-height");
    }

    return () => {
      window.localStorage.removeItem("DND_LIBRARY_MODE");
      clearTimeout(timer);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (meta) {
        meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=no, viewport-fit=cover, height=device-height");
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      setIsFullscreen(!isFullscreen);
    }
    setShowMenu(false);
    setShowSettings(false);
  };

  useEffect(() => {
    const handleRemoteSync = (e: Event) => {
      if (!duetMode) return;
      const { bookId, epubcifi } = (e as CustomEvent).detail;
      if (bookId === id && epubcifi && renditionRef.current) {
        isRemoteSync.current = true;
        renditionRef.current.display(epubcifi);
        setBookLocation(epubcifi);
      }
    };
    window.addEventListener("grova-page-sync", handleRemoteSync);
    return () => window.removeEventListener("grova-page-sync", handleRemoteSync);
  }, [duetMode, id]);

  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locationChanged = useCallback((epubcifi: string) => {
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);

    syncDebounceRef.current = setTimeout(() => {
      setBookLocation(epubcifi);

      if (renditionRef.current) {
        try {
          const loc = renditionRef.current.currentLocation();
          if (loc?.start?.displayed) {
            const page = loc.start.displayed.page;
            const total = loc.start.displayed.total;
            setCurrentPage(page);
            setTotalPages(total);
            if (total > 0) setProgressPct(Math.round((page / total) * 100));

            if (page > 0) {
              if (lastPageRef.current !== null && page !== lastPageRef.current) {
                sessionPagesReadRef.current += 1;
              }
              lastPageRef.current = page;
              apiFetch(`/library/${id}/progress`, {
                method: "PUT",
                body: JSON.stringify({ page, status: "reading", totalPages: total }),
              }).catch(() => {});
            }
          }
        } catch { /* ignore */ }
      }

      if (!isRemoteSync.current && duetMode) {
        apiFetch(`/library/${id}/sync`, {
          method: "POST",
          body: JSON.stringify({ epubcifi }),
        }).catch(() => {});
      }
      isRemoteSync.current = false;
    }, 300);
  }, [duetMode, id]);

  const changeFontSize = (delta: number) => {
    setFontSize((s) => Math.max(110, Math.min(220, s + delta)));
  };

  const changeLineHeight = (delta: number) => {
    setLineHeight((h) => Math.max(1.6, Math.min(2.8, Math.round((h + delta) * 10) / 10)));
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !id) return;
    setIsSavingNote(true);
    try {
      await apiFetch(`/library/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          text: noteText,
          chapterOrPage: isPdf ? `Page ${currentPage}` : String(bookLocation),
        }),
      });
      window.dispatchEvent(new Event("LIBRARY_NOTES_UPDATED"));
      setShowNoteModal(false);
      setNoteText("");
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handlePdfScroll = () => {
    if (!pdfContainerRef.current || totalPages === 0) return;
    if (!pdfExpandedRef.current) pdfExpandedRef.current = true;

    const { scrollTop, scrollHeight, clientHeight } = pdfContainerRef.current;

    const scrollProgress = scrollTop / (scrollHeight - clientHeight || 1);
    let newPage = Math.max(1, Math.min(totalPages, Math.ceil(scrollProgress * totalPages)));
    if (scrollTop === 0) newPage = 1;

    setPdfWindow({
      start: Math.max(1, newPage - PDF_PAGE_BUFFER),
      end: Math.min(totalPages, newPage + PDF_PAGE_BUFFER),
    });

    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      setProgressPct(Math.round((newPage / totalPages) * 100));

      if (lastPageRef.current !== null && newPage !== lastPageRef.current) {
        sessionPagesReadRef.current += Math.abs(newPage - lastPageRef.current);
      }
      lastPageRef.current = newPage;

      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      syncDebounceRef.current = setTimeout(() => {
        apiFetch(`/library/${id}/progress`, {
          method: "PUT",
          body: JSON.stringify({ page: newPage, status: "reading", totalPages }),
        })
          .then(() => window.dispatchEvent(new Event("LIBRARY_STATS_UPDATED")))
          .catch(() => {});
      }, 500);
    }
  };

  const scrollToSavedPage = (page: number, numPages: number) => {
    if (!pdfContainerRef.current || page <= 1) return;
    const ratio = (page - 1) / Math.max(numPages - 1, 1);
    pdfContainerRef.current.scrollTop = ratio * (pdfContainerRef.current.scrollHeight - pdfContainerRef.current.clientHeight);
  };

  const t = THEMES[theme];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col transition-colors duration-500"
      style={{ backgroundColor: t.bg }}
    >

      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showMenu ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="flex items-center justify-between px-4 pt-10 pb-3 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={() => setLocation("/library")} className="p-2 rounded-full bg-black/30 text-white active:scale-90">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 mx-3 text-center min-w-0">
            <p className="text-white/90 text-sm font-serif font-bold truncate">{bookTitle}</p>
            {progressPct > 0 && <p className="text-white/50 text-[10px] mt-0.5">{progressPct}% through book</p>}
          </div>
          <div className="flex gap-1">
            <button onClick={() => setDuetMode(!duetMode)} className={`p-2 rounded-full bg-black/30 active:scale-90 ${duetMode ? "text-primary" : "text-white"}`}>
              <LinkIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShowNoteModal(true)} className="p-2 rounded-full bg-black/30 text-white active:scale-90">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full bg-black/30 text-white active:scale-90">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-28 right-4 left-4 sm:left-auto bg-[#1a1a1a]/95 border border-white/10 rounded-2xl shadow-2xl p-5 z-30 sm:w-72 text-white backdrop-blur-md">
          <h4 className="text-xs font-bold mb-3 opacity-60 uppercase tracking-widest">Reading Theme</h4>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {(Object.keys(THEMES) as Theme[]).map((th) => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`h-10 rounded-xl border-2 text-[9px] font-bold capitalize ${theme === th ? "border-primary scale-105" : "border-transparent"}`}
                style={{ backgroundColor: THEMES[th].page, color: THEMES[th].text }}
              >
                {THEMES[th].name.slice(0, 3)}
              </button>
            ))}
          </div>

          <h4 className="text-xs font-bold mb-2 opacity-60 uppercase tracking-widest">Display</h4>
          <button onClick={toggleFullscreen} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-3 font-bold text-sm mb-5 transition-colors">
            {isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <h4 className="text-xs font-bold mb-2 opacity-60 uppercase tracking-widest">Text Size</h4>
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-1 mb-4">
            <button onClick={() => changeFontSize(-10)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm">{fontSize}%</span>
            <button onClick={() => changeFontSize(10)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-xs font-bold mb-2 opacity-60 uppercase tracking-widest">Line Spacing</h4>
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-1">
            <button onClick={() => changeLineHeight(-0.1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">
              <Type className="w-3 h-3" />
            </button>
            <span className="font-bold text-sm">{lineHeight.toFixed(1)}×</span>
            <button onClick={() => changeLineHeight(0.1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10">
              <Type className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Book viewport — paper page centered */}
      <div className="flex-1 flex flex-col items-stretch justify-center px-0 sm:px-6 py-0 sm:py-4 relative z-0 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/50 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-serif tracking-wide">Opening your book…</p>
          </div>
        ) : !epubData ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <Info className="w-12 h-12 text-white/30 mb-4" />
            <h2 className="text-xl font-serif font-bold text-white mb-2">
              {loadError ? "Error Loading Book" : "No Digital Version Available"}
            </h2>
            <p className="text-white/50 max-w-sm mb-6 text-sm">{loadError || "Search the library and add a PDF book."}</p>
            <div className="flex gap-3">
              {loadError && (
                <button
                  onClick={() => { setLoadError(null); setLoading(true); setRetryCount((c) => c + 1); }}
                  className="px-6 py-3 bg-white/10 text-white font-bold rounded-full border border-white/20"
                >
                  Try Again
                </button>
              )}
              <button onClick={() => setLocation("/library")} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full">
                Back to Library
              </button>
            </div>
          </div>
        ) : isPdf ? (
          <div 
            className="flex-1 max-w-3xl mx-auto w-full bg-[#323639] overflow-y-auto sm:rounded-lg shadow-2xl relative"
            ref={pdfContainerRef}
            onScroll={handlePdfScroll}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              setShowMenu((m) => !m);
              setShowSettings(false);
            }}
          >
            <Document 
              file={epubData} 
              onLoadSuccess={({ numPages }) => {
                setTotalPages(numPages);
                const resume = savedPageRef.current;
                const startPage = resume > 0 ? Math.min(resume, numPages) : 1;
                setCurrentPage(startPage);
                setProgressPct(Math.round((startPage / numPages) * 100));
                pdfExpandedRef.current = resume > 1;
                setPdfWindow(
                  resume > 1
                    ? {
                        start: Math.max(1, startPage - PDF_PAGE_BUFFER),
                        end: Math.min(numPages, startPage + PDF_PAGE_BUFFER),
                      }
                    : { start: 1, end: 1 },
                );
                if (resume > 1) {
                  setTimeout(() => scrollToSavedPage(resume, numPages), 300);
                }
                apiFetch(`/library/${id}/progress`, {
                  method: "PUT",
                  body: JSON.stringify({ page: startPage, status: "reading", totalPages: numPages }),
                }).catch(() => {});
              }}
              onLoadError={(err) => setLoadError(err?.message || "Failed to parse PDF")}
              className="flex flex-col items-center py-6 gap-6"
              loading={
                <div className="flex flex-col items-center justify-center flex-1 text-white/50 h-full w-full py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-serif tracking-wide">Loading PDF Document…</p>
                </div>
              }
            >
              {totalPages > 0 && Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const pageWidth = Math.min(window.innerWidth - 32, 800);
                const placeholderH = Math.round(pageWidth * 1.414) + 24;
                const inWindow = pageNum >= pdfWindow.start && pageNum <= pdfWindow.end;
                if (!inWindow) {
                  return (
                    <div
                      key={`page_${pageNum}`}
                      data-page={pageNum}
                      style={{ height: placeholderH, width: pageWidth }}
                      className="mb-4 mx-auto bg-white/5 rounded"
                      aria-hidden
                    />
                  );
                }
                return (
                  <div
                    key={`page_${pageNum}`}
                    data-page={pageNum}
                    className="mb-4 relative group"
                  >
                    <button
                      type="button"
                      aria-label={`Note for page ${pageNum}`}
                      className="absolute top-3 right-3 z-20 bg-black/55 text-white rounded-full p-2.5 shadow-lg border border-white/20 active:scale-95"
                      onClick={(e) => { e.stopPropagation(); openPageNote(pageNum); }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <Page
                      pageNumber={pageNum}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      width={pageWidth}
                      className="shadow-xl bg-white mx-auto pointer-events-none"
                    />
                  </div>
                );
              })}
            </Document>
            
            {/* Always visible minimal footer with page numbers for PDF */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 h-8 px-4 rounded-full flex items-center justify-center pointer-events-none opacity-40 z-20" style={{ backgroundColor: t.page, color: t.text }}>
              <span className="text-[11px] font-bold tracking-widest uppercase shadow-black/50">
                {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : "Loading..."}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <Info className="w-12 h-12 text-white/30 mb-4" />
            <h2 className="text-xl font-serif font-bold text-white mb-2">PDF Only</h2>
            <p className="text-white/50 max-w-sm mb-6 text-sm">This book is not a PDF. Remove it and add a PDF from search results.</p>
            <button onClick={() => setLocation("/library")} className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full">
              Back to Library
            </button>
          </div>
        )}
      </div>

      {/* Bottom progress bar */}
      {!loading && epubData && progressPct > 0 && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20 transition-opacity duration-300 ${!showMenu && !isFullscreen ? "opacity-100" : "opacity-0"}`}
        >
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {showNoteModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
            <div className="rounded-t-3xl p-6 h-[50vh] flex flex-col shadow-2xl" style={{ backgroundColor: t.page, color: t.text }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold font-serif flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {isPdf && currentPage > 0 ? `Note — Page ${currentPage}` : "Note"}
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className="w-full flex-1 bg-black/5 border border-black/10 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 text-base font-serif leading-relaxed"
              placeholder="What did you learn from this page?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleSaveNote}
              disabled={isSavingNote || !noteText.trim()}
              className="mt-4 self-end bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {isSavingNote ? "Saving…" : <><Send className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
