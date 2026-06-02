import { memo, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  stories: string[];
  username: string;
  avatar: string;
  onClose: () => void;
};

export const StoryViewer = memo(function StoryViewer({ stories, username, avatar, onClose }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      if (index < stories.length - 1) setIndex((i) => i + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(t);
  }, [index, stories.length, onClose]);

  const story = stories[index];
  if (!story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  i < index ? "w-full" : i === index ? "w-1/2 animate-pulse" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-4">
          <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20" />
          <span className="text-white font-semibold text-sm drop-shadow">{username}</span>
          <span className="text-white/60 text-xs">Just now</span>
          <button type="button" onClick={onClose} className="ml-auto text-white p-2" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <img src={story} alt="" className="flex-1 w-full object-contain bg-black" />

        {index > 0 && (
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/80"
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Previous"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white/80"
            onClick={() => setIndex((i) => i + 1)}
            aria-label="Next"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Footer — IG style */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent">
          <input
            type="text"
            placeholder={`Reply to ${username}...`}
            className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none"
            readOnly
          />
          <button type="button" className="text-white p-2" aria-label="Like story">
            <Heart className="w-6 h-6" />
          </button>
          <button type="button" className="text-white p-2" aria-label="Share story">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
