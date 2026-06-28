import { memo, useMemo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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

type StaticDroplet = {
  id: number;
  left: number;
  top: number;
  size: number;
};

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export const RainstormOverlay = memo(function RainstormOverlay() {
  const [lightningFlash, setLightningFlash] = useState(0); // 0 = off, 1 = dim, 2 = bright
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Organic Lightning Engine
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const scheduleLightning = () => {
      // Random interval between 5 and 20 seconds
      const nextStrikeIn = 5000 + Math.random() * 15000;
      
      timeout = setTimeout(() => {
        // Start strike
        const intensity = Math.random() > 0.7 ? 2 : 1;
        setLightningFlash(intensity);
        
        // Dim
        setTimeout(() => {
          setLightningFlash(0);
          
          // 40% chance of a double strike
          if (Math.random() > 0.6) {
            setTimeout(() => {
              setLightningFlash(1);
              setTimeout(() => {
                setLightningFlash(0);
                scheduleLightning();
              }, 50 + Math.random() * 100);
            }, 50 + Math.random() * 150);
          } else {
            scheduleLightning();
          }
        }, 50 + Math.random() * 150);
        
      }, nextStrikeIn);
    };

    scheduleLightning();
    return () => clearTimeout(timeout);
  }, []);

  // Interactive Ripples Engine
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore clicks on inputs/textareas to not interrupt typing, unless it's just visually fine
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev.slice(-4), newRipple]); // Keep max 5 ripples
      
      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('mousedown', handleClick);
    // Touch support
    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const newRipple = { id: Date.now(), x: touch.clientX, y: touch.clientY };
      setRipples(prev => [...prev.slice(-4), newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };
    window.addEventListener('touchstart', handleTouch, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, []);

  // Falling Rain Streaks
  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      width: 1 + Math.random() * 1.5, // Very thin
      height: 15 + Math.random() * 45, // Streaks
      delay: Math.random() * 5, // Fast repetition
      duration: 0.35 + Math.random() * 0.4, // Extremely fast falling (0.35s to 0.75s)
      opacity: 0.1 + Math.random() * 0.25, // Transparent/subtle
      blur: Math.random() > 0.5 ? Math.random() * 2 : 0,
    }));
  }, []);

  // Static refracting droplets on the "lens"
  const staticDroplets = useMemo<StaticDroplet[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 4 + Math.random() * 12, // 4px to 16px droplet
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes rainFall {
          0% { transform: translate3d(0, -20vh, 0); }
          100% { transform: translate3d(0, 120vh, 0); }
        }
        @keyframes rippleExpand {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
      
      {/* Lightning Flash Overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-colors duration-75",
          lightningFlash === 2 ? "bg-white/10" : lightningFlash === 1 ? "bg-white/5" : "bg-transparent"
        )}
      />

      {/* Static Refracting Droplets (Glassmorphism) */}
      {staticDroplets.map((d) => (
        <div
          key={`static-${d.id}`}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: `${d.size}px`,
            height: `${d.size}px`,
            // Refraction magic: blurs and distorts the background immediately behind the droplet
            backdropFilter: 'blur(4px) brightness(1.2) contrast(1.1)',
            WebkitBackdropFilter: 'blur(4px) brightness(1.2) contrast(1.1)',
            // Simulate water volume and light reflection
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
            opacity: 0.7,
          }}
        />
      ))}

      {/* Falling Rain Streaks */}
      {drops.map((d) => (
        <div
          key={`streak-${d.id}`}
          className="absolute top-0 rounded-full"
          style={{
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.height}px`,
            backgroundColor: 'rgba(210, 230, 240, 1)', // Icy rain color
            opacity: d.opacity,
            filter: d.blur ? `blur(${d.blur}px)` : 'none',
            animation: `rainFall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}

      {/* Interactive Puddle Ripples */}
      {ripples.map(r => (
        <div
          key={`ripple-${r.id}`}
          className="absolute rounded-full border border-white/40"
          style={{
            left: `${r.x - 20}px`,
            top: `${r.y - 20}px`,
            width: '40px',
            height: '40px',
            animation: 'rippleExpand 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
            boxShadow: '0 0 10px rgba(255,255,255,0.1), inset 0 0 10px rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>,
    document.body,
  );
});
