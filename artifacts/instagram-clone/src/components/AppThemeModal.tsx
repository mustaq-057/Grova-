import { memo } from "react";
import { X } from "lucide-react";
import { APP_THEMES, applyAppTheme, type AppThemeId } from "@/lib/app-theme";

type Props = {
  show: boolean;
  onClose: () => void;
  current: AppThemeId;
  onSelect: (id: AppThemeId) => void;
};

export const AppThemeModal = memo(function AppThemeModal({ show, onClose, current, onSelect }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">App themes</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-secondary rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Nav, profile & settings only — chat colors use the palette button in chat.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {APP_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t.id);
                applyAppTheme(t.id);
                onClose();
              }}
              className={`text-left p-3 rounded-xl border-2 transition-all ${current === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              <div className={`w-full h-8 rounded-lg mb-2 ${t.swatch}`} />
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
