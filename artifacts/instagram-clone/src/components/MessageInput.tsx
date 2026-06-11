import { memo, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { Smile, Mic, Send, Sticker, Paperclip, X, MessageCircle, MapPin, PenTool, Zap, Plus, Image as ImageIcon, Camera, PlusCircle, Sparkles, FileText, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "@/components/EmojiPicker";
import StickerPicker from "@/components/StickerPicker";
import GreetingPicker from "@/components/GreetingPicker";
import { extractClipboardFiles, readClipboardFilesAsync } from "@/lib/media-file";

const CustomLocationIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
  </svg>
);

const CustomQuickChatIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M13 8.5l-2 3.5h3l-2 3.5" strokeWidth="1.8"/>
  </svg>
);

const CustomDoodleIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const CustomPaletteIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20" fill="rgba(255,255,255,0.15)" stroke="none"/>
    <circle cx="8" cy="10" r="1.3" fill="#fff" stroke="none"/>
    <circle cx="12" cy="7" r="1.3" fill="#fff" stroke="none"/>
    <circle cx="16" cy="10" r="1.3" fill="#fff" stroke="none"/>
    <circle cx="9" cy="14" r="1.3" fill="#fff" stroke="none"/>
  </svg>
);

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
  onOpenCamera?: () => void;
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
  onOpenCamera,
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
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Avoid auto-focus on mobile — it pops the keyboard and causes scroll flicker.
  useEffect(() => {
    if (!inputRef.current || openPicker) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) inputRef.current.focus();
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
    setShowAttachmentMenu(false);
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
    onImageSelect(file, file.type || undefined);
    e.target.value = "";
  }, [onImageSelect]);

  const openDoodle = useCallback(() => {
    setOpenPicker(null);
    setShowCuteMenu(false);
    setShowAttachmentMenu(false);
    onDoodleOpen?.();
  }, [onDoodleOpen]);

  const toggleCuteMenu = useCallback(() => {
    setShowCuteMenu((s) => !s);
    setShowAttachmentMenu(false);
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
    setShowAttachmentMenu(false);
  }, []);

  const toggleStickerPicker = useCallback(() => {
    setOpenPicker((p) => (p === "sticker" ? null : "sticker"));
    setShowAttachmentMenu(false);
  }, []);

  const toggleQuickReplies = useCallback(() => {
    setShowCuteMenu(false);
    setShowAttachmentMenu(false);
    setOpenPicker((p) => (p === "greeting" ? null : "greeting"));
  }, []);

  const handleShareLocation = useCallback(() => {
    setShowAttachmentMenu(false);
    onShareLocation?.();
  }, [onShareLocation]);

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
      className={`flex-1 w-0 min-w-0 bg-transparent text-[17px] placeholder-[#888] text-white focus:outline-none border-none font-[inherit] ${
        disabled || recording ? "opacity-60 cursor-not-allowed" : ""
      }`}
      disabled={disabled || recording}
      aria-label="Message input"
    />
  );

  const attachmentMenu = (
    showAttachmentMenu &&
      createPortal(
        <>
          <div
            className="fixed inset-0 z-[200] bg-transparent"
            onClick={() => setShowAttachmentMenu(false)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-[201] right-3 sm:right-4 bottom-[calc(8rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.5rem] bg-[#1c1c1c] rounded-[22px] py-[10px] shadow-[0_8px_40px_rgba(0,0,0,0.7)] flex flex-col min-w-[210px] sm:min-w-[230px]"
            role="menu"
          >
            {onShareLocation && (
              <button
                type="button"
                onClick={handleShareLocation}
                className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
                disabled={disabled || sharingLocation}
              >
                <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                  {sharingLocation ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CustomLocationIcon />
                  )}
                </div>
                <span>Location</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleQuickReplies}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <CustomQuickChatIcon />
              </div>
              <span>Quick Chat</span>
            </button>

            <button
              type="button"
              onClick={openDoodle}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <CustomDoodleIcon />
              </div>
              <span>Doodle</span>
            </button>

            {onToggleCuteMode && (
              <button
                type="button"
                onClick={toggleCuteMenu}
                className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
                disabled={disabled}
              >
                <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                  <CustomPaletteIcon />
                </div>
                <span>Chat Styles</span>
              </button>
            )}
          </motion.div>
        </>,
        document.body,
      )
  );

  return (
    <div className="chat-panel-input relative w-full z-20 shrink-0 px-0 pt-1.5 pb-1">
      {replyPreview}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,audio/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload any file"
      />

      {openPicker === "greeting" && (
        <GreetingPicker onSelect={handleGreetingSelect} onClose={() => setOpenPicker(null)} />
      )}

      <div className="flex items-center gap-[8px] sm:gap-[10px] bg-[#1a1a1a] rounded-[40px] py-[7px] sm:py-[9px] pr-[8px] sm:pr-[14px] pl-[5px] sm:pl-[9px] mx-[4px] md:mx-auto md:w-full md:max-w-[800px]">
        <button
          type="button"
          onClick={onOpenCamera}
          className="w-[38px] h-[38px] sm:w-[44px] sm:h-[44px] rounded-full bg-[#5b5ef4] hover:bg-[#4a4de3] active:scale-95 flex shrink-0 items-center justify-center text-white border-none transition-all"
          disabled={disabled}
        >
          <Camera className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" strokeWidth={1.8} />
        </button>

        {textInput}

        {input.trim() || recording ? (
          <div className="pr-1">
            {sendOrMic}
          </div>
        ) : (
          <div className="flex items-center gap-0 sm:gap-[2px] shrink-0">
            <button
              type="button"
              onClick={onStartRecording}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
              disabled={disabled}
            >
              <Mic className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={handleImageClick}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
              disabled={disabled}
            >
              <ImageIcon className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={toggleStickerPicker}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
              disabled={disabled}
            >
              <Sticker className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            
            <div className="relative shrink-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu((s) => !s)}
                className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
                disabled={disabled}
              >
                <PlusCircle className={`w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] transition-transform duration-[0.3s] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showAttachmentMenu ? "rotate-45" : ""}`} strokeWidth={1.8} />
              </button>
              {attachmentMenu}
            </div>
          </div>
        )}
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
              className="fixed z-[201] left-3 right-3 bottom-[calc(8rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.5rem] bg-[#1c1c1c] border border-white/10 rounded-2xl p-2 shadow-xl flex flex-col gap-1"
              role="dialog"
              aria-label="Chat styles"
            >
              <button type="button" onClick={toggleCuteFrog} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "frog" ? "bg-primary/15" : ""}`}>
                <span className="emoji-native text-2xl leading-none">🐸</span>
                <span>Frog mode</span>
              </button>
              <button type="button" onClick={toggleCatMode} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "cat" ? "bg-primary/15" : ""}`}>
                <span className="emoji-native text-2xl leading-none">🐱</span>
                <span>Cat mode</span>
              </button>
              <button type="button" onClick={togglePandaMode} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary ${cuteMode === "panda" ? "bg-primary/15" : ""}`}>
                <span className="emoji-native text-2xl leading-none">🐼</span>
                <span>Panda mode</span>
              </button>
            </motion.div>
          </>,
          document.body,
        )}
    </div>
  );
}));
