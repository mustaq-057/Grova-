import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, PlusSquare, User, Settings, MoreHorizontal, BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: PlusSquare, label: "Create", href: "/create" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: BookOpen, label: "Dua", href: "/dua" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-[72px] lg:w-[244px] border-r border-border h-full px-3 py-6 justify-between shrink-0">
        <div className="flex flex-col gap-6">
          <Link href="/" className="px-3 pt-2 pb-2">
            <span className="font-serif text-2xl tracking-tighter hidden lg:block italic font-bold text-primary">Grova</span>
            <span className="font-serif text-2xl tracking-tighter block lg:hidden italic font-bold text-primary">G</span>
          </Link>

          {/* User chip */}
          {user && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 bg-secondary/40 rounded-xl">
              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href === "/profile" && location.startsWith("/profile"));
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-foreground"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-primary" : ""}`}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <span className={`hidden lg:block text-[15px] ${isActive ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors w-full text-muted-foreground group">
          <MoreHorizontal className="w-6 h-6 shrink-0" strokeWidth={1.5} />
          <span className="hidden lg:block text-[15px]">More</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">{children}</main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/profile" && location.startsWith("/profile"));
          return (
            <Link key={item.href} href={item.href} className="p-2 flex flex-col items-center" data-testid={`nav-${item.label.toLowerCase()}`}>
              <Icon
                className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
