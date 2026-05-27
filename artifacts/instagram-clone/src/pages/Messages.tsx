import { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, Info, Heart, ImagePlus, Smile, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ME, WIFE } from "@/lib/mock-data";

type Message = {
  id: string;
  senderId: "me" | "wife";
  text: string;
  timestamp: string;
  liked: boolean;
  image?: string;
};

const INITIAL_MESSAGES: Message[] = [
  { id: "m1", senderId: "wife", text: "good morning love ☀️", timestamp: "Yesterday 8:12 AM", liked: true },
  { id: "m2", senderId: "me", text: "good morning ♥ did you sleep well?", timestamp: "Yesterday 8:14 AM", liked: false },
  { id: "m3", senderId: "wife", text: "yes!! best sleep in a while. what are we doing today", timestamp: "Yesterday 8:16 AM", liked: false },
  { id: "m4", senderId: "me", text: "I was thinking we go to that café you found, then a walk maybe?", timestamp: "Yesterday 8:18 AM", liked: true },
  { id: "m5", senderId: "wife", text: "YES that sounds perfect. I've been wanting to go back there", timestamp: "Yesterday 8:19 AM", liked: false },
  { id: "m6", senderId: "me", text: "📸 also bringing the camera", timestamp: "Yesterday 8:21 AM", liked: true },
  { id: "m7", senderId: "wife", text: "obviously 😂 I would expect nothing less", timestamp: "Yesterday 8:22 AM", liked: false },
  { id: "m8", senderId: "me", text: "you looked so good in that last one I posted btw", timestamp: "Today 10:02 AM", liked: true },
  { id: "m9", senderId: "wife", text: "stoppp 😭 you're the best", timestamp: "Today 10:04 AM", liked: false },
  { id: "m10", senderId: "wife", text: "also I love you so much", timestamp: "Today 10:05 AM", liked: true },
  { id: "m11", senderId: "me", text: "I love you more ♥", timestamp: "Today 10:06 AM", liked: true },
];

const AUTO_REPLIES = [
  "♥",
  "haha yes exactly",
  "I love you so much",
  "ok yes let's do that",
  "you're literally the best",
  "miss you already",
  "can't wait to see you",
  "😭😭 yes",
  "aww stop it",
  "forever and always ♥",
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: "me",
      text: trimmed,
      timestamp: formatTime(new Date()),
      liked: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    inputRef.current?.focus();

    // Show typing indicator then auto-reply
    setTimeout(() => setTyping(true), 600);
    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: `m${Date.now() + 1}`,
        senderId: "wife",
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        timestamp: formatTime(new Date()),
        liked: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 2000);
  };

  const toggleLike = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m))
    );
  };

  const sendHeart = () => {
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: "me",
      text: "♥",
      timestamp: formatTime(new Date()),
      liked: false,
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Group messages by day
  let lastTimestampGroup = "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="relative">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[2px]">
              <img src={WIFE.avatar} alt={WIFE.name} className="w-9 h-9 rounded-full object-cover" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" data-testid="text-chat-name">{WIFE.name}</p>
          <p className="text-xs text-green-400">Active now</p>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="hover:text-foreground transition-colors" data-testid="button-call">
            <Phone className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="hover:text-foreground transition-colors" data-testid="button-video">
            <Video className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="hover:text-foreground transition-colors" data-testid="button-info">
            <Info className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 scrollbar-hide" data-testid="messages-list">
        {/* Profile card at top */}
        <div className="flex flex-col items-center gap-2 py-8 mb-4">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[3px]">
              <img src={WIFE.avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
            </div>
          </div>
          <p className="font-bold text-lg">{WIFE.name}</p>
          <p className="text-sm text-muted-foreground">{WIFE.username}</p>
          <p className="text-xs text-muted-foreground/70">{WIFE.bio}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground">Just the two of us ♥</span>
          </div>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.senderId === "me";
          const showTime = msg.timestamp !== lastTimestampGroup && (i === 0 || messages[i - 1].timestamp !== msg.timestamp);
          const prevMsg = messages[i - 1];
          const sameSender = prevMsg && prevMsg.senderId === msg.senderId;
          if (showTime && i > 3) lastTimestampGroup = msg.timestamp;

          return (
            <div key={msg.id}>
              {i > 3 && !sameSender && (
                <div className="h-2" />
              )}
              <div className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`} data-testid={`message-${msg.id}`}>
                {!isMe && !sameSender ? (
                  <img src={WIFE.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" />
                ) : !isMe ? (
                  <div className="w-6 shrink-0" />
                ) : null}

                <div className="relative max-w-[70%]">
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-snug select-text ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    } ${msg.text === "♥" ? "text-2xl py-1.5" : ""}`}
                  >
                    {msg.text}
                  </motion.div>

                  {/* Like reaction */}
                  <button
                    onClick={() => toggleLike(msg.id)}
                    className={`absolute -bottom-2.5 ${isMe ? "-left-1" : "-right-1"} transition-opacity ${
                      msg.liked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    data-testid={`button-like-msg-${msg.id}`}
                  >
                    <Heart
                      className={`w-4 h-4 drop-shadow ${msg.liked ? "fill-red-500 text-red-500" : "text-muted-foreground/60"}`}
                    />
                  </button>
                </div>
              </div>
              {msg.liked && <div className={`flex ${msg.senderId === "me" ? "justify-end pr-2" : "justify-start pl-10"} mt-0.5`} />}
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <img src={WIFE.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md flex gap-1 items-center">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-muted-foreground/60"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-border shrink-0 flex items-center gap-2 bg-background">
        <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0" data-testid="button-emoji">
          <Smile className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2.5 gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Message Luna..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            data-testid="input-message"
          />
        </div>
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
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <button className="hover:text-foreground transition-colors" data-testid="button-image">
              <ImagePlus className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={sendHeart}
              className="hover:text-red-500 transition-colors"
              data-testid="button-heart"
            >
              <Heart className="w-5 h-5" strokeWidth={1.5} />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
