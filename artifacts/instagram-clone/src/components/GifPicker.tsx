import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

const GIPHY_KEY = "dc6zaTOxFJmzC";

interface GifItem {
  id: string;
  url: string;
  preview: string;
}

async function fetchGifs(query: string): Promise<GifItem[]> {
  try {
    const endpoint = query.trim()
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=18&rating=g`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=18&rating=g`;
    const res = await fetch(endpoint);
    const json = await res.json();
    return (json.data as { id: string }[]).map((g) => ({
      id: g.id,
      url: `https://media.giphy.com/media/${g.id}/giphy.gif`,
      preview: `https://media.giphy.com/media/${g.id}/200w.gif`,
    }));
  } catch {
    return [];
  }
}

type Props = { onSelect: (url: string) => void; onClose: () => void };

export default function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const results = await fetchGifs(query);
      setGifs(results);
      setLoading(false);
    }, 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query]);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
        data-testid="gif-picker"
      >
        {/* Search */}
        <div className="p-2 border-b border-border flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="h-52 overflow-y-auto scrollbar-hide p-1">
          {loading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-secondary/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No GIFs found
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => { onSelect(gif.url); onClose(); }}
                  className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  <img
                    src={gif.preview}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-2 pb-1.5 text-center">
          <span className="text-[10px] text-muted-foreground/40">Powered by GIPHY</span>
        </div>
      </motion.div>
    </>
  );
}
