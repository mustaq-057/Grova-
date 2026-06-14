import { useCallback, useEffect, useRef, useState } from "react";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { tryRefreshSession } from "@/lib/api";
import { resolveMediaDownloadUrl } from "@/lib/media-url";

type MediaItem = {
  url: string;
  kind: "image" | "video";
};

type Props = {
  url?: string;
  kind?: "image" | "video";
  items?: MediaItem[];
  initialIndex?: number;
  timed: boolean;
  useVideoDuration: boolean;
  secondsLeft: number;
  mediaReady: boolean;
  allowDownload?: boolean;
  onClose: () => void;
  onMediaReady?: () => void;
  onVideoEnded?: () => void;
};

export function MediaViewerOverlay({
  url,
  kind,
  items,
  initialIndex = 0,
  timed,
  useVideoDuration,
  secondsLeft,
  mediaReady,
  allowDownload = false,
  onClose,
  onMediaReady,
  onVideoEnded,
}: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [internalReady, setInternalReady] = useState(mediaReady);
  
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null);

  const activeItems = items || (url && kind ? [{ url, kind }] : []);
  const currentItem = activeItems[currentIndex];

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setInternalReady(mediaReady);
  }, [currentIndex, currentItem?.url, mediaReady]);

  const handleDownload = useCallback(async () => {
    if (!currentItem) return;
    const fileBase = `grova-${currentItem.kind}-${Date.now()}`;

    const extFromBlob = (blob: Blob): string => {
      const ct = blob.type.toLowerCase();
      if (ct.includes("webp")) return "webp";
      if (ct.includes("png")) return "png";
      if (ct.includes("gif")) return "gif";
      if (ct.includes("mp4") || ct.includes("video")) return "mp4";
      if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
      return currentItem.kind === "video" ? "mp4" : "jpg";
    };

    const saveBlob = (blob: Blob) => {
      const ext = extFromBlob(blob);
      const fileName = `${fileBase}.${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Downloaded");
    };

    const fetchBlob = async (): Promise<Blob> => {
      let downloadUrl = resolveMediaDownloadUrl(currentItem.url, currentItem.kind);
      let res = await fetch(downloadUrl, { credentials: "include" });
      if (res.status === 401) {
        const refreshed = await tryRefreshSession();
        if (refreshed) {
          downloadUrl = resolveMediaDownloadUrl(currentItem.url, currentItem.kind);
          res = await fetch(downloadUrl, { credentials: "include" });
        }
      }
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      return res.blob();
    };

    try {
      const blob = await fetchBlob();
      // REMOVED navigator.share logic to force direct download
      saveBlob(blob);
    } catch {
      try {
        const downloadUrl = resolveMediaDownloadUrl(currentItem.url, currentItem.kind);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileBase;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        toast.error("Download failed");
      }
    }
  }, [currentItem]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, scale };
      panRef.current = null;
      swipeRef.current = null;
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0]!;
      if (scale > 1) {
        panRef.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
      } else {
        swipeRef.current = { startX: t.clientX, startY: t.clientY };
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = Math.min(4, Math.max(1, (pinchRef.current.scale * dist) / pinchRef.current.dist));
      setScale(next);
      return;
    }
    if (e.touches.length === 1 && scale > 1 && panRef.current) {
      const t = e.touches[0]!;
      setOffset({
        x: panRef.current.ox + (t.clientX - panRef.current.x),
        y: panRef.current.oy + (t.clientY - panRef.current.y),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (scale === 1 && swipeRef.current) {
      const t = e.changedTouches[0];
      if (t) {
        const dx = t.clientX - swipeRef.current.startX;
        const dy = t.clientY - swipeRef.current.startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
          if (dx > 0 && currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
          } else if (dx < 0 && currentIndex < activeItems.length - 1) {
            setCurrentIndex((i) => i + 1);
          }
        }
      }
    }
    
    pinchRef.current = null;
    panRef.current = null;
    swipeRef.current = null;
    if (scale < 1.05) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  if (!currentItem) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {!internalReady && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {allowDownload && mediaReady && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          aria-label="Close media"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {timed && !useVideoDuration && internalReady && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary/30 text-white text-sm font-semibold z-10">
          {secondsLeft}s
        </div>
      )}

      {activeItems.length > 1 && currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {activeItems.length > 1 && currentIndex < activeItems.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {activeItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {activeItems.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}

      {currentItem.kind === "video" ? (
        <video
          src={currentItem.url}
          controls={!timed}
          autoPlay
          playsInline
          onEnded={onVideoEnded}
          className={`w-full h-full object-contain ${!internalReady ? "opacity-0" : ""}`}
          onLoadedData={() => {
            setInternalReady(true);
            onMediaReady?.();
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={currentItem.url}
            alt=""
            className={`max-w-full max-h-full object-contain transition-transform duration-75 ${!internalReady ? "opacity-0" : ""}`}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
            onLoad={() => {
              setInternalReady(true);
              onMediaReady?.();
            }}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
