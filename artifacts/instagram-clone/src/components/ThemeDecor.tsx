import { memo } from "react";
import { AppThemeId } from "@/lib/app-theme";

// Floura: Flower
export const FlouraDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <path d="M50 20 Q 60 5, 70 20 Q 95 30, 80 50 Q 95 70, 70 80 Q 60 95, 50 80 Q 40 95, 30 80 Q 5 70, 20 50 Q 5 30, 30 20 Q 40 5, 50 20 Z" opacity="0.6"/>
    <circle cx="50" cy="50" r="15" fill="#fbcfe8" opacity="0.9"/>
  </svg>
);

// Mint: Leaf
export const MintDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <path d="M20 80 Q 20 20, 80 20 Q 80 80, 20 80 Z" opacity="0.7"/>
    <path d="M20 80 Q 50 50, 80 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
  </svg>
);

// Sara Lavender: Lavender Sprig
export const SaraDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <path d="M 50 90 L 50 20" stroke="currentColor" strokeWidth="3" opacity="0.6" strokeLinecap="round"/>
    <ellipse cx="50" cy="30" rx="10" ry="20" fill="#d8b4fe" opacity="0.8"/>
    <ellipse cx="35" cy="45" rx="8" ry="15" fill="#e9d5ff" opacity="0.8" transform="rotate(-30 35 45)"/>
    <ellipse cx="65" cy="45" rx="8" ry="15" fill="#e9d5ff" opacity="0.8" transform="rotate(30 65 45)"/>
    <ellipse cx="35" cy="65" rx="8" ry="15" fill="#c084fc" opacity="0.8" transform="rotate(-40 35 65)"/>
    <ellipse cx="65" cy="65" rx="8" ry="15" fill="#c084fc" opacity="0.8" transform="rotate(40 65 65)"/>
  </svg>
);

// Mustaq: Diamond / Spark
export const MustaqDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <path d="M50 0 L 60 40 L 100 50 L 60 60 L 50 100 L 40 60 L 0 50 L 40 40 Z" opacity="0.8" fill="#fbbf24"/>
  </svg>
);

export const ThemeCornerDecor = memo(({ theme }: { theme: AppThemeId }) => {
  if (theme === "floura") return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-20px] left-[-20px] w-48 h-48 opacity-40 text-pink-400 pointer-events-none rotate-12">
        <FlouraDecor className="w-full h-full drop-shadow-md" />
      </div>
      <div className="absolute top-[-30px] right-[-30px] w-64 h-64 opacity-30 text-rose-300 pointer-events-none -rotate-12">
        <FlouraDecor className="w-full h-full drop-shadow-lg" />
      </div>
    </div>
  );
  if (theme === "mint") return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-10px] left-[-10px] w-40 h-40 opacity-40 text-emerald-400 pointer-events-none -rotate-45">
        <MintDecor className="w-full h-full drop-shadow-md" />
      </div>
      <div className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-30 text-green-300 pointer-events-none rotate-45">
        <MintDecor className="w-full h-full drop-shadow-lg" />
      </div>
    </div>
  );
  if (theme === "sara-lavender") return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-10px] left-[-10px] w-40 h-40 opacity-40 text-purple-400 pointer-events-none -rotate-12">
        <SaraDecor className="w-full h-full drop-shadow-md" />
      </div>
      <div className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-30 text-fuchsia-300 pointer-events-none rotate-12">
        <SaraDecor className="w-full h-full drop-shadow-lg" />
      </div>
    </div>
  );
  if (theme === "mustaq") return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[10px] left-[10px] w-24 h-24 opacity-30 pointer-events-none rotate-45">
        <MustaqDecor className="w-full h-full drop-shadow-md" />
      </div>
      <div className="absolute top-[20px] right-[20px] w-16 h-16 opacity-20 pointer-events-none -rotate-12">
        <MustaqDecor className="w-full h-full drop-shadow-lg" />
      </div>
    </div>
  );
  return null;
});

export const ThemeShortcutDecor = memo(({ theme }: { theme: AppThemeId }) => {
  if (theme === "floura") return <div className="absolute -top-4 -right-4 w-20 h-20 opacity-25 pointer-events-none text-pink-400 rotate-12"><FlouraDecor className="w-full h-full" /></div>;
  if (theme === "mint") return <div className="absolute -top-4 -right-4 w-20 h-20 opacity-25 pointer-events-none text-emerald-400 -rotate-12"><MintDecor className="w-full h-full" /></div>;
  if (theme === "sara-lavender") return <div className="absolute -top-4 -right-4 w-16 h-16 opacity-25 pointer-events-none text-purple-400 rotate-45"><SaraDecor className="w-full h-full" /></div>;
  if (theme === "mustaq") return <div className="absolute -top-2 -right-2 w-16 h-16 opacity-20 pointer-events-none"><MustaqDecor className="w-full h-full" /></div>;
  return null;
});
