import { memo, useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Snowflake = {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  sway: number;
  opacity: number;
  blur: number;
  depth: number;
};

export const SnowfallOverlay = memo(function SnowfallOverlay() {
  const [touchWindX, setTouchWindX] = useState(0);
  const [touchWindY, setTouchWindY] = useState(0);
  const [tiltX, setTiltX] = useState(0);

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
        setTouchWindX(Math.max(-150, Math.min(150, dx * 2)));
        setTouchWindY(Math.max(-150, Math.min(150, dy * 2)));
        
        clearTimeout(windTimeout);
        windTimeout = setTimeout(() => {
          setTouchWindX(0);
          setTouchWindY(0);
        }, 300);
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

  // Device Orientation Physics (Gyroscope)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma; // In degree in the range [-90,90]
      if (gamma !== null) {
        // Map tilt to wind force (-45deg to 45deg maps to -100px to 100px)
        const tiltForce = Math.max(-100, Math.min(100, gamma * 2.2));
        setTiltX(tiltForce);
      }
    };

    // Need to request permission for iOS 13+
    // But for simplicity, we just listen if it's available without prompt 
    // (some browsers still allow it, or it will be ignored).
    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation, true);
      }
    };
  }, []);

  // Parallax Snowflakes
  const flakes = useMemo<Snowflake[]>(() => {
    return Array.from({ length: 60 }, (_, i) => {
      // 3 Depth layers
      const layer = i % 3; // 0 = bg, 1 = mid, 2 = fg
      let depth, size, duration, opacity, blur;
      
      if (layer === 0) { // Background (small, slow, blurry)
        depth = 0.3;
        size = 2 + Math.random() * 3;
        duration = 20 + Math.random() * 15;
        opacity = 0.4 + Math.random() * 0.3;
        blur = 2 + Math.random() * 2;
      } else if (layer === 1) { // Midground (medium, normal, sharp)
        depth = 0.7;
        size = 4 + Math.random() * 4;
        duration = 12 + Math.random() * 10;
        opacity = 0.6 + Math.random() * 0.4;
        blur = Math.random() > 0.7 ? 1 : 0;
      } else { // Foreground (large, fast, slightly out of focus)
        depth = 1.2;
        size = 8 + Math.random() * 6;
        duration = 6 + Math.random() * 6;
        opacity = 0.8 + Math.random() * 0.2;
        blur = 3 + Math.random() * 3; // Depth of field blur
      }

      return {
        id: i,
        left: -20 + Math.random() * 140, // Allow spawning slightly offscreen
        size,
        delay: Math.random() * -30, // Negative delay so they are already falling
        duration,
        sway: 20 + Math.random() * 40, 
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
          100% { transform: translate3d(calc(var(--tilt) + var(--wind-x)), calc(110vh + var(--wind-y)), 0); }
        }
        @keyframes snowSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
        @keyframes snowShimmer {
          0%, 100% { opacity: var(--base-opacity); }
          50% { opacity: 1; box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8); }
        }
        .snowfall-gradient-bg {
           background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%);
        }
      `}</style>
      
      {/* Background illumination */}
      <div className="absolute inset-0 snowfall-gradient-bg opacity-70" />

      {/* Decorative Snowman and Penguin */}
      <div className="absolute bottom-[80px] left-8 text-5xl opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ animationDuration: '4s' }}>
        ⛄
      </div>
      <div className="absolute bottom-[80px] right-8 text-4xl opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" style={{ animationDuration: '5s' }}>
        🐧
      </div>

      {/* Frost Vignette (Glassmorphism edges) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(255,255,255,0.05)] ring-1 ring-white/5 mix-blend-overlay backdrop-blur-[1px] opacity-40 dark:opacity-20" />

      {/* Container responding to touch/tilt forces for smooth lerping */}
      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translate3d(${touchWindX * 0.5 + tiltX * 0.3}px, ${touchWindY * 0.3}px, 0)` }}
      >
        {flakes.map((f) => (
          <div
            key={`snow-${f.id}`}
            className="absolute top-0 rounded-full bg-white select-none"
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
              "--tilt": `${tiltX * f.depth}px`,
              "--wind-x": `${touchWindX * f.depth}px`,
              "--wind-y": `${touchWindY * f.depth}px`,
              "--base-opacity": f.opacity,
            }}
          />
        ))}
      </div>
    </div>,
    document.body
  );
});
