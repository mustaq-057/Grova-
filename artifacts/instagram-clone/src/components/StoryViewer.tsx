import { useState, useEffect, useMemo } from "react";
import { X, Pause, Play, MoreVertical, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { api } from "../lib/api";
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [localStories, setLocalStories] = useState(stories);

  useEffect(() => {
    setLocalStories(stories);
  }, [stories]);

  useEffect(() => {
    if (isPaused || showMoreMenu) return;

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < localStories.length - 1) {
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
  }, [currentIndex, isPaused, showMoreMenu, localStories.length, onClose]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteStory(id);
      const updated = localStories.filter(s => s.id !== id);
      if (updated.length === 0) {
        onClose();
      } else {
        setLocalStories(updated);
        setCurrentIndex(c => (c >= updated.length ? updated.length - 1 : c));
        setProgress(0);
        setShowMoreMenu(false);
        setIsPaused(false);
      }
    } catch (e) {
      console.error("Failed to delete story", e);
      alert("Failed to delete story.");
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (showMoreMenu) return; // Ignore taps when menu is open
    
    // Ignore taps on controls
    if ((e.target as HTMLElement).closest('.story-controls')) return;

    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const width = window.innerWidth;
    
    if (x < width * 0.3) {
      if (currentIndex > 0) {
        setCurrentIndex(c => c - 1);
      }
    } else {
      if (currentIndex < localStories.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        onClose();
      }
    }
  };

  if (localStories.length === 0) return null;

  const currentStory = localStories[currentIndex];

  let textOverlayData = null;
  if (currentStory?.textOverlay) {
    try {
      textOverlayData = JSON.parse(currentStory.textOverlay);
    } catch (e) { }
  }

  const isVideo = currentStory?.mediaUrl?.includes(".mp4") || currentStory?.mediaUrl?.includes(".webm");

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-[500] bg-black flex flex-col font-sans select-none"
      >
        {/* Progress Bars */}
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-0 right-0 p-2 flex gap-1 z-20">
          {localStories.map((story, idx) => (
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
          <div className="flex items-center gap-2 story-controls pointer-events-auto">
            <button 
              onClick={() => setIsPaused(p => !p)} 
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors drop-shadow-md"
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setShowMoreMenu(m => !m)} 
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors drop-shadow-md relative"
            >
              <MoreVertical className="w-6 h-6" />
              {showMoreMenu && (
                <div className="absolute top-10 right-0 bg-[#262626] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[150px] z-[510]">
                  <div 
                    onClick={() => handleDelete(currentStory.id)}
                    className="px-4 py-3 text-red-500 font-medium hover:bg-white/5 active:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <Trash className="w-5 h-5" />
                    Delete
                  </div>
                </div>
              )}
            </button>
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full drop-shadow-md transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Media */}
        <div 
          className="flex-1 relative"
          onMouseDown={() => { if (!showMoreMenu) setIsPaused(true); }}
          onMouseUp={(e) => { setIsPaused(false); handleTap(e); }}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => { if (!showMoreMenu) setIsPaused(true); }}
          onTouchEnd={(e) => { setIsPaused(false); handleTap(e); }}
        >
          {currentStory.mediaUrl && (
            isVideo ? (
              <video 
                src={`/api/media/inline?url=${encodeURIComponent(currentStory.mediaUrl)}&type=video/mp4`} 
                className="w-full h-full object-cover" 
                autoPlay 
                loop 
                muted 
                playsInline
                draggable={false}
              />
            ) : (
              <img 
                src={`/api/media/inline?url=${encodeURIComponent(currentStory.mediaUrl)}&type=image/jpeg`} 
                className="w-full h-full object-cover" 
                draggable={false}
                alt="Story"
              />
            )
          )}
          {textOverlayData && (
             <div 
               className="absolute z-10 text-center whitespace-pre-wrap select-none pointer-events-none"
               style={{ 
                 left: `${textOverlayData.x * 100}%`, 
                 top: `${textOverlayData.y * 100}%`,
                 transform: 'translate(-50%, -50%)',
                 fontFamily: textOverlayData.fontFamily,
                 color: textOverlayData.textColor,
                 fontSize: 'min(10vw, 40px)',
                 fontWeight: 'bold',
                 textShadow: '0px 2px 10px rgba(0,0,0,0.5)'
               }}
             >
               {textOverlayData.text}
             </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
