import { useState, useEffect, useRef, useCallback } from "react";
import { Info, Heart, ImagePlus, Smile, Mic, MicOff, Send, X, Trash2, Play, Pause, Image, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import EmojiPicker from "@/components/EmojiPicker";
import { Link } from "wouter";
import { WIFE, ME } from "@/lib/mock-data";

// ── Audio message player ──────────────────────────────────────────────────────
function AudioMessage({ audioData, isMe }: { audioData: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = [3, 5, 8, 6, 9, 7, 5, 8, 6, 4, 7, 5, 3, 6, 8, 5, 7, 4, 6, 3];

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-2.5 min-w-[160px] ${isMe ? "text-primary-foreground" : "text-foreground"}`}
      data-testid="button-play-audio"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? "bg-white/20" : "bg-primary/20"}`}>
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </div>
      <div className="flex gap-px items-center h-6">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-full ${isMe ? "bg-primary-foreground/70" : "bg-foreground/50"}`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <span className="text-xs opacity-70 shrink-0">Voice</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const partnerId = user?.id === "me" ? "wife" : "me";
  const partner = user?.id === "me" ? WIFE : ME;

  // Poll messages
  const loadMessages = useCallback(async () => {
    try {
      const msgs = await api.getMessages();
      setMessages(msgs);
    } catch { /* ignore */ }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    loadMessages();
    const iv = setInterval(loadMessages, 3000);
    return () => clearInterval(iv);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user) return;
    setInput("");
    try {
      const msg = await api.sendMessage({ senderId: user.id, text, type: "text" });
      setMessages((prev) => [...prev, msg]);
    } catch { /* ignore */ }
  };

  // Send heart
  const sendHeart = async () => {
    if (!user) return;
    try {
      const msg = await api.sendMessage({ senderId: user.id, text: "♥", type: "heart" });
      setMessages((prev) => [...prev, msg]);
    } catch { /* ignore */ }
  };

  // Toggle message like
  const toggleLike = async (id: string) => {
    try {
      const updated = await api.likeMessage(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch { /* ignore */ }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (!user) return;
          try {
            const msg = await api.sendMessage({ senderId: user.id, type: "audio", audioData: reader.result as string });
            setMessages((prev) => [...prev, msg]);
          } catch { /* ignore */ }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert("Microphone permission denied. Allow mic access and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  // Delete chat
  const handleDeleteChat = async () => {
    await api.deleteMessages();
    setMessages([]);
    setShowDeleteConfirm(false);
    setShowInfo(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  const groupByDay = (msgs: ApiMessage[]) => {
    const groups: { label: string; messages: ApiMessage[] }[] = [];
    msgs.forEach((msg) => {
      const d = new Date(msg.timestamp);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const label = isToday ? "Today" : d.toDateString() === yesterday.toDateString() ? "Yesterday" : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.messages.push(msg);
      else groups.push({ label, messages: [msg] });
    });
    return groups;
  };

  if (blocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <Ban className="w-12 h-12 text-destructive/50" />
        <p className="font-semibold">You've blocked {partner.name}</p>
        <p className="text-sm text-muted-foreground">You won't see their messages.</p>
        <button onClick={() => setBlocked(false)} className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold">Unblock</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="relative shrink-0">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[2px]">
              <img src={partner.avatar} alt={partner.name} className="w-9 h-9 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" data-testid="text-chat-name">{partner.name}</p>
          <p className="text-xs text-green-400">Active now</p>
        </div>
        <button
          onClick={() => setShowInfo((s) => !s)}
          className={`text-muted-foreground hover:text-foreground transition-colors p-1 ${showInfo ? "text-primary" : ""}`}
          data-testid="button-info"
        >
          <Info className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 scrollbar-hide" data-testid="messages-list">
        {/* Profile card */}
        <div className="flex flex-col items-center gap-2 py-8 mb-2">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[3px]">
              <img src={partner.avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
            </div>
          </div>
          <p className="font-bold text-lg">{partner.name}</p>
          <p className="text-sm text-muted-foreground">{partner.bio}</p>
          <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground mt-1">Just the two of you ♥</span>
        </div>

        {loadingMsgs ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          groupByDay(messages).map((group) => (
            <div key={group.label}>
              <p className="text-center text-[11px] text-muted-foreground/50 my-4 font-medium">{group.label}</p>
              {group.messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                const prevMsg = group.messages[i - 1];
                const sameSender = prevMsg?.senderId === msg.senderId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 group mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    data-testid={`message-${msg.id}`}
                  >
                    {!isMe && !sameSender ? (
                      <img src={partner.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" />
                    ) : !isMe ? (
                      <div className="w-6 shrink-0" />
                    ) : null}

                    <div className="relative max-w-[72%]">
                      <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`rounded-2xl text-sm leading-snug ${
                          isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                        } ${msg.type === "heart" ? "px-4 py-2.5 text-2xl" : msg.type === "audio" ? "px-0 py-0 overflow-hidden" : "px-4 py-2.5"}`}
                      >
                        {msg.type === "audio" && msg.audioData ? (
                          <AudioMessage audioData={msg.audioData} isMe={isMe} />
                        ) : (
                          msg.text
                        )}
                      </motion.div>

                      {/* Like button */}
                      <button
                        onClick={() => toggleLike(msg.id)}
                        className={`absolute -bottom-2.5 ${isMe ? "-left-1" : "-right-1"} transition-all ${
                          msg.liked ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        }`}
                        data-testid={`button-like-${msg.id}`}
                      >
                        <Heart className={`w-4 h-4 drop-shadow ${msg.liked ? "fill-red-500 text-red-500" : "text-muted-foreground/60"}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Input bar ── */}
      <div className="px-3 py-3 border-t border-border shrink-0 bg-background">
        {recording ? (
          /* Recording UI */
          <div className="flex items-center gap-3">
            <button onClick={cancelRecording} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-destructive/10 rounded-full px-4 py-2.5">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-destructive rounded-full shrink-0"
              />
              <span className="text-sm text-destructive font-medium">Recording {recordingTime}s</span>
            </div>
            <button
              onClick={stopRecording}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground shrink-0"
              data-testid="button-stop-record"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 relative">
            {/* Emoji button */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji((s) => !s)}
                className={`transition-colors shrink-0 ${showEmoji ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="button-emoji"
              >
                <Smile className="w-5 h-5" strokeWidth={1.5} />
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={(emoji) => { setInput((i) => i + emoji); setShowEmoji(false); inputRef.current?.focus(); }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>

            {/* Text input */}
            <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2.5">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Message ${partner.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
                data-testid="input-message"
              />
            </div>

            {/* Send / Action buttons */}
            {input.trim() ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0"
                data-testid="button-send"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-image">
                  <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <button
                  onPointerDown={startRecording}
                  onPointerUp={stopRecording}
                  onPointerLeave={stopRecording}
                  className="text-muted-foreground hover:text-primary transition-colors active:text-primary"
                  data-testid="button-mic"
                >
                  <Mic className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <motion.button
                  whileTap={{ scale: 1.3 }}
                  onClick={sendHeart}
                  className="hover:text-red-500 transition-colors text-muted-foreground"
                  data-testid="button-heart"
                >
                  <Heart className="w-5 h-5" strokeWidth={1.5} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Info / Details panel ── */}
      {showInfo && (
        <>
          <div className="absolute inset-0 bg-black/30 z-20" onClick={() => setShowInfo(false)} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-72 bg-background border-l border-border z-30 flex flex-col overflow-y-auto scrollbar-hide"
            data-testid="info-panel"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
              <p className="font-semibold text-sm">Details</p>
              <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Partner profile */}
            <div className="flex flex-col items-center gap-2 py-6 border-b border-border px-4">
              <div className="story-ring">
                <div className="bg-background rounded-full p-[3px]">
                  <img src={partner.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                </div>
              </div>
              <p className="font-bold">{partner.name}</p>
              <p className="text-sm text-muted-foreground text-center">{partner.bio}</p>
            </div>

            {/* Actions */}
            <div className="py-2">
              <Link href="/memories" onClick={() => setShowInfo(false)}>
                <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left" data-testid="button-view-memories">
                  <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center">
                    <Image className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">View Memories</p>
                    <p className="text-xs text-muted-foreground">Your shared photos</p>
                  </div>
                </button>
              </Link>

              <button
                onClick={() => setBlocked(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left"
                data-testid="button-block"
              >
                <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <Ban className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">Block {partner.name}</p>
                  <p className="text-xs text-muted-foreground">Hide messages temporarily</p>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left"
                data-testid="button-delete-chat"
              >
                <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Chat</p>
                  <p className="text-xs text-muted-foreground">Remove all messages</p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Delete confirmation ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" data-testid="delete-confirm">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs"
          >
            <Trash2 className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h3 className="font-bold text-center mb-1">Delete all messages?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">This cannot be undone. Both sides will lose the conversation.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-semibold"
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="flex-1 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold"
                data-testid="button-confirm-delete"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
