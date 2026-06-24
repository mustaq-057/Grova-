import { useState, useRef, useEffect } from "react";
import { X, Send, Trash2, StickyNote, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { api, type ApiAvatarNote, type ApiUser } from "../lib/api";
import { useAuth } from "@/lib/auth";
import { AvatarImage } from "./AvatarImage";

interface AvatarNoteModalProps {
  mode: "create" | "view";
  user: ApiUser;
  note?: ApiAvatarNote;
  onClose: () => void;
  onNoteAdded?: (note: ApiAvatarNote) => void;
  onNoteDeleted?: (id: string) => void;
  onReplySent?: () => void;
}

export function AvatarNoteModal({ mode, user, note, onClose, onNoteAdded, onNoteDeleted, onReplySent }: AvatarNoteModalProps) {
  const { user: currentUser } = useAuth();
  const [text, setText] = useState(mode === "view" ? note?.text || "" : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(mode === "create");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isMine = user.id === currentUser?.id;
  const maxLength = 60;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const handleShare = async () => {
    if (!text.trim() || text.length > maxLength) return;
    setIsSubmitting(true);
    try {
      const newNote = await api.addAvatarNote(text.trim());
      onNoteAdded?.(newNote);
      onClose();
    } catch (err) {
      console.error("Failed to add note", err);
      alert("Failed to share note. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!note?.id) return;
    setIsSubmitting(true);
    try {
      await api.deleteAvatarNote(note.id);
      onNoteDeleted?.(note.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete note", err);
      alert("Failed to delete note. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !note?.id) return;
    setIsSubmitting(true);
    try {
      await api.sendMessage({
        text: replyText.trim(),
        type: "text",
        replyToId: note.id,
        replyToText: note.text,
        replyToSenderId: note.userId,
      });
      onReplySent?.();
      onClose();
    } catch (err) {
      console.error("Failed to send reply", err);
      alert("Failed to send reply. Please try again.");
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="bg-gradient-to-b from-[#1a1a1e] to-[#0f0f12] w-full sm:max-w-sm rounded-t-[28px] sm:rounded-[28px] overflow-hidden border border-white/10 shadow-2xl"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="relative flex items-center justify-center px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">
                {editing ? (isMine ? "Your note" : "Add a note") : `${user.name}'s note`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 pt-5 pb-6 flex flex-col items-center">
            {/* Avatar with note ring */}
            <div className="relative mb-5">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary via-rose-400 to-amber-300 opacity-80 blur-[2px]" />
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-primary via-rose-400 to-amber-300">
                <AvatarImage
                  src={user.avatar}
                  userId={user.id}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#0f0f12]"
                />
              </div>
            </div>

            {editing ? (
              <div className="w-full">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, maxLength))}
                    placeholder="What's on your mind?"
                    className="w-full bg-white/5 border border-white/15 rounded-2xl p-4 text-center text-lg text-white placeholder:text-white/35 resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[88px]"
                    rows={3}
                  />
                </div>
                <div className="flex justify-between items-center mt-4 px-1">
                  <span className={`text-xs font-medium tabular-nums ${text.length === maxLength ? "text-red-400" : "text-white/40"}`}>
                    {text.length}/{maxLength}
                  </span>
                  <span className="text-[11px] text-white/30">Visible for 24 hours</span>
                </div>
                <div className="flex gap-2 mt-4">
                  {isMine && note && (
                    <button
                      onClick={() => { setEditing(false); setText(note.text); }}
                      className="flex-1 py-3 rounded-full font-semibold text-sm text-white/80 bg-white/10 hover:bg-white/15 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    disabled={!text.trim() || isSubmitting}
                    className="flex-1 py-3 rounded-full font-semibold text-sm bg-white text-black disabled:opacity-40 hover:bg-white/90 transition-colors"
                  >
                    {isSubmitting ? "Sharing…" : "Share note"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[92%] mb-6">
                  <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-3xl" />
                  <div className="relative bg-gradient-to-br from-white/15 to-white/5 border border-white/15 rounded-3xl px-6 py-5 text-center backdrop-blur-sm">
                    <p className="text-xl text-white font-semibold leading-snug break-words">
                      {text}
                    </p>
                  </div>
                </div>

                {isMine ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                    <button
                      onClick={() => setEditing(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-full transition-colors text-sm font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-full transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${user.name}…`}
                      className="flex-1 bg-white/10 border border-white/15 rounded-full px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                      onKeyDown={e => e.key === "Enter" && handleReply()}
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || isSubmitting}
                      className="w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-all"
                      aria-label="Send reply"
                    >
                      <Send className="w-4 h-4 text-black ml-0.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
