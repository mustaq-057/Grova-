import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const NAMES = ["Sara", "Sara", "♡ Sara", "sara", "SARA", "♡ sara"];
const SARA_COLORS = ["#ffb7c9", "#ff85a8", "#fd79a8", "#e84393", "#f8a5c2", "#ffc8d8", "#ffe4ec"];

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
};

export const FallingNamesOverlay = memo(function FallingNamesOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      label: NAMES[i % NAMES.length]!,
      left: Math.random() * 100,
      size: 14 + Math.random() * 22,
      delay: Math.random() * 14,
      duration: 12 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 80,
      sway: 20 + Math.random() * 40,
      spin: (Math.random() - 0.5) * 180,
      color: SARA_COLORS[i % SARA_COLORS.length]!,
      fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive',
      depth: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(255, 133, 168, 0.28) 0%, transparent 55%), linear-gradient(180deg, rgba(255, 228, 236, 0.15) 0%, transparent 40%)",
      }}
    >
      <style>{`
        @keyframes nameFall {
          0% { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.85; }
          100% { transform: translate3d(var(--drift), 108vh, 0) rotate(var(--spin)); opacity: 0.15; }
        }
        @keyframes nameSway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
      `}</style>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 font-semibold select-none whitespace-nowrap"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            color: f.color,
            opacity: 0.55 * f.depth,
            textShadow: "0 1px 10px rgba(232, 67, 147, 0.4), 0 0 18px rgba(255, 183, 201, 0.35)",
            animation: `nameFall ${f.duration}s linear ${f.delay}s infinite, nameSway ${3 + f.duration * 0.15}s ease-in-out ${f.delay}s infinite alternate`,
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
