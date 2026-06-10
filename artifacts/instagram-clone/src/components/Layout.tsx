import { useEffect, useState, memo } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, PlusSquare, Settings, BookOpen, Heart, Bell, Calendar as CalendarIcon, Sparkles, ListTodo, Star, Shield, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  unreadCount,
  NOTIFY_CHANGED,
  getUnreadChatBadge,
  UNREAD_CHAT_CHANGED,
  syncChatBadgeFromServer,
  markChatOpened,
  bumpUnreadChatBadge,
} from "@/lib/notifications-feed";
import { AvatarImage } from "@/components/AvatarImage";
import { FallingFlowersOverlay } from "@/components/FallingFlowersOverlay";
import { FallingNamesOverlay } from "@/components/FallingNamesOverlay";
import { AuroraOverlay } from "@/components/AuroraOverlay";
import { ThemeBackgroundOverlay } from "@/components/ThemeBackgroundOverlay";
import {
  APP_THEME_CHANGED,
  getStoredAppTheme,
  isSakuraFallTheme,
  isMoonlightSagaTheme,
  isSaraLavenderTheme,
  themeUsesPhotoBackground,
  type AppThemeId,
} from "@/lib/app-theme";
import { MobileMenuGrid } from "./MobileMenuGrid";

type NavItem = {
  icon: typeof Home;
  label: string;
  href: string;
  badge?: number;
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [notifCount, setNotifCount] = useState(() => unreadCount());
  const [chatBadge, setChatBadge] = useState(() => getUnreadChatBadge());
  const [appTheme, setAppTheme] = useState<AppThemeId>(() => getStoredAppTheme());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isChat = location === "/chat";
  const showSakura = isSakuraFallTheme(appTheme);
  const showAurora = isMoonlightSagaTheme(appTheme);
  const showSaraLavender = isSaraLavenderTheme(appTheme);
  const showThemeBg = themeUsesPhotoBackground(appTheme);

  useEffect(() => {
    const onTheme = () => setAppTheme(getStoredAppTheme());
    window.addEventListener(APP_THEME_CHANGED, onTheme);
    return () => window.removeEventListener(APP_THEME_CHANGED, onTheme);
  }, []);

  useEffect(() => {
    const refresh = () => setNotifCount(unreadCount());
    window.addEventListener(NOTIFY_CHANGED, refresh);
    return () => window.removeEventListener(NOTIFY_CHANGED, refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setChatBadge(getUnreadChatBadge());
    refresh();
    window.addEventListener(UNREAD_CHAT_CHANGED, refresh);
    const onPartnerMsg = () => {
      const onChat = location === "/chat";
      if (!onChat || document.visibilityState === "hidden") {
        bumpUnreadChatBadge();
      }
      setChatBadge(getUnreadChatBadge());
    };
    window.addEventListener("grova-partner-message", onPartnerMsg);
    return () => {
      window.removeEventListener(UNREAD_CHAT_CHANGED, refresh);
      window.removeEventListener("grova-partner-message", onPartnerMsg);
    };
  }, [location]);

  useEffect(() => {
    if (!user) return;
    if (location === "/chat") return;
    void syncChatBadgeFromServer();
    const t = setInterval(() => void syncChatBadgeFromServer(), 30_000);
    return () => clearInterval(t);
  }, [user?.id, location]);

  useEffect(() => {
    if (location === "/chat") markChatOpened();
  }, [location]);

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/" },
    { icon: MessageCircle, label: "Chat", href: "/chat", badge: chatBadge || undefined },
    { icon: PlusSquare, label: "Photos", href: "/create" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: notifCount || undefined },
    { icon: BookOpen, label: "Dua", href: "/dua" },
    { icon: Heart, label: "Memories", href: "/memories" },
    { icon: CalendarIcon, label: "Calendar", href: "/calendar" },
    { icon: Sparkles, label: "Check-in", href: "/checkin" },
    { icon: ListTodo, label: "Tasks", href: "/tasks" },
    { icon: Star, label: "Milestones", href: "/milestones" },
    { icon: Shield, label: "Secret Notes", href: "/secret-notes" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const photoChrome = showThemeBg ? "bg-background/92 backdrop-blur-md" : "bg-background/50";

  return (
    <div className="flex h-[100dvh] app-chrome bg-background text-foreground overflow-hidden relative">
      {showThemeBg && <ThemeBackgroundOverlay themeId={appTheme} />}
      {showAurora && <AuroraOverlay />}
      {showSakura && <FallingFlowersOverlay />}
      {showSaraLavender && <FallingNamesOverlay />}
      {/* Desktop Sidebar */}
      <nav
        className={`hidden md:flex flex-col w-[72px] lg:w-[244px] border-r border-border h-full px-3 py-6 justify-between shrink-0 app-chrome relative z-10 ${photoChrome}`}
      >
        <div className="flex flex-col gap-6 h-full min-h-0">
          <Link href="/" className="px-3 pt-2 pb-2 group">
            <span className="font-serif text-2xl tracking-tighter hidden lg:block italic font-bold text-primary inline-block">Grova</span>
            <span className="font-serif text-2xl tracking-tighter block lg:hidden italic font-bold text-primary">G</span>
          </Link>

          {user && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-secondary/50 to-secondary/30 rounded-xl border border-border/50 hover:border-primary/30 group cursor-pointer">
              <div className="relative">
                <AvatarImage src={user.avatar} userId={user.id} alt={`Profile picture of ${user.name}`} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-primary/20" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent pr-1 flex-1 min-h-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href ||
                (item.href === "/chat" && location === "/chat");
              const badge = item.badge ?? 0;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div className={`flex items-center gap-4 p-3 rounded-xl relative focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 ${isActive ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-md" : "hover:bg-secondary/50 text-foreground hover:shadow-sm"}`}>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                    <div className="relative shrink-0">
                      <Icon className={`w-6 h-6 ${isActive ? "text-primary" : ""}`} strokeWidth={isActive ? 2.5 : 1.5} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] text-white rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-background z-30">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                    <span className={`hidden lg:block text-[15px] ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content area */}
      {isChat ? (
        <main className="flex-1 overflow-hidden relative pb-16 sm:pb-14 md:pb-0">
          {children}
        </main>
      ) : (
        <main
          className={`flex-1 overflow-hidden relative z-10 ${showThemeBg ? "bg-background/88 backdrop-blur-sm" : ""}`}
        >
          <div className="h-full overflow-y-auto pb-20 sm:pb-16 md:pb-0 scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent">
            {children}
          </div>
        </main>
      )}

      {/* Mobile Bottom Bar - Responsive with Menu Toggle */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-16 sm:h-14 app-chrome border-t border-border/50 flex items-center justify-around px-1 z-50 safe-area-bottom ${showThemeBg ? "bg-background/95 backdrop-blur-lg" : "bg-background/95 backdrop-blur-md"}`}
      >
        {navItems.filter((i) => !["Dua", "Memories", "Calendar", "Check-in", "Tasks", "Milestones", "Secret Notes"].includes(i.label)).map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.href ||
            (item.href === "/chat" && location === "/chat");
          const badge = item.badge ?? 0;
          return (
            <Link key={item.href} href={item.href} className="p-2 sm:p-1.5 flex flex-col items-center group shrink-0 min-h-12 sm:min-h-10 justify-center">
              <div className={`relative ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                {isActive && (
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full shadow-lg shadow-primary/50"
                  />
                )}
                <div className={`relative p-2 sm:p-1.5 rounded-xl ${isActive ? "bg-primary/10" : "group-hover:bg-secondary/50"}`}>
                  <Icon className={`w-5 h-5 sm:w-5 sm:h-5`} strokeWidth={isActive ? 2.5 : 1.5} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 z-30 min-w-[20px] h-5 px-1 bg-red-600 text-[11px] text-white rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-background">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMobileMenu(true)}
          className="p-2 sm:p-1.5 flex flex-col items-center group shrink-0 min-h-12 sm:min-h-10 justify-center text-muted-foreground hover:text-foreground"
          aria-label="All features"
        >
          <div className="p-2 sm:p-1.5 rounded-xl hover:bg-secondary/50">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </button>
      </nav>

      <MobileMenuGrid
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        navItems={navItems}
        chatBadge={chatBadge}
        notifCount={notifCount}
      />
    </div>
  );
}
