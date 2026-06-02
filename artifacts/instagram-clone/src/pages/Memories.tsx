import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Heart, Pin, MessageCircle } from "lucide-react";
import { getMemories, type MemoryItem } from "@/lib/memories";
import { useAuth } from "@/lib/auth";

export default function Memories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<MemoryItem[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    void getMemories(user.id).then(setItems);
  }, [user?.id]);

  const openInChat = (messageId: string) => {
    setLocation(`/chat?highlight=${messageId}`);
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="px-4 py-5 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="font-semibold text-base flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Memories
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pinned messages from your chat ♥</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-20 px-6 text-center gap-4">
          <Pin className="w-14 h-14 text-muted-foreground/30" />
          <p className="font-semibold">No memories yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            In chat, tap the ⋯ on a message and choose &quot;Pin to Memories&quot; to save it here.
          </p>
          <Link href="/chat">
            <button type="button" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl">
              <MessageCircle className="w-4 h-4" />
              Open chat
            </button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m) => (
            <li key={m.messageId}>
              <button
                type="button"
                onClick={() => openInChat(m.messageId)}
                className="w-full text-left px-4 py-4 hover:bg-secondary/50 transition-colors"
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {m.senderId === user?.id ? "You" : "Partner"} · {new Date(m.timestamp).toLocaleString()}
                </p>
                <p className="text-sm line-clamp-3">{m.text || `[${m.type}]`}</p>
                <span className="text-xs text-primary mt-2 inline-block">Jump to message →</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
