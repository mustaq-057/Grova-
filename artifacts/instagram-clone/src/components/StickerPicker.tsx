import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X, Loader2, Sticker } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchTrendingStickers,
  searchStickers,
  hasGiphyKey,
  GIPHY_MAX_ITEMS,
  GIPHY_PAGE_SIZE,
  type GiphyMedia,
} from "@/lib/giphy";

type Props = {
  onSelect: (sticker: string) => void;
  onSelectGif?: (url: string) => void;
  onClose: () => void;
};

export default function StickerPicker({ onSelect, onSelectGif, onClose }: Props) {
  const giphyReady = hasGiphyKey();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyMedia[]>([]);
  const offsetRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const loadPage = async (reset: boolean) => {
    if (!giphyReady || loadingRef.current) return;
    const nextOffset = reset ? 0 : offsetRef.current;
    if (!reset && nextOffset >= GIPHY_MAX_ITEMS) {
      setHasMore(false);
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    const q = queryRef.current;
    const batch = q.trim()
      ? await searchStickers(q, nextOffset)
      : await fetchTrendingStickers(nextOffset);
    setItems((prev) => (reset ? batch : [...prev, ...batch]));
    offsetRef.current = nextOffset + batch.length;
    setHasMore(batch.length >= GIPHY_PAGE_SIZE && offsetRef.current < GIPHY_MAX_ITEMS);
    loadingRef.current = false;
    setLoading(false);
  };

  useEffect(() => {
    if (!giphyReady) return;
    offsetRef.current = 0;
    setHasMore(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void loadPage(true), 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, giphyReady]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore || !giphyReady) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadPage(false);
  }, [loading, hasMore, giphyReady]);

  const pickGiphy = useCallback((item: GiphyMedia) => {
    if (onSelectGif) onSelectGif(item.url);
    else onSelect(item.url);
    onClose();
  }, [onSelect, onSelectGif, onClose]);

  const runSearch = useCallback(() => {
    if (!giphyReady) return;
    offsetRef.current = 0;
    setHasMore(true);
    void loadPage(true);
  }, [giphyReady]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[201] left-0 right-0 bottom-16 sm:bottom-14 md:bottom-0 max-h-[min(50vh,400px)] md:max-h-[min(58vh,440px)] bg-card/98 backdrop-blur-xl border-t border-border rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        data-testid="sticker-picker"
        role="dialog"
        aria-label="Sticker picker"
      >
        <div className="p-2 border-b border-border flex items-center gap-2 shrink-0">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search stickers..."
            disabled={!giphyReady}
            className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={runSearch}
            disabled={!giphyReady}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            Search
          </button>
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto scrollbar-hide p-2 min-h-[180px]">
          {!giphyReady ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
              <Sticker className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No stickers available</p>
              <p className="text-xs text-muted-foreground/70">
                Add a GIPHY API key in .env to enable sticker search
              </p>
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">No stickers available</p>
              {query.trim() && (
                <p className="text-xs text-muted-foreground/70">Try a different search term</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => pickGiphy(item)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary bg-secondary/30 active:ring-2 active:ring-primary transition-all duration-150"
                    title={item.title}
                  >
                    <img src={item.preview} alt="" className="w-full h-full object-contain" loading="lazy" />
                  </motion.button>
                ))}
              </div>
              {loading && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {!hasMore && items.length > 0 && (
                <p className="text-[10px] text-center text-muted-foreground py-2">End of results</p>
              )}
            </>
          )}
        </div>

        {giphyReady && (
          <div className="px-2 py-1.5 text-center border-t border-border shrink-0">
            <span className="text-[10px] text-muted-foreground/50">Powered by GIPHY</span>
          </div>
        )}
      </motion.div>
    </>,
    document.body,
  );
}
