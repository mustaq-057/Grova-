import { memo, useState } from "react";
import { motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { AvatarImage } from "@/components/AvatarImage";

type Props = {
  show: boolean;
  onClose: () => void;
  authorName: string;
  authorAvatar: string;
  authorId: string;
  text: string;
  isOwn: boolean;
  onReply?: (replyText: string) => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
};

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍"];

export const NoteViewerModal = memo(function NoteViewerModal({
  show,
  onClose,
  authorName,
  authorAvatar,
  authorId,
  text,
  isOwn,
  onReply,
  onDelete,
  onReact,
}: Props) {
  const [replyText, setReplyText] = useState("");

  if (!show) return null;

  const sendReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed || !onReply) return;
    onReply(trimmed);
    setReplyText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-white/70 text-sm font-medium">Notes</p>
        <button type="button" onClick={onClose} className="p-2 text-white/80 hover:bg-white/10 rounded-full" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center w-full max-w-xs"
        >
          {text && (
            <div className="mb-3 max-w-[220px] w-full">
              <div className="bg-[#262626] text-white text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-lg break-words text-center">
                {text}
              </div>
            </div>
          )}

          <AvatarImage
            src={authorAvatar}
            userId={authorId}
            alt={authorName}
            className="w-24 h-24 rounded-full object-cover ring-2 ring-white/20 shadow-xl"
          />
          <p className="text-white font-semibold text-sm mt-3">{authorName}</p>
          <p className="text-white/50 text-xs mt-1">Expires in 24 hours</p>

          {isOwn && onDelete && (
            <button
              type="button"
              onClick={() => { onDelete(); onClose(); }}
              className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Delete note
            </button>
          )}
        </motion.div>
      </div>

      <div className="px-4 pb-6 pt-2 space-y-3" onClick={(e) => e.stopPropagation()}>
        {!isOwn && (
          <div className="flex items-center justify-center gap-2">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact?.(emoji)}
                className="text-2xl p-2 hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {!isOwn && onReply && (
          <div className="flex items-center gap-2 bg-[#262626] rounded-full px-4 py-2 border border-white/10">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
              placeholder={`Reply to ${authorName.split(" ")[0]}…`}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              autoFocus
            />
            <button
              type="button"
              onClick={sendReply}
              disabled={!replyText.trim()}
              className="p-2 text-blue-400 disabled:opacity-40"
              aria-label="Send reply"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {isOwn && (
          <p className="text-center text-xs text-white/50">Tap &quot;Your note&quot; above your avatar to edit</p>
        )}
      </div>
    </div>
  );
});
