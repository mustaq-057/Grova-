import { useState, useEffect, useCallback, useRef } from "react";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { Plus, Trash2, Lock, X, Shield, Mic } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { api, type ApiSecretNote } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { encryptSecret, decryptSecret, isEncryptedSecret } from "@/lib/secret-crypto";
import { formatSecretNotePlain } from "@/lib/secret-note-payload";
import { partnerPossessiveNote } from "@/lib/partner-words";
import { SecretNoteReader } from "@/components/SecretNoteReader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { openLiveChannel } from "@/lib/sse-client";

export default function SecretNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ApiSecretNote[]>([]);
  const { showLoading, finishLoading } = useFeatureLoading(notes.length === 0);
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockNoteId, setUnlockNoteId] = useState<string | null>(null);
  const [unlockPass, setUnlockPass] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [reader, setReader] = useState<{ id: string; title: string; body: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | null>(null);
  const [recordingNote, setRecordingNote] = useState(false);
  const noteRecorderRef = useRef<MediaRecorder | null>(null);
  const noteChunksRef = useRef<Blob[]>([]);
  const noteStreamRef = useRef<MediaStream | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const data = await api.getSecretNotes();
      setNotes(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load secret notes:", err);
      setError("Could not load secret notes.");
    } finally {
      finishLoading();
    }
  }, [finishLoading]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (!user) return;
    let es: EventSource | null = null;
    let pollStop: (() => void) | null = null;

    void openLiveChannel(user.id, () => void loadNotes()).then((channel) => {
      if (!channel) return;
      if (channel.mode === "poll") {
        pollStop = channel.stop;
        return;
      }
      es = channel.eventSource;
      wireEvents(es);
    });

    function wireEvents(source: EventSource) {
    source.addEventListener("secret-note-added", (e) => {
      try {
        const note = JSON.parse((e as MessageEvent).data) as ApiSecretNote;
        setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev : [note, ...prev]));
      } catch {
        void loadNotes();
      }
    });
    source.addEventListener("secret-note-deleted", (e) => {
      try {
        const { id } = JSON.parse((e as MessageEvent).data) as { id: string };
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (reader?.id === id) setReader(null);
      } catch {
        void loadNotes();
      }
    });
    }

    return () => {
      es?.close();
      pollStop?.();
    };
  }, [user, loadNotes, reader?.id]);

  const stopNoteRecording = useCallback(() => {
    const rec = noteRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    noteStreamRef.current?.getTracks().forEach((t) => t.stop());
    noteStreamRef.current = null;
    setRecordingNote(false);
  }, []);

  const startNoteRecording = async () => {
    if (recordingNote) {
      stopNoteRecording();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      noteStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      noteChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) noteChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType || "audio/mp4";
        const blob = new Blob(noteChunksRef.current, { type: actualMime });
        noteChunksRef.current = [];
        noteRecorderRef.current = null;
        stream.getTracks().forEach((t) => t.stop());
        noteStreamRef.current = null;
        setRecordingNote(false);
        if (blob.size > 0) {
          if (voiceNoteUrl?.startsWith("blob:")) URL.revokeObjectURL(voiceNoteUrl);
          setVoiceNoteUrl(URL.createObjectURL(blob));
        }
      };
      noteRecorderRef.current = recorder;
      recorder.start(250);
      setRecordingNote(true);
      toast.message("Recording voice note…", { description: "Tap again to stop and save." });
    } catch {
      toast.error("Could not access microphone.");
    }
  };

  const voiceNoteUrlRef = useRef(voiceNoteUrl);
  voiceNoteUrlRef.current = voiceNoteUrl;
  useEffect(
    () => () => {
      stopNoteRecording();
      const url = voiceNoteUrlRef.current;
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    [stopNoteRecording],
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !voiceNoteUrl) || !password.trim() || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      let audioData: string | undefined;
      if (voiceNoteUrl) {
        const res = await fetch(voiceNoteUrl);
        const blob = await res.blob();
        audioData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read voice note"));
          reader.readAsDataURL(blob);
        });
      }
      const plain = formatSecretNotePlain({ text: content.trim(), audio: audioData });
      const encrypted = await encryptSecret(plain, password.trim());
      const note = await api.addSecretNote({
        content: encrypted,
        author: user.id,
      });
      setNotes((prev) => [note, ...prev]);
      setContent("");
      setPassword("");
      if (voiceNoteUrl?.startsWith("blob:")) URL.revokeObjectURL(voiceNoteUrl);
      setVoiceNoteUrl(null);
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add secret note:", err);
      setError(err instanceof Error ? err.message : "Could not save secret note.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteSecretNote(deleteId);
      setNotes((prev) => prev.filter((n) => n.id !== deleteId));
      if (reader?.id === deleteId) setReader(null);
    } catch (err) {
      console.error("Failed to delete secret note:", err);
      setError("Could not delete note. Only the creator can delete.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openUnlock = (note: ApiSecretNote) => {
    setUnlockNoteId(note.id);
    setUnlockPass("");
    setUnlockError(null);
  };

  const submitUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = notes.find((n) => n.id === unlockNoteId);
    if (!note || !unlockPass.trim()) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const plain = isEncryptedSecret(note.content)
        ? await decryptSecret(note.content, unlockPass.trim())
        : note.content;
      const title = note.author === user?.id ? "Your secret note" : "Secret note";
      setUnlockNoteId(null);
      setUnlockPass("");
      setReader({ id: note.id, title, body: plain });
    } catch {
      setUnlockError("Wrong passcode. Nobody can read this without the correct one.");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="px-4 py-5 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base">Secret Notes</h1>
            <p className="text-xs text-muted-foreground">Passcode locked · syncs on all devices</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          data-testid="button-add-secret-note"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card/50 overflow-hidden"
          >
            <form onSubmit={handleAdd} className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">New secret note</p>
                <button type="button" onClick={() => setShowAdd(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your private message…"
                rows={5}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none"
                data-testid="input-secret-note-content"
              />
              <button
                type="button"
                onClick={() => void startNoteRecording()}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  recordingNote
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-secondary border-border hover:border-primary/40"
                }`}
              >
                <Mic className="w-4 h-4" />
                {recordingNote ? "Stop & save voice note" : voiceNoteUrl ? "Re-record voice note" : "Record voice note"}
              </button>
              {voiceNoteUrl ? (
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Voice preview — saved with your passcode</p>
                  <audio src={voiceNoteUrl} controls className="w-full" playsInline />
                </div>
              ) : null}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a passcode"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                <Lock className="w-3 h-3 inline mr-1" />
                Encrypted on your device. Only someone with this passcode can read it — including you later.
              </p>
              <button
                type="submit"
                disabled={(!content.trim() && !voiceNoteUrl) || !password.trim() || submitting}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 text-sm"
                data-testid="button-submit-secret-note"
              >
                {submitting ? "Saving..." : "Save secret note"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {showLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-2">
            <Shield className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No secret notes yet</p>
            <p className="text-xs text-muted-foreground/60">Create one with a passcode only you know</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => {
              const isMine = note.author === user?.id;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/50 border border-border rounded-2xl p-4 hover:bg-card/70 transition-colors"
                  data-testid={`secret-note-${note.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-primary/10" : "bg-secondary/50"}`}>
                        <Lock className={`w-4 h-4 ${isMine ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{isMine ? "Your note" : partnerPossessiveNote(note.author)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString()} · locked
                        </p>
                      </div>
                    </div>
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => setDeleteId(note.id)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors p-1 shrink-0"
                        data-testid={`button-delete-secret-note-${note.id}`}
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="bg-secondary/30 border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                    <Lock className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">Content hidden until passcode is entered</p>
                    <button
                      type="button"
                      onClick={() => openUnlock(note)}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl"
                      data-testid={`button-reveal-secret-note-${note.id}`}
                    >
                      Enter passcode to read
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {unlockNoteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={submitUnlock}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Enter passcode</h2>
                <button type="button" onClick={() => setUnlockNoteId(null)} className="p-1 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                type="password"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                placeholder="Passcode"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary mb-2"
                autoFocus
                autoComplete="current-password"
              />
              {unlockError && <p className="text-xs text-destructive mb-2">{unlockError}</p>}
              <button
                type="submit"
                disabled={!unlockPass.trim() || unlocking}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm disabled:opacity-50"
              >
                {unlocking ? "Unlocking..." : "Unlock"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reader && (
          <SecretNoteReader
            title={reader.title}
            body={reader.body}
            onClose={() => setReader(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete secret note?"
        description="This permanently removes it. Only you could delete notes you created."
        confirmLabel="Delete forever"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
