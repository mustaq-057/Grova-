import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

type Drop = {
  id: number;
  left: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  opacity: number;
  blur: number;
};

export const RainstormOverlay = memo(function RainstormOverlay() {
  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      width: 1 + Math.random() * 2, // Very thin
      height: 15 + Math.random() * 40, // Streaks
      delay: Math.random() * 5, // Fast repetition
      duration: 0.4 + Math.random() * 0.5, // Very fast falling (0.4s to 0.9s)
      opacity: 0.1 + Math.random() * 0.25, // Transparent/subtle
      blur: Math.random() > 0.5 ? Math.random() * 2 : 0,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes rainFall {
          0% { transform: translate3d(0, -20vh, 0); }
          100% { transform: translate3d(0, 120vh, 0); }
        }
        @keyframes lightningFlash {
          0%, 95%, 100% { background-color: transparent; }
          96% { background-color: rgba(255,255,255,0.05); }
          98% { background-color: rgba(255,255,255,0.1); }
          99% { background-color: transparent; }
        }
      `}</style>
      
      {/* Subtle lightning flash container */}
      <div 
        className="absolute inset-0"
        style={{ animation: 'lightningFlash 15s infinite' }}
      />

      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute top-0 rounded-full"
          style={{
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.height}px`,
            backgroundColor: 'rgba(200, 220, 230, 1)', // Icy/rain color
            opacity: d.opacity,
            filter: d.blur ? `blur(${d.blur}px)` : 'none',
            animation: `rainFall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
});
