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

type PuddleSplash = {
  id: number;
  left: number;
};

const LightningEngine = memo(function LightningEngine() {
  const [lightningFlash, setLightningFlash] = useState(0); 

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleLightning = () => {
      const nextStrikeIn = 3000 + Math.random() * 8000; // More frequent thunder
      timeout = setTimeout(() => {
        const intensity = Math.random() > 0.7 ? 2 : 1;
        setLightningFlash(intensity);
        setTimeout(() => {
          setLightningFlash(0);
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

  if (lightningFlash === 0) return null;

  return (
    <div 
      className={cn(
        "absolute inset-0 transition-colors duration-75 pointer-events-none",
        lightningFlash === 2 ? "bg-white/20" : "bg-white/10"
      )}
    />
  );
});

const SplashEngine = memo(function SplashEngine() {
  const [splashes, setSplashes] = useState<PuddleSplash[]>([]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleSplash = () => {
      timeout = setTimeout(() => {
        const newSplash = { id: Date.now(), left: 10 + Math.random() * 80 };
        setSplashes(prev => [...prev.slice(-10), newSplash]);
        
        setTimeout(() => {
          setSplashes(prev => prev.filter(s => s.id !== newSplash.id));
        }, 300); // Splashes are very fast
        
        scheduleSplash();
      }, 50 + Math.random() * 150); // High frequency
    };
    scheduleSplash();
    return () => clearTimeout(timeout);
  }, []);

  if (splashes.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none">
      {splashes.map(s => (
        <div
          key={`splash-${s.id}`}
          className="absolute bottom-2 w-0.5 bg-white/40 rounded-full"
          style={{
            left: `${s.left}%`,
            height: '10px',
            animation: 'puddleSplash 0.3s ease-out forwards',
          }}
        />
      ))}
    </div>
  );
});

export const RainstormOverlay = memo(function RainstormOverlay() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Interactive Ripples Engine
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev.slice(-4), newRipple]); 
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('mousedown', handleClick);
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

  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: 200 }, (_, i) => ({ 
      id: i,
      left: Math.random() * 100,
      width: 1 + Math.random() * 1.5, 
      height: 15 + Math.random() * 45, 
      delay: Math.random() * 5, 
      duration: 0.35 + Math.random() * 0.4, 
      opacity: 0.1 + Math.random() * 0.25, 
      blur: Math.random() > 0.5 ? Math.random() * 2 : 0,
    }));
  }, []);

  const staticDroplets = useMemo<StaticDroplet[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 4 + Math.random() * 12, 
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
        @keyframes puddleSplash {
          0% { transform: scaleY(0) translateY(0); opacity: 1; }
          50% { transform: scaleY(1) translateY(-10px); opacity: 0.8; }
          100% { transform: scaleY(0) translateY(-15px); opacity: 0; }
        }
      `}</style>
      
      <LightningEngine />

      {/* Static Refracting Droplets */}
      <div className="absolute inset-0 transition-transform duration-200 ease-out">
        {staticDroplets.map((d) => (
          <div
            key={`static-${d.id}`}
            className="absolute rounded-full"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.05))',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.1)',
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Falling Rain Streaks */}
      {drops.map((d) => (
        <div
          key={`streak-${d.id}`}
          className="absolute top-0 rounded-full"
          style={{
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.height}px`,
            backgroundColor: 'rgba(210, 230, 240, 1)', 
            opacity: d.opacity,
            filter: d.blur ? `blur(${d.blur}px)` : 'none',
            animation: `rainFall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}

      <SplashEngine />

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
