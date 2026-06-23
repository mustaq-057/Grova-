import { useState, useMemo, useEffect } from "react";
import { getLocalBlobUrl } from "@/lib/media-url";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CUSTOM_STICKERZ, type CustomSticker, getAllStickers, addCustomSticker } from "@/lib/stickerz";
import { uploadMediaFile } from "@/lib/media-upload";
import { Plus, Loader2 } from "lucide-react";

interface StickerzPickerProps {
  onSelect: (sticker: CustomSticker) => void;
  onClose: () => void;
}

export function StickerzPicker({ onSelect, onClose }: StickerzPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stickers, setStickers] = useState(getAllStickers);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const onUpdate = () => setStickers(getAllStickers());
    window.addEventListener("custom_stickerz_updated", onUpdate);
    return () => window.removeEventListener("custom_stickerz_updated", onUpdate);
  }, []);

  const filteredStickers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query 
      ? stickers.filter(s => s.caption.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
      : stickers;
  }, [searchQuery, stickers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadCaption("");
  };

  const handleSave = async () => {
    if (!uploadFile) return;
    setIsSaving(true);
    try {
      const url = await uploadMediaFile(uploadFile, uploadFile.type);
      addCustomSticker(url, uploadCaption || "custom sticker");
      setUploadFile(null);
      setUploadPreview("");
    } catch (err) {
      console.error("Failed to upload custom sticker", err);
      alert("Failed to save sticker. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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

        {uploadFile ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-2 shadow-xl">
              <img src={uploadPreview} alt="preview" className="w-full h-full object-contain" />
            </div>
            <input
              type="text"
              placeholder="Give it a caption (e.g., 'angry cat')"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full max-w-sm bg-[#2a2a2a] text-white text-center rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={() => setUploadFile(null)}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-24">
          {filteredStickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <p>No stickerz found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <label className="group flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border border-dashed border-white/20 hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="w-full aspect-square rounded-lg flex items-center justify-center">
                  <Plus className="w-8 h-8 text-white/50 group-hover:text-white/80" />
                </div>
                <span className="text-[9px] text-center text-white/50 w-full leading-tight">Add Custom</span>
              </label>
              {filteredStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => onSelect(sticker)}
                  className="group flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                    <img 
                      src={getLocalBlobUrl(sticker.url) || sticker.url} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 text-transparent"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <span className="text-[9px] text-center text-white/70 line-clamp-1 w-full px-0.5 leading-tight group-hover:text-white">
                    {sticker.caption}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </motion.div>
    </>
  );
}
