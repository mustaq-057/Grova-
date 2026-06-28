import { memo, useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// High-fidelity SVG Leaf paths (Maple, Oak, Elm shapes)
const LEAF_SVGS = [
  // Maple
  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M492.3 227.1l-66.2-11.8 17.5-31.5c4.7-8.5-3.3-17.7-11.9-13.8l-105.7 48.6-21.5-62.7 34.6-25.5c7.7-5.7 6.1-17.5-2.9-20.9l-68.5-25.8-2.6-43.6c-.6-9.7-12.8-13.1-18.4-5.2l-38.6 54.4-48-20c-8.9-3.7-18.3 3.3-16.5 12.6l12.8 67.5-68.2-11.7c-9.6-1.7-15.3 9.4-9.8 17.4l39 57.5-60.5 25.1c-9.2 3.8-10.7 16.5-2.6 22.3l74.9 54-15 42c-3.1 8.8 4.7 17.1 13.5 14.3l69.7-22.1 36.4 53.6c5.5 8.1 18.2 6.5 21.3-2.6l15-44.5 42.1 43.1c7 7.2 19 2.5 19-7.5v-78l61 29.5c8.7 4.2 18-3.4 15.6-12.8l-14.5-56 59.8 18.5c9.2 2.8 17.4-5.8 13.9-14.5z"/></svg>,
  // Oak
  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M256 0c-4.3 0-8.2 2.6-9.7 6.7-12.5 35-37.4 61-72.3 75.3-31.5 12.9-54 36.3-64.6 69-1.9 5.8-9 8.2-14 4.8-19.1-13.2-41-13.6-59.5-1-17.8 12.1-27.1 31.8-25.5 53.8 2.2 30.6 21 54.7 51 65.5 5.5 2 7.7 8.3 4.8 13.3-20.7 35.8-11.3 82.5 22.1 107.5 17.4 13 38.3 16.6 58.7 10.3 5.3-1.6 10.7 1.8 11.9 7.2 6.6 29.8 27.5 52 56 60 4 1.1 6.8 4.6 7 8.7l2.1 27.8c.3 4.1 3.7 7.2 7.8 7.2h32c4.1 0 7.5-3.1 7.8-7.2l2.1-27.8c.2-4.1 3-7.6 7-8.7 28.5-8 49.4-30.2 56-60 1.2-5.4 6.6-8.8 11.9-7.2 20.4 6.3 41.3 2.7 58.7-10.3 33.4-25 42.8-71.7 22.1-107.5-2.9-5-1.1-11.4 4.8-13.3 30-10.8 48.8-34.9 51-65.5 1.6-22-7.7-41.7-25.5-53.8-18.5-12.6-40.4-12.2-59.5 1-5 3.4-12.1 1-14-4.8-10.6-32.7-33.1-56.1-64.6-69-34.9-14.3-59.8-40.3-72.3-75.3-1.5-4.1-5.4-6.7-9.7-6.7z"/></svg>,
  // Elm
  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M497.9 142.1l-46.1-33.2c-5.7-4.1-13.7-1-14.6 6.1l-4.5 35.2c-.6 4.9-5.4 8.2-10 7L241 103.5l14.4-44.5c2.3-7-3.9-13.6-10.7-11.4l-42 13.5c-4.4 1.4-8.8-1.5-9.3-6.1l-4.5-41.9c-.8-7.4-10.4-9.4-14.5-3l-28 43.7c-2.7 4.2-8.3 5-11.9 1.6L103.6 25c-5.4-5-14.1-1.2-14.4 6.3l-1.8 41.5c-.2 4.6-4.9 7.6-9.2 5.9L37.7 62c-6.8-2.6-13.4 3.7-11.1 10.5l14.4 43.1c1.5 4.4-1.5 8.9-6 9.8L3 132c-7.3 1.5-9.1 11.2-2.6 15.3l37.2 23.5c4 2.5 5.1 7.8 2.3 11.5L9.6 223c-4.4 5.9.1 14.2 7.4 13.8l42.6-2c4.7-.2 8.5 3.3 8.7 8l1.4 35c.3 7.3 9.4 10.3 13.8 4.6l26-33.7c2.9-3.8 8.6-4 11.8-.4l29.8 33.3c5 5.6 14.1 2.3 14.5-5.3l2-38c.3-4.7 4.8-7.9 9.3-6.6l176.6 51.6-13.2 41c-2.2 6.8 4.1 13.4 10.9 11l41-14.3c4.4-1.5 9.1 1.2 9.8 5.8l6.8 42c1.2 7.3 11 9 14.8 2.6l23.7-39.7c2.4-4 8-4.7 11.3-1.4l31.2 31.2c5.3 5.3 14.2 1.5 14.2-6v-41.1c0-4.6 4.7-7.6 9-6l40.4 15.4c6.7 2.6 13.1-3.9 10.7-10.6l-14-40.2c-1.6-4.5 1.5-9.2 6.2-9.9l40.6-6.4c7.3-1.1 9.4-10.7 3.2-14.9l-35.3-24c-3.9-2.7-4.9-8-2-11.8l29.8-38.3c4.5-5.8-.3-14.3-7.6-13.6l-40.2 3.6c-4.7.4-8.4-3.3-8.3-8l.9-35.1c.1-7.4-9-10.6-13.5-4.8l-26.3 33.8c-2.9 3.8-8.6 3.9-11.8.2L497.9 142.1z"/></svg>,
];
const LEAF_COLORS = ["#d97706", "#ea580c", "#c2410c", "#b45309", "#9a3412"];

type Flake = {
  id: number;
  shapeIndex: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  sway: number;
  spin: number; // Z-axis spin
  spinXDuration: number;
  spinYDuration: number;
  color: string;
  depth: number;
  blur: number;
};

export const FallingAutumnOverlay = memo(function FallingAutumnOverlay() {
  const [globalWind, setGlobalWind] = useState(0);

  // Global scroll listener for wind physics
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let windTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Calculate scroll velocity
          const currentScrollY = window.scrollY;
          const velocity = currentScrollY - lastScrollY;
          lastScrollY = currentScrollY;

          // Apply a "wind" force based on scroll speed (capped)
          if (Math.abs(velocity) > 5) {
            const windForce = Math.max(-100, Math.min(100, velocity * 2));
            setGlobalWind(windForce);
            
            clearTimeout(windTimeout);
            windTimeout = setTimeout(() => {
              setGlobalWind(0); // Wind dies down after scrolling stops
            }, 300);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Also listen to the chat container scroll since layout sets overflow hidden on body
    const chatContainer = document.querySelector('.chat-panel-messages');
    if (chatContainer) {
      chatContainer.addEventListener("scroll", (e) => {
        const target = e.target as HTMLElement;
        const currentScrollY = target.scrollTop;
        const velocity = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        if (Math.abs(velocity) > 5) {
          const windForce = Math.max(-100, Math.min(100, velocity * 1.5));
          setGlobalWind(-windForce); // Invert because scrolling down chat means content goes up
          clearTimeout(windTimeout);
          windTimeout = setTimeout(() => setGlobalWind(0), 300);
        }
      }, { passive: true });
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (chatContainer) chatContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      shapeIndex: i % LEAF_SVGS.length,
      left: -10 + Math.random() * 120, 
      size: 16 + Math.random() * 24,
      delay: Math.random() * 25,
      duration: 16 + Math.random() * 22, // Slower falling
      drift: (Math.random() - 0.2) * 150, 
      sway: 40 + Math.random() * 60, 
      spin: (Math.random() - 0.5) * 360, 
      spinXDuration: 3 + Math.random() * 4, // 3D tumbling speed
      spinYDuration: 4 + Math.random() * 5, 
      color: LEAF_COLORS[i % LEAF_COLORS.length]!,
      depth: 0.4 + Math.random() * 0.6,
      blur: Math.random() > 0.6 ? 2 + Math.random() * 4 : 0,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes autumnFall {
          0% { transform: translate3d(0, -15vh, 0) scale(0.85); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(calc(var(--drift) + var(--wind)), 115vh, 0) scale(1.1); opacity: 0; }
        }
        @keyframes autumnSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
        @keyframes leafTumbleX {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(360deg); }
        }
        @keyframes leafTumbleY {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes godRayPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.1); }
        }
      `}</style>
      
      {/* Dynamic Sunlight / God Rays */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vh] rounded-full blur-[100px] bg-gradient-radial from-amber-400/30 to-transparent mix-blend-overlay"
        style={{ animation: 'godRayPulse 12s ease-in-out infinite' }}
      />
      <div 
        className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] bg-gradient-radial from-orange-400/20 to-transparent mix-blend-overlay"
        style={{ animation: 'godRayPulse 18s ease-in-out infinite reverse' }}
      />

      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ 
          // Global wind shifts the entire container slightly for immediate effect
          transform: `translate3d(0, ${globalWind * 0.3}px, 0)` 
        }}
      >
        {flakes.map((f) => (
          <div
            key={f.id}
            className="absolute top-0 select-none"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              color: f.color,
              opacity: 0.8 * f.depth,
              filter: f.blur ? `blur(${f.blur}px)` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              animation: `
                autumnFall ${f.duration}s linear ${f.delay}s infinite, 
                autumnSway ${5 + f.duration * 0.15}s ease-in-out ${f.delay}s infinite alternate
              `,
              // @ts-expect-error css vars
              "--drift": `${f.drift}px`,
              "--sway": `${f.sway}px`,
              "--wind": `${globalWind}px`, // Wind pushes drift dynamically
            }}
          >
            {/* Inner div handles the 3D tumbling so it doesn't conflict with the falling translation */}
            <div 
              className="w-full h-full"
              style={{
                transform: `rotate(${f.spin}deg)`, // Initial Z rotation
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  animation: `
                    leafTumbleX ${f.spinXDuration}s linear ${f.delay}s infinite,
                    leafTumbleY ${f.spinYDuration}s linear ${f.delay}s infinite
                  `
                }}
              >
                {LEAF_SVGS[f.shapeIndex]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
});
