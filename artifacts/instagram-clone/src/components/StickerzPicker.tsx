import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CUSTOM_STICKERZ, type CustomSticker, type StickerCategory } from "@/lib/stickerz";

interface StickerzPickerProps {
  onSelect: (sticker: CustomSticker) => void;
  onClose: () => void;
}

export function StickerzPicker({ onSelect, onClose }: StickerzPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Group stickers by category
  const groupedStickers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query 
      ? CUSTOM_STICKERZ.filter(s => s.caption.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
      : CUSTOM_STICKERZ;

    const groups: Record<string, CustomSticker[]> = {};
    for (const sticker of filtered) {
      if (!groups[sticker.category]) {
        groups[sticker.category] = [];
      }
      groups[sticker.category].push(sticker);
    }
    return groups;
  }, [searchQuery]);

  return (
    <>
      <div 
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed z-[301] bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-24 md:w-[400px] md:rounded-3xl bg-[#1c1c1c] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-[70vh] md:h-[600px] border border-white/10"
        role="dialog"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-white">Stickerz</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stickerz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6">
          {Object.entries(groupedStickers).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <p>No stickerz found</p>
            </div>
          ) : (
            Object.entries(groupedStickers).map(([category, stickers]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider pl-1">
                  {category}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => onSelect(sticker)}
                      className="group flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95"
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                        <img 
                          src={sticker.url} 
                          alt={sticker.caption} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[9px] text-center text-white/70 line-clamp-1 w-full px-0.5 leading-tight group-hover:text-white">
                        {sticker.caption}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
