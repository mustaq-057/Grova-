import { useState, useEffect } from "react";
import { Check, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface PendingMediaPreviewProps {
  file: File;
  onCancel: () => void;
  onSend: (viewMode: "keep" | "once" | "twice") => void;
  disabled?: boolean;
}

export function PendingMediaPreview({ file, onCancel, onSend, disabled }: PendingMediaPreviewProps) {
  const [viewMode, setViewMode] = useState<"keep" | "once" | "twice">("keep");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showViewMenu, setShowViewMenu] = useState(true);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSend = () => {
    onSend(viewMode);
  };

  return (
    <div className="relative w-full z-20 shrink-0 px-0 pt-1.5 pb-1 flex justify-between items-end gap-2 max-w-[800px] mx-auto min-h-[60px]">
      <div className="relative flex-1">
        {showViewMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-[10px] sm:left-[14px] mb-2 bg-[#2c2c2e] rounded-[24px] p-4 shadow-xl min-w-[280px]"
          >
            <p className="text-[#a1a1aa] text-[13px] px-1 mb-3">Set how many times this photo<br/>can be viewed.</p>
            
            <button 
              onClick={() => setViewMode("once")}
              className="flex items-center gap-4 w-full py-3 px-1 text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="relative flex items-center justify-center w-6 h-6 border-2 border-white rounded-full">
                <span className="text-[12px] font-bold">1</span>
                <div className="absolute -right-[2px] -top-[2px] w-[6px] h-[6px] border-r-2 border-t-2 border-white rounded-tr-full" />
              </div>
              <span className="text-[17px] flex-1 text-left">View once</span>
              {viewMode === "once" && <Check className="w-5 h-5 text-white" />}
            </button>

            <button 
              onClick={() => setViewMode("twice")}
              className="flex items-center gap-4 w-full py-3 px-1 text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="relative flex items-center justify-center w-6 h-6 border-2 border-white rounded-full">
                <span className="text-[12px] font-bold">2</span>
                <div className="absolute -right-[2px] -top-[2px] w-[6px] h-[6px] border-r-2 border-t-2 border-white rounded-tr-full" />
              </div>
              <span className="text-[17px] flex-1 text-left">View twice</span>
              {viewMode === "twice" && <Check className="w-5 h-5 text-white" />}
            </button>

            <button 
              onClick={() => setViewMode("keep")}
              className="flex items-center gap-4 w-full py-3 px-1 text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <div className="flex items-center justify-center w-6 h-6 border-2 border-white rounded-full">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-[17px] flex-1 text-left">Unlimited views</span>
              {viewMode === "keep" && <Check className="w-5 h-5 text-white" />}
            </button>
          </motion.div>
        )}

        <button 
          onClick={() => setShowViewMenu(!showViewMenu)}
          className="ml-[10px] sm:ml-[14px] px-5 py-[10px] bg-[#1a1a1a] rounded-full text-white text-[15px] font-medium border border-white/10 flex items-center gap-2"
        >
          {viewMode === "once" ? "View once" : viewMode === "twice" ? "View twice" : "Unlimited views"}
        </button>
      </div>

      <div className="flex items-center gap-2 px-[10px] sm:px-[14px] pb-1">
        <button 
          onClick={onCancel}
          disabled={disabled}
          className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          disabled={disabled}
          className="h-10 pl-1 pr-4 rounded-full bg-white text-black flex items-center gap-2 font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          {previewUrl && (
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ml-[2px]">
              {file.type.startsWith('video/') ? (
                <video src={previewUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
