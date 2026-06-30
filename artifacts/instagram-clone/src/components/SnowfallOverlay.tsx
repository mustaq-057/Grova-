import { memo, useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SNOWFLAKE_SVGS = [
  // Intricate crystal star
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M4 12h16"/><path d="m19.07 4.93-14.14 14.14"/><path d="M4.93 4.93l14.14 14.14"/><path d="m7.76 7.76 2.12-2.12"/><path d="m16.24 16.24-2.12 2.12"/><path d="m7.76 16.24 2.12 2.12"/><path d="m16.24 7.76-2.12-2.12"/></svg>,
  // Frosty branch snowflake
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 20-3-3 3-3"/><path d="M12 22V2"/><path d="m14 20 3-3-3-3"/><path d="m5 17-3-3 3-3"/><path d="M2 12h20"/><path d="m19 17 3-3-3-3"/><path d="m10 4-3 3 3 3"/><path d="m14 4 3 3-3 3"/></svg>
];

export const SnowflakeDecor = ({ className = "w-full h-full text-blue-200" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ filter: "drop-shadow(0px 2px 4px rgba(255,255,255,0.8))" }}>
    <path d="M12 2v20"/><path d="M4 12h16"/><path d="m19.07 4.93-14.14 14.14"/><path d="M4.93 4.93l14.14 14.14"/><path d="m7.76 7.76 2.12-2.12"/><path d="m16.24 16.24-2.12 2.12"/><path d="m7.76 16.24 2.12 2.12"/><path d="m16.24 7.76-2.12-2.12"/>
  </svg>
);

export const FrostBranch = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 300" fill="none" className={className} style={{ filter: "drop-shadow(0 4px 8px rgba(255,255,255,0.5))" }}>
    {/* Main branch trunk */}
    <path d="M10,290 Q40,200 120,50 T190,10" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8"/>
    {/* Snow on main branch */}
    <path d="M8,288 Q40,195 120,45 T190,5" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9"/>
    
    {/* Secondary branches */}
    <path d="M50,180 Q100,150 150,130" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8"/>
    <path d="M50,177 Q100,147 150,127" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9"/>
    
    <path d="M90,110 Q140,80 170,90" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8"/>
    <path d="M90,107 Q140,77 170,87" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9"/>
    
    {/* Tiny twigs */}
    <path d="M120,140 Q135,160 140,170" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M130,85 Q140,60 150,55" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none"/>
    
    {/* Icicles */}
    <path d="M50,180 L52,195 L54,180 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M100,110 L101,125 L102,110 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M140,133 L142,150 L144,133 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M150,127 L152,140 L154,127 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M170,90 L171,105 L172,90 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M120,50 L122,65 L124,50 Z" fill="#e2e8f0" opacity="0.9"/>
    <path d="M80,135 L81,148 L82,135 Z" fill="#e2e8f0" opacity="0.9"/>
    
    {/* Glowing frost sparks */}
    <circle cx="160" cy="40" r="2.5" fill="#ffffff" opacity="0.9" style={{ filter: "blur(1px)" }}/>
    <circle cx="110" cy="150" r="2" fill="#ffffff" opacity="0.8" style={{ filter: "blur(1px)" }}/>
    <circle cx="60" cy="90" r="2.5" fill="#ffffff" opacity="0.9" style={{ filter: "blur(1px)" }}/>
    <circle cx="180" cy="110" r="2" fill="#ffffff" opacity="0.8" style={{ filter: "blur(1px)" }}/>
  </svg>
);

type Snowflake = {
  id: number;
  shapeIndex: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  sway: number;
  spin: number;
  spinDuration: number;
  opacity: number;
  blur: number;
  depth: number;
};

export const SnowfallOverlay = memo(function SnowfallOverlay() {
  // Parallax Snowflakes
  const flakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: 60 }, (_, i) => {
      // 3 Depth layers
      const layer = i % 3; // 0 = bg, 1 = mid, 2 = fg
      let depth, size, duration, opacity, blur;
      
      if (layer === 0) { // Background (small, slow, blurry)
        depth = 0.3;
        size = 4 + Math.random() * 4;
        duration = 20 + Math.random() * 15;
        opacity = 0.3 + Math.random() * 0.2;
        blur = 3 + Math.random() * 2;
      } else if (layer === 1) { // Midground (medium, normal, sharp)
        depth = 0.7;
        size = 12 + Math.random() * 8;
        duration = 12 + Math.random() * 10;
        opacity = 0.5 + Math.random() * 0.4;
        blur = Math.random() > 0.7 ? 1 : 0;
      } else { // Foreground (large, fast, slightly out of focus)
        depth = 1.2;
        size = 24 + Math.random() * 16;
        duration = 6 + Math.random() * 6;
        opacity = 0.7 + Math.random() * 0.3;
        blur = 2 + Math.random() * 3; // Depth of field blur
      }

      return {
        id: i,
        shapeIndex: i % SNOWFLAKE_SVGS.length,
        left: -20 + Math.random() * 140, // Allow spawning slightly offscreen
        size,
        delay: Math.random() * -30, // Negative delay so they are already falling
        duration,
        sway: 20 + Math.random() * 40,
        spin: Math.random() * 360,
        spinDuration: 8 + Math.random() * 15,
        opacity,
        blur,
        depth,
      };
    });
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes snowfall {
          0% { transform: translate3d(0, -10vh, 0); }
          100% { transform: translate3d(0, 110vh, 0); }
        }
        @keyframes snowSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
        @keyframes snowSpin {
          0% { transform: rotate(var(--start-spin)); }
          100% { transform: rotate(calc(var(--start-spin) + 360deg)); }
        }
        @keyframes snowShimmer {
          0%, 100% { opacity: var(--base-opacity); filter: drop-shadow(0 0 2px rgba(255,255,255,0.2)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.9)); }
        }
        .snowfall-gradient-bg {
           background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%);
        }
      `}</style>
      
      {/* Background illumination */}
      <div className="absolute inset-0 snowfall-gradient-bg opacity-70" />

      {/* Decorative Frost Branches */}
      <div className="absolute bottom-[-10px] left-[-20px] w-48 h-64 opacity-70">
        <FrostBranch />
      </div>
      <div className="absolute bottom-[-20px] right-[-30px] w-56 h-72 opacity-60 transform scale-x-[-1] rotate-12">
        <FrostBranch />
      </div>

      {/* Frost Vignette (Glassmorphism edges) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(255,255,255,0.05)] ring-1 ring-white/5 mix-blend-overlay backdrop-blur-[1px] opacity-40 dark:opacity-20" />

      {/* Container - no interactive wind transform needed */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out">
        {flakes.map((f) => (
          <div
            key={`snow-${f.id}`}
            className="absolute top-0 text-white select-none"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: f.opacity,
              filter: f.blur ? `blur(${f.blur}px)` : 'drop-shadow(0 0 4px rgba(255,255,255,0.4))',
              animation: `
                snowfall ${f.duration}s linear ${f.delay}s infinite, 
                snowSway ${3 + f.duration * 0.2}s ease-in-out ${f.delay}s infinite alternate,
                ${f.depth > 1 ? `snowShimmer ${1 + Math.random() * 2}s ease-in-out ${f.delay}s infinite alternate` : 'none'}
              `,
              // @ts-expect-error css vars
              "--sway": `${f.sway}px`,
              "--base-opacity": f.opacity,
            }}
          >
            <div 
              className="w-full h-full"
              style={{ 
                animation: `snowSpin ${f.spinDuration}s linear ${f.delay}s infinite`,
                // @ts-expect-error
                "--start-spin": `${f.spin}deg`
              }}
            >
              {SNOWFLAKE_SVGS[f.shapeIndex]}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
});
