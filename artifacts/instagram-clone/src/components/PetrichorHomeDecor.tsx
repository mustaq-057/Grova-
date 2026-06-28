import { memo } from "react";
import { motion } from "framer-motion";

export const PetrichorHomeDecor = memo(function PetrichorHomeDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      
      {/* Frosted Condensation Overlay (Edges) */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(200, 220, 230, 0.05) 70%, rgba(180, 200, 210, 0.15) 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          maskImage: "radial-gradient(ellipse at center, transparent 50%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 50%, black 100%)",
          zIndex: 1
        }}
      />

      {/* Static Puddles (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-0">
        
        {/* Puddle 1 - Left */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute bottom-[-10px] left-[5%] w-32 h-10 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(4px) brightness(1.2)",
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.5)",
            transform: "scaleY(0.4)", // Squashed perspective
          }}
        />

        {/* Puddle 2 - Right */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-2 right-[10%] w-48 h-16 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(6px) brightness(1.1)",
            boxShadow: "inset 0 1px 3px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.4)",
            transform: "scaleY(0.35)", // Squashed perspective
          }}
        />

        {/* Puddle 3 - Center (Subtle) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2, delay: 1 }}
          className="absolute bottom-10 left-[40%] w-24 h-8 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(2px)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.3)",
            transform: "scaleY(0.4)", // Squashed perspective
          }}
        />

      </div>
    </div>
  );
});
