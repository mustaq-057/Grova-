import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { getQuickReactions, applyQuickReactions } from "@/lib/quick-reactions";
import { api } from "@/lib/api";

type Props = {
  show: boolean;
  onClose: () => void;
};

export function QuickReactionsCustomizeModal({ show, onClose }: Props) {
  const [emojis, setEmojis] = useState<string[]>(getQuickReactions());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEmoji, setTempEmoji] = useState("");

  const handleSave = async () => {
    try {
      await api.updateCouplePrefs({ quickEmojis: emojis });
      applyQuickReactions(emojis);
      onClose();
    } catch {
      alert("Could not save — check your connection.");
    }
  };

  const handleEmojiChange = (index: number, newEmoji: string) => {
    const updated = [...emojis];
    updated[index] = newEmoji;
    setEmojis(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (dragIndex === dropIndex) return;

    const updated = [...emojis];
    const [draggedEmoji] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, draggedEmoji);
    setEmojis(updated);
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[101] flex items-center justify-center p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Customize Quick Reactions</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Drag to reorder, or click to change an emoji (max 5)
            </p>

            <div className="space-y-2 mb-6">
              {emojis.map((emoji, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors cursor-move"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => {
                      setEditingIndex(index);
                      setTempEmoji(emoji);
                    }}
                    className="flex-1 text-3xl hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </button>
                </div>
              ))}
            </div>

            {editingIndex !== null && (
              <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">Enter new emoji:</p>
                <input
                  type="text"
                  value={tempEmoji}
                  onChange={(e) => setTempEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-2xl text-center"
                  maxLength={2}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (tempEmoji) {
                        handleEmojiChange(editingIndex, tempEmoji);
                      }
                      setEditingIndex(null);
                      setTempEmoji("");
                    }}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(null);
                      setTempEmoji("");
                    }}
                    className="flex-1 px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
