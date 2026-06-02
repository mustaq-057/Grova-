import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchTrendingGifs,
  searchGifs,
  hasGiphyKey,
  GIPHY_MAX_ITEMS,
  GIPHY_PAGE_SIZE,
  type GiphyMedia,
} from "@/lib/giphy";

type Props = { onSelect: (url: string) => void; onClose: () => void };

export default function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyMedia[]>([]);
  const offsetRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const loadPage = async (reset: boolean) => {
    if (!hasGiphyKey() || loadingRef.current) return;
    const nextOffset = reset ? 0 : offsetRef.current;
    if (!reset && nextOffset >= GIPHY_MAX_ITEMS) {
      setHasMore(false);
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    const q = queryRef.current;
    const batch = q.trim() ? await searchGifs(q, nextOffset) : await fetchTrendingGifs(nextOffset);
    setGifs((prev) => (reset ? batch : [...prev, ...batch]));
    offsetRef.current = nextOffset + batch.length;
    setHasMore(batch.length >= GIPHY_PAGE_SIZE && offsetRef.current < GIPHY_MAX_ITEMS);
    loadingRef.current = false;
    setLoading(false);
  };

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void loadPage(true), 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadPage(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute bottom-full left-0 mb-2 w-[min(100vw-2rem,22rem)] sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[min(70vh,400px)]"
        data-testid="gif-picker"
      >
        <div className="p-2 border-b border-border flex items-center gap-2 shrink-0">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto scrollbar-hide p-1.5 min-h-[180px]">
          {!hasGiphyKey() ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4 py-8">
              Add VITE_GIPHY_API_KEY to .env — free key at developers.giphy.com (2000+ trending GIFs)
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelect(gif.url);
                      onClose();
                    }}
                    className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary"
                  >
                    <img src={gif.preview} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
              {loading && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {!loading && gifs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No GIFs found</p>
              )}
            </>
          )}
        </div>

        <div className="px-2 py-1.5 text-center border-t border-border shrink-0">
          <span className="text-[10px] text-muted-foreground/50">Powered by GIPHY · scroll to load more</span>
        </div>
      </motion.div>
    </>
  );
}
