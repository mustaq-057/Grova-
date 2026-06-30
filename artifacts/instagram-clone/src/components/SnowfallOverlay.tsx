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

export const SnowyPine = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 300" fill="none" className={className} style={{ filter: "drop-shadow(0px 10px 15px rgba(255,255,255,0.2))" }}>
    <path d="M90 250 L110 250 L105 300 L95 300 Z" fill="#2d3748" />
    <path d="M100 20 L40 100 L80 100 L30 180 L80 180 L20 260 L180 260 L120 180 L170 180 L120 100 L160 100 Z" fill="#1a365d" />
    <path d="M100 20 L50 90 Q 75 95, 80 100 L65 100 L100 50 L135 100 L120 100 Q 125 95, 150 90 Z" fill="#e2e8f0" opacity="0.95"/>
    <path d="M80 100 L40 170 Q 65 175, 80 180 L65 180 L100 120 L135 180 L120 180 Q 135 175, 160 170 Z" fill="#e2e8f0" opacity="0.95"/>
    <path d="M80 180 L30 250 Q 75 255, 90 260 L110 260 Q 125 255, 170 250 Z" fill="#e2e8f0" opacity="0.95"/>
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

      {/* Decorative Snowy Pines */}
      <div className="absolute bottom-[-20px] left-[-20px] w-40 h-60 opacity-60">
        <SnowyPine />
      </div>
      <div className="absolute bottom-[-10px] right-[-10px] w-32 h-48 opacity-50 rotate-[-5deg]">
        <SnowyPine />
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
