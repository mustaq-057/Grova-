import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const NAMES = ["Sara", "♡ Sara", "sara", "SARA", "Sara ♡", "my Sara"];
const SARA_COLORS = ["#ffb7c9", "#ff6b9d", "#fd79a8", "#e84393", "#f8a5c2", "#ffc8d8", "#ffe4ec", "#ff85a8"];

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
  glow: number;
};

export const FallingNamesOverlay = memo(function FallingNamesOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      label: NAMES[i % NAMES.length]!,
      left: Math.random() * 100,
      size: 16 + Math.random() * 28,
      delay: Math.random() * 16,
      duration: 10 + Math.random() * 9,
      drift: (Math.random() - 0.5) * 100,
      sway: 24 + Math.random() * 48,
      spin: (Math.random() - 0.5) * 220,
      color: SARA_COLORS[i % SARA_COLORS.length]!,
      depth: 0.65 + Math.random() * 0.35,
      glow: 0.35 + Math.random() * 0.45,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes nameFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg) scale(0.85); opacity: 0; }
          6% { opacity: 1; }
          100% { transform: translate3d(var(--drift), 112vh, 0) rotate(var(--spin)) scale(1); opacity: 0.12; }
        }
        @keyframes nameSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
        @keyframes nameShimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
      `}</style>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 font-bold select-none whitespace-nowrap"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            color: f.color,
            opacity: 0.72 * f.depth,
            fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", "Apple Chancery", cursive',
            textShadow: `0 0 ${12 + f.glow * 20}px rgba(255, 133, 168, ${f.glow}), 0 2px 14px rgba(232, 67, 147, 0.45)`,
            animation: `nameFall ${f.duration}s linear ${f.delay}s infinite, nameSway ${3.2 + f.duration * 0.12}s ease-in-out ${f.delay}s infinite alternate, nameShimmer ${4 + Math.random() * 3}s ease-in-out ${f.delay * 0.3}s infinite`,
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
