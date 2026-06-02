import { Link, useLocation } from "wouter";
import { Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";

type NavItem = {
  icon: typeof Home;
  label: string;
  href: string;
  badge?: number;
};

interface MobileMenuGridProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  chatBadge: number;
  notifCount: number;
}

export const MobileMenuGrid = memo(function MobileMenuGrid({ 
  isOpen, 
  onClose, 
  navItems,
  chatBadge,
  notifCount
}: MobileMenuGridProps) {
  const [location] = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Grid Menu */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-background rounded-t-3xl border-t border-border z-50 overflow-y-auto safe-area-bottom md:hidden"
          >
            <div className="sticky top-0 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-3 w-10" />
            
            <div className="px-4 py-6 pb-24">
              <h2 className="text-xl font-bold mb-6">All Features</h2>
              
              {/* 3-column grid with visual guides */}
              <div className="grid grid-cols-3 gap-3 relative">
                {/* Grid lines background */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="grid grid-cols-3 gap-3 h-full">
                    {Array(12).fill(0).map((_, i) => (
                      <div key={i} className="border border-primary/30 rounded-lg" />
                    ))}
                  </div>
                </div>

                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive =
                    location === item.href ||
                    (item.href === "/chat" && location === "/chat");
                  
                  let badge = 0;
                  if (item.label === "Chat") badge = chatBadge;
                  if (item.label === "Notifications") badge = notifCount;

                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 relative group cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-br from-primary/30 to-primary/10 border-primary text-primary shadow-lg shadow-primary/20"
                            : "bg-secondary/30 border-border hover:border-primary/50 hover:bg-secondary/50 text-foreground hover:shadow-md"
                        }`}
                      >
                        <div className="relative">
                          <Icon className={`w-6 h-6 transition-all ${isActive ? "text-primary" : ""}`} strokeWidth={2} />
                          {badge > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[18px] h-5 px-1 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                              {badge > 9 ? "9+" : badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                        
                        {/* Active indicator line */}
                        {isActive && (
                          <motion.div
                            layoutId="mobile-grid-indicator"
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
