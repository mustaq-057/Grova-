import { memo } from "react";

/** Soft animated aurora bands for the Eternal Aurora theme. */
export const AuroraOverlay = memo(function AuroraOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="aurora-band aurora-band-1" />
      <div className="aurora-band aurora-band-2" />
      <div className="aurora-band aurora-band-3" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/75" />
    </div>
  );
});
