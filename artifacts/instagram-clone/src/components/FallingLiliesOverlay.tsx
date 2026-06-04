import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const LILY_PINK = ["#ff6b9d", "#ff85a8", "#e84393", "#fd79a8", "#f8a5c2", "#ffb7c9"];
const LILY_WHITE = "#fff5f8";

function StargazerLily({ size, id, color }: { size: number; id: number; color: string }) {
  const grad = `lily-${id}`;
  const petal = (angle: number) => (
    <ellipse
      cx="12"
      cy="5.5"
      rx="5"
      ry="8"
      fill={`url(#${grad})`}
      stroke={color}
      strokeWidth="0.35"
      transform={`rotate(${angle} 12 12)`}
    />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 6px rgba(232, 67, 147, 0.35))" }}>
      <defs>
        <radialGradient id={grad} cx="45%" cy="25%" r="75%">
          <stop offset="0%" stopColor={LILY_WHITE} stopOpacity="0.95" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </radialGradient>
      </defs>
      {petal(0)}
      {petal(60)}
      {petal(120)}
      {petal(180)}
      {petal(240)}
      {petal(300)}
      <circle cx="12" cy="12" r="2.5" fill="#ffeef4" />
      <line x1="12" y1="12" x2="12" y2="22" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

type Flake = {
  id: number;
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

export const FallingLiliesOverlay = memo(function FallingLiliesOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 22 + Math.random() * 20,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 12,
      drift: (Math.random() - 0.5) * 90,
      sway: 18 + Math.random() * 36,
      spin: (Math.random() - 0.5) * 120,
      color: LILY_PINK[i % LILY_PINK.length]!,
      depth: 0.55 + Math.random() * 0.45,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes lilyFall {
          0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translate3d(var(--drift), 110vh, 0) rotate(var(--spin)); opacity: 0.2; }
        }
        @keyframes lilySway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: var(--sway); }
        }
      `}</style>
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute top-0"
          style={{
            left: `${f.left}%`,
            opacity: 0.5 * f.depth,
            animation: `lilyFall ${f.duration}s linear ${f.delay}s infinite, lilySway ${4 + f.duration * 0.12}s ease-in-out ${f.delay}s infinite alternate`,
            // @ts-expect-error css vars
            "--drift": `${f.drift}px`,
            "--sway": `${f.sway}px`,
            "--spin": `${f.spin}deg`,
          }}
        >
          <StargazerLily size={f.size} id={f.id} color={f.color} />
        </div>
      ))}
    </div>,
    document.body,
  );
});
