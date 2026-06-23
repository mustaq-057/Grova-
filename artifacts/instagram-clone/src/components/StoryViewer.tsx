import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import type { ApiStory } from "../lib/api";

interface StoryViewerProps {
  stories: ApiStory[];
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000;

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + (100 / (STORY_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, onClose]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const width = window.innerWidth;
    
    if (x < width * 0.3) {
      if (currentIndex > 0) {
        setCurrentIndex(c => c - 1);
      }
    } else {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        onClose();
      }
    }
  };

  if (stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[500] bg-black flex flex-col font-sans select-none"
      >
        {/* Progress Bars */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-0 right-0 p-2 flex gap-1 z-20">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-0 right-0 mt-6 px-4 flex justify-between items-center z-20 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm drop-shadow-md">Story</span>
            <span className="text-white/70 text-xs drop-shadow-md">
              {new Date(parseInt(currentStory.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full pointer-events-auto">
            <X className="w-6 h-6 drop-shadow-md" />
          </button>
        </div>

        {/* Media */}
        <div 
          className="flex-1 relative"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={(e) => { setIsPaused(false); handleTap(e); }}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={(e) => { setIsPaused(false); handleTap(e); }}
        >
          {currentStory.mediaUrl && (
            <img 
              src={`/api/media/inline?url=${encodeURIComponent(currentStory.mediaUrl)}&type=image/jpeg`} 
              className="w-full h-full object-cover" 
              draggable={false}
              alt="Story"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
