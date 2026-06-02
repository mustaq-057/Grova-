import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { THEMES, THEME_SWATCHES } from "@/lib/themes";

interface ThemePickerProps {
  show: boolean;
  onClose: () => void;
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemePicker = memo(function ThemePicker({ show, onClose, currentThemeId, onThemeChange }: ThemePickerProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 pb-20 md:pb-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Bubble color</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
              aria-label="Close theme picker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  currentThemeId === t.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105"
                }`}
                aria-label={`Select ${t.name} theme`}
                aria-pressed={currentThemeId === t.id}
              >
                <div className={`w-8 h-8 rounded-full ${THEME_SWATCHES[t.id]}`} />
                <span className="text-xs text-muted-foreground">{t.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
