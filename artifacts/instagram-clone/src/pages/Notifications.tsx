import { memo, useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, Heart, MessageCircle, BookOpen, Phone, MapPin, ListTodo } from "lucide-react";
import { getNotifications, markAllRead, hydrateNotifications, NOTIFY_CHANGED, setNotificationViewer } from "@/lib/notifications-feed";
import { useAuth } from "@/lib/auth";

export default memo(function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState(() => getNotifications());

  useEffect(() => {
    if (user) setNotificationViewer(user.id, user.name);
    hydrateNotifications().then(() => setItems(getNotifications()));
    const refresh = () => setItems(getNotifications());
    window.addEventListener(NOTIFY_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFY_CHANGED, refresh);
  }, [user?.id, user?.name]);

  const markRead = async () => {
    await markAllRead();
    setItems(getNotifications());
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <Link href="/settings">
          <button type="button" className="p-2 hover:bg-secondary rounded-full" aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-lg font-semibold flex-1">Notifications</h1>
        {items.some((n) => !n.read) && (
          <button type="button" onClick={markRead} className="text-xs text-primary font-semibold">
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-16">No notifications yet</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 ${n.read ? "" : "bg-primary/5"}`}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                {n.type === "like" ? (
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                ) : n.type === "dua" ? (
                  <BookOpen className="w-5 h-5 text-primary" />
                ) : n.type === "call" ? (
                  <Phone className="w-5 h-5 text-green-500" />
                ) : n.type === "location" ? (
                  <MapPin className="w-5 h-5 text-amber-500" />
                ) : n.type === "task" ? (
                  <ListTodo className="w-5 h-5 text-violet-500" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{n.fromName}</span> {n.text}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
