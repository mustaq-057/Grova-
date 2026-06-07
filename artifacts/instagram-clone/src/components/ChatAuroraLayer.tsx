import { memo } from "react";

/** In-chat northern lights — layered 3D curtains visible through the chat panel. */
export const ChatAuroraLayer = memo(function ChatAuroraLayer() {
  return (
    <div className="chat-aurora-layer pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="aurora-curtain aurora-curtain-1" />
      <div className="aurora-curtain aurora-curtain-2" />
      <div className="aurora-curtain aurora-curtain-3" />
      <div className="aurora-curtain aurora-curtain-4" />
      <div className="aurora-stars" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
    </div>
  );
});
