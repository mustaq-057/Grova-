import { useState, useEffect, useRef, useCallback } from "react";
import { Info, Heart, Smile, Mic, Send, X, Trash2, Play, Pause, Image, Ban, Phone, Video, Sticker, Gift, Palette, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { api, type ApiMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import EmojiPicker from "@/components/EmojiPicker";
import StickerPicker from "@/components/StickerPicker";
import GifPicker from "@/components/GifPicker";
import CallScreen, { IncomingCallOverlay } from "@/components/CallScreen";
import { Link } from "wouter";
import { ME, WIFE } from "@/lib/mock-data";

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = [
  { id: "default",  name: "Espresso",  chatBg: "",                  myBg: "bg-amber-600",    myGrad: "from-amber-500 to-orange-600" },
  { id: "midnight", name: "Midnight",  chatBg: "bg-[#08081a]",      myBg: "bg-indigo-700",   myGrad: "from-indigo-600 to-purple-700" },
  { id: "rose",     name: "Rose",      chatBg: "bg-[#150a0e]",      myBg: "bg-rose-700",     myGrad: "from-rose-600 to-pink-700" },
  { id: "forest",   name: "Forest",    chatBg: "bg-[#0a150a]",      myBg: "bg-emerald-700",  myGrad: "from-emerald-600 to-teal-700" },
  { id: "ocean",    name: "Ocean",     chatBg: "bg-[#080f1e]",      myBg: "bg-sky-700",      myGrad: "from-sky-600 to-cyan-700" },
  { id: "sakura",   name: "Sakura",    chatBg: "bg-[#150a12]",      myBg: "bg-pink-700",     myGrad: "from-pink-600 to-fuchsia-700" },
];
const THEME_SWATCHES: Record<string, string> = {
  default: "bg-amber-600", midnight: "bg-indigo-700", rose: "bg-rose-700",
  forest: "bg-emerald-700", ocean: "bg-sky-700", sakura: "bg-pink-700",
};

// ── Audio message player ──────────────────────────────────────────────────────
function AudioMessage({ audioData, isMe }: { audioData: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = [3,5,8,6,9,7,5,8,6,4,7,5,3,6,8,5,7,4,6,3];
  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioData);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  return (
    <button onClick={toggle} className={`flex items-center gap-2 px-3 py-2.5 min-w-[150px] ${isMe ? "text-white/90" : "text-foreground"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isMe ? "bg-white/20" : "bg-primary/20"}`}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </div>
      <div className="flex gap-px items-center h-5">
        {bars.map((h, i) => (
          <div key={i} className={`w-0.5 rounded-full ${isMe ? "bg-white/60" : "bg-foreground/40"}`} style={{ height: `${h}px` }} />
        ))}
      </div>
      <span className="text-[11px] opacity-60 shrink-0">Voice</span>
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isEmojiOnly(text?: string): boolean {
  if (!text) return false;
  const stripped = text.replace(/\s/g, "");
  return stripped.length > 0 && stripped.length <= 6 && /^\p{Emoji}+$/u.test(stripped);
}

type OpenPicker = "emoji" | "sticker" | "gif" | null;
type CallState = { status: "outgoing" | "incoming" | "active"; type: "audio" | "video"; offer?: RTCSessionDescriptionInit } | null;

// ── Main Component ────────────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [themeId, setThemeId] = useState(() => localStorage.getItem("grova_chat_theme") || "default");
  const [callState, setCallState] = useState<CallState>(null);
  const [incomingCall, setIncomingCall] = useState<{ type: "audio" | "video"; offer: RTCSessionDescriptionInit } | null>(null);
  const [callSignal, setCallSignal] = useState<{ type: "answer" | "ice"; data: unknown } | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerAvatar, setPartnerAvatar] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partnerId = user?.id === "me" ? "wife" : "me";
  const staticPartner = user?.id === "me" ? WIFE : ME;
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]!;

  // Init partner info from API
  useEffect(() => {
    api.getUsers().then(users => {
      const p = users.find(u => u.id === partnerId);
      if (p) { setPartnerName(p.name); setPartnerAvatar(p.avatar); }
      else { setPartnerName(staticPartner.name); setPartnerAvatar(staticPartner.avatar); }
    }).catch(() => {
      setPartnerName(staticPartner.name);
      setPartnerAvatar(staticPartner.avatar);
    });
  }, [partnerId]);

  // SSE real-time connection
  useEffect(() => {
    if (!user) return;

    // Initial message load
    api.getMessages().then(msgs => { setMessages(msgs); setLoading(false); });

    const es = new EventSource(`/api/events?userId=${user.id}`);

    es.addEventListener("new-message", (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as ApiMessage;
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    es.addEventListener("message-liked", (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as ApiMessage;
      setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
    });

    es.addEventListener("messages-cleared", () => setMessages([]));

    es.addEventListener("call-offer", (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      if (d.from !== user.id) {
        setIncomingCall({ type: d.callType, offer: d.sdp });
      }
    });

    es.addEventListener("call-answer", (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      if (d.from !== user.id) setCallSignal({ type: "answer", data: d.sdp });
    });

    es.addEventListener("call-ice", (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      if (d.from !== user.id) setCallSignal({ type: "ice", data: d.candidate });
    });

    es.addEventListener("call-end", () => { setCallState(null); setIncomingCall(null); });
    es.addEventListener("call-reject", () => setCallState(null));

    es.addEventListener("profile-updated", (e: MessageEvent) => {
      const d = JSON.parse(e.data);
      if (d.userId === partnerId) { setPartnerName(d.name); setPartnerAvatar(d.avatar); }
    });

    return () => es.close();
  }, [user, partnerId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const setTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem("grova_chat_theme", id);
    setShowThemes(false);
  };

  // Send helpers
  const sendMsg = useCallback(async (partial: Partial<ApiMessage>) => {
    if (!user) return;
    try {
      await api.sendMessage({ senderId: user.id, ...partial });
      // Message arrives via SSE — no need to set state here
    } catch { /* ignore */ }
  }, [user]);

  const sendText = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMsg({ text, type: "text" });
  };

  const sendHeart = () => sendMsg({ text: "♥", type: "heart" });

  const sendSticker = (s: string) => sendMsg({ text: s, type: "sticker" });
  const sendGif = (url: string) => sendMsg({ gifUrl: url, type: "gif" });

  const sendImage = (dataUrl: string) => sendMsg({ imageData: dataUrl, type: "image" });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => sendImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        const reader = new FileReader();
        reader.onloadend = () => sendMsg({ type: "audio", audioData: reader.result as string });
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { alert("Microphone permission denied."); }
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
      try { mediaRecorderRef.current.stop(); } catch { /**/ }
      streamRef.current?.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false); setRecordingTime(0); chunksRef.current = [];
  };

  // Call actions
  const startCall = (type: "audio" | "video") => {
    setCallState({ status: "outgoing", type });
    setIncomingCall(null);
    setOpenPicker(null);
  };
  const acceptCall = () => {
    if (!incomingCall) return;
    setCallState({ status: "incoming", type: incomingCall.type, offer: incomingCall.offer });
    setIncomingCall(null);
  };
  const rejectCall = () => {
    if (user) api.sendCallSignal({ type: "reject", senderId: user.id });
    setIncomingCall(null);
  };
  const endCall = () => { setCallState(null); setCallSignal(null); };

  // Delete chat
  const handleDeleteChat = async () => {
    await api.deleteMessages();
    setShowDeleteConfirm(false);
    setShowInfo(false);
  };

  const toggleLike = async (id: string) => {
    try { await api.likeMessage(id); } catch { /**/ }
  };

  const togglePicker = (p: OpenPicker) => setOpenPicker(prev => prev === p ? null : p);

  // Render helpers
  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return time;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  const groupByDay = (msgs: ApiMessage[]) => {
    const groups: { label: string; msgs: ApiMessage[] }[] = [];
    msgs.forEach(msg => {
      const d = new Date(msg.timestamp);
      const now = new Date();
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
      const label = d.toDateString() === now.toDateString() ? "Today"
        : d.toDateString() === yesterday.toDateString() ? "Yesterday"
        : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
      const last = groups[groups.length - 1];
      if (last?.label === label) last.msgs.push(msg);
      else groups.push({ label, msgs: [msg] });
    });
    return groups;
  };

  const pAvatar = partnerAvatar || staticPartner.avatar;
  const pName = partnerName || staticPartner.name;

  if (blocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <Ban className="w-12 h-12 text-destructive/50" />
        <p className="font-semibold">You've blocked {pName}</p>
        <button onClick={() => setBlocked(false)} className="px-4 py-2 bg-secondary rounded-lg text-sm font-semibold">Unblock</button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full relative overflow-hidden ${theme.chatBg}`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="relative shrink-0">
          <div className="story-ring"><div className="bg-background rounded-full p-[2px]">
            <img src={pAvatar} alt={pName} className="w-9 h-9 rounded-full object-cover" />
          </div></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" data-testid="chat-partner-name">{pName}</p>
          <p className="text-xs text-green-400">Active now</p>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme picker */}
          <div className="relative">
            <button onClick={() => { setShowThemes(s => !s); setShowInfo(false); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-themes">
              <Palette className="w-4 h-4" strokeWidth={1.5} />
            </button>
            {showThemes && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemes(false)} />
                <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-2xl p-3 z-50 shadow-xl flex gap-2 flex-wrap w-44" data-testid="theme-picker">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.name}
                      className={`w-7 h-7 rounded-full ${THEME_SWATCHES[t.id]} hover:scale-110 transition-transform ${themeId === t.id ? "ring-2 ring-white ring-offset-2 ring-offset-card" : ""}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => startCall("audio")} className="p-1.5 text-muted-foreground hover:text-green-400 transition-colors" data-testid="button-voice-call">
            <Phone className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => startCall("video")} className="p-1.5 text-muted-foreground hover:text-blue-400 transition-colors" data-testid="button-video-call">
            <Video className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => { setShowInfo(s => !s); setShowThemes(false); }}
            className={`p-1.5 transition-colors ${showInfo ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-info">
            <Info className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 scrollbar-hide" data-testid="messages-list">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-2 py-8 mb-2">
          <div className="story-ring"><div className="bg-background rounded-full p-[3px]">
            <img src={pAvatar} alt="" className="w-24 h-24 rounded-full object-cover" />
          </div></div>
          <p className="font-bold text-lg">{pName}</p>
          <span className="text-xs bg-secondary/60 backdrop-blur px-3 py-1 rounded-full text-muted-foreground">Just the two of you ♥</span>
        </div>

        {loading && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-4xl">💬</span>
            <p className="text-sm text-muted-foreground">Say hi to {pName}!</p>
          </div>
        )}

        {groupByDay(messages).map(group => (
          <div key={group.label}>
            <p className="text-center text-[11px] text-muted-foreground/50 my-4 font-medium">{group.label}</p>
            {group.msgs.map((msg, i) => {
              const isMe = msg.senderId === user?.id;
              const prevMsg = group.msgs[i - 1];
              const sameSender = prevMsg?.senderId === msg.senderId;
              const emojiOnly = (msg.type === "text" || msg.type === "heart") && isEmojiOnly(msg.text);
              const isSticker = msg.type === "sticker";
              const isGif = msg.type === "gif";
              const isImage = msg.type === "image";

              return (
                <div key={msg.id} className={`flex items-end gap-2 group mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`} data-testid={`message-${msg.id}`}>
                  {!isMe && !sameSender ? (
                    <img src={pAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" />
                  ) : !isMe ? <div className="w-6 shrink-0" /> : null}

                  <div className="relative max-w-[72%]">
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.12 }}
                      className={
                        emojiOnly || isSticker ? "text-5xl px-1" :
                        isGif || isImage ? "overflow-hidden rounded-2xl" :
                        msg.type === "audio" ? `rounded-2xl overflow-hidden ${isMe ? `bg-gradient-to-br ${theme.myGrad}` : "bg-secondary/80"} ${isMe ? "rounded-br-[5px]" : "rounded-bl-[5px]"}` :
                        `px-4 py-2.5 rounded-[20px] text-sm leading-snug
                         ${isMe ? `bg-gradient-to-br ${theme.myGrad} text-white rounded-br-[5px]` : "bg-secondary/80 backdrop-blur text-foreground rounded-bl-[5px]"}`
                      }
                    >
                      {msg.type === "audio" && msg.audioData ? (
                        <AudioMessage audioData={msg.audioData} isMe={isMe} />
                      ) : isGif && msg.gifUrl ? (
                        <img src={msg.gifUrl} alt="GIF" className="max-w-[200px] max-h-[200px] object-cover" loading="lazy" />
                      ) : isImage && msg.imageData ? (
                        <img src={msg.imageData} alt="" className="max-w-[220px] max-h-[220px] object-cover" />
                      ) : (
                        msg.text
                      )}
                    </motion.div>

                    {/* Timestamp */}
                    <p className={`text-[10px] text-muted-foreground/40 mt-0.5 ${isMe ? "text-right" : "text-left"}`}>
                      {fmtTime(msg.timestamp)}
                    </p>

                    {/* Like */}
                    <button onClick={() => toggleLike(msg.id)}
                      className={`absolute -bottom-1.5 ${isMe ? "-left-1" : "-right-1"} transition-all ${msg.liked ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"}`}
                      data-testid={`button-like-${msg.id}`}
                    >
                      <Heart className={`w-4 h-4 drop-shadow ${msg.liked ? "fill-red-500 text-red-500" : "text-muted-foreground/60"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Input Bar ── */}
      <div className="px-3 py-3 border-t border-border shrink-0 bg-background/80 backdrop-blur">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {recording ? (
          <div className="flex items-center gap-3">
            <button onClick={cancelRecording} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex-1 flex items-center gap-2 bg-destructive/10 rounded-full px-4 py-2.5">
              <motion.div animate={{ scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-destructive rounded-full shrink-0" />
              <span className="text-sm text-destructive font-medium">Recording {recordingTime}s</span>
            </div>
            <button onPointerUp={stopRecording} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground shrink-0" data-testid="button-stop-record">
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 relative">
            {/* Pickers row */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="relative">
                <button onClick={() => togglePicker("emoji")} className={`transition-colors ${openPicker === "emoji" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-emoji">
                  <Smile className="w-5 h-5" strokeWidth={1.5} />
                </button>
                {openPicker === "emoji" && <EmojiPicker onSelect={e => { setInput(i => i + e); setOpenPicker(null); inputRef.current?.focus(); }} onClose={() => setOpenPicker(null)} />}
              </div>
              <div className="relative">
                <button onClick={() => togglePicker("sticker")} className={`transition-colors ${openPicker === "sticker" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-sticker">
                  <Sticker className="w-5 h-5" strokeWidth={1.5} />
                </button>
                {openPicker === "sticker" && <StickerPicker onSelect={sendSticker} onClose={() => setOpenPicker(null)} />}
              </div>
              <div className="relative">
                <button onClick={() => togglePicker("gif")} className={`transition-colors ${openPicker === "gif" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} data-testid="button-gif">
                  <Gift className="w-5 h-5" strokeWidth={1.5} />
                </button>
                {openPicker === "gif" && <GifPicker onSelect={sendGif} onClose={() => setOpenPicker(null)} />}
              </div>
            </div>

            {/* Input */}
            <div className="flex-1 flex items-center bg-secondary/70 rounded-full px-4 py-2.5">
              <input ref={inputRef} type="text" placeholder={`Message ${pName}...`} value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendText()}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-message" />
            </div>

            {/* Right buttons */}
            {input.trim() ? (
              <motion.button whileTap={{ scale: 0.9 }} onClick={sendText} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shrink-0" data-testid="button-send">
                <Send className="w-4 h-4 text-primary-foreground" />
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-image">
                  <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <button onPointerDown={startRecording} onPointerUp={stopRecording} onPointerLeave={stopRecording}
                  className="text-muted-foreground hover:text-primary transition-colors active:text-primary" data-testid="button-mic">
                  <Mic className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <motion.button whileTap={{ scale: 1.3 }} onClick={sendHeart} className="text-muted-foreground hover:text-red-500 transition-colors" data-testid="button-heart">
                  <Heart className="w-5 h-5" strokeWidth={1.5} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Info Panel ── */}
      {showInfo && (
        <>
          <div className="absolute inset-0 bg-black/30 z-20" onClick={() => setShowInfo(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-72 bg-background border-l border-border z-30 flex flex-col overflow-y-auto scrollbar-hide" data-testid="info-panel">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
              <p className="font-semibold text-sm">Details</p>
              <button onClick={() => setShowInfo(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col items-center gap-2 py-6 border-b border-border px-4">
              <div className="story-ring"><div className="bg-background rounded-full p-[3px]">
                <img src={pAvatar} alt="" className="w-20 h-20 rounded-full object-cover" />
              </div></div>
              <p className="font-bold">{pName}</p>
            </div>
            <div className="py-2">
              <Link href="/memories" onClick={() => setShowInfo(false)}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><Image className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /></div>
                  <div><p className="text-sm font-medium">View Memories</p><p className="text-xs text-muted-foreground">Your shared photos</p></div>
                </div>
              </Link>
              <div onClick={() => setBlocked(true)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer">
                <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center"><Ban className="w-4 h-4 text-destructive" strokeWidth={1.5} /></div>
                <div><p className="text-sm font-medium text-destructive">Block {pName}</p><p className="text-xs text-muted-foreground">Hide messages temporarily</p></div>
              </div>
              <div onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer">
                <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center"><Trash2 className="w-4 h-4 text-destructive" strokeWidth={1.5} /></div>
                <div><p className="text-sm font-medium text-destructive">Delete Chat</p><p className="text-xs text-muted-foreground">Remove all messages</p></div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Delete confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs" data-testid="delete-confirm">
            <Trash2 className="w-8 h-8 text-destructive mx-auto mb-3" />
            <h3 className="font-bold text-center mb-1">Delete all messages?</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-semibold" data-testid="button-cancel-delete">Cancel</button>
              <button onClick={handleDeleteChat} className="flex-1 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold" data-testid="button-confirm-delete">Delete</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Incoming call banner ── */}
      {incomingCall && (
        <IncomingCallOverlay
          callerName={pName}
          callerAvatar={pAvatar}
          callType={incomingCall.type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* ── Active / Outgoing call screen ── */}
      {callState && (
        <CallScreen
          call={callState}
          partnerId={partnerId}
          partnerName={pName}
          partnerAvatar={pAvatar}
          myId={user!.id}
          onSendSignal={(data) => api.sendCallSignal(data)}
          onEnd={endCall}
          incomingSignal={callSignal ?? undefined}
        />
      )}
    </div>
  );
}
