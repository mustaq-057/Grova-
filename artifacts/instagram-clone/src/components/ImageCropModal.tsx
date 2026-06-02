import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";

export type CropAspect = "free" | "1:1" | "4:5";

type Props = {
  imageSrc: string;
  title?: string;
  /** Default crop frame — use 1:1 for profile photos */
  initialAspect?: CropAspect;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
};

const ASPECT: Record<CropAspect, number | null> = {
  free: null,
  "1:1": 1,
  "4:5": 4 / 5,
};

export const ImageCropModal = memo(function ImageCropModal({
  imageSrc,
  title = "Crop photo",
  initialAspect = "4:5",
  onCancel,
  onApply,
}: Props) {
  const [aspect, setAspect] = useState<CropAspect>(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const totalScale = baseScale * zoom;

  const fitImage = useCallback(() => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img?.naturalWidth || !frame) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    const fit = Math.max(frame.clientWidth / img.naturalWidth, frame.clientHeight / img.naturalHeight);
    setBaseScale(fit);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setAspect(initialAspect);
  }, [imageSrc, initialAspect]);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const id = requestAnimationFrame(() => fitImage());
    return () => cancelAnimationFrame(id);
  }, [imageSrc, aspect, fitImage]);

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => setDragging(false);

  const applyCrop = useCallback(() => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !img.complete || !frame) return;

    const frameW = frame.clientWidth;
    const frameH = frame.clientHeight;
    const ratio = ASPECT[aspect];
    let cropW = frameW;
    let cropH = frameH;
    if (ratio) {
      if (frameW / frameH > ratio) {
        cropH = frameH;
        cropW = frameH * ratio;
      } else {
        cropW = frameW;
        cropH = frameW / ratio;
      }
    }

    const canvas = document.createElement("canvas");
    const outW = Math.min(1600, Math.round(cropW * 2));
    const outH = Math.round(outW * (cropH / cropW));
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayedW = img.naturalWidth * totalScale;
    const displayedH = img.naturalHeight * totalScale;
    const imgLeft = (frameW - displayedW) / 2 + offset.x;
    const imgTop = (frameH - displayedH) / 2 + offset.y;
    const cropLeft = (frameW - cropW) / 2;
    const cropTop = (frameH - cropH) / 2;

    const sx = ((cropLeft - imgLeft) / displayedW) * img.naturalWidth;
    const sy = ((cropTop - imgTop) / displayedH) * img.naturalHeight;
    const sw = (cropW / displayedW) * img.naturalWidth;
    const sh = (cropH / displayedH) * img.naturalHeight;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    onApply(canvas.toDataURL("image/jpeg", 0.92));
  }, [aspect, offset, totalScale, onApply]);

  const frameAspectClass =
    aspect === "1:1"
      ? "aspect-square max-h-[min(55vh,400px)]"
      : aspect === "4:5"
        ? "aspect-[4/5] max-h-[min(55vh,500px)]"
        : "aspect-[3/4] max-h-[min(55vh,480px)]";

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/95 flex flex-col safe-area-top safe-area-bottom">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <button type="button" onClick={onCancel} className="p-2 text-white/80 hover:text-white" aria-label="Cancel">
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-semibold text-white">{title}</p>
        <button type="button" onClick={applyCrop} className="p-2 text-primary font-semibold text-sm flex items-center gap-1">
          <Check className="w-5 h-5" />
          Done
        </button>
      </div>

      <div className="flex gap-2 justify-center py-3 px-4 shrink-0">
        {(["free", "1:1", "4:5"] as CropAspect[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAspect(a)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              aspect === a ? "bg-primary text-primary-foreground" : "bg-white/15 text-white"
            }`}
          >
            {a === "free" ? "Free" : a}
          </button>
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div
          ref={frameRef}
          className={`relative w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black ${frameAspectClass}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            className="absolute left-1/2 top-1/2 max-w-none select-none touch-none origin-center"
            style={{
              width: natural.w || undefined,
              height: natural.h || undefined,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${totalScale})`,
            }}
            draggable={false}
            onLoad={fitImage}
          />
          <div className="absolute inset-0 pointer-events-none ring-2 ring-white/40 ring-inset" />
        </div>
      </div>

      <p className="text-center text-xs text-white/60 px-4 pb-2 shrink-0">Drag to reposition · pinch or use zoom</p>

      <div className="flex justify-center gap-4 pb-6 shrink-0">
        <button
          type="button"
          onClick={() => setZoom((s) => Math.max(0.5, s - 0.15))}
          className="p-3 rounded-full bg-white/15 text-white"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((s) => Math.min(3, s + 0.15))}
          className="p-3 rounded-full bg-white/15 text-white"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
});
