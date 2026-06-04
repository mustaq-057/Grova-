import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const NAMES = ["Sara", "Lily", "Sara", "Lily", "♡ Sara", "♡ Lily"];
const LAVENDER = ["#e8d5ff", "#d4b5ff", "#c9a0ff", "#b794f6", "#ddd6fe", "#ede9fe", "#f3e8ff"];

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
      color: LAVENDER[i % LAVENDER.length]!,
      depth: 0.5 + Math.random() * 0.5,
    }));
  }, []);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(196, 181, 253, 0.35) 0%, transparent 55%), linear-gradient(180deg, rgba(237, 233, 254, 0.12) 0%, transparent 40%)",
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
            textShadow: "0 1px 8px rgba(139, 92, 246, 0.35), 0 0 20px rgba(216, 180, 254, 0.25)",
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
