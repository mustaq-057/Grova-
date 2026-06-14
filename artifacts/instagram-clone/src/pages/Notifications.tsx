import { memo, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  Heart,
  MessageSquare,
  BookOpen,
  Phone,
  MapPin,
  ListTodo,
  PenTool,
  ImageIcon,
  Smile,
  Zap,
  Calendar as CalendarIcon,
  Sparkles,
  Bell,
} from "lucide-react";
import {
  getNotifications,
  markAllRead,
  hydrateNotifications,
  NOTIFY_CHANGED,
  setNotificationViewer,
  type AppNotification,
} from "@/lib/notifications-feed";
import { navigateWithSearch, SEARCH_CHANGED } from "@/lib/app-search";
import { useAuth } from "@/lib/auth";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function notificationIcon(type: AppNotification["type"]) {
  switch (type) {
    case "like":
      return { Icon: Heart, className: "text-rose-500 bg-rose-500/15" };
    case "comment":
      return { Icon: MessageSquare, className: "text-sky-500 bg-sky-500/15" };
    case "dua":
      return { Icon: BookOpen, className: "text-emerald-500 bg-emerald-500/15" };
    case "call":
      return { Icon: Phone, className: "text-green-500 bg-green-500/15" };
    case "location":
      return { Icon: MapPin, className: "text-amber-500 bg-amber-500/15" };
    case "task":
      return { Icon: ListTodo, className: "text-violet-500 bg-violet-500/15" };
    case "doodle":
      return { Icon: PenTool, className: "text-pink-500 bg-pink-500/15" };
    case "file":
      return { Icon: ImageIcon, className: "text-blue-500 bg-blue-500/15" };
    case "reaction":
      return { Icon: Smile, className: "text-yellow-500 bg-yellow-500/15" };
    case "greeting":
      return { Icon: Zap, className: "text-primary bg-primary/15" };
    case "calendar":
      return { Icon: CalendarIcon, className: "text-orange-500 bg-orange-500/15" };
    case "checkin":
      return { Icon: Sparkles, className: "text-fuchsia-500 bg-fuchsia-500/15" };
    default:
      return { Icon: Bell, className: "text-primary bg-primary/15" };
  }
}

function defaultPath(type: AppNotification["type"]): string {
  switch (type) {
    case "dua":
      return "/dua";
    case "task":
      return "/tasks";
    case "calendar":
      return "/calendar";
    case "checkin":
      return "/checkin";
    case "doodle":
    case "file":
    case "reaction":
    case "greeting":
    case "location":
    case "call":
      return "/chat";
    case "comment":
    case "like":
    case "story":
      return "/";
    default:
      return "/notifications";
  }
}

export default memo(function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
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

  const openNotification = useCallback(
    (n: AppNotification) => {
      const path = n.targetPath || defaultPath(n.type);
      const url = new URL(path, window.location.origin);
      if (url.pathname === window.location.pathname) {
        navigateWithSearch(path);
      } else {
        setLocation(path);
      }
    },
    [setLocation],
  );

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6 min-h-full">
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

      <div className="px-3 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/60 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">Likes, comments, doodles, and more show up here</p>
          </div>
        ) : (
          items.map((n) => {
            const { Icon, className } = notificationIcon(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={`w-full flex items-start gap-3 px-3 py-3.5 rounded-2xl text-left transition-colors hover:bg-secondary/40 active:bg-secondary/60 ${
                  n.read ? "bg-card/30" : "bg-primary/8 border border-primary/15"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${className}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{n.fromName}</span>{" "}
                    <span className="text-foreground/90">{n.text}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatRelativeTime(n.timestamp)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});
