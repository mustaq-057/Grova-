import { memo, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { Smile, Mic, Send, Sticker, Paperclip, X, MessageCircle, MapPin, PenTool, Zap, Plus, Image as ImageIcon, PlusCircle, Sparkles, FileText, Palette, File as FileIcon, AlertCircle, Camera, MessageSquarePlus, Type, Clock, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "@/components/EmojiPicker";
import StickerPicker from "@/components/StickerPicker";
import GreetingPicker from "@/components/GreetingPicker";
import { StickerzPicker } from "@/components/StickerzPicker";
import type { CustomSticker } from "@/lib/stickerz";
import { extractClipboardFiles, readClipboardFilesAsync } from "@/lib/media-file";
import { useChatTheme } from "@/hooks/useChatTheme";
import { isSupportedFileType, MAX_FILE_SIZE_MB, DOCUMENTS_ONLY_ACCEPT } from "@/lib/supported-file-types";
import { toast } from "sonner";
import { getFontStyleStyles } from "@/lib/message-utils";

const CustomLocationIcon = () => <MapPin className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;
const CustomQuickChatIcon = () => <MessageSquarePlus className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;
const CustomDoodleIcon = () => <PenTool className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;
const CustomPaletteIcon = () => <Palette className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;
const CustomFileIcon = () => <FileIcon className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;
const CustomClockIcon = () => <Clock className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />;

interface MessageInputProps {
  draftKey?: string;
  /** Called with trimmed text when user sends (input state stays inside this component for perf). */
  onSendMessage: (text: string, fontStyle?: "default" | "edo" | "italian" | "allura") => void;
  onInputActivity?: (value: string) => void;
  onShareLocation?: () => void;
  sharingLocation?: boolean;
  onStickerSelect: (sticker: string) => void;
  onCustomStickerSelect?: (sticker: CustomSticker) => void;
  onGifSelect: (gif: string) => void;
  onGreetingSelect: (greeting: unknown) => void;
  onImageSelect: (file: File | File[], clipboardItemType?: string) => void;
  onOpenCamera?: () => void;
  mediaViewMode?: "keep" | "once" | "twice";
  onMediaViewModeChange?: (mode: "keep" | "once" | "twice") => void;
  onDoodleOpen?: () => void;
  doodleActive?: boolean;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onSendRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  recording: boolean;
  recordingPaused?: boolean;
  recordingTime: number;
  recordingStream?: MediaStream | null;
  recordingPreviewUrl?: string | null;
  disabled: boolean;
  replyPreview?: React.ReactNode;
}

type OpenPicker = "emoji" | "sticker" | "greeting" | "stickerz" | "schedule" | null;

const SchedulePicker = ({ onClose, onSchedule }: { onClose: () => void, onSchedule: (date: Date) => void }) => {
  const [mode, setMode] = useState<"chips" | "custom">("chips");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  const handleCustom = () => {
    if (!dateStr || !timeStr) return;
    const date = new Date(`${dateStr}T${timeStr}`);
    onSchedule(date);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="relative bg-[#1c1c1c] rounded-t-[28px] p-6 text-white pb-[env(safe-area-inset-bottom,20px)] max-h-[80svh] flex flex-col"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
        <h3 className="text-xl font-bold mb-4 shrink-0">Schedule Message</h3>
        
        {mode === "chips" ? (
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2">
            <button 
              onClick={() => onSchedule(new Date(Date.now() + 10 * 60 * 1000))}
              className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left font-medium transition-colors shrink-0"
            >
              In 10 Minutes
            </button>
            <button 
              onClick={() => onSchedule(new Date(Date.now() + 30 * 60 * 1000))}
              className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left font-medium transition-colors shrink-0"
            >
              In 30 Minutes
            </button>
            <button 
              onClick={() => onSchedule(new Date(Date.now() + 60 * 60 * 1000))}
              className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left font-medium transition-colors shrink-0"
            >
              In 1 Hour
            </button>
            <button 
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                d.setHours(9, 0, 0, 0);
                onSchedule(d);
              }}
              className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left font-medium transition-colors shrink-0"
            >
              Tomorrow Morning (9:00 AM)
            </button>
            <button 
              onClick={() => setMode("custom")}
              className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left font-medium transition-colors shrink-0"
            >
              Custom Date & Time
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 pb-2">
            <div>
              <label className="block text-sm text-white/50 mb-1 ml-1">Date</label>
              <input 
                type="date" 
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white appearance-none outline-none focus:border-primary focus:bg-white/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1 ml-1">Time</label>
              <input 
                type="time" 
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white appearance-none outline-none focus:border-primary focus:bg-white/10 transition-colors"
              />
            </div>
            <button 
              onClick={handleCustom}
              disabled={!dateStr || !timeStr}
              className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-bold mt-2 disabled:opacity-50 transition-opacity"
            >
              Confirm Time
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

const LiveWaveform = ({ stream, paused }: { stream: MediaStream | null; paused?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current || paused) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const rawVal = dataArray[i];
          const val = rawVal! / 255.0; // 0 to 1
          const barHeight = Math.max(4, val * height);

          // Aesthetic styling
          ctx.fillStyle = val > 0.5 ? "rgba(255, 60, 60, 0.9)" : "rgba(255, 100, 100, 0.6)";
          ctx.beginPath();
          ctx.roundRect(x, (height - barHeight) / 2, barWidth - 1, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.error("LiveWaveform setup failed", e);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      sourceRef.current?.disconnect();
      audioContextRef.current?.close().catch(() => {});
    };
  }, [stream]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={32} 
      className="w-[120px] h-[32px]"
      aria-hidden="true"
    />
  );
};

function AudioPreview({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => setPlaying(false);
    const handlePause = () => setPlaying(false);
    const handlePlay = () => setPlaying(true);
    
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-2 bg-destructive/10 rounded-full pr-3 pl-1 py-1 border border-destructive/20">
      <audio ref={audioRef} src={url} className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex items-center gap-0.5 opacity-60">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`w-1 rounded-full bg-destructive ${playing ? 'animate-pulse' : ''}`} style={{ height: playing ? `${Math.random() * 12 + 4}px` : '4px', transition: 'height 0.2s' }} />
        ))}
      </div>
    </div>
  );
}

export const MessageInput = memo(forwardRef<HTMLTextAreaElement, MessageInputProps>(function MessageInput({
  onSendMessage,
  onInputActivity,
  onShareLocation,
  sharingLocation = false,
  onStickerSelect,
  onCustomStickerSelect,
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
  onPauseRecording,
  onResumeRecording,
  recording,
  recordingPaused,
  recordingTime,
  recordingStream,
  recordingPreviewUrl,
  disabled,
  replyPreview,
  draftKey,
}, ref) {
  const [input, setInput] = useState(() => {
    if (draftKey) {
      try {
        return sessionStorage.getItem(draftKey) || "";
      } catch {}
    }
    return "";
  });
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [fontStyle, setFontStyle] = useState<"default" | "edo" | "italian" | "allura">("default");
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genericFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSentTimeRef = useRef<number>(0);
  const { theme } = useChatTheme();

  useImperativeHandle(ref, () => inputRef.current as HTMLTextAreaElement);

  useEffect(() => {
    if (draftKey) {
      try {
        if (input) sessionStorage.setItem(draftKey, input);
        else sessionStorage.removeItem(draftKey);
      } catch {}
    }
  }, [input, draftKey]);

  // Avoid auto-focus on mobile — it pops the keyboard and causes scroll flicker.
  useEffect(() => {
    if (!inputRef.current || openPicker) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) inputRef.current.focus();
  }, [openPicker]);

  const submitMessage = useCallback(() => {
    const text = input.trim();
    if (!text || disabled || recording) return;

    // Prevent double-submit within 300ms
    const now = Date.now();
    if (now - lastSentTimeRef.current < 300) return;
    lastSentTimeRef.current = now;

    setInput("");
    if (draftKey) {
      try { sessionStorage.removeItem(draftKey); } catch {}
    }
    if (inputRef.current) inputRef.current.style.height = 'auto';

    if (scheduledTime) {
      // It's a scheduled message
      import("@/lib/api").then(({ api }) => {
        api.scheduleMessage({
          senderId: "me", // this will be overridden by the server using authenticated token
          type: "text",
          text: text,
          scheduledAt: scheduledTime.toISOString(),
          variant: fontStyle === "default" ? undefined : fontStyle,
        }).then(() => {
          toast.success(`Message scheduled for ${scheduledTime.toLocaleTimeString()}`);
          setScheduledTime(null);
        }).catch(err => {
          toast.error("Failed to schedule message");
          setInput(text); // restore
        });
      });
      return;
    }

    onSendMessage(text, fontStyle);
  }, [input, disabled, recording, onSendMessage, fontStyle, draftKey, scheduledTime]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) {
        return; // Allow newline on mobile
      }
      if (e.repeat) return; // Guard against Enter keydown repeat
      e.preventDefault();
      submitMessage();
    }
  }, [submitMessage]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    onInputActivity?.(value);
    
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, [setInput, onInputActivity]);

  const handleImageClick = useCallback(() => {
    // On mobile, open directly without showing attachment menu
    const isMobile = typeof window !== 'undefined' && window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      setShowAttachmentMenu((s) => !s);
    }
  }, []);

  const handleGenericFileClick = useCallback(() => {
    setShowAttachmentMenu(false);
    genericFileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (files.length > 10) {
      toast.error("You can only send up to 10 files at a time.");
      files = files.slice(0, 10);
    }
    
    // Validate all files before processing
    const unsupportedFiles: string[] = [];
    const oversizedFiles: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      const maxMB = MAX_FILE_SIZE_MB;
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > maxMB) {
        oversizedFiles.push(`${file.name} (${fileSizeMB.toFixed(1)}MB)`);
        continue;
      }

      // Check if file type is supported (skip for images as they're always supported)
      if (!file.type.startsWith("image/") && !isSupportedFileType(file.type, file.name)) {
        unsupportedFiles.push(file.name);
        continue;
      }

      validFiles.push(file);
    }

    // Show error messages for unsupported or oversized files
    if (unsupportedFiles.length > 0) {
      alert(`❌ Unsupported file types:\n${unsupportedFiles.join("\n")}\n\nPlease use supported document, image, audio, video, or archive formats.`);
    }
    if (oversizedFiles.length > 0) {
      alert(`⚠️ Files too large (max ${MAX_FILE_SIZE_MB}MB):\n${oversizedFiles.join("\n")}`);
    }

    // Send valid files if any
    if (validFiles.length > 0) {
      onImageSelect(validFiles.length === 1 ? validFiles[0] : validFiles, validFiles.length === 1 ? validFiles[0].type || undefined : undefined);
    }

    e.target.value = "";
  }, [onImageSelect]);

  const openDoodle = useCallback(() => {
    setOpenPicker(null);
    setShowAttachmentMenu(false);
    onDoodleOpen?.();
  }, [onDoodleOpen]);

  const toggleFontStyle = useCallback(() => {
    setFontStyle(prev => prev === "default" ? "italian" : prev === "italian" ? "edo" : prev === "edo" ? "allura" : "default");
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setOpenPicker((p) => (p === "emoji" ? null : "emoji"));
    setShowAttachmentMenu(false);
  }, []);

  const toggleStickerPicker = useCallback(() => {
    setOpenPicker((p) => (p === "sticker" ? null : "sticker"));
    setShowAttachmentMenu(false);
  }, []);

  const toggleStickerzPicker = useCallback(() => {
    setShowAttachmentMenu(false);
    setOpenPicker((p) => (p === "stickerz" ? null : "stickerz"));
  }, []);

  const toggleQuickReplies = useCallback(() => {
    setShowAttachmentMenu(false);
    setOpenPicker((p) => (p === "greeting" ? null : "greeting"));
  }, []);

  const toggleSchedulePicker = useCallback(() => {
    setShowAttachmentMenu(false);
    setOpenPicker((p) => (p === "schedule" ? null : "schedule"));
  }, []);

  const handleShareLocation = useCallback(() => {
    setShowAttachmentMenu(false);
    onShareLocation?.();
  }, [onShareLocation]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((i) => i + emoji);
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

  const handleCustomStickerSelect = useCallback((sticker: CustomSticker) => {
    onCustomStickerSelect?.(sticker);
    setOpenPicker(null);
  }, [onCustomStickerSelect]);

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
        onClick={recordingPaused ? onResumeRecording : onPauseRecording}
        className="p-2.5 rounded-full text-primary hover:text-primary-foreground hover:bg-primary/90 transition-all"
        aria-label={recordingPaused ? "Resume recording" : "Pause recording"}
      >
        {recordingPaused ? <Mic className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={onSendRecording}
        className="send-btn p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
        aria-label="Send voice message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  ) : input.trim() ? (
    <button
      type="button"
      onClick={submitMessage}
      className={`send-btn p-2.5 rounded-full transition-all shrink-0 ${
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
    <textarea
      ref={inputRef}
      inputMode="text"
      autoComplete="off"
      autoCorrect="on"
      rows={1}
      value={input}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.focus()}
      placeholder="Message..."
      className={`flex-1 w-0 min-w-0 bg-transparent text-[17px] placeholder-[#888] text-white focus:outline-none border-none resize-none m-0 p-0 block overflow-y-auto ${
        disabled || recording ? "opacity-60 cursor-not-allowed" : ""
      }`}
      style={{
        ...(getFontStyleStyles(fontStyle) ?? { fontFamily: "inherit" }),
        minHeight: '24px',
        maxHeight: '120px',
        lineHeight: '24px'
      }}
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
                disabled={disabled}
              >
                <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                  <CustomLocationIcon />
                </div>
                <span>Location</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGenericFileClick}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <CustomFileIcon />
              </div>
              <span>Files</span>
            </button>

            <button
              type="button"
              onClick={toggleStickerzPicker}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <Sticker className="w-[26px] h-[26px] text-white" strokeWidth={1.6} />
              </div>
              <span>Stickerz</span>
            </button>

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

            {onDoodleOpen && (
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
            )}

            <button
              type="button"
              onClick={toggleSchedulePicker}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <CustomClockIcon />
              </div>
              <span>Schedule</span>
            </button>

            <button
              type="button"
              onClick={toggleFontStyle}
              className="flex items-center gap-[20px] px-[24px] py-[15px] text-[17px] font-normal hover:bg-white/5 transition-colors w-full text-left text-white"
              disabled={disabled}
            >
              <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                <span className="text-[22px] font-bold text-white" style={getFontStyleStyles(fontStyle) ?? { fontFamily: "inherit" }}>A</span>
              </div>
              <span className="flex-1">Font Style</span>
              <span className="text-[13px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full capitalize shrink-0">
                {fontStyle === "default" ? "Default" : fontStyle === "edo" ? "Edo SZ" : fontStyle === "italian" ? "Italian" : "Allura"}
              </span>
            </button>


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
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload any file"
      />

      <input
        id="generic-file-upload"
        ref={genericFileInputRef}
        type="file"
        multiple
        accept={DOCUMENTS_ONLY_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload document or file"
      />

      {openPicker === "greeting" && (
        <GreetingPicker onSelect={handleGreetingSelect} onClose={() => setOpenPicker(null)} />
      )}

      {scheduledTime && (
        <div className="absolute -top-[30px] left-[5%] w-[90%] bg-primary/20 backdrop-blur-md border border-primary/30 text-white text-[13px] px-4 py-1.5 rounded-t-2xl flex items-center justify-between z-10 font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Scheduling for {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={() => setScheduledTime(null)} className="text-white/50 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {recording && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute -top-[52px] left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-destructive/15 backdrop-blur-xl text-destructive text-sm font-medium rounded-[20px] z-10 border border-destructive/20 shadow-lg"
        >
          {recordingPaused && recordingPreviewUrl ? (
            <AudioPreview url={recordingPreviewUrl} />
          ) : recordingStream ? (
            <LiveWaveform stream={recordingStream} paused={recordingPaused} />
          ) : (
            <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
          )}
          <span className="tabular-nums min-w-[36px] text-center font-bold tracking-wide">{formatTime(recordingTime)}</span>
        </motion.div>
      )}

      <div className={`message-input-pill flex items-center gap-[8px] sm:gap-[10px] bg-[#1a1a1a] rounded-[40px] py-[7px] sm:py-[9px] pr-[8px] sm:pr-[14px] pl-[5px] sm:pl-[9px] mx-[4px] md:mx-auto md:w-full md:max-w-[800px] ${scheduledTime ? 'rounded-tl-none rounded-tr-none border border-primary/30 border-t-0' : ''}`}>
        {/* eslint-disable-next-line */}
        <button
          type="button"
          onClick={onOpenCamera}
          className="camera-btn w-[38px] h-[38px] sm:w-[44px] sm:h-[44px] rounded-full active:scale-95 flex shrink-0 items-center justify-center text-white border-none transition-all hover:brightness-90"
          style={{ backgroundColor: theme.bubbleColor }}
          disabled={disabled}
          aria-label="Take photo with camera"
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
              aria-label="Start voice recording"
            >
              <Mic className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={handleImageClick}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
              disabled={disabled}
              aria-label="Attach image or video"
            >
              <ImageIcon className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={toggleStickerPicker}
              className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
              disabled={disabled}
              aria-label="Stickers and GIFs"
            >
              <Sticker className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" strokeWidth={1.8} />
            </button>
            
            <div className="relative shrink-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu((s) => !s)}
                className={`w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-[#ccc] border-none bg-transparent ${disabled ? iconBtnDisabled : ""}`}
                disabled={disabled}
                aria-label="More attachment options"
              >
                <PlusCircle className={`w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] transition-transform duration-[0.3s] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showAttachmentMenu ? "rotate-45" : ""}`} strokeWidth={1.8} />
              </button>
              {attachmentMenu}
            </div>
          </div>
        )}
      </div>


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
      {openPicker === "stickerz" && (
        <StickerzPicker
          onSelect={handleCustomStickerSelect}
          onClose={() => setOpenPicker(null)}
        />
      )}
      
      {openPicker === "schedule" && (
        <SchedulePicker 
          onSchedule={(date) => {
            setScheduledTime(date);
            setOpenPicker(null);
            setTimeout(() => inputRef.current?.focus(), 100);
          }} 
          onClose={() => setOpenPicker(null)} 
        />
      )}

    </div>
  );
}));
