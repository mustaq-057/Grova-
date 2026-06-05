import { memo } from "react";
import { Pencil, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
};

export const EditMessageBar = memo(function EditMessageBar({
  value,
  onChange,
  onSave,
  onCancel,
  saving = false,
}: Props) {
  return (
    <div className="mx-3 mb-2 rounded-2xl bg-[#262626] border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <Pencil className="w-4 h-4 text-primary shrink-0" aria-hidden />
        <p className="text-xs font-semibold text-primary">Edit message</p>
        <button
          type="button"
          onClick={onCancel}
          className="ml-auto shrink-0 p-1 text-white/60 hover:text-white"
          aria-label="Cancel edit"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 p-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSave();
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder="Edit message..."
          className="flex-1 min-w-0 px-4 py-2.5 bg-background/80 border border-white/10 rounded-full text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
          disabled={saving}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !value.trim()}
          className="shrink-0 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
});
