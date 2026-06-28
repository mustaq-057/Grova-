import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const LEAF_COLORS = ["#d97706", "#ea580c", "#c2410c", "#b45309", "#9a3412"]; // Warm ambers, oranges, mahogany
const LEAF_SHAPES = ["🍂", "🍁", "🍃"];

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

export const FallingAutumnOverlay = memo(function FallingAutumnOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      label: LEAF_SHAPES[i % LEAF_SHAPES.length]!,
      left: -10 + Math.random() * 120, // Can start off-screen for more natural drift
      size: 14 + Math.random() * 20,
      delay: Math.random() * 25,
      duration: 15 + Math.random() * 20, // Gentle, varied falling speed
      drift: (Math.random() - 0.2) * 150, // More horizontal drift to simulate wind
      sway: 30 + Math.random() * 50, // Wide swaying motion
      spin: (Math.random() - 0.5) * 360, // Full rotation
      color: LEAF_COLORS[i % LEAF_COLORS.length]!,
      depth: 0.4 + Math.random() * 0.6,
      blur: Math.random() > 0.6 ? 2 + Math.random() * 4 : 0,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes autumnFall {
          0% { transform: translate3d(0, -15vh, 0) rotate(0deg) scale(0.85); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 115vh, 0) rotate(var(--spin)) scale(1.1); opacity: 0; }
        }
        @keyframes autumnSway {
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
            opacity: 0.7 * f.depth,
            filter: f.blur ? `blur(${f.blur}px)` : 'none',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)', // Slight shadow for depth
            animation: `autumnFall ${f.duration}s linear ${f.delay}s infinite, autumnSway ${5 + f.duration * 0.15}s ease-in-out ${f.delay}s infinite alternate`,
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
