import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Undo2 } from "lucide-react";

type Props = {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const UnsendConfirmModal = memo(function UnsendConfirmModal({ show, onConfirm, onCancel }: Props) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] px-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-destructive/10 rounded-full mx-auto mb-4">
            <Undo2 className="w-6 h-6 text-destructive" />
          </div>

          <h3 className="text-lg font-bold text-center mb-2">Unsend message?</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            The message will be removed from both sides of the conversation. Everyone will know it was unsent.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/90 transition-colors"
            >
              Unsend
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
