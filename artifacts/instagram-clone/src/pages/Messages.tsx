import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Phone, Video, Info, Heart, ImagePlus, Smile } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_USERS } from "@/lib/mock-data";

const ME = MOCK_USERS[0];
const THEM = MOCK_USERS[1];

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  liked: boolean;
};

const INITIAL_MESSAGES: Message[] = [
  { id: "m1", senderId: THEM.id, text: "just saw your latest post — the shibuya shot is insane", timestamp: "Yesterday 9:12 PM", liked: false },
  { id: "m2", senderId: ME.id, text: "thank you!! was raining for like 3 hours waiting for that light lol", timestamp: "Yesterday 9:14 PM", liked: true },
  { id: "m3", senderId: THEM.id, text: "absolutely worth it. what film were you shooting on?", timestamp: "Yesterday 9:15 PM", liked: false },
  { id: "m4", senderId: ME.id, text: "portra 800 pushed one stop. gives that grain I've been after", timestamp: "Yesterday 9:17 PM", liked: true },
  { id: "m5", senderId: THEM.id, text: "ok I need to try that. I've been stuck on 400 forever", timestamp: "Yesterday 9:18 PM", liked: false },
  { id: "m6", senderId: ME.id, text: "do it. the shadows get so much more interesting", timestamp: "Yesterday 9:20 PM", liked: false },
  { id: "m7", senderId: THEM.id, text: "you shooting this weekend?", timestamp: "Today 10:04 AM", liked: false },
  { id: "m8", senderId: ME.id, text: "yeah thinking about heading to yanaka. wanna come?", timestamp: "Today 10:06 AM", liked: true },
  { id: "m9", senderId: THEM.id, text: "100%. what time", timestamp: "Today 10:07 AM", liked: false },
];

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [view, setView] = useState<"inbox" | "chat">("inbox");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: ME.id,
      text: trimmed,
      timestamp: "Just now",
      liked: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Auto-reply after 1.2s
    setTimeout(() => {
      const replies = [
        "haha yes perfect",
        "ok great see you then",
        "sounds good!",
        "lol yes exactly",
        "waiting for that light all day",
        "definitely. let me know",
      ];
      const reply: Message = {
        id: `m${Date.now() + 1}`,
        senderId: THEM.id,
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: "Just now",
        liked: false,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const toggleLike = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m))
    );
  };

  // --- INBOX VIEW ---
  if (view === "inbox") {
    return (
      <div className="max-w-[470px] mx-auto pb-16 md:pb-4">
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">{ME.username}</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground" data-testid="button-new-message">
            <ImagePlus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-2">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Messages</h2>

          {/* Single conversation */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setView("chat")}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors text-left"
            data-testid="button-open-chat"
          >
            <div className="relative shrink-0">
              <div className="story-ring">
                <div className="bg-background rounded-full p-[2px]">
                  <img src={THEM.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                </div>
              </div>
              {/* Online dot */}
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{THEM.username}</p>
              <p className="text-sm text-muted-foreground truncate">{INITIAL_MESSAGES[INITIAL_MESSAGES.length - 1].text}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">10:07 AM</span>
          </motion.button>
        </div>

        <div className="px-4 mt-6">
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Send className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Your messages</p>
            <p className="text-xs text-muted-foreground/70 max-w-[200px]">Send private photos and messages to a friend</p>
          </div>
        </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  return (
    <div className="flex flex-col h-full max-w-[470px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => setView("inbox")}
          className="text-muted-foreground hover:text-foreground transition-colors md:hidden"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={THEM.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" data-testid="text-chat-username">{THEM.username}</p>
          <p className="text-xs text-green-500">Active now</p>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="hover:text-foreground transition-colors" data-testid="button-call">
            <Phone className="w-5 h-5" />
          </button>
          <button className="hover:text-foreground transition-colors" data-testid="button-video">
            <Video className="w-5 h-5" />
          </button>
          <button className="hover:text-foreground transition-colors" data-testid="button-info">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 scrollbar-hide pb-2" data-testid="messages-list">
        {/* Avatar + name header */}
        <div className="flex flex-col items-center gap-2 py-6 mb-2">
          <div className="story-ring">
            <div className="bg-background rounded-full p-[3px]">
              <img src={THEM.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            </div>
          </div>
          <p className="font-semibold">{THEM.username}</p>
          <p className="text-sm text-muted-foreground">{THEM.bio}</p>
          <p className="text-xs text-muted-foreground">{THEM.followers.toLocaleString()} followers</p>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.senderId === ME.id;
          const prevMsg = messages[i - 1];
          const showTimestamp = !prevMsg || prevMsg.timestamp !== msg.timestamp;

          return (
            <div key={msg.id}>
              {showTimestamp && i > 4 && (
                <p className="text-center text-[11px] text-muted-foreground/60 my-3">{msg.timestamp}</p>
              )}
              <div className={`flex items-end gap-1.5 group ${isMe ? "flex-row-reverse" : "flex-row"}`} data-testid={`message-${msg.id}`}>
                {!isMe && (
                  <img src={THEM.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mb-1" />
                )}

                <div className="relative max-w-[70%]">
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </motion.div>

                  {/* Like button (double-tap-style) */}
                  <button
                    onClick={() => toggleLike(msg.id)}
                    className={`absolute -bottom-2 ${isMe ? "left-1" : "right-1"} opacity-0 group-hover:opacity-100 transition-opacity`}
                    data-testid={`button-like-message-${msg.id}`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${msg.liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                    />
                  </button>
                  {msg.liked && (
                    <div className={`absolute -bottom-2.5 ${isMe ? "left-0" : "right-0"}`}>
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-border shrink-0 flex items-center gap-2">
        <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-emoji">
          <Smile className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-2 gap-2">
          <input
            type="text"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            data-testid="input-message"
          />
        </div>
        {input ? (
          <button
            onClick={sendMessage}
            className="text-primary font-semibold text-sm hover:text-primary/80 transition-colors"
            data-testid="button-send"
          >
            Send
          </button>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors" data-testid="button-attach-image">
              <ImagePlus className="w-5 h-5" />
            </button>
            <button className="hover:text-foreground transition-colors" data-testid="button-heart-send">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
