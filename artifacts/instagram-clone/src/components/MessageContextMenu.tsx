import { memo, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Copy, Pin, CornerUpLeft, Trash2, Undo2, Pencil, Download } from "lucide-react";
import type { ApiMessage } from "@/lib/api";

export type MessageMenuMode = "full" | "audio";

type Props = {
  msg: ApiMessage;
  position: { top: number; left: number };
  mode?: MessageMenuMode;
  isMe: boolean;
  canEdit: boolean;
  onClose: () => void;
  onCopy?: () => void;
  onReply?: () => void;
  onPin: () => void;
  onDeleteForMe?: () => void;
  onUnsend?: () => void;
  onEdit?: () => void;
  onRemoveReaction?: () => void;
  onDownloadChat?: () => void;
};

export const MessageContextMenu = memo(function MessageContextMenu({
  msg,
  position,
  mode = "full",
  isMe,
  canEdit,
  onClose,
  onCopy,
  onReply,
  onPin,
  onDeleteForMe,
  onUnsend,
  onEdit,
  onRemoveReaction,
  onDownloadChat,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState(position);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let top = position.top;
    let left = Math.min(position.left, window.innerWidth - rect.width - 12);
    if (top + rect.height > window.innerHeight - 12) {
      top = Math.max(12, position.top - rect.height - 8);
    }
    setCoords({ top, left });
  }, [position]);

  const item = (
    label: string,
    icon: ReactNode,
    onClick: () => void,
    destructive = false,
  ) => (
    <button
      type="button"
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/10 ${
        destructive ? "text-red-400" : ""
      }`}
    >
      {label}
      <span className="opacity-70">{icon}</span>
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 min-w-[200px] bg-[#262626] text-white rounded-xl py-2 shadow-2xl border border-white/10 max-h-[70vh] overflow-y-auto"
        style={{ top: coords.top, left: coords.left }}
      >
        {mode === "audio" ? (
          <>
            {onReply && item("Reply", <CornerUpLeft className="w-4 h-4" />, onReply)}
            {item("Pin to Memories", <Pin className="w-4 h-4" />, onPin)}
            {msg.reaction && onRemoveReaction &&
              item(`Remove ${msg.reaction}`, <Undo2 className="w-4 h-4" />, onRemoveReaction)}
            {isMe && onUnsend && item("Unsend for everyone", <Undo2 className="w-4 h-4" />, onUnsend, true)}
            {onDeleteForMe && item("Delete for me only", <Trash2 className="w-4 h-4" />, onDeleteForMe)}
          </>
        ) : (
          <>
            {onReply && item("Reply", <CornerUpLeft className="w-4 h-4" />, onReply)}
            {msg.text && onCopy && item("Copy", <Copy className="w-4 h-4" />, onCopy)}
            {item("Pin to Memories", <Pin className="w-4 h-4" />, onPin)}
            {msg.reaction && onRemoveReaction &&
              item(`Remove ${msg.reaction}`, <Undo2 className="w-4 h-4" />, onRemoveReaction)}
            {onDownloadChat &&
              item("Download chat", <Download className="w-4 h-4" />, onDownloadChat)}
            {onDeleteForMe &&
              item("Delete for me", <Trash2 className="w-4 h-4" />, onDeleteForMe)}
            {isMe && onUnsend && item("Unsend", <Undo2 className="w-4 h-4" />, onUnsend, true)}
            {isMe && canEdit && onEdit && item("Edit", <Pencil className="w-4 h-4" />, onEdit)}
          </>
        )}
      </div>
    </>
  );
});
