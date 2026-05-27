import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, MessageCircle, PlusSquare, User, Settings, MoreHorizontal } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
    { icon: PlusSquare, label: "Create", href: "/create" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-[72px] lg:w-[244px] border-r border-border h-full px-3 py-6 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <Link href="/" className="px-3 pt-2 pb-4 mb-2">
            <span className="font-serif text-2xl tracking-tighter hidden lg:block italic font-bold text-primary">Grova</span>
            <span className="font-serif text-2xl tracking-tighter block lg:hidden italic font-bold text-primary">G</span>
          </Link>

          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-white/5 text-foreground"
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

        <div>
          <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors w-full group text-muted-foreground">
            <MoreHorizontal className="w-6 h-6 shrink-0" strokeWidth={1.5} />
            <span className="hidden lg:block text-[15px]">More</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative">{children}</main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-4 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="p-2 flex flex-col items-center gap-0.5" data-testid={`nav-${item.label.toLowerCase()}`}>
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
