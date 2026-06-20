import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ReactReader, ReactReaderStyle } from "react-reader";
import { ChevronLeft, Settings, Info, Type, Link as LinkIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

  // Fallback to a free sample alice in wonderland epub if the db book has no epubUrl
  // since most Google books don't have direct epub downloads in the search list.
  const FALLBACK_EPUB = "https://s3.amazonaws.com/moby-dick/moby-dick.epub";
  const [epubUrl, setEpubUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/library/${id}`).then((book: any) => {
      setEpubUrl(book.epubUrl || FALLBACK_EPUB);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setEpubUrl(FALLBACK_EPUB);
      setLoading(false);
    });
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
        {loading || !epubUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium tracking-widest uppercase">Opening Book...</p>
          </div>
        ) : (
          <ReactReader
            url={epubUrl}
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
      <div className={`absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${showMenu ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
         <div className="flex justify-center text-xs font-bold uppercase tracking-wider text-white opacity-80">
            Zen Mode Active
         </div>
      </div>
    </div>
  );
}
