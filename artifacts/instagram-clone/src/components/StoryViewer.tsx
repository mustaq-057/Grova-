import { useState, useEffect, useRef, useCallback } from "react";
import { X, Pause, Play, Trash2, Heart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { api } from "../lib/api";
import type { ApiStory } from "../lib/api";

import { useAuth } from "@/lib/auth";

interface StoryViewerProps {
  stories: ApiStory[];
  initialIndex?: number;
  onClose: () => void;
  /** Called when a story is deleted so parent can refresh its story list */
  onStoriesChanged?: () => void;
}

const STORY_DURATION = 5000;

export function StoryViewer({ stories, initialIndex = 0, onClose, onStoriesChanged }: StoryViewerProps) {
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localStories, setLocalStories] = useState(stories);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reply
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Like / double-tap heart
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showHeart, setShowHeart] = useState(false);
  const lastTapTimeRef = useRef(0);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { setLocalStories(stories); }, [stories]);

  // Reset progress on story change
  useEffect(() => { setProgress(0); }, [currentIndex]);

  // Video sync pause/play
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || isReplying || showDeleteConfirm) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isReplying, showDeleteConfirm]);

  // Progress timer
  useEffect(() => {
    if (isPaused || showDeleteConfirm || deleting || isReplying) return;
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
  }, [currentIndex, isPaused, showDeleteConfirm, deleting, isReplying, localStories.length, onClose]);

  // Auto-dismiss error
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 3000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // Auto-dismiss reply-sent confirmation
  useEffect(() => {
    if (!replySent) return;
    const t = setTimeout(() => setReplySent(false), 2500);
    return () => clearTimeout(t);
  }, [replySent]);

  const handleDelete = async () => {
    const id = localStories[currentIndex]?.id;
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteStory(id);
      const updated = localStories.filter(s => s.id !== id);
      onStoriesChanged?.(); // tell Home to refresh story list → clears ring
      if (updated.length === 0) { onClose(); return; }
      setLocalStories(updated);
      setCurrentIndex(c => Math.min(c, updated.length - 1));
      setProgress(0);
      setShowDeleteConfirm(false);
      setIsPaused(false);
    } catch (e) {
      console.error("Failed to delete story", e);
      setErrorMsg("Failed to delete — try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      await api.sendMessage({
        text: `💬 ${replyText}`,
        type: "text",
        senderId: user?.id ?? "me",
      } as any);
      setReplyText("");
      setIsReplying(false);
      setIsPaused(false);
      setReplySent(true);
    } catch (e) {
      console.error("Failed to send story reply", e);
      setErrorMsg("Couldn't send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const triggerLike = (id: string) => {
    setLikedIds(prev => new Set([...prev, id]));
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1100);
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReplying) return;

    // Double-tap detection for like
    const now = Date.now();
    if (now - lastTapTimeRef.current < 320) {
      lastTapTimeRef.current = 0;
      triggerLike(localStories[currentIndex]?.id ?? "");
      return;
    }
    lastTapTimeRef.current = now;

    if (showDeleteConfirm) { setShowDeleteConfirm(false); setIsPaused(false); return; }
    if ((e.target as HTMLElement).closest(".story-controls")) return;

    const clientX = "touches" in e
      ? (e as React.TouchEvent).changedTouches[0]?.clientX
      : (e as React.MouseEvent).clientX;
    if (clientX == null) return;

    if (clientX < window.innerWidth * 0.3) {
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

  const mediaUrl = currentStory.mediaUrl ?? "";
  const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes(".webm") || currentStory.kind === "reel" || mediaUrl.includes("video");
  const isLiked = likedIds.has(currentStory.id);

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
        {/* ── PROGRESS BARS ── */}
        <div className="absolute top-safe left-0 right-0 px-3 pt-3 flex gap-[3px] z-20 pointer-events-none">
          {localStories.map((story, idx) => (
            <div key={story.id} className="h-[3px] flex-1 bg-white/25 rounded-full overflow-hidden">
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

        {/* ── HEADER ── */}
        <div className="absolute top-safe left-0 right-0 mt-5 px-4 flex justify-between items-center z-20 story-controls">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm drop-shadow-md">
              {currentStory.kind === "reel" ? "🎬 Reel" : "Story"}
            </span>
            <span className="text-white/55 text-xs drop-shadow-md">
              {new Date(parseInt(currentStory.createdAt)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {localStories.length > 1 && (
              <span className="bg-white/20 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {currentIndex + 1}/{localStories.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setIsPaused(p => !p)}
              className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={() => { setShowDeleteConfirm(true); setIsPaused(true); }}
              className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── MEDIA AREA ── */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          onMouseDown={() => { if (!showDeleteConfirm && !isReplying) setIsPaused(true); }}
          onMouseUp={e => { setIsPaused(false); handleTap(e); }}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => { if (!showDeleteConfirm && !isReplying) setIsPaused(true); }}
          onTouchEnd={e => { setIsPaused(false); handleTap(e); }}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Blurred background (images only) */}
          {mediaUrl && !isVideo && (
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${mediaUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(26px) brightness(0.45)"
              }}
            />
          )}

          {/* Media */}
          {mediaUrl && (
            isVideo ? (
              <video
                key={mediaUrl}
                ref={videoRef}
                src={mediaUrl}
                className="relative w-full h-full object-contain z-10"
                autoPlay
                loop
                playsInline
                muted
                draggable={false}
              />
            ) : (
              <img
                key={mediaUrl}
                src={mediaUrl}
                className="relative max-w-full max-h-full object-contain z-10 drop-shadow-2xl"
                draggable={false}
                alt="Story"
                onError={e => {
                  // B2 public URL failed (bucket not public?) → fall through to blank
                  (e.target as HTMLImageElement).style.opacity = "0";
                }}
              />
            )
          )}

          {/* Text overlay (for video stories) */}
          {textOverlayData && (
            <div
              className="absolute z-20 text-center whitespace-pre-wrap select-none pointer-events-none"
              style={{
                left: `${textOverlayData.x * 100}%`,
                top: `${textOverlayData.y * 100}%`,
                transform: "translate(-50%, -50%)",
                fontFamily: textOverlayData.fontFamily,
                color: textOverlayData.textColor,
                fontSize: "clamp(24px, 8vw, 40px)",
                fontWeight: "bold",
                textShadow: "0px 2px 12px rgba(0,0,0,0.7)"
              }}
            >
              {textOverlayData.text}
            </div>
          )}

          {/* Top/bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/40 pointer-events-none z-10" />

          {/* Double-tap heart burst */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.3, opacity: 1 }}
                exit={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute z-30 pointer-events-none drop-shadow-2xl"
              >
                <Heart className="w-28 h-28 fill-white text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── BOTTOM BAR: Like + Reply ── */}
        {!showDeleteConfirm && (
          <div
            className="absolute bottom-0 left-0 right-0 z-20 story-controls"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            {/* Reply sent toast */}
            <AnimatePresence>
              {replySent && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-white/80 text-xs pb-2"
                >
                  ✓ Sent
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 px-4 pt-1">
              {/* Like heart button */}
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={() => {
                  if (isLiked) {
                    setLikedIds(prev => { const n = new Set(prev); n.delete(currentStory.id); return n; });
                  } else {
                    triggerLike(currentStory.id);
                  }
                }}
                className="flex-shrink-0 p-1"
              >
                <Heart
                  className={`w-7 h-7 transition-all duration-200 ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"}`}
                />
              </motion.button>

              {/* Reply input */}
              <div
                className={`flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 border transition-all ${
                  isReplying
                    ? "bg-white/15 border-white/50 backdrop-blur-sm"
                    : "bg-white/10 border-white/20 backdrop-blur-sm"
                }`}
                onClick={() => {
                  if (!isReplying) {
                    setIsReplying(true);
                    setIsPaused(true);
                    setTimeout(() => replyInputRef.current?.focus(), 60);
                  }
                }}
              >
                {isReplying ? (
                  <input
                    ref={replyInputRef}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleReply();
                      if (e.key === "Escape") { setIsReplying(false); setIsPaused(false); setReplyText(""); }
                    }}
                    onBlur={() => {
                      if (!replyText.trim()) { setIsReplying(false); setIsPaused(false); }
                    }}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/50 min-w-0"
                    placeholder="Send a message…"
                  />
                ) : (
                  <span className="text-white/55 text-sm">Send a message…</span>
                )}
              </div>

              {/* Send button */}
              {isReplying && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: replyText.trim() ? 1 : 0.7, opacity: replyText.trim() ? 1 : 0.4 }}
                  onClick={handleReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="flex-shrink-0 w-9 h-9 bg-white rounded-full flex items-center justify-center disabled:opacity-40 transition-all"
                >
                  {sendingReply
                    ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    : <Send className="w-4 h-4 text-black ml-0.5" />
                  }
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* ── ERROR TOAST ── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm px-4 py-2 rounded-full z-50 shadow-xl whitespace-nowrap"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DELETE BOTTOM SHEET ── */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 z-30"
                onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 260 }}
                className="absolute bottom-0 left-0 right-0 z-40 bg-[#1c1c1e] rounded-t-2xl story-controls"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-5" />
                <p className="text-center text-white/55 text-sm mb-5 px-8">
                  Delete this story? This can't be undone.
                </p>
                <div className="border-t border-white/10">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full py-4 text-red-500 font-semibold text-[16px] flex items-center justify-center gap-2 hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    {deleting ? "Deleting…" : "Delete Story"}
                  </button>
                </div>
                <div className="border-t border-white/10">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setIsPaused(false); }}
                    className="w-full py-4 text-white font-medium text-[16px] hover:bg-white/5 active:bg-white/10 transition-colors"
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
