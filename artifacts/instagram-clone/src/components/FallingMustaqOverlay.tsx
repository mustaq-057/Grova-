import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const NAMES = ["mustaq", "M", "✦", "✧"];
const MUSTAQ_COLORS = ["#1a1a1a", "#262626", "#333333", "#404040", "#0a0a0a"]; // Dark glass / obsidian tones

type Flake = {
  id: number;
  label: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  sway: number;
  spin: number;
  color: string;
  depth: number;
  blur: number;
};

export const FallingMustaqOverlay = memo(function FallingMustaqOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      label: NAMES[i % NAMES.length]!,
      left: 5 + Math.random() * 90,
      size: 16 + Math.random() * 30, // Slightly larger to appreciate the subtle text
      delay: Math.random() * 30, // Staggered over a long time
      duration: 35 + Math.random() * 25, // Extremely slow (35 to 60 seconds)
      drift: (Math.random() - 0.5) * 80, // Drift horizontally as they float up
      sway: 10 + Math.random() * 20, // Gentle sway
      spin: (Math.random() - 0.5) * 45, // Slow rotation
      color: MUSTAQ_COLORS[i % MUSTAQ_COLORS.length]!,
      depth: 0.3 + Math.random() * 0.7,
      blur: Math.random() > 0.4 ? 3 + Math.random() * 5 : 0, // Heavy depth of field
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes mustaqFloatUp {
          0% { transform: translate3d(0, 110vh, 0) rotate(0deg) scale(0.85); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(var(--drift), -20vh, 0) rotate(var(--spin)) scale(1.1); opacity: 0; }
        }
        @keyframes mustaqSwayEthereal {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
      `}</style>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 select-none whitespace-nowrap"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            color: f.color,
            opacity: 0.5 * f.depth, // Very subtle opacity
            fontFamily: '"Inter", sans-serif', // Modern, sleek font
            fontWeight: 300,
            letterSpacing: '3px', // Spaced out and elegant
            filter: f.blur ? `blur(${f.blur}px)` : 'none',
            textShadow: '0 0 12px rgba(255,255,255,0.08), 0 1px 2px rgba(255,255,255,0.03)', // Subtle rim-light glass effect
            animation: `mustaqFloatUp ${f.duration}s linear ${f.delay}s infinite, mustaqSwayEthereal ${8 + f.duration * 0.2}s ease-in-out ${f.delay}s infinite alternate`,
            // @ts-expect-error css vars
            "--drift": `${f.drift}px`,
            "--sway": `${f.sway}px`,
            "--spin": `${f.spin}deg`,
          }}
        >
          {f.label}
        </span>
      ))}
    </div>,
    document.body,
  );
});
