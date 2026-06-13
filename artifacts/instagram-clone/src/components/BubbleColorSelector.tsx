import { memo } from "react";
import { X } from "lucide-react";
import { THEMES } from "@/lib/themes";

interface BubbleColorSelectorProps {
  show: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelect: (themeId: string) => void;
}

export const BubbleColorSelector = memo(function BubbleColorSelector({
  show,
  onClose,
  currentThemeId,
  onSelect,
}: BubbleColorSelectorProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" 
      onClick={onClose}
    >
      <div
        className="bg-[#121826] border border-border rounded-2xl w-full max-w-[360px] p-5 shadow-xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="font-bold text-lg text-white">Bubble color</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-y-6 gap-x-2 overflow-y-auto pb-4 scrollbar-hide">
          {THEMES.filter(t => t.id !== "moonlight-saga").map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t.id);
                onClose();
              }}
              className="flex flex-col items-center gap-2 group outline-none"
            >
              <div 
                className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all ${
                  currentThemeId === t.id ? "ring-2 ring-[#38bdf8] ring-offset-2 ring-offset-[#121826]" : ""
                }`}
                style={{ backgroundColor: t.bubbleColor }}
              />
              <span className="text-[12px] font-medium text-white/80">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
