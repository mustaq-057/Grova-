import { useState, useEffect, useRef } from "react";
import { X, Pause, Play, Trash2 } from "lucide-react";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localStories, setLocalStories] = useState(stories);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { setLocalStories(stories); }, [stories]);

  // Progress timer
  useEffect(() => {
    if (isPaused || showDeleteConfirm || deleting) return;
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
  }, [currentIndex, isPaused, showDeleteConfirm, deleting, localStories.length, onClose]);

  // Reset progress when switching stories
  useEffect(() => { setProgress(0); }, [currentIndex]);

  // Auto-dismiss error
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 3000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const handleDelete = async () => {
    const id = localStories[currentIndex]?.id;
    if (!id) return;
    setDeleting(true);
    try {
      // Optimistically update UI first
      const updated = localStories.filter(s => s.id !== id);
      if (updated.length === 0) {
        onClose();
        return;
      }
      setLocalStories(updated);
      setCurrentIndex(c => Math.min(c, updated.length - 1));
      setProgress(0);
      setShowDeleteConfirm(false);
      setIsPaused(false);

      // Then call API in background
      await api.deleteStory(id);
    } catch (e) {
      console.error("Failed to delete story", e);
      setErrorMsg("Failed to delete story.");
      // Re-add the story back if API failed
      setLocalStories(stories);
    } finally {
      setDeleting(false);
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
      return;
    }
    if ((e.target as HTMLElement).closest('.story-controls')) return;

    const clientX = 'touches' in e
      ? (e as React.TouchEvent).changedTouches[0]?.clientX
      : (e as React.MouseEvent).clientX;

    if (clientX == null) return;
    const width = window.innerWidth;

    if (clientX < width * 0.3) {
      if (currentIndex > 0) setCurrentIndex(c => c - 1);
    } else {
      if (currentIndex < localStories.length - 1) setCurrentIndex(c => c + 1);
      else onClose();
    }
  };

  if (localStories.length === 0) return null;

  const currentStory = localStories[currentIndex];
  if (!currentStory) return null;

  let textOverlayData: { text: string; fontFamily: string; textColor: string; x: number; y: number } | null = null;
  if (currentStory.textOverlay) {
    try { textOverlayData = JSON.parse(currentStory.textOverlay); } catch { }
  }

  const mediaUrl = currentStory.mediaUrl;
  const isVideo = mediaUrl?.includes(".mp4") || mediaUrl?.includes(".webm");

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        key="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-black font-sans select-none flex flex-col"
        onContextMenu={e => e.preventDefault()}
      >
        {/* Progress Bars */}
        <div className="absolute top-safe left-0 right-0 px-3 pt-3 flex gap-1 z-20 pointer-events-none">
          {localStories.map((story, idx) => (
            <div key={story.id} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
                  transition: idx === currentIndex ? "width 50ms linear" : "none"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-safe left-0 right-0 mt-5 px-4 flex justify-between items-center z-20 story-controls">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm drop-shadow-md">Story</span>
            <span className="text-white/60 text-xs drop-shadow-md">
              {new Date(parseInt(currentStory.createdAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Pause / Play */}
            <button
              onClick={() => setIsPaused(p => !p)}
              className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            {/* Delete */}
            <button
              onClick={() => { setShowDeleteConfirm(true); setIsPaused(true); }}
              className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Area */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onMouseDown={() => { if (!showDeleteConfirm) setIsPaused(true); }}
          onMouseUp={e => { setIsPaused(false); handleTap(e); }}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => { if (!showDeleteConfirm) setIsPaused(true); }}
          onTouchEnd={e => { setIsPaused(false); handleTap(e); }}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Blurred background */}
          {mediaUrl && !isVideo && (
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${mediaUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(24px) brightness(0.5)"
              }}
            />
          )}

          {/* Actual media */}
          {mediaUrl && (
            isVideo ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                className="relative w-full h-full object-contain z-10"
                autoPlay
                loop
                muted
                playsInline
                draggable={false}
              />
            ) : (
              <img
                key={mediaUrl}
                src={mediaUrl}
                className="relative max-w-full max-h-full object-contain z-10 drop-shadow-2xl"
                draggable={false}
                alt="Story"
              />
            )
          )}

          {/* Text overlay */}
          {textOverlayData && (
            <div
              className="absolute z-20 text-center whitespace-pre-wrap select-none pointer-events-none"
              style={{
                left: `${textOverlayData.x * 100}%`,
                top: `${textOverlayData.y * 100}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: textOverlayData.fontFamily,
                color: textOverlayData.textColor,
                fontSize: "min(10vw, 40px)",
                fontWeight: "bold",
                textShadow: "0px 2px 10px rgba(0,0,0,0.6)"
              }}
            >
              {textOverlayData.text}
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/20 pointer-events-none z-10" />
        </div>

        {/* Error toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation sheet */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 z-30"
                onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
              />
              {/* Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="absolute bottom-0 left-0 right-0 z-40 bg-[#1c1c1e] rounded-t-2xl overflow-hidden story-controls"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
                <p className="text-center text-white/60 text-sm mb-4 px-6">Delete this story? This cannot be undone.</p>
                <div className="border-t border-white/10">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full py-4 text-red-500 font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    {deleting ? "Deleting…" : "Delete Story"}
                  </button>
                </div>
                <div className="border-t border-white/10">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                    className="w-full py-4 text-white font-medium text-base hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
