import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Compass, Film, PlusSquare, User, Send, Bell, MoreHorizontal, Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Film, label: "Reels", href: "/reels" },
    { icon: Send, label: "Messages", href: "/messages", hideMobile: true },
    { icon: Bell, label: "Notifications", href: "/notifications", hideMobile: true },
    { icon: PlusSquare, label: "Create", href: "/create" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-[72px] lg:w-[244px] border-r border-border h-full px-3 py-6 justify-between shrink-0">
        <div className="flex flex-col gap-8">
          <Link href="/" className="px-3 pt-2 pb-4 mb-2">
            <span className="font-serif text-2xl tracking-tighter hidden lg:block italic font-bold">Grova</span>
            <span className="font-serif text-2xl tracking-tighter block lg:hidden italic font-bold">G</span>
          </Link>
          
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div className={`flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors ${isActive ? 'font-bold' : ''}`}>
                    <Icon className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="hidden lg:block text-[15px]">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors w-full group">
            <MoreHorizontal className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105" strokeWidth={1.5} />
            <span className="hidden lg:block text-[15px]">More</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative bg-background/50">
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-12 bg-background border-t border-border flex items-center justify-around px-2 z-50">
        {navItems.filter(item => !item.hideMobile).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="p-2">
              <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2.5 : 1.5} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
