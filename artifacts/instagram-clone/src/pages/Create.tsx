import { useState, useRef, useEffect, memo } from "react";
import { ImagePlus, X, Check, MapPin, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { savePost, getPosts, clearLegacyLocalMedia } from "@/lib/local-posts";
import { readFileAsDataUrl, uploadMedia, materializeGalleryFiles } from "@/lib/media-upload";
import { isAcceptedGalleryImage, prepareImageForUpload, resolveGalleryPick } from "@/lib/media-file";
import { ImageCropModal } from "@/components/ImageCropModal";
import { countPostImages } from "@/lib/post-media";

const MAX_PHOTOS_PER_POST = 10;

type QueuedPhoto = {
  id: string;
  dataUrl: string;
  originalDataUrl: string;
  modalState?: any;
};

export default memo(function Create() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [cropId, setCropId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocationLabel] = useState("");
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [sharing, setSharing] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [savedPhotoCount, setSavedPhotoCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myId = user?.id ?? "me";
  const canAddMore = true; // no global cap — only per-post limit applies
  const canAddMoreToQueue = queue.length < MAX_PHOTOS_PER_POST;

  useEffect(() => {
    // savedPhotoCount kept for display only — not used to block uploads
    if (!user) return;
    getPosts(user.id)
      .then((posts) => setSavedPhotoCount(countPostImages(posts)))
      .catch(() => setSavedPhotoCount(0));
  }, [user]);

  const addFiles = async (files: FileList | File[]) => {
    setLoadingPhotos(true);
    try {
      const snapshot = Array.from(files);
      const materialized = await materializeGalleryFiles(snapshot);
      if (materialized.length === 0) {
        alert("Could not read selected photos. Try selecting again.");
        return;
      }

      const list: File[] = [];
      let lastError: string | null = null;
      let skipped = 0;
      for (const raw of materialized) {
        try {
          const resolved = await resolveGalleryPick(raw);
          if (!isAcceptedGalleryImage(resolved)) {
            lastError = "Only photos are supported.";
            skipped += 1;
            continue;
          }
          list.push(await prepareImageForUpload(resolved));
        } catch (err) {
          skipped += 1;
          lastError = err instanceof Error ? err.message : "Could not read photo.";
        }
      }
      if (list.length === 0) {
        alert(lastError ?? "Only photos are supported.");
        return;
      }
      const roomInGrid = MAX_PHOTOS_PER_POST - queue.length;
      const roomInPost = MAX_PHOTOS_PER_POST - queue.length;
      if (roomInPost <= 0) {
        alert(`Up to ${MAX_PHOTOS_PER_POST} photos per post.`);
        return;
      }
      const toAdd = list.slice(0, Math.min(roomInGrid, roomInPost));
      const previews: QueuedPhoto[] = [];
      let readFailed = 0;
      for (const file of toAdd) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          previews.push({ id: crypto.randomUUID(), dataUrl, originalDataUrl: dataUrl });
        } catch (err) {
          readFailed += 1;
          lastError = err instanceof Error ? err.message : "Could not read photo.";
        }
      }
      if (previews.length === 0) {
        alert(lastError ?? "Could not read photo.");
        return;
      }
      setQueue((prev) => [...prev, ...previews]);
      setStep("review");
      const dropped = snapshot.length - previews.length;
      if (dropped > 0 || skipped > 0 || readFailed > 0) {
        alert(
          `Added ${previews.length} of ${snapshot.length} photo(s).` +
            (dropped + skipped + readFailed > 0 ? " Some files could not be read — try selecting fewer at once." : ""),
        );
      }
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setStep("pick");
      return next;
    });
  };

  const applyCrop = (cropped: string, state: any) => {
    if (!cropId) return;
    setQueue((prev) => prev.map((p) => (p.id === cropId ? { ...p, dataUrl: cropped, modalState: state } : p)));
    setCropId(null);
  };

  const shareAll = async () => {
    if (!user || queue.length === 0) return;
    setSharing(true);
    try {
      clearLegacyLocalMedia(myId);
      const uploadedUrls: string[] = [];
      const failedIndexes: number[] = [];
      let calculatedRatio = "auto";

      for (let i = 0; i < queue.length; i++) {
        const photo = queue[i]!;

        if (i === 0) {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const r = img.width / img.height;
              if (Math.abs(r - 1) < 0.05) calculatedRatio = "1:1";
              else if (Math.abs(r - 4/5) < 0.05) calculatedRatio = "4:5";
              else if (Math.abs(r - 16/9) < 0.05) calculatedRatio = "16:9";
              else calculatedRatio = "auto";
              resolve();
            };
            img.onerror = () => resolve();
            img.src = photo.dataUrl;
          });
        }

        try {
          const mime = photo.dataUrl.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg";
          const mediaUrl = await uploadMedia(photo.dataUrl, mime);
          uploadedUrls.push(mediaUrl);
        } catch (err) {
          console.error(`[shareAll] photo ${i + 1} upload failed:`, err);
          failedIndexes.push(i + 1);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error("All photos failed to upload. Check your connection and try again.");
      }

      await savePost(myId, {
        image: uploadedUrls[0]!,
        images: uploadedUrls.length > 1 ? uploadedUrls : undefined,
        caption: caption.trim(),
        location: location.trim(),
        ratio: calculatedRatio,
        at: new Date().toISOString(),
      });

      setQueue([]);
      setCaption("");
      setLocationLabel("");
      setStep("pick");

      if (failedIndexes.length > 0) {
        alert(`Posted ${uploadedUrls.length} of ${queue.length} photos. ${failedIndexes.length} could not be uploaded — try re-selecting them.`);
      }

      setLocation("/");
    } catch (err) {
      console.error("Share failed:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to upload. Set CLOUDINARY_URL in your server .env and redeploy.",
      );
    } finally {
      setSharing(false);
    }
  };


  const cropTarget = queue.find((p) => p.id === cropId);

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold">Upload photos</h1>
        {step === "review" && (
          <button
            type="button"
            onClick={() => {
              setQueue([]);
              setStep("pick");
            }}
            className="p-2 hover:bg-secondary rounded-full"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Photos only · {queue.length > 0 ? `${queue.length}/${MAX_PHOTOS_PER_POST} selected` : `Up to ${MAX_PHOTOS_PER_POST} per post`}
        {queue.length > 0 ? " · tap a photo to crop" : ""}
      </p>

      {step === "pick" ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 py-16 px-6 transition-all ${
            !canAddMore
              ? "border-border opacity-60 cursor-not-allowed"
              : dragging
                ? "border-primary bg-primary/10 scale-[1.01] cursor-pointer"
                : "border-border hover:border-primary/40 hover:bg-secondary/20 cursor-pointer"
          }`}
          onDragOver={(e) => {
            if (!canAddMore) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={canAddMore ? handleDrop : undefined}
          onClick={() => !loadingPhotos && canAddMore && fileInputRef.current?.click()}
          data-testid="upload-dropzone"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
            <ImagePlus className="w-9 h-9 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base">
              {!canAddMore ? "Photo limit reached" : loadingPhotos ? "Reading photos…" : "Add photos to your feed"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Select one or many · crop each one</p>
          </div>
          {canAddMore && (
            <button
              type="button"
              className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-md"
            >
              Choose photos
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const input = e.target;
              const picked = input.files ? Array.from(input.files) : [];
              if (picked.length === 0) return;
              void addFiles(picked).finally(() => {
                input.value = "";
              });
            }}
          />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {queue.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-black group">
                <button type="button" className="absolute inset-0" onClick={() => setCropId(photo.id)}>
                  <img src={photo.dataUrl} alt="" className="w-full h-full object-contain" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFromQueue(photo.id)}
                  className="absolute top-1 right-1 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white z-10"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {canAddMoreToQueue && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors shadow-inner"
                aria-label="Add more photos"
              >
                <Plus className="w-8 h-8" />
                <span className="text-xs font-semibold tracking-wide">Add more</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const input = e.target;
              const picked = input.files ? Array.from(input.files) : [];
              if (picked.length === 0) return;
              void addFiles(picked).finally(() => {
                input.value = "";
              });
            }}
          />

          <div className="border border-border/60 bg-secondary/10 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-secondary/20 transition-all shadow-sm">
            <textarea
              placeholder="Write a caption for your post (optional)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-[15px] outline-none resize-none placeholder:text-muted-foreground/70 leading-relaxed"
              maxLength={2200}
            />
          </div>

          <div className="flex items-center gap-3 border border-border/60 bg-secondary/10 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-secondary/20 transition-all shadow-sm">
            <MapPin className="w-5 h-5 text-primary/70 shrink-0" />
            <input
              type="text"
              placeholder="Add Location (optional)"
              value={location}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={sharing || queue.length === 0}
            onClick={shareAll}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mt-4"
          >
            <Check className="w-5 h-5" />
            {sharing ? "Uploading to feed…" : queue.length === 1 ? "Share to feed" : `Share ${queue.length} photos as one post`}
          </motion.button>
        </motion.div>
      )}

      {cropId && (
        <ImageCropModal
          imageSrc={queue.find((p) => p.id === cropId)?.originalDataUrl || queue.find((p) => p.id === cropId)?.dataUrl || ""}
          initialState={queue.find((p) => p.id === cropId)?.modalState}
          title="Crop photo"
          onCancel={() => setCropId(null)}
          onApply={applyCrop}
        />
      )}
    </div>
  );
});
