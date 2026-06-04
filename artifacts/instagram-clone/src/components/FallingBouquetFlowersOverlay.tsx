import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const PINKS = ["#f8b4c4", "#f5a3b8", "#e899ad", "#ffc9d9", "#ffd6e0"];
const WHITES = ["#ffffff", "#fff8fb", "#fff0f5"];

function Gerbera({ size, id, color }: { size: number; id: number; color: string }) {
  const g = `gerb-${id}`;
  const petal = (angle: number) => (
    <ellipse cx="12" cy="7" rx="4" ry="6.5" fill={color} transform={`rotate(${angle} 12 12)`} opacity="0.92" />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {petal(0)}
      {petal(45)}
      {petal(90)}
      {petal(135)}
      {petal(180)}
      {petal(225)}
      {petal(270)}
      {petal(315)}
      <circle cx="12" cy="12" r="4.5" fill={`url(#${g})`} />
      <defs>
        <radialGradient id={g}>
          <stop offset="0%" stopColor="#5c4033" />
          <stop offset="100%" stopColor="#3d2817" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function BabysBreath({ size, id }: { size: number; id: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 16 12" opacity="0.85">
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={2 + (i % 4) * 3.5} cy={3 + Math.floor(i / 4) * 4} r="1.2" fill={WHITES[i % WHITES.length]} />
      ))}
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
  variant: "gerbera" | "baby";
  color: string;
};

export const FallingBouquetFlowersOverlay = memo(function FallingBouquetFlowersOverlay() {
  const flakes = useMemo<Flake[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: i % 3 === 0 ? 20 + Math.random() * 14 : 10 + Math.random() * 10,
      delay: Math.random() * 14,
      duration: 13 + Math.random() * 14,
      drift: (Math.random() - 0.5) * 70,
      sway: 16 + Math.random() * 32,
      variant: i % 4 === 0 ? "gerbera" : "baby",
      color: PINKS[i % PINKS.length]!,
    }));
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes bouquetFall {
          0% { transform: translate3d(0, -8vh, 0); opacity: 0; }
          8% { opacity: 0.85; }
          100% { transform: translate3d(var(--drift), 108vh, 0); opacity: 0.15; }
        }
        @keyframes bouquetSway {
          50% { margin-left: var(--sway); }
        }
      `}</style>
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute top-0"
          style={{
            left: `${f.left}%`,
            animation: `bouquetFall ${f.duration}s linear ${f.delay}s infinite, bouquetSway ${3.5 + f.duration * 0.1}s ease-in-out ${f.delay}s infinite alternate`,
            // @ts-expect-error css vars
            "--drift": `${f.drift}px`,
            "--sway": `${f.sway}px`,
          }}
        >
          {f.variant === "gerbera" ? (
            <Gerbera size={f.size} id={f.id} color={f.color} />
          ) : (
            <BabysBreath size={f.size} id={f.id} />
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
});
