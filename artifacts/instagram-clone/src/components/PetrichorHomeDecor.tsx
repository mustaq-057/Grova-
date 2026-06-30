import { memo, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export const PetrichorCloud = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 60" fill="currentColor" className={className} style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}>
    <path 
      d="M25 45 Q 15 45, 10 35 Q 5 25, 20 20 Q 30 5, 50 10 Q 75 -5, 85 15 Q 100 20, 95 35 Q 90 45, 80 40 Z" 
      opacity="0.6"
    />
    <path 
      d="M30 40 Q 20 40, 15 30 Q 10 20, 25 15 Q 35 5, 50 10 Q 70 0, 80 15 Q 95 20, 90 35 Q 85 45, 75 40 Z" 
      opacity="0.9"
    />
  </svg>
);
export const PetrichorHomeDecor = memo(function PetrichorHomeDecor() {
  const [wipeCoords, setWipeCoords] = useState<{ x: number, y: number } | null>(null);
  
  // Interactive Condensation Wipe
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      setWipeCoords({ x, y });
      
      // Gradually "fog" back up after wiping
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setWipeCoords(null);
      }, 1000); 
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      
      {/* Frosted Condensation Overlay (Edges) */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(200, 220, 230, 0.05) 70%, rgba(180, 200, 210, 0.15) 100%)",
          // Combine the default oval mask (clear middle, frosted edges) with the dynamic wipe mask
          maskImage: wipeCoords 
            ? `radial-gradient(ellipse at center, transparent 50%, black 100%), radial-gradient(circle 80px at ${wipeCoords.x}px ${wipeCoords.y}px, transparent 100%, black 100%)`
            : `radial-gradient(ellipse at center, transparent 50%, black 100%)`,
          WebkitMaskImage: wipeCoords 
            ? `radial-gradient(ellipse at center, transparent 50%, black 100%), radial-gradient(circle 100px at ${wipeCoords.x}px ${wipeCoords.y}px, transparent 100%, black 100%)`
            : `radial-gradient(ellipse at center, transparent 50%, black 100%)`,
          maskComposite: wipeCoords ? "subtract" : "add",
          WebkitMaskComposite: wipeCoords ? "destination-out" : "source-over", // "Wipe" effect
          zIndex: 1
        }}
      />

      <div className="absolute top-[-10px] left-[-20px] w-48 h-32 opacity-40 text-blue-200 pointer-events-none">
        <PetrichorCloud />
      </div>
      <div className="absolute top-[-20px] right-[-30px] w-56 h-40 opacity-30 text-blue-300 pointer-events-none rotate-[10deg]">
        <PetrichorCloud />
      </div>

      {/* Static Puddles (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-0 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute bottom-[-10px] left-[5%] w-32 h-10 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(4px) brightness(1.2)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)",
            transform: "scaleY(0.4)",
          }}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-2 right-[10%] w-48 h-16 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(6px) brightness(1.1)",
            boxShadow: "inset 0 1px 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)",
            transform: "scaleY(0.35)", 
          }}
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, delay: 1 }}
          className="absolute bottom-10 left-[40%] w-24 h-8 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(2px)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.3)",
            transform: "scaleY(0.4)",
          }}
        />
      </div>
    </div>
  );
});
