import { useCallback, useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import { tryRefreshSession } from "@/lib/api";
import { isMobileDevice } from "@/lib/file-view";
import { resolveMediaDownloadUrl } from "@/lib/media-url";

type Props = {
  url: string;
  kind: "image" | "video";
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
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [url]);

  const handleDownload = useCallback(async () => {
    const fileBase = `grova-${kind}-${Date.now()}`;

    const extFromBlob = (blob: Blob): string => {
      const ct = blob.type.toLowerCase();
      if (ct.includes("webp")) return "webp";
      if (ct.includes("png")) return "png";
      if (ct.includes("gif")) return "gif";
      if (ct.includes("mp4") || ct.includes("video")) return "mp4";
      if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
      return kind === "video" ? "mp4" : "jpg";
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
      let downloadUrl = resolveMediaDownloadUrl(url, kind);
      let res = await fetch(downloadUrl, { credentials: "include" });
      if (res.status === 401) {
        const refreshed = await tryRefreshSession();
        if (refreshed) {
          downloadUrl = resolveMediaDownloadUrl(url, kind);
          res = await fetch(downloadUrl, { credentials: "include" });
        }
      }
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      return res.blob();
    };

    try {
      const blob = await fetchBlob();
      if (
        isMobileDevice() &&
        navigator.share &&
        navigator.canShare?.({
          files: [new File([blob], `${fileBase}.${extFromBlob(blob)}`, { type: blob.type || "application/octet-stream" })],
        })
      ) {
        await navigator.share({
          files: [new File([blob], `${fileBase}.${extFromBlob(blob)}`, { type: blob.type || "application/octet-stream" })],
        });
        return;
      }
      saveBlob(blob);
    } catch {
      try {
        const downloadUrl = resolveMediaDownloadUrl(url, kind);
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
  }, [url, kind]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, scale };
      panRef.current = null;
      return;
    }
    if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0]!;
      panRef.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
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
    if (e.touches.length === 1 && panRef.current && scale > 1) {
      const t = e.touches[0]!;
      setOffset({
        x: panRef.current.ox + (t.clientX - panRef.current.x),
        y: panRef.current.oy + (t.clientY - panRef.current.y),
      });
    }
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
    panRef.current = null;
    if (scale < 1.05) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {allowDownload && mediaReady && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
          aria-label="Close media"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {timed && !useVideoDuration && mediaReady && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary/30 text-white text-sm font-semibold z-10">
          {secondsLeft}s
        </div>
      )}

      {!mediaReady && kind === "image" ? (
        <img
          src={url}
          alt=""
          className="max-w-full max-h-full object-contain opacity-0"
          onLoad={onMediaReady}
          draggable={false}
        />
      ) : !mediaReady ? null : kind === "video" ? (
        <video
          src={url}
          controls={!timed}
          autoPlay
          playsInline
          onEnded={onVideoEnded}
          className="w-full h-full object-contain"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={url}
            alt="Media Viewer"
            className="max-w-full max-h-full object-contain transition-transform duration-75"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
            onLoad={onMediaReady}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
