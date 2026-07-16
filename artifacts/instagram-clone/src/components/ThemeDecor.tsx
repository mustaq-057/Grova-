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

// ============================================================================
// Islamic Theme — Rich Geometric + Arabesque + Lantern Artwork
// ============================================================================

/** Helper: returns the 8-pointed star (khatam) path at a given size */
const islamicStar8 = (cx: number, cy: number, r: number, rotation = 0) => {
  // 8-pointed star: outer 8 points + inner 8 points
  const pts: string[] = [];
  const innerR = r * 0.42;
  for (let i = 0; i < 16; i++) {
    const angle = ((i * 22.5 + rotation) * Math.PI) / 180;
    const radius = i % 2 === 0 ? r : innerR;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(" ");
};

/** 4-petal rosette at a point */
const rosette = (cx: number, cy: number, r: number) => {
  return [
    `M${cx},${cy - r} Q${cx + r},${cy - r} ${cx + r},${cy} Q${cx + r},${cy + r} ${cx},${cy + r} Q${cx - r},${cy + r} ${cx - r},${cy} Q${cx - r},${cy - r} ${cx},${cy - r} Z`
  ].join(" ");
};

// Main Islamic Decor: crescent + 8-pointed star grid + hanging lantern + arabesque border
export const IslamicDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className} overflow="visible">
    <defs>
      <radialGradient id="islamicMoonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
        <stop offset="45%" stopColor="#fde047" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="islamicLanternGlow" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="islamicLanternBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#92400e" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="islamicCrescent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="60%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <filter id="islamicGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* ── Arabesque border tessellation (bottom row) ── */}
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={`ros-${i}`} transform={`translate(${10 + i * 38}, 178)`} opacity="0.55">
        <polygon points={islamicStar8(0, 0, 14, 22.5)} fill="#d97706" opacity="0.5" />
        <polygon points={islamicStar8(0, 0, 8, 0)} fill="#fde68a" opacity="0.7" />
        <circle cx="0" cy="0" r="3" fill="#fef3c7" opacity="0.9" />
      </g>
    ))}
    <line x1="5" y1="164" x2="195" y2="164" stroke="#d97706" strokeWidth="0.75" opacity="0.35" />
    <line x1="5" y1="192" x2="195" y2="192" stroke="#d97706" strokeWidth="0.75" opacity="0.25" />

    {/* ── Main 8-pointed star (top-right focal) ── */}
    <g transform="translate(145, 60)" filter="url(#islamicGlowFilter)">
      <polygon points={islamicStar8(0, 0, 38, 22.5)} fill="#d97706" opacity="0.35" />
      <polygon points={islamicStar8(0, 0, 38, 0)} fill="#fbbf24" opacity="0.45" />
      <polygon points={islamicStar8(0, 0, 26, 22.5)} fill="#fde68a" opacity="0.55" />
      <polygon points={islamicStar8(0, 0, 26, 0)} fill="#fef3c7" opacity="0.65" />
      <polygon points={islamicStar8(0, 0, 16, 22.5)} fill="#fbbf24" opacity="0.8" />
      <circle cx="0" cy="0" r="7" fill="#fef9c3" opacity="0.95" />
      <circle cx="0" cy="0" r="3" fill="#fbbf24" />
    </g>

    {/* ── Crescent Moon ── */}
    <g transform="translate(34, 18)" filter="url(#islamicGlowFilter)">
      {/* Outer glow */}
      <circle cx="22" cy="38" r="34" fill="url(#islamicMoonGlow)" opacity="0.45" />
      {/* Crescent shape: big circle minus smaller offset circle */}
      <path
        d="M22,10 A30,30 0 1,1 22,66 A22,22 0 1,0 22,10 Z"
        fill="url(#islamicCrescent)"
        opacity="0.92"
      />
      {/* Inner crescent highlight */}
      <path
        d="M22,15 A25,25 0 0,1 22,61 A17,17 0 0,0 22,15 Z"
        fill="#fef9c3"
        opacity="0.25"
      />
    </g>

    {/* ── Small stars near crescent ── */}
    <g opacity="0.9">
      {/* 5-point star near crescent tip */}
      <polygon
        points={islamicStar8(85, 22, 9, 0)}
        fill="#fef3c7"
        opacity="0.85"
      />
      <circle cx="85" cy="22" r="2.5" fill="#fde047" />
      {/* Tiny sparkle */}
      <polygon points={islamicStar8(105, 38, 5, 22.5)} fill="#fcd34d" opacity="0.7" />
      <circle cx="105" cy="38" r="1.5" fill="#fef9c3" />
    </g>

    {/* ── Hanging Lantern (left side) ── */}
    <g transform="translate(175, -5)">
      {/* Hanging chain — dotted */}
      {[0, 6, 12, 18, 24, 30].map((y, i) => (
        <ellipse key={i} cx="0" cy={y} rx="1.5" ry="2" fill="#d97706" opacity="0.7" />
      ))}
      {/* Lantern cap */}
      <path d="M-9,36 Q0,30 9,36 L6,42 L-6,42 Z" fill="#b45309" opacity="0.95" />
      <line x1="-9" y1="36" x2="9" y2="36" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
      {/* Lantern body — hexagonal */}
      <path d="M-7,42 L-10,52 L-8,68 L8,68 L10,52 L7,42 Z"
        fill="url(#islamicLanternBody)" stroke="#d97706" strokeWidth="1.2" />
      {/* Lantern body filigree lines */}
      <line x1="0" y1="42" x2="0" y2="68" stroke="#fde68a" strokeWidth="0.6" opacity="0.6" />
      <line x1="-10" y1="52" x2="10" y2="52" stroke="#fde68a" strokeWidth="0.6" opacity="0.5" />
      <line x1="-9" y1="47" x2="9" y2="57" stroke="#fde68a" strokeWidth="0.4" opacity="0.4" />
      <line x1="9" y1="47" x2="-9" y2="57" stroke="#fde68a" strokeWidth="0.4" opacity="0.4" />
      {/* Inner glow */}
      <ellipse cx="0" cy="55" rx="10" ry="13" fill="url(#islamicLanternGlow)" />
      {/* Flame */}
      <path d="M0,50 Q2.5,55 0,60 Q-2.5,55 0,50 Z" fill="#fef9c3" opacity="0.95" />
      <path d="M0,53 Q1.5,57 0,60 Q-1.5,57 0,53 Z" fill="#fde047" opacity="0.8" />
      {/* Lantern base */}
      <path d="M-8,68 L-5,74 L5,74 L8,68 Z" fill="#b45309" opacity="0.9" />
      <line x1="-5" y1="74" x2="5" y2="74" stroke="#fbbf24" strokeWidth="1" opacity="0.7" />
      {/* Tassel */}
      <line x1="0" y1="74" x2="0" y2="82" stroke="#d97706" strokeWidth="1" opacity="0.6" />
      <ellipse cx="0" cy="83" rx="2" ry="3" fill="#fbbf24" opacity="0.7" />
    </g>

    {/* ── Secondary small 8-pointed star (bottom-left accent) ── */}
    <g transform="translate(25, 140)" opacity="0.6">
      <polygon points={islamicStar8(0, 0, 18, 22.5)} fill="#d97706" opacity="0.4" />
      <polygon points={islamicStar8(0, 0, 18, 0)} fill="#fbbf24" opacity="0.5" />
      <polygon points={islamicStar8(0, 0, 11, 0)} fill="#fde68a" opacity="0.7" />
      <circle cx="0" cy="0" r="4" fill="#fef3c7" opacity="0.9" />
    </g>

    {/* ── Rosette accents ── */}
    <path d={rosette(95, 130, 6)} fill="#d97706" opacity="0.3" />
    <path d={rosette(95, 130, 3.5)} fill="#fbbf24" opacity="0.5" />
    <circle cx="95" cy="130" r="1.5" fill="#fef3c7" opacity="0.8" />

    {/* ── Scatter sparkle dots ── */}
    <circle cx="62" cy="145" r="1.5" fill="#fde047" opacity="0.7" />
    <circle cx="115" cy="100" r="1" fill="#fef3c7" opacity="0.6" />
    <circle cx="155" cy="110" r="1.5" fill="#fcd34d" opacity="0.5" />
    <circle cx="130" cy="140" r="1" fill="#fde68a" opacity="0.6" />
  </svg>
);

// Lantern-only decoration — for corner/avatar use
export const IslamicLanternDecor = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 110" fill="none" className={className}>
    <defs>
      <radialGradient id="ilanGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#fef9c3" stopOpacity="1" />
        <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="ilanBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#78350f" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    {/* Chain */}
    {[0, 5, 10, 15, 20].map((y, i) => <ellipse key={i} cx="30" cy={y + 2} rx="2" ry="2.5" fill="#d97706" opacity="0.8" />)}
    {/* Cap */}
    <path d="M20,24 Q30,16 40,24 L36,32 L24,32 Z" fill="#b45309" />
    <line x1="20" y1="24" x2="40" y2="24" stroke="#fbbf24" strokeWidth="1.5" />
    {/* Body */}
    <path d="M22,32 L18,45 L16,65 L44,65 L42,45 L38,32 Z" fill="url(#ilanBody)" stroke="#d97706" strokeWidth="1.5" />
    {/* Filigree */}
    <line x1="30" y1="32" x2="30" y2="65" stroke="#fde68a" strokeWidth="0.8" opacity="0.6" />
    <line x1="18" y1="48" x2="42" y2="48" stroke="#fde68a" strokeWidth="0.8" opacity="0.5" />
    <path d="M18,40 L42,56 M42,40 L18,56" stroke="#fde68a" strokeWidth="0.5" opacity="0.35" />
    {/* Glow */}
    <ellipse cx="30" cy="49" rx="16" ry="18" fill="url(#ilanGlow)" />
    {/* Flame */}
    <path d="M30,42 Q33,49 30,56 Q27,49 30,42 Z" fill="#fef9c3" opacity="0.95" />
    <path d="M30,46 Q32,51 30,55 Q28,51 30,46 Z" fill="#fde047" />
    {/* Base */}
    <path d="M16,65 L20,74 L40,74 L44,65 Z" fill="#b45309" />
    <line x1="20" y1="74" x2="40" y2="74" stroke="#fbbf24" strokeWidth="1.5" />
    {/* Tassel */}
    <line x1="30" y1="74" x2="30" y2="86" stroke="#d97706" strokeWidth="1.5" opacity="0.7" />
    <ellipse cx="30" cy="89" rx="3" ry="4" fill="#fbbf24" opacity="0.8" />
  </svg>
);

// Islamic Star Tessellation — geometric tile for avatar frame / home decor
export const IslamicStarTile = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <defs>
      <pattern id="islamicTilePattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
        <rect width="50" height="50" fill="none" />
        <polygon points="25,2 28,10 36,10 30,16 32,24 25,19 18,24 20,16 14,10 22,10" fill="#d97706" opacity="0.5" />
        <polygon points="25,6 27,12 33,12 28,16 30,22 25,18 20,22 22,16 17,12 23,12" fill="#fde68a" opacity="0.6" />
        <circle cx="25" cy="15" r="3" fill="#fef3c7" opacity="0.8" />
        {/* Corner petals */}
        <path d="M0,0 Q8,8 0,16 Q-8,8 0,0 Z" fill="#fbbf24" opacity="0.3" />
        <path d="M50,0 Q42,8 50,16 Q58,8 50,0 Z" fill="#fbbf24" opacity="0.3" />
        <path d="M0,50 Q8,42 0,34 Q-8,42 0,50 Z" fill="#fbbf24" opacity="0.3" />
        <path d="M50,50 Q42,42 50,34 Q58,42 50,50 Z" fill="#fbbf24" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#islamicTilePattern)" />
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
  if (theme === "islamic") return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Left corner: large main Islamic decor */}
      <div className="absolute top-[-15px] left-[-15px] w-52 h-52 opacity-50 pointer-events-none">
        <IslamicDecor className="w-full h-full drop-shadow-lg" />
      </div>
      {/* Right corner: lantern only for variety */}
      <div className="absolute top-[-8px] right-[4px] w-16 h-28 opacity-60 pointer-events-none">
        <IslamicLanternDecor className="w-full h-full drop-shadow-xl" />
      </div>
      {/* Bottom-right: small geometric star tile */}
      <div className="absolute bottom-[-10px] right-[-10px] w-28 h-28 opacity-20 pointer-events-none">
        <IslamicStarTile className="w-full h-full" />
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
  if (theme === "islamic") return <div className="absolute -top-4 -right-4 w-14 h-24 opacity-55 pointer-events-none"><IslamicLanternDecor className="w-full h-full drop-shadow-md" /></div>;
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
    
    {/* Single Real Purple Flower Top Left */}
    <g transform="translate(4, -8)">
      <defs>
        <clipPath id="singleFlowerClip">
          {/* 5 petals around center to create a realistic single flower silhouette */}
          <circle cx="15" cy="8" r="8" />
          <circle cx="23" cy="14" r="8" />
          <circle cx="20" cy="24" r="8" />
          <circle cx="10" cy="24" r="8" />
          <circle cx="7" cy="14" r="8" />
          <circle cx="15" cy="16" r="6" />
        </clipPath>
        <filter id="flowerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.4" />
        </filter>
      </defs>
      
      {/* Shadow layer (since drop-shadow on clipped image can be tricky, we apply it to a duplicate shape) */}
      <g filter="url(#flowerShadow)">
        <circle cx="15" cy="8" r="8" fill="#000" />
        <circle cx="23" cy="14" r="8" fill="#000" />
        <circle cx="20" cy="24" r="8" fill="#000" />
        <circle cx="10" cy="24" r="8" fill="#000" />
        <circle cx="7" cy="14" r="8" fill="#000" />
        <circle cx="15" cy="16" r="6" fill="#000" />
      </g>
      
      {/* The actual photo */}
      <image 
        href="/themes/purple_flower.jpg" 
        x="0" 
        y="0" 
        width="32" 
        height="32" 
        clipPath="url(#singleFlowerClip)" 
        preserveAspectRatio="xMidYMid slice" 
      />
      
      {/* Optional organic lighting overlay to enhance realism */}
      <circle cx="15" cy="15" r="14" fill="url(#frameGradient)" opacity="0.15" clipPath="url(#singleFlowerClip)" pointerEvents="none" />
      {/* Small golden center stigma */}
      <circle cx="15" cy="16" r="2.5" fill="#fde047" opacity="0.9" />
      <circle cx="15" cy="16" r="1" fill="#d97706" />
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
