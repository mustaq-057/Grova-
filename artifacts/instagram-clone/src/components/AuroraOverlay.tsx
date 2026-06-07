import { memo } from "react";

/** Soft animated aurora bands for the Eternal Aurora theme — Finland-style northern lights. */
export const AuroraOverlay = memo(function AuroraOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden aurora-scene" aria-hidden>
      <div className="aurora-sky-glow" />
      <div className="aurora-band aurora-band-1" />
      <div className="aurora-band aurora-band-2" />
      <div className="aurora-band aurora-band-3" />
      <div className="aurora-band aurora-band-4" />
      <div className="aurora-curtain aurora-curtain-1 aurora-curtain-global" />
      <div className="aurora-curtain aurora-curtain-2 aurora-curtain-global" />
      <div className="aurora-stars aurora-stars-global" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/30 via-transparent to-background/80" />
    </div>
  );
});
