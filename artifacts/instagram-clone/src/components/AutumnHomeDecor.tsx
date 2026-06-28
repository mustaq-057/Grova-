import { memo } from "react";
import { motion } from "framer-motion";

// Beautiful SVG branch that will hang from the top right
const AutumnBranch = () => (
  <svg 
    viewBox="0 0 300 300" 
    fill="none" 
    className="w-full h-full text-amber-900 drop-shadow-md"
    style={{ filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.5))" }}
  >
    {/* Branch */}
    <path d="M300 0 Q 250 50, 180 120 T 50 200" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
    <path d="M220 80 Q 180 120, 120 110" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    <path d="M150 150 Q 120 180, 80 160" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    
    {/* Leaves on the branch */}
    <path d="M 120 110 Q 100 90, 80 110 Q 100 130, 120 110" fill="#d97706" />
    <path d="M 180 120 Q 200 140, 180 160 Q 160 140, 180 120" fill="#ea580c" />
    <path d="M 150 150 Q 130 170, 150 190 Q 170 170, 150 150" fill="#c2410c" />
    <path d="M 80 160 Q 60 140, 40 160 Q 60 180, 80 160" fill="#b45309" />
    <path d="M 50 200 Q 30 220, 50 240 Q 70 220, 50 200" fill="#9a3412" />
    <path d="M 250 50 Q 230 30, 210 50 Q 230 70, 250 50" fill="#ea580c" />
  </svg>
);

// A simple scattered leaf
const StaticLeaf = ({ className, fill }: { className?: string, fill: string }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))" }}>
    <path d="M 50 20 Q 20 40, 30 70 Q 50 90, 70 70 Q 80 40, 50 20 Z" fill={fill} />
  </svg>
);

export const AutumnHomeDecor = memo(function AutumnHomeDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      
      {/* Hanging Branch - Top Right */}
      <motion.div 
        initial={{ rotate: -15, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-[-40px] right-[-40px] w-48 h-48 sm:w-64 sm:h-64 opacity-80"
      >
        <motion.div
          animate={{ rotate: [0, 2, -1, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: 1, originY: 0 }} // Rotate from top right corner
        >
          <AutumnBranch />
        </motion.div>
      </motion.div>

      {/* Ground Scatter - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-90">
        <StaticLeaf fill="#b45309" className="absolute bottom-2 left-[10%] w-12 h-12 rotate-[-25deg]" />
        <StaticLeaf fill="#ea580c" className="absolute bottom-6 left-[18%] w-8 h-8 rotate-[45deg]" />
        <StaticLeaf fill="#c2410c" className="absolute bottom-1 left-[40%] w-14 h-14 rotate-[15deg]" />
        <StaticLeaf fill="#9a3412" className="absolute bottom-8 left-[60%] w-10 h-10 rotate-[-60deg]" />
        <StaticLeaf fill="#d97706" className="absolute bottom-3 right-[20%] w-16 h-16 rotate-[85deg]" />
        <StaticLeaf fill="#ea580c" className="absolute bottom-5 right-[8%] w-9 h-9 rotate-[-10deg]" />
        
        {/* Slightly blurred leaves in foreground */}
        <StaticLeaf fill="#78350f" className="absolute bottom-[-10px] left-[25%] w-20 h-20 rotate-[30deg] blur-[2px]" />
        <StaticLeaf fill="#92400e" className="absolute bottom-[-15px] right-[30%] w-24 h-24 rotate-[-45deg] blur-[3px]" />
      </div>

    </div>
  );
});
