import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const NAMES = ["sara", "sara ♡", "i love you", "my sara"];
const SARA_COLORS = ["#d8b4e2", "#e8c7e8", "#f3d8ed", "#c7b4e2", "#e2b4d8"]; // Soft lavenders and lilacs

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

export const FallingNamesOverlay = memo(function FallingNamesOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      label: NAMES[i % NAMES.length]!,
      left: 5 + Math.random() * 90,
      size: 14 + Math.random() * 20,
      delay: Math.random() * 15,
      duration: 18 + Math.random() * 15, // slower falling
      drift: (Math.random() - 0.5) * 60, // less drift
      sway: 15 + Math.random() * 25, // less sway
      spin: (Math.random() - 0.5) * 15, // minimal rotation (-7.5 to 7.5 deg)
      color: SARA_COLORS[i % SARA_COLORS.length]!,
      depth: 0.5 + Math.random() * 0.5,
      blur: Math.random() > 0.6 ? 2 + Math.random() * 3 : 0, // depth of field effect
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
      `}</style>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 select-none whitespace-nowrap"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            color: f.color,
            opacity: 0.8 * f.depth,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            letterSpacing: '1px',
            filter: f.blur ? `blur(${f.blur}px)` : 'none',
            textShadow: '0 2px 8px rgba(0,0,0,0.1)',
            animation: `nameFall ${f.duration}s linear ${f.delay}s infinite, nameSway ${4 + f.duration * 0.15}s ease-in-out ${f.delay}s infinite alternate`,
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
