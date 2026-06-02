import { memo, useMemo } from "react";
import { createPortal } from "react-dom";

const PETAL_COLORS = ["#ffd1e0", "#ffb7c9", "#ff9ebb", "#ffc8d8", "#f8a5bb", "#ffe4ec", "#fff0f5"];

type Petal = {
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
  variant: "blossom" | "petal";
};

function SakuraBlossom({ color, size, id }: { color: string; size: number; id: number }) {
  const gradId = `sakura-${id}`;
  const petal = (angle: number) => (
    <ellipse
      cx="12"
      cy="6"
      rx="5.5"
      ry="7.5"
      fill={`url(#${gradId})`}
      transform={`rotate(${angle} 12 12)`}
    />
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ filter: "drop-shadow(0 1px 3px rgba(255, 105, 150, 0.35))" }}
    >
      <defs>
        <radialGradient id={gradId} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </radialGradient>
      </defs>
      {petal(0)}
      {petal(72)}
      {petal(144)}
      {petal(216)}
      {petal(288)}
      <circle cx="12" cy="12" r="2.2" fill="#ffeef4" fillOpacity="0.9" />
      <circle cx="12" cy="12" r="1" fill="#ffb7c9" fillOpacity="0.6" />
    </svg>
  );
}

function SinglePetal({ color, size, id }: { color: string; size: number; id: number }) {
  const gradId = `petal-${id}`;
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 20 24"
      style={{ filter: "drop-shadow(0 1px 2px rgba(255, 105, 150, 0.25))" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M10 2 C14 4, 16 10, 10 22 C4 10, 6 4, 10 2 Z"
        fill={`url(#${gradId})`}
        transform="rotate(-8 10 12)"
      />
    </svg>
  );
}

export const FallingFlowersOverlay = memo(function FallingFlowersOverlay() {
  const petals = useMemo<Petal[]>(() => {
    return Array.from({ length: 52 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: i % 3 === 0 ? 18 + Math.random() * 14 : 10 + Math.random() * 12,
      delay: Math.random() * 14,
      duration: 12 + Math.random() * 16,
      drift: -50 + Math.random() * 100,
      sway: 20 + Math.random() * 40,
      spin: 360 + Math.random() * 720,
      color: PETAL_COLORS[i % PETAL_COLORS.length]!,
      depth: 0.55 + Math.random() * 0.55,
      variant: i % 4 === 0 ? "blossom" : "petal",
    }));
  }, []);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
      style={{ zIndex: 5, perspective: "900px" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(255, 190, 210, 0.28) 0%, transparent 65%)",
        }}
      />
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-sakura-sway"
          style={{
            left: `${p.left}%`,
            animationDuration: `${3 + (p.id % 5)}s`,
            animationDelay: `${p.delay * 0.15}s`,
            ["--sway" as string]: `${p.sway}px`,
          }}
        >
          <div
            className="animate-sakura-fall"
            style={{
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ["--drift" as string]: `${p.drift}px`,
              ["--spin" as string]: `${p.spin}deg`,
              ["--depth" as string]: p.depth,
              opacity: 0.5 + p.depth * 0.4,
            }}
          >
            {p.variant === "blossom" ? (
              <SakuraBlossom color={p.color} size={p.size} id={p.id} />
            ) : (
              <SinglePetal color={p.color} size={p.size} id={p.id + 1000} />
            )}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
});
