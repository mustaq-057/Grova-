import { motion } from "framer-motion";
import { GREETING_TEMPLATES, type GreetingTemplate } from "@/lib/greeting-messages";

type Props = {
  onSelect: (g: GreetingTemplate) => void;
  onClose: () => void;
};

export default function GreetingPicker({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-0 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-56"
        data-testid="greeting-picker"
      >
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-2 font-semibold">
          Quick replies ({GREETING_TEMPLATES.length})
        </p>
        <div className="overflow-y-auto scrollbar-hide p-2 flex flex-wrap gap-1.5 max-h-44">
          {GREETING_TEMPLATES.map((g) => (
            <button
              key={g.id}
              onClick={() => { onSelect(g); onClose(); }}
              className="text-left text-xs px-3 py-2 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
            >
              <span className="emoji-native text-base leading-none shrink-0">{g.companionSticker}</span>
              <span>{g.text}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
