import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ReactReader, ReactReaderStyle } from "react-reader";
import { ChevronLeft, Settings, Info, Type, Link as LinkIcon, MessageSquare, Send, X } from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api";

type LibraryBook = {
  epubUrl?: string | null;
  title?: string;
};

type Theme = "obsidian" | "parchment" | "sepia" | "midnight";

const THEMES: Record<Theme, { bg: string, text: string, name: string, readerStyles: any }> = {
  obsidian: {
    name: "Obsidian",
    bg: "#000000",
    text: "#b3b3b3",
    readerStyles: {
      body: { background: '#000000', color: '#b3b3b3' },
      p: { color: '#b3b3b3' },
      h1: { color: '#ffffff' },
      h2: { color: '#ffffff' },
    }
  },
  parchment: {
    name: "Parchment",
    bg: "#FDF6E3",
    text: "#3E362E",
    readerStyles: {
      body: { background: '#FDF6E3', color: '#3E362E' },
      p: { color: '#3E362E' },
    }
  },
  sepia: {
    name: "Sepia Sunset",
    bg: "#4A3320",
    text: "#E6C6A5",
    readerStyles: {
      body: { background: '#4A3320', color: '#E6C6A5' },
      p: { color: '#E6C6A5' },
    }
  },
  midnight: {
    name: "Midnight Navy",
    bg: "#0A192F",
    text: "#CCD6F6",
    readerStyles: {
      body: { background: '#0A192F', color: '#CCD6F6' },
      p: { color: '#CCD6F6' },
    }
  }
};

export default function EReader() {
  const [location, setLocation] = useLocation();
  const { id } = useParams();
  const [bookLocation, setBookLocation] = useState<string | number>(0);
  const [theme, setTheme] = useState<Theme>("obsidian");
  const [showMenu, setShowMenu] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [duetMode, setDuetMode] = useState(false);
  const renditionRef = useRef<any>(null);
  const isRemoteSync = useRef(false);
  const sessionPagesReadRef = useRef(0);
  const lastPageRef = useRef<number | null>(null);

  const [epubData, setEpubData] = useState<ArrayBuffer | string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const blobUrlRef = useRef<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Session tracking (1 minute intervals)
  useEffect(() => {
    if (!id || loading || !epubData) return;
    
    // Set an interval to log a minute of reading
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        const pagesRead = sessionPagesReadRef.current;
        sessionPagesReadRef.current = 0; // Reset after sending

        apiFetch(`/library/${id}/session`, {
          method: "POST",
          body: JSON.stringify({ durationMinutes: 1, pagesRead })
        }).catch(err => console.error("Failed to log session:", err));
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [id, loading, epubData]);

  // Jump to location from URL params (e.g. from Memorize notes)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const loc = searchParams.get("location");
    if (loc) {
      setBookLocation(loc);
    }
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
        if (!book.epubUrl?.trim()) {
          if (!cancelled) {
            setEpubData(null);
            setLoading(false);
          }
          return;
        }

        let blob: Blob;
        let contentType = "";
        try {
          const proxied = await apiFetchBlob(`/library/${id}/file`);
          blob = proxied.blob;
          contentType = proxied.contentType;
        } catch (proxyErr) {
          console.warn("Book proxy failed, trying direct download:", proxyErr);
          const directUrl = book.epubUrl;
          if (!/cdn\.jsdelivr\.net|cloudinary\.com|raw\.githubusercontent\.com/i.test(directUrl)) {
            throw proxyErr;
          }
          const direct = await fetch(directUrl);
          if (!direct.ok) throw proxyErr;
          blob = await direct.blob();
          contentType = direct.headers.get("content-type") || "";
        }

        const pdf =
          book.epubUrl.toLowerCase().includes(".pdf") ||
          contentType.includes("application/pdf");

        const blobUrl = URL.createObjectURL(
          pdf ? blob : new Blob([await blob.arrayBuffer()], { type: "application/epub+zip" })
        );
        blobUrlRef.current = blobUrl;

        if (!cancelled) {
          setIsPdf(pdf);
          setEpubData(blobUrl);
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      } catch (e) {
        console.error(e);
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
  }, [id]);

  useEffect(() => {
    // DND MODE: Block notifications and chat while reading
    window.localStorage.setItem("DND_LIBRARY_MODE", "true");
    // Hide menu initially if we want true zen mode on load
    const timer = setTimeout(() => {
      setShowMenu(false);
    }, 3000);
    return () => {
      window.localStorage.removeItem("DND_LIBRARY_MODE");
      clearTimeout(timer);
    };
  }, []);

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

  const locationChanged = (epubcifi: string) => {
    // Clear any previous debounce
    if (syncDebounceRef.current) {
      clearTimeout(syncDebounceRef.current);
    }

    // Debounce the state update and network sync to prevent UI thread locking
    syncDebounceRef.current = setTimeout(() => {
      setBookLocation(epubcifi);
      
      // Track page read and update status to 'reading'
      if (renditionRef.current) {
         try {
           const loc = renditionRef.current.currentLocation();
           if (loc && loc.start && loc.start.displayed) {
              const page = loc.start.displayed.page;
              if (page && page > 0) {
                 if (lastPageRef.current !== null && page !== lastPageRef.current) {
                    sessionPagesReadRef.current += 1;
                 }
                 lastPageRef.current = page;

                 apiFetch(`/library/${id}/progress`, {
                   method: "PUT",
                   body: JSON.stringify({ page, status: "reading" })
                 }).catch(e => console.error("Progress tracking failed:", e));
              }
           }
         } catch (e) {
           console.error("Could not extract page number", e);
         }
      }

      // Only broadcast if it's a local user action
      if (!isRemoteSync.current && duetMode) {
        apiFetch(`/library/${id}/sync`, { 
          method: "POST", 
          body: JSON.stringify({ epubcifi }) 
        }).catch(e => console.error("Sync failed:", e));
      }
      
      // Reset the flag
      isRemoteSync.current = false;
    }, 300); // Wait 300ms after last page turn before syncing
  };

  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
    if (showSettings) setShowSettings(false);
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(80, Math.min(200, fontSize + delta));
    setFontSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}%`);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !id) return;
    setIsSavingNote(true);
    try {
      await apiFetch(`/library/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          text: noteText,
          chapterOrPage: String(bookLocation) // Saving current location
        })
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

  return (
    <div 
      className="fixed inset-0 z-[100] transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: THEMES[theme].bg, color: THEMES[theme].text }}
    >
      {/* Hidden Menu Overlay Trigger (Center tap) */}
      <div 
        className="absolute inset-0 z-10 w-1/3 left-1/3" 
        onClick={handleToggleMenu}
      />

      {/* Top Navbar */}
      <div className={`absolute top-0 left-0 right-0 p-4 pt-10 z-20 flex justify-between items-center bg-black/40 backdrop-blur-md transition-opacity duration-300 ${showMenu ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button onClick={() => setLocation("/library")} className="p-2 rounded-full hover:bg-white/10 active:scale-90 text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => setDuetMode(!duetMode)} 
            className={`p-2 rounded-full hover:bg-white/10 active:scale-90 ${duetMode ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]' : 'text-white'}`}
            title="Duet Mode (Sync Pages)"
          >
            <LinkIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowNoteModal(true)} 
            className="p-2 rounded-full hover:bg-white/10 active:scale-90 text-white"
            title="Take Note"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="p-2 rounded-full hover:bg-white/10 active:scale-90 text-white"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-24 right-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-30 w-64 text-white">
          <h4 className="text-sm font-bold mb-3 opacity-70">THEME</h4>
          <div className="flex justify-between mb-6">
            {(Object.keys(THEMES) as Theme[]).map(t => (
              <button 
                key={t}
                onClick={() => setTheme(t)}
                className={`w-10 h-10 rounded-full border-2 ${theme === t ? "border-primary" : "border-transparent"}`}
                style={{ backgroundColor: THEMES[t].bg }}
              />
            ))}
          </div>

          <h4 className="text-sm font-bold mb-3 opacity-70">FONT SIZE</h4>
          <div className="flex items-center justify-between bg-white/5 rounded-full p-1">
            <button onClick={() => changeFontSize(-10)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
              <Type className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm">{fontSize}%</span>
            <button onClick={() => changeFontSize(10)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
              <Type className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reader */}
      <div className="flex-1 relative z-0 pb-10" style={{ height: "100vh" }}>
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium tracking-widest uppercase">Opening Book...</p>
          </div>
        ) : !epubData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Info className="w-10 h-10 text-white/30" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">
              {loadError ? "Error Loading Book" : "No Digital Version Available"}
            </h2>
            <p className="text-white/50 max-w-sm mb-8">
              {loadError || "This book has no downloadable file. Remove it and add again from search results that include EPUB or PDF."}
            </p>
            <button 
              onClick={() => setLocation("/library")}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              Return to Library
            </button>
          </div>
        ) : isPdf && typeof epubData === "string" ? (
          <div className="w-full h-full bg-white relative">
             <iframe
               src={epubData}
               className="w-full h-full border-none absolute inset-0"
               title="PDF Viewer"
             />
          </div>
        ) : (
          <ReactReader
            url={epubData}
          epubInitOptions={{ openAs: 'epub' }}
          location={bookLocation}
          locationChanged={locationChanged}
          getRendition={(rendition) => {
            renditionRef.current = rendition;
            rendition.themes.register('custom', THEMES[theme].readerStyles);
            rendition.themes.select('custom');
            rendition.themes.fontSize(`${fontSize}%`);
          }}
          tocChanged={() => {}}
          swipeable
          epubOptions={{
            flow: "paginated",
            manager: "continuous",
            spread: "none"
          }}
          readerStyles={{
            // Spread all required default styles first, then override what we need
            ...ReactReaderStyle,
            container:  { ...ReactReaderStyle.container,  width: '100%', height: '100%' },
            readerArea: { ...ReactReaderStyle.readerArea, width: '100%', height: '100%', transition: 'background-color 0.5s' },
            titleArea:  { ...ReactReaderStyle.titleArea,  display: 'none' },
            tocArea:    { ...ReactReaderStyle.tocArea,    display: 'none' },
            arrow:      { ...ReactReaderStyle.arrow,      background: 'transparent', padding: '0 20px', color: THEMES[theme].text, opacity: '0.3' },
          }}
        />
        )}
      </div>

      {/* Bottom Bar Scrubber */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${showMenu && !showNoteModal ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
         <div className="flex justify-center text-xs font-bold uppercase tracking-wider text-white opacity-80">
            Zen Mode Active
         </div>
      </div>

      {/* Take Note Modal */}
      {showNoteModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[var(--lib-card)] rounded-t-3xl p-6 h-[50vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300" style={{ backgroundColor: THEMES[theme].bg, color: THEMES[theme].text }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Note this thought
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="p-2 hover:bg-black/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <textarea
              className="w-full flex-1 bg-black/5 border border-black/10 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
              style={{ color: THEMES[theme].text }}
              placeholder="What did you learn from this page?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              autoFocus
            />

            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSaveNote}
                disabled={isSavingNote || !noteText.trim()}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSavingNote ? "Saving..." : <><Send className="w-4 h-4" /> Save Note</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
