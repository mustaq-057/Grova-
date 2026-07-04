import { memo } from "react";
import { AppThemeId } from "@/lib/app-theme";

// Floura: Detailed floral branch
export const FlouraDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    <path d="M10,190 Q50,150 60,100 T180,20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M60,100 Q80,80 120,90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3"/>
    <path d="M100,60 Q130,40 160,70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
    <g transform="translate(60, 100) scale(1.5)">
      <path d="M0,0 C-15,-20 -25,-10 0,-30 C25,-10 15,-20 0,0" fill="#fbcfe8" opacity="0.9"/>
      <path d="M0,0 C20,-15 10,-25 30,0 C10,25 20,15 0,0" fill="#f472b6" opacity="0.8"/>
      <path d="M0,0 C15,20 25,10 0,30 C-25,10 -15,20 0,0" fill="#fbcfe8" opacity="0.9"/>
      <path d="M0,0 C-20,15 -10,25 -30,0 C-10,-25 -20,-15 0,0" fill="#f472b6" opacity="0.8"/>
      <circle cx="0" cy="0" r="4" fill="#fde047"/>
    </g>
    <g transform="translate(120, 90) scale(1) rotate(45)">
      <path d="M0,0 C-10,-15 -15,-5 0,-20 C15,-5 10,-15 0,0" fill="#f9a8d4" opacity="0.8"/>
      <path d="M0,0 C15,-10 5,-15 20,0 C5,15 15,10 0,0" fill="#fbcfe8" opacity="0.9"/>
      <path d="M0,0 C10,15 15,5 0,20 C-15,5 -10,15 0,0" fill="#f9a8d4" opacity="0.8"/>
      <path d="M0,0 C-15,10 -5,15 -20,0 C-5,-15 -15,-10 0,0" fill="#fbcfe8" opacity="0.9"/>
      <circle cx="0" cy="0" r="3" fill="#fde047"/>
    </g>
    <path d="M140,140 Q150,150 145,160 Q135,150 140,140" fill="#f472b6" opacity="0.7"/>
    <path d="M40,40 Q50,45 45,55 Q35,50 40,40" fill="#fbcfe8" opacity="0.6"/>
    <path d="M170,120 Q180,125 175,135 Q165,130 170,120" fill="#f9a8d4" opacity="0.8"/>
  </svg>
);

// Mint: Elegant cascading leaves
export const MintDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    <path d="M20,180 Q80,100 180,20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M70,115 Q100,50 140,10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M50,140 C30,120 40,80 80,100 C70,130 60,150 50,140" fill="#6ee7b7" opacity="0.8"/>
    <path d="M50,140 C50,115 65,100 80,100" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.6"/>
    <path d="M90,120 C120,130 150,110 130,70 C100,80 80,100 90,120" fill="#a7f3d0" opacity="0.9"/>
    <path d="M90,120 C110,110 120,90 130,70" stroke="#6ee7b7" strokeWidth="1" fill="none" opacity="0.6"/>
    <path d="M130,70 C120,30 160,10 180,30 C170,60 150,80 130,70" fill="#6ee7b7" opacity="0.7"/>
    <path d="M130,70 C145,50 165,40 180,30" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.6"/>
    <path d="M100,60 C80,40 90,20 120,30 C120,50 110,70 100,60" fill="#a7f3d0" opacity="0.8"/>
    <path d="M150,100 C170,110 190,90 180,60 C160,70 140,80 150,100" fill="#6ee7b7" opacity="0.9"/>
    <path d="M40,80 C30,60 50,40 70,60 C60,80 50,90 40,80" fill="#a7f3d0" opacity="0.7"/>
  </svg>
);

// Sara Lavender: Realistic layered lavender bouquet
export const SaraDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    <path d="M80,190 Q90,120 100,20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M80,190 Q60,130 40,40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
    <path d="M80,190 Q120,140 160,50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
    <g fill="#c084fc" opacity="0.85">
      <ellipse cx="100" cy="30" rx="6" ry="12" transform="rotate(20 100 30)"/>
      <ellipse cx="98" cy="45" rx="7" ry="14" transform="rotate(-15 98 45)" fill="#d8b4fe"/>
      <ellipse cx="102" cy="60" rx="8" ry="15" transform="rotate(25 102 60)"/>
      <ellipse cx="97" cy="75" rx="7" ry="14" transform="rotate(-20 97 75)" fill="#e9d5ff"/>
      <ellipse cx="104" cy="90" rx="9" ry="16" transform="rotate(30 104 90)"/>
      <ellipse cx="96" cy="105" rx="8" ry="15" transform="rotate(-25 96 105)" fill="#d8b4fe"/>
    </g>
    <g fill="#d8b4fe" opacity="0.8">
      <ellipse cx="45" cy="50" rx="5" ry="10" transform="rotate(-30 45 50)"/>
      <ellipse cx="50" cy="65" rx="6" ry="12" transform="rotate(10 50 65)" fill="#e9d5ff"/>
      <ellipse cx="55" cy="80" rx="6" ry="12" transform="rotate(-20 55 80)"/>
      <ellipse cx="62" cy="95" rx="7" ry="13" transform="rotate(15 62 95)" fill="#c084fc"/>
      <ellipse cx="68" cy="110" rx="7" ry="13" transform="rotate(-10 68 110)"/>
    </g>
    <g fill="#e9d5ff" opacity="0.9">
      <ellipse cx="150" cy="60" rx="5" ry="10" transform="rotate(35 150 60)"/>
      <ellipse cx="140" cy="75" rx="6" ry="12" transform="rotate(-5 140 75)" fill="#c084fc"/>
      <ellipse cx="130" cy="90" rx="7" ry="13" transform="rotate(25 130 90)"/>
      <ellipse cx="120" cy="105" rx="7" ry="13" transform="rotate(-15 120 105)" fill="#d8b4fe"/>
      <ellipse cx="110" cy="120" rx="8" ry="14" transform="rotate(20 110 120)"/>
    </g>
  </svg>
);

// Mustaq: Premium 3D geometric gold starburst
export const MustaqDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
        <defs>
          </defs>
    <g transform="translate(100, 100)">
      <path d="M0,-90 L5,-20 L90,0 L5,20 L0,90 L-5,20 L-90,0 L-5,-20 Z" fill="#fcd34d" opacity="0.4"/>
      <path d="M0,-90 L0,90 M-90,0 L90,0" stroke="#fef3c7" strokeWidth="1" opacity="0.5"/>
      <path d="M-60,-60 L-10,-10 L60,-60 L10,-10 L60,60 L10,10 L-60,60 L-10,10 Z" fill="#fbbf24" opacity="0.5"/>
      <path d="M-60,-60 L60,60 M-60,60 L60,-60" stroke="#fde68a" strokeWidth="1" opacity="0.6"/>
      <path d="M0,-40 L20,0 L0,40 L-20,0 Z" fill="#d97706" opacity="0.8"/>
      <path d="M0,-40 L20,0 L0,0 Z" fill="#f59e0b" opacity="0.9"/>
      <path d="M0,-40 L-20,0 L0,0 Z" fill="#fbbf24" opacity="0.9"/>
      <path d="M0,40 L20,0 L0,0 Z" fill="#b45309" opacity="0.8"/>
      <path d="M0,40 L-20,0 L0,0 Z" fill="#d97706" opacity="0.8"/>
      <polygon points="0,-15 8,0 0,15 -8,0" fill="#fef3c7" opacity="0.9"/>
    </g>
    <circle cx="40" cy="40" r="3" fill="#fcd34d" opacity="0.8"/>
    <circle cx="160" cy="150" r="2" fill="#fbbf24" opacity="0.9"/>
    <circle cx="150" cy="40" r="4" fill="#f59e0b" opacity="0.6"/>
    <circle cx="50" cy="160" r="2.5" fill="#fef3c7" opacity="0.7"/>
  </svg>
);

// Tangled: Golden sun medallion with Rapunzel braid tendrils + purple flowers + chameleon
export const TangledDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className}>
    <defs>
      <radialGradient id="tangledSunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </radialGradient>
      <radialGradient id="tangledInnerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="100%" stopColor="#fbbf24" />
      </radialGradient>
    </defs>
    {/* Braid tendrils top-left */}
    <path d="M10,10 C30,40 20,70 40,90 C55,105 65,95 75,110" stroke="#c9a227" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.7"/>
    <path d="M5,15 C25,50 15,80 35,100 C48,112 60,100 70,118" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M15,5 C35,35 25,65 45,85 C60,98 70,90 80,102" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    {/* Sun rays */}
    <line x1="100" y1="55" x2="100" y2="72" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="124" y1="62" x2="116" y2="77" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="140" y1="80" x2="127" y2="87" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="145" y1="100" x2="128" y2="100" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="140" y1="120" x2="127" y2="113" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="124" y1="138" x2="116" y2="123" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="100" y1="145" x2="100" y2="128" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="76" y1="138" x2="84" y2="123" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="60" y1="120" x2="73" y2="113" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="55" y1="100" x2="72" y2="100" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="60" y1="80" x2="73" y2="87" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    <line x1="76" y1="62" x2="84" y2="77" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
    {/* Sun body */}
    <circle cx="100" cy="100" r="26" fill="url(#tangledSunGlow)" opacity="0.95"/>
    <circle cx="100" cy="100" r="18" fill="url(#tangledInnerGlow)" opacity="1"/>
    <circle cx="100" cy="100" r="10" fill="#fef3c7" opacity="0.95"/>
    {/* Purple flowers top-right */}
    <g transform="translate(155, 35)">
      <ellipse cx="0" cy="-10" rx="5" ry="9" fill="#c084fc" opacity="0.9"/>
      <ellipse cx="7" cy="-7" rx="5" ry="9" transform="rotate(30 7 -7)" fill="#a855f7" opacity="0.85"/>
      <ellipse cx="9" cy="2" rx="5" ry="9" transform="rotate(60 9 2)" fill="#c084fc" opacity="0.9"/>
      <ellipse cx="5" cy="10" rx="5" ry="9" transform="rotate(90 5 10)" fill="#d8b4fe" opacity="0.85"/>
      <ellipse cx="-4" cy="10" rx="5" ry="9" transform="rotate(120 -4 10)" fill="#a855f7" opacity="0.9"/>
      <ellipse cx="-9" cy="2" rx="5" ry="9" transform="rotate(150 -9 2)" fill="#c084fc" opacity="0.8"/>
      <circle cx="0" cy="0" r="4" fill="#fde68a"/>
    </g>
    {/* Small flower bottom-left */}
    <g transform="translate(38, 160) scale(0.7)">
      <ellipse cx="0" cy="-8" rx="4" ry="7" fill="#e9d5ff" opacity="0.8"/>
      <ellipse cx="6" cy="-4" rx="4" ry="7" transform="rotate(45 6 -4)" fill="#c084fc" opacity="0.8"/>
      <ellipse cx="6" cy="4" rx="4" ry="7" transform="rotate(90 6 4)" fill="#e9d5ff" opacity="0.8"/>
      <ellipse cx="0" cy="8" rx="4" ry="7" transform="rotate(135 0 8)" fill="#c084fc" opacity="0.7"/>
      <ellipse cx="-6" cy="4" rx="4" ry="7" transform="rotate(180 -6 4)" fill="#e9d5ff" opacity="0.8"/>
      <ellipse cx="-6" cy="-4" rx="4" ry="7" transform="rotate(225 -6 -4)" fill="#c084fc" opacity="0.7"/>
      <circle cx="0" cy="0" r="3.5" fill="#fde68a"/>
    </g>
    {/* Pascal the chameleon removed as requested */}

    {/* Glint dots */}
    <circle cx="60" cy="25" r="2" fill="#fde68a" opacity="0.7"/>
    <circle cx="170" cy="80" r="1.5" fill="#fbbf24" opacity="0.8"/>
    <circle cx="25" cy="130" r="1.5" fill="#fde68a" opacity="0.6"/>
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
  
  return null;
});

export const ThemeShortcutDecor = memo(({ theme }: { theme: AppThemeId }) => {
  if (theme === "floura") return <div className="absolute -top-4 -right-4 w-20 h-20 opacity-25 pointer-events-none text-pink-400 rotate-12"><FlouraDecor className="w-full h-full" /></div>;
  if (theme === "mint") return <div className="absolute -top-4 -right-4 w-20 h-20 opacity-25 pointer-events-none text-emerald-400 -rotate-12"><MintDecor className="w-full h-full" /></div>;
  if (theme === "sara-lavender") return <div className="absolute -top-4 -right-4 w-16 h-16 opacity-25 pointer-events-none text-purple-400 rotate-45"><SaraDecor className="w-full h-full" /></div>;
    if (theme === "tangled") return <div className="absolute -top-3 -right-3 w-20 h-20 opacity-35 pointer-events-none"><TangledDecor className="w-full h-full" /></div>;
  return null;
});

// ============================================================================
// Specialized Tangled Home Elements
// ============================================================================

export const TangledAvatarFrame = ({ className = "" }: { className?: string }) => (
  <svg viewBox="-20 -20 140 140" fill="none" className={className} overflow="visible">
    <defs>
      <linearGradient id="frameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    
    {/* Main Frame Circle */}
    <circle cx="50" cy="50" r="48" stroke="#78350f" strokeWidth="6" />
    <circle cx="50" cy="50" r="48" stroke="url(#frameGradient)" strokeWidth="4" />
    
    {/* Flower Cluster Top Left */}
    <g transform="translate(10, -5)">
      {/* 5 purple circles overlapping exactly as in reference */}
      <circle cx="15" cy="15" r="9" fill="#9333ea" />
      <circle cx="5" cy="25" r="7" fill="#a855f7" />
      <circle cx="12" cy="32" r="6" fill="#c084fc" />
      <circle cx="28" cy="22" r="6" fill="#c084fc" />
      <circle cx="2" cy="15" r="5" fill="#c084fc" />
      {/* Inner dots */}
      <circle cx="15" cy="15" r="3" fill="#d8b4fe" />
      <circle cx="5" cy="25" r="2.5" fill="#e9d5ff" />
    </g>
  </svg>
);

export const TangledCardDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 160 200" fill="none" className={className} preserveAspectRatio="none">
    {/* Ornate corners remain */}
    <path d="M10,40 L10,10 L40,10 M10,160 L10,190 L40,190 M150,40 L150,10 L120,10 M150,160 L150,190 L120,190" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" fill="none" />
    <path d="M15,35 L15,15 L35,15 M15,165 L15,185 L35,185 M145,35 L145,15 L125,15 M145,165 L145,185 L125,185" stroke="#fcd34d" strokeWidth="1" opacity="0.4" fill="none" />
    
    {/* Exact Reference Sun */}
    <g transform="translate(80, 100) scale(2.4)">
      <defs>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>

      {/* Thin outer ring */}
      <circle cx="0" cy="0" r="46" stroke="#b45309" strokeWidth="1" opacity="0.6" />

      {/* 8 Small Rays */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(deg => (
        <g key={`small-${deg}`} transform={`rotate(${deg})`}>
          <polygon points="-4,-18 4,-18 0,-34" fill="#d97706" />
        </g>
      ))}

      {/* 8 Large Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
        <g key={`large-${deg}`} transform={`rotate(${deg})`}>
          <polygon points="-6,-18 6,-18 0,-44" fill="#d97706" />
          {/* Inner line on orthogonal rays (0, 90, 180, 270) */}
          {deg % 90 === 0 && (
            <line x1="0" y1="-18" x2="0" y2="-43" stroke="#fef3c7" strokeWidth="0.75" opacity="0.5" />
          )}
        </g>
      ))}

      {/* 16 Inner Spikes forming the sawtooth rim */}
      {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(deg => (
        <g key={`spike-${deg}`} transform={`rotate(${deg})`}>
          <polygon points="-2.5,-16 2.5,-16 0,-21" fill="#b45309" />
        </g>
      ))}

      {/* Inner Sun Core */}
      <circle cx="0" cy="0" r="18" fill="#b45309" />
      <circle cx="0" cy="0" r="16" fill="url(#sunCore)" />
      
      {/* Extra glow ring */}
      <circle cx="0" cy="0" r="15" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
    </g>
  </svg>
);

export const TangledHomeDecor = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Decorations temporarily removed to fix overlap issues */}
    </div>
  );
};
