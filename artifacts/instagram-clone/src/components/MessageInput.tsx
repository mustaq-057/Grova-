import { memo, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { Smile, Mic, Send, Sticker, Paperclip, X, MessageCircle, MapPin, PenTool, Zap } from "lucide-react";
import { motion } from "framer-motion";
import EmojiPicker from "@/components/EmojiPicker";
import StickerPicker from "@/components/StickerPicker";
import GreetingPicker from "@/components/GreetingPicker";
import { extractClipboardFiles, readClipboardFilesAsync } from "@/lib/media-file";

interface MessageInputProps {
  /** Called with trimmed text when user sends (input state stays inside this component for perf). */
  onSendMessage: (text: string) => void;
  onInputActivity?: (value: string) => void;
  cuteMode?: string | null;
  onToggleCuteMode?: (mode: string | null) => void;
  onShareLocation?: () => void;
  sharingLocation?: boolean;
  onStickerSelect: (sticker: string) => void;
  onGifSelect: (gif: string) => void;
  onGreetingSelect: (greeting: unknown) => void;
  onImageSelect: (file: File, clipboardItemType?: string) => void;
  mediaViewMode?: "keep" | "once" | "twice";
  onMediaViewModeChange?: (mode: "keep" | "once" | "twice") => void;
  onDoodleOpen?: () => void;
  doodleActive?: boolean;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onSendRecording: () => void;
  recording: boolean;
  recordingTime: number;
  disabled: boolean;
  replyPreview?: React.ReactNode;
}

type OpenPicker = "emoji" | "sticker" | "greeting" | null;

export const MessageInput = memo(forwardRef<HTMLInputElement, MessageInputProps>(function MessageInput({
  onSendMessage,
  onInputActivity,
  cuteMode = null,
  onToggleCuteMode,
  onShareLocation,
  sharingLocation = false,
  onStickerSelect,
  onGifSelect,
  onGreetingSelect,
  onImageSelect,
  mediaViewMode = "keep",
  onMediaViewModeChange,
  onDoodleOpen,
  doodleActive = false,
  onStartRecording,
  onCancelRecording,
  onSendRecording,
  recording,
  recordingTime,
  disabled,
  replyPreview,
}, ref) {
  const [input, setInput] = useState("");
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showCuteMenu, setShowCuteMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  useEffect(() => {
    if (inputRef.current && !openPicker) {
      inputRef.current.focus();
    }
  }, [openPicker]);

  const submitMessage = useCallback(() => {
    const text = input.trim();
    if (!text || disabled || recording) return;
    setInput("");
    onSendMessage(text);
  }, [input, disabled, recording, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }, [submitMessage]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (recording || disabled) return;

      const runPicked = (picked: { file: File; itemType?: string }[]) => {
        if (picked.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const { file, itemType } = picked[0]!;
        onImageSelect(file, itemType);
      };

      const sync = extractClipboardFiles(e.clipboardData).filter(({ file }) => file.size > 0);
      if (sync.length > 0) {
        runPicked(sync);
        return;
      }

      void readClipboardFilesAsync().then((asyncPicked) => {
        const media = asyncPicked.filter(({ file }) => file.size > 0);
        if (media.length === 0) return;
        runPicked(media);
      });
    },
    [recording, disabled, onImageSelect],
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    onInputActivity?.(value);
  }, [setInput, onInputActivity]);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv|3gp)$/i.test(file.name);
    const maxBytes = isVideo ? 60 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(isVideo ? "Video too large (max 60MB)." : "File too large (max 25MB).");
      e.target.value = "";
      return;
    }
    onImageSelect(file);
    e.target.value = "";
  }, [onImageSelect]);

  const openDoodle = useCallback(() => {
    setOpenPicker(null);
    setShowCuteMenu(false);
    onDoodleOpen?.();
  }, [onDoodleOpen]);

  const toggleCuteMenu = useCallback(() => {
    setShowCuteMenu((s) => !s);
  }, []);

  const toggleCuteFrog = useCallback(() => {
    onToggleCuteMode?.(cuteMode === "frog" ? null : "frog");
    setShowCuteMenu(false);
  }, [onToggleCuteMode, cuteMode]);

  const toggleCatMode = useCallback(() => {
    onToggleCuteMode?.(cuteMode === "cat" ? null : "cat");
    setShowCuteMenu(false);
  }, [onToggleCuteMode, cuteMode]);

  const togglePandaMode = useCallback(() => {
    onToggleCuteMode?.(cuteMode === "panda" ? null : "panda");
    setShowCuteMenu(false);
  }, [onToggleCuteMode, cuteMode]);

  const toggleEmojiPicker = useCallback(() => {
    setOpenPicker((p) => (p === "emoji" ? null : "emoji"));
  }, []);

  const toggleStickerPicker = useCallback(() => {
    setOpenPicker((p) => (p === "sticker" ? null : "sticker"));
  }, []);

  const toggleQuickReplies = useCallback(() => {
    setShowCuteMenu(false);
    setOpenPicker((p) => (p === "greeting" ? null : "greeting"));
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((i) => i + emoji);
    setOpenPicker(null);
  }, []);

  const handleStickerSelect = useCallback((sticker: string) => {
    onStickerSelect(sticker);
    setOpenPicker(null);
  }, [onStickerSelect]);

  const handleGifSelect = useCallback((gif: string) => {
    onGifSelect(gif);
    setOpenPicker(null);
  }, [onGifSelect]);

  const handleGreetingSelect = useCallback((greeting: unknown) => {
    onGreetingSelect(greeting);
    setOpenPicker(null);
  }, [onGreetingSelect]);

  const iconBtn =
    "p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 shrink-0";
  const iconBtnIdle = `${iconBtn} text-muted-foreground hover:text-foreground hover:bg-secondary/80`;
  const iconBtnDisabled = `${iconBtn} opacity-50 cursor-not-allowed text-muted-foreground/50`;

  const sendOrMic = recording ? (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onCancelRecording}
        className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
        aria-label="Cancel recording"
      >
        <X className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onSendRecording}
        className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
        aria-label="Send voice message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  ) : input.trim() ? (
    <button
      type="button"
      onClick={submitMessage}
      className={`p-2.5 rounded-full transition-all shrink-0 ${
        disabled ? "opacity-50 cursor-not-allowed bg-primary/60" : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
      aria-label="Send message"
      disabled={disabled}
    >
      <Send className="w-5 h-5" />
    </button>
  ) : (
    <button
      type="button"
      onClick={onStartRecording}
      className={`p-2.5 rounded-full transition-all shrink-0 ${disabled ? iconBtnDisabled : iconBtnIdle}`}
      aria-label="Start voice recording"
      disabled={disabled}
    >
      <Mic className="w-5 h-5" />
    </button>
  );

  const textInput = (
    <input
      ref={inputRef}
      type="text"
      inputMode="text"
      enterKeyHint="send"
      autoComplete="off"
      autoCorrect="on"
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.focus()}
      placeholder="Message..."
      className={`w-full min-w-0 px-4 py-2.5 bg-secondary/50 border border-border/50 rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all ${
        disabled || recording ? "opacity-60 cursor-not-allowed" : ""
      }`}
      disabled={disabled || recording}
      aria-label="Message input"
    />
  );

  const attachmentToolbar = (
    <>
      {onMediaViewModeChange && (
        <button
          type="button"
          onClick={() => onMediaViewModeChange(mediaViewMode === "keep" ? "once" : mediaViewMode === "once" ? "twice" : "keep")}
          className={disabled ? iconBtnDisabled : iconBtnIdle}
          aria-label="Media view mode"
          title={`Media mode: ${mediaViewMode === "keep" ? "Keep in chat" : mediaViewMode === "once" ? "View once" : "View twice"}`}
          disabled={disabled}
        >
          <span className="text-[11px] font-bold">{mediaViewMode === "keep" ? "K" : mediaViewMode === "once" ? "1" : "2"}</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleImageClick}
        className={disabled ? iconBtnDisabled : iconBtnIdle}
        aria-label="Attach file"
        disabled={disabled}
      >
        <Paperclip className="w-5 h-5" />
      </button>

      {onShareLocation && (
        <button
          type="button"
          onClick={onShareLocation}
          className={disabled || sharingLocation ? iconBtnDisabled : iconBtnIdle}
          aria-label="Share location"
          disabled={disabled || sharingLocation}
        >
          {sharingLocation ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </button>
      )}

      {onToggleCuteMode && (
        <button
          type="button"
          onClick={toggleCuteMenu}
          className={
            showCuteMenu || cuteMode
              ? `${iconBtn} bg-secondary text-foreground`
              : disabled
                ? iconBtnDisabled
                : iconBtnIdle
          }
          title="Chat styles"
          aria-expanded={showCuteMenu}
          disabled={disabled}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      <button
        type="button"
        onClick={toggleQuickReplies}
        className={
          openPicker === "greeting"
            ? `${iconBtn} text-primary bg-primary/10`
            : disabled
              ? iconBtnDisabled
              : iconBtnIdle
        }
        title="Quick replies"
        aria-expanded={openPicker === "greeting"}
        aria-label="Quick replies"
        disabled={disabled}
      >
        <Zap className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={toggleEmojiPicker}
        className={
          openPicker === "emoji"
            ? `${iconBtn} text-primary bg-primary/10`
            : disabled
              ? iconBtnDisabled
              : iconBtnIdle
        }
        title="Emoji"
        aria-expanded={openPicker === "emoji"}
        disabled={disabled}
      >
        <Smile className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={toggleStickerPicker}
        className={
          openPicker === "sticker"
            ? `${iconBtn} text-primary bg-primary/10`
            : disabled
              ? iconBtnDisabled
              : iconBtnIdle
        }
        title="Stickers & GIFs"
        aria-expanded={openPicker === "sticker"}
        disabled={disabled}
      >
        <Sticker className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={openDoodle}
        className={
          doodleActive
            ? `${iconBtn} text-primary bg-primary/15`
            : disabled
              ? iconBtnDisabled
              : iconBtnIdle
        }
        aria-label="Draw doodle — tap again for more space"
        disabled={disabled}
      >
        <PenTool className="w-5 h-5" />
      </button>
    </>
  );

  return (
    <div className="chat-panel-input relative z-20 shrink-0 px-2 sm:px-4 pb-2 md:pb-3 pt-1.5 md:pt-2 border-t border-border/50 bg-background/95 backdrop-blur-sm">
      {replyPreview}

      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload any file"
      />

      {openPicker === "greeting" && (
        <GreetingPicker onSelect={handleGreetingSelect} onClose={() => setOpenPicker(null)} />
      )}

      {/* Mobile: message row + tool row (no quick-emoji strip) */}
      <div className="flex flex-col gap-1.5 md:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">{textInput}</div>
          {sendOrMic}
        </div>
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-0.5 px-0.5">
          {attachmentToolbar}
        </div>
      </div>

      {/* Desktop: single row */}
      <div className="hidden md:flex items-center gap-2 min-w-0">
        {attachmentToolbar}
        <div className="flex-1 min-w-0">{textInput}</div>
        {sendOrMic}
      </div>

      {recording && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 mt-2 bg-destructive/10 text-destructive text-sm font-medium rounded-full"
        >
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span>{formatTime(recordingTime)}</span>
        </motion.div>
      )}

      {openPicker === "emoji" && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === "sticker" && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onSelectGif={handleGifSelect}
          onClose={() => setOpenPicker(null)}
        />
      )}

      {showCuteMenu && onToggleCuteMode &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[200] bg-black/40" onClick={() => setShowCuteMenu(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed z-[201] left-3 right-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[max(5.5rem,env(safe-area-inset-bottom))] bg-card border border-border rounded-2xl p-2 shadow-xl flex flex-col gap-1"
              role="dialog"
              aria-label="Chat styles"
            >
              <button type="button" onClick={toggleCuteFrog} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "frog" ? "bg-primary/15" : ""}`}>
                <span className="text-xl">🐸</span>
                <span>Frog mode</span>
              </button>
              <button type="button" onClick={toggleCatMode} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "cat" ? "bg-primary/15" : ""}`}>
                <span className="text-xl">🐱</span>
                <span>Cat mode</span>
              </button>
              <button type="button" onClick={togglePandaMode} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "panda" ? "bg-primary/15" : ""}`}>
                <span className="text-xl">🐼</span>
                <span>Panda mode</span>
              </button>
            </motion.div>
          </>,
          document.body,
        )}
    </div>
  );
}));
