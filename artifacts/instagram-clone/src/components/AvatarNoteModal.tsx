import { useState, useRef, useEffect } from "react";
import { X, Send, Trash2, StickyNote, Pencil, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import { api, type ApiAvatarNote, type ApiUser } from "../lib/api";
import { useAuth } from "@/lib/auth";
import { AvatarImage } from "./AvatarImage";

interface AvatarNoteModalProps {
  mode: "view";
  user: ApiUser;
  note?: ApiAvatarNote;
  onClose: () => void;
  onNoteAdded?: (note: ApiAvatarNote) => void;
  onNoteDeleted?: (id: string) => void;
  onReplySent?: () => void;
}

export function AvatarNoteModal({
  user,
  note,
  onClose,
  onNoteAdded,
  onNoteDeleted,
  onReplySent,
}: AvatarNoteModalProps) {
  const { user: currentUser } = useAuth();
  const [draftText, setDraftText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note?.text ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);

  const isMine = user.id === currentUser?.id;
  const maxLength = 60;

  // If it's mine and no note → show composer directly
  const showComposer = isMine && !note && !editing;
  const showEditor = isMine && note && editing;
  const showViewMine = isMine && note && !editing;
  const showViewPartner = !isMine && note;

  useEffect(() => {
    if (showComposer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showComposer]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (!replySent) return;
    const t = setTimeout(() => setReplySent(false), 2500);
    return () => clearTimeout(t);
  }, [replySent]);

  // Post a brand-new note
  const handlePost = async () => {
    if (!draftText.trim() || draftText.length > maxLength) return;
    setIsSubmitting(true);
    try {
      const newNote = await api.addAvatarNote(draftText.trim());
      api.postActivity({
        type: "note",
        fromName: currentUser?.name ?? "Someone",
        text: `added a new note: "${draftText.trim()}"`,
        targetPath: `/?noteUserId=${currentUser?.id}`
      }).catch(console.error);
      onNoteAdded?.(newNote);
      onClose();
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save an edited note
  const handleSave = async () => {
    if (!editText.trim() || editText.length > maxLength) return;
    setIsSubmitting(true);
    try {
      const newNote = await api.addAvatarNote(editText.trim()); // replaces existing (backend deletes old)
      onNoteAdded?.(newNote);
      onClose();
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!note?.id) return;
    setIsSubmitting(true);
    try {
      await api.deleteAvatarNote(note.id);
      onNoteDeleted?.(note.id);
      onClose();
    } catch (err) {
      console.error("Failed to delete note", err);
      setIsSubmitting(false);
    }
  };

  // Reply to partner's note — same logic as story reply in chat
  const handleReply = async () => {
    if (!replyText.trim() || !note?.id) return;
    setIsSubmitting(true);
    try {
      await api.sendMessage({
        text: replyText.trim(),
        type: "text",
        replyToId: `__note__${note.userId}`,
        replyToText: note.text,           // shows as the quoted bubble text
        replyToSenderId: note.userId,
        replyToImageUrl: user.avatar,     // shows avatar as thumb in reply bubble
      } as any);
      setReplyText("");
      setReplySent(true);
      onReplySent?.();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error("Failed to send reply", err);
      setIsSubmitting(false);
    }
  };

  // Time left helper
  function timeLeft(expiresAt: string) {
    const ms = parseInt(expiresAt) - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `Expires in ${h}h ${m}m`;
    return `Expires in ${m}m`;
  }

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
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          onClick={e => e.stopPropagation()}
        >
          {/* drag handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Header */}
          <div className="relative flex items-center justify-center px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-white">
                {showComposer
                  ? "Add a note"
                  : showEditor
                  ? "Edit note"
                  : isMine
                  ? "Your note"
                  : `${user.name}'s note`}
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

          <div className="px-6 pt-5 pb-2 flex flex-col items-center">
            {/* Avatar */}
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

            {/* ── ADD NEW NOTE (own avatar, no existing note) ── */}
            {showComposer && (
              <div className="w-full">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={draftText}
                    onChange={e => setDraftText(e.target.value.slice(0, maxLength))}
                    placeholder="What's on your mind?"
                    className="w-full bg-white/5 border border-white/15 rounded-2xl p-4 text-center text-lg text-white placeholder:text-white/35 resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[88px]"
                    rows={3}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 px-1 mb-4">
                  <span className={`text-xs font-medium tabular-nums ${draftText.length === maxLength ? "text-red-400" : "text-white/40"}`}>
                    {draftText.length}/{maxLength}
                  </span>
                  <span className="text-[11px] text-white/30">Visible for 24 hours</span>
                </div>
                <button
                  onClick={handlePost}
                  disabled={!draftText.trim() || isSubmitting}
                  className="w-full py-3.5 rounded-full font-semibold text-sm bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Post note
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── VIEW OWN NOTE ── */}
            {showViewMine && (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[92%] mb-3">
                  <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-3xl" />
                  <div className="relative bg-gradient-to-br from-white/15 to-white/5 border border-white/15 rounded-3xl px-6 py-5 text-center backdrop-blur-sm">
                    <p className="text-xl text-white font-semibold leading-snug break-words">{note!.text}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/35 mb-5">{timeLeft(note!.expiresAt)}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    onClick={() => { setEditText(note!.text); setEditing(true); }}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-full transition-colors text-sm font-medium"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 px-5 py-2.5 rounded-full transition-colors text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* ── EDIT OWN NOTE ── */}
            {showEditor && (
              <div className="w-full">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value.slice(0, maxLength))}
                    placeholder="What's on your mind?"
                    className="w-full bg-white/5 border border-white/15 rounded-2xl p-4 text-center text-lg text-white placeholder:text-white/35 resize-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all min-h-[88px]"
                    rows={3}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 px-1 mb-4">
                  <span className={`text-xs font-medium tabular-nums ${editText.length === maxLength ? "text-red-400" : "text-white/40"}`}>
                    {editText.length}/{maxLength}
                  </span>
                  <span className="text-[11px] text-white/30">Visible for 24 hours</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-3 rounded-full font-semibold text-sm text-white/80 bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!editText.trim() || isSubmitting}
                    className="flex-1 py-3 rounded-full font-semibold text-sm bg-white text-black disabled:opacity-40 hover:bg-white/90 transition-colors"
                  >
                    {isSubmitting ? "Saving…" : "Save note"}
                  </button>
                </div>
              </div>
            )}

            {/* ── VIEW PARTNER NOTE + REPLY ── */}
            {showViewPartner && (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[92%] mb-3">
                  <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-3xl" />
                  <div className="relative bg-gradient-to-br from-white/15 to-white/5 border border-white/15 rounded-3xl px-6 py-5 text-center backdrop-blur-sm">
                    <p className="text-xl text-white font-semibold leading-snug break-words">{note!.text}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/35 mb-5">{timeLeft(note!.expiresAt)}</p>

                {/* Reply sent confirmation */}
                <AnimatePresence>
                  {replySent && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-white/70 text-xs pb-3 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-green-400" />
                      Reply sent!
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Reply input */}
                <div className="w-full flex gap-2">
                  <input
                    ref={replyRef}
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
                    {isSubmitting
                      ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      : <Send className="w-4 h-4 text-black ml-0.5" />
                    }
                  </button>
                </div>
              </div>
            )}

            {/* No note yet (partner has none) */}
            {!isMine && !note && (
              <div className="w-full text-center py-4">
                <p className="text-white/50 text-sm">{user.name} hasn't added a note yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
