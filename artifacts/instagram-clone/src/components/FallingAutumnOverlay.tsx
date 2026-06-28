import { memo, useMemo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

// High-fidelity SVG Leaf paths
const LEAF_SVGS = [
  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M492.3 227.1l-66.2-11.8 17.5-31.5c4.7-8.5-3.3-17.7-11.9-13.8l-105.7 48.6-21.5-62.7 34.6-25.5c7.7-5.7 6.1-17.5-2.9-20.9l-68.5-25.8-2.6-43.6c-.6-9.7-12.8-13.1-18.4-5.2l-38.6 54.4-48-20c-8.9-3.7-18.3 3.3-16.5 12.6l12.8 67.5-68.2-11.7c-9.6-1.7-15.3 9.4-9.8 17.4l39 57.5-60.5 25.1c-9.2 3.8-10.7 16.5-2.6 22.3l74.9 54-15 42c-3.1 8.8 4.7 17.1 13.5 14.3l69.7-22.1 36.4 53.6c5.5 8.1 18.2 6.5 21.3-2.6l15-44.5 42.1 43.1c7 7.2 19 2.5 19-7.5v-78l61 29.5c8.7 4.2 18-3.4 15.6-12.8l-14.5-56 59.8 18.5c9.2 2.8 17.4-5.8 13.9-14.5z"/></svg>,
  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M256 0c-4.3 0-8.2 2.6-9.7 6.7-12.5 35-37.4 61-72.3 75.3-31.5 12.9-54 36.3-64.6 69-1.9 5.8-9 8.2-14 4.8-19.1-13.2-41-13.6-59.5-1-17.8 12.1-27.1 31.8-25.5 53.8 2.2 30.6 21 54.7 51 65.5 5.5 2 7.7 8.3 4.8 13.3-20.7 35.8-11.3 82.5 22.1 107.5 17.4 13 38.3 16.6 58.7 10.3 5.3-1.6 10.7 1.8 11.9 7.2 6.6 29.8 27.5 52 56 60 4 1.1 6.8 4.6 7 8.7l2.1 27.8c.3 4.1 3.7 7.2 7.8 7.2h32c4.1 0 7.5-3.1 7.8-7.2l2.1-27.8c.2-4.1 3-7.6 7-8.7 28.5-8 49.4-30.2 56-60 1.2-5.4 6.6-8.8 11.9-7.2 20.4 6.3 41.3 2.7 58.7-10.3 33.4-25 42.8-71.7 22.1-107.5-2.9-5-1.1-11.4 4.8-13.3 30-10.8 48.8-34.9 51-65.5 1.6-22-7.7-41.7-25.5-53.8-18.5-12.6-40.4-12.2-59.5 1-5 3.4-12.1 1-14-4.8-10.6-32.7-33.1-56.1-64.6-69-34.9-14.3-59.8-40.3-72.3-75.3-1.5-4.1-5.4-6.7-9.7-6.7z"/></svg>,
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
  spin: number;
  spinXDuration: number;
  spinYDuration: number;
  color: string;
  depth: number;
  blur: number;
};

type Firefly = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
};

export const FallingAutumnOverlay = memo(function FallingAutumnOverlay() {
  const [globalWind, setGlobalWind] = useState(0);
  const [touchWindX, setTouchWindX] = useState(0);
  const [touchWindY, setTouchWindY] = useState(0);
  const [isNight, setIsNight] = useState(false);

  // Time of Day Logic
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour <= 6);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Global scroll listener for wind physics
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let windTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const target = e.target as HTMLElement | Document;
          const currentScrollY = target === document ? window.scrollY : (target as HTMLElement).scrollTop;
          const velocity = currentScrollY - lastScrollY;
          lastScrollY = currentScrollY;

          if (Math.abs(velocity) > 5) {
            const windForce = Math.max(-100, Math.min(100, velocity * (target === document ? 2 : -1.5)));
            setGlobalWind(windForce);
            
            clearTimeout(windTimeout);
            windTimeout = setTimeout(() => setGlobalWind(0), 300);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  // Interactive Touch/Mouse Wind
  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let lastTime = Date.now();
    let windTimeout: ReturnType<typeof setTimeout>;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      if (now - lastTime < 16) return; // limit to ~60fps
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      if (lastX !== 0 && lastY !== 0) {
        const dx = clientX - lastX;
        const dy = clientY - lastY;
        
        // Calculate velocity vector
        setTouchWindX(Math.max(-200, Math.min(200, dx * 3)));
        setTouchWindY(Math.max(-200, Math.min(200, dy * 3)));
        
        clearTimeout(windTimeout);
        windTimeout = setTimeout(() => {
          setTouchWindX(0);
          setTouchWindY(0);
        }, 150);
      }
      
      lastX = clientX;
      lastY = clientY;
      lastTime = now;
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, []);

  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      shapeIndex: i % LEAF_SVGS.length,
      left: -10 + Math.random() * 120, 
      size: 16 + Math.random() * 24,
      delay: Math.random() * 25,
      duration: 16 + Math.random() * 22,
      drift: (Math.random() - 0.2) * 150, 
      sway: 40 + Math.random() * 60, 
      spin: (Math.random() - 0.5) * 360, 
      spinXDuration: 3 + Math.random() * 4,
      spinYDuration: 4 + Math.random() * 5, 
      color: LEAF_COLORS[i % LEAF_COLORS.length]!,
      depth: 0.4 + Math.random() * 0.6,
      blur: Math.random() > 0.6 ? 2 + Math.random() * 4 : 0,
    }));
  }, []);

  const fireflies = useMemo<Firefly[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: 20 + Math.random() * 80, // Start lower down
      size: 2 + Math.random() * 4,
      delay: Math.random() * 10,
      duration: 5 + Math.random() * 15,
      driftX: (Math.random() - 0.5) * 100,
      driftY: -50 - Math.random() * 100, // Drift upwards
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes autumnFall {
          0% { transform: translate3d(0, -15vh, 0) scale(0.85); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(calc(var(--drift) + var(--wind-x)), calc(115vh + var(--wind-y))), 0) scale(1.1); opacity: 0; }
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
        @keyframes fireflyFloat {
          0% { transform: translate3d(0, 0, 0) scale(0.8); opacity: 0; }
          20% { opacity: var(--max-opacity); }
          80% { opacity: var(--max-opacity); }
          100% { transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1.2); opacity: 0; }
        }
        @keyframes fireflyBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; box-shadow: 0 0 10px 2px rgba(234, 179, 8, 0.8); }
        }
      `}</style>
      
      {/* Night Time Darkening Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 bg-black/40"
        style={{ opacity: isNight ? 1 : 0 }}
      />

      {/* Dynamic Sunlight / God Rays (Only visible during day) */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vh] rounded-full blur-[100px] bg-gradient-radial from-amber-400/30 to-transparent mix-blend-overlay transition-opacity duration-1000"
        style={{ 
          animation: 'godRayPulse 12s ease-in-out infinite',
          opacity: isNight ? 0 : 1
        }}
      />
      <div 
        className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] rounded-full blur-[120px] bg-gradient-radial from-orange-400/20 to-transparent mix-blend-overlay transition-opacity duration-1000"
        style={{ 
          animation: 'godRayPulse 18s ease-in-out infinite reverse',
          opacity: isNight ? 0 : 1
        }}
      />

      {/* Container responding to wind forces */}
      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translate3d(${touchWindX * 0.5}px, ${(globalWind * 0.3) + (touchWindY * 0.5)}px, 0)` }}
      >
        {/* Render Leaves during the day, or Fireflies during the night */}
        {!isNight ? (
          flakes.map((f) => (
            <div
              key={`leaf-${f.id}`}
              className="absolute top-0 select-none"
              style={{
                left: `${f.left}%`,
                width: `${f.size}px`,
                height: `${f.size}px`,
                color: f.color,
                opacity: 0.8 * f.depth,
                filter: f.blur ? `blur(${f.blur}px)` : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                animation: `autumnFall ${f.duration}s linear ${f.delay}s infinite, autumnSway ${5 + f.duration * 0.15}s ease-in-out ${f.delay}s infinite alternate`,
                // @ts-expect-error css vars
                "--drift": `${f.drift}px`,
                "--sway": `${f.sway}px`,
                "--wind-x": `${touchWindX}px`,
                "--wind-y": `${globalWind}px`,
              }}
            >
              <div className="w-full h-full" style={{ transform: `rotate(${f.spin}deg)` }}>
                <div className="w-full h-full" style={{ animation: `leafTumbleX ${f.spinXDuration}s linear ${f.delay}s infinite, leafTumbleY ${f.spinYDuration}s linear ${f.delay}s infinite` }}>
                  {LEAF_SVGS[f.shapeIndex]}
                </div>
              </div>
            </div>
          ))
        ) : (
          fireflies.map((f) => (
            <div
              key={`firefly-${f.id}`}
              className="absolute rounded-full bg-yellow-300"
              style={{
                left: `${f.left}%`,
                top: `${f.top}%`,
                width: `${f.size}px`,
                height: `${f.size}px`,
                boxShadow: "0 0 6px 1px rgba(253, 224, 71, 0.6)",
                animation: `
                  fireflyFloat ${f.duration}s ease-in-out ${f.delay}s infinite,
                  fireflyBlink ${1 + Math.random() * 2}s ease-in-out ${f.delay}s infinite alternate
                `,
                // @ts-expect-error vars
                "--drift-x": `${f.driftX + (touchWindX * 0.5)}px`,
                "--drift-y": `${f.driftY + (touchWindY * 0.5)}px`,
                "--max-opacity": f.opacity
              }}
            />
          ))
        )}
      </div>
    </div>
  );
});
