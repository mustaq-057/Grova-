import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Eraser, Send, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DoodleData {
  imageData: string;
  blob: Blob;
  width: number;
  height: number;
}

interface DoodleCanvasProps {
  onClose: () => void;
  onSend: (data: DoodleData) => void;
  onError?: (message: string) => void;
}

const COLORS = [
  "#1a1a2e",
  "#FFFFFF",
  "#FF4D8D",
  "#FF6B6B",
  "#FFB347",
  "#FFE066",
  "#4ECDC4",
  "#45B7D1",
  "#9B59B6",
  "#E84393",
];

const SIZES = [3, 6, 12, 20];

type Point = { x: number; y: number };

export default function DoodleCanvas({ onClose, onSend, onError }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState("#1a1a2e");
  const [brushSize, setBrushSize] = useState(6);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sending, setSending] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);
  const exportGenRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const snap = historyRef.current.length ? canvas.toDataURL("image/png") : null;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, rect.width, rect.height);

      if (snap) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snap;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL("image/png"));
    if (historyRef.current.length > 30) historyRef.current.shift();
    setCanUndo(true);
  }, []);

  const restoreCanvas = useCallback((snap: string | undefined) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);

    if (snap) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = snap;
    }
  }, []);

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    restoreCanvas(prev);
    setCanUndo(historyRef.current.length > 0);
    if (!historyRef.current.length) setHasStrokes(false);
  }, [restoreCanvas]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    historyRef.current = [];
    setCanUndo(false);
    setHasStrokes(false);
  }, []);

  const applyBrush = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [color, brushSize]);

  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getPoint(e);
    lastPtRef.current = pt;

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize, applyBrush]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || !lastPtRef.current) return;
    e.preventDefault();
    const pt = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;
  }, [applyBrush]);

  const onPointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPtRef.current = null;
    saveHistory();
    setHasStrokes(true);
  }, [saveHistory]);

  const cropToContent = (
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
  ): { x: number; y: number; w: number; h: number } => {
    const cssW = width > 0 ? width : sourceCanvas.width;
    const cssH = height > 0 ? height : sourceCanvas.height;
    if (cssW <= 0 || cssH <= 0) {
      return { x: 0, y: 0, w: 40, h: 40 };
    }

    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) return { x: 0, y: 0, w: cssW, h: cssH };

    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(0, 0, cssW, cssH);
    } catch {
      return { x: 0, y: 0, w: Math.min(cssW, 280), h: Math.min(cssH, 280) };
    }
    const data = imageData.data;

    const isDrawn = (offset: number) => {
      const a = data[offset + 3];
      if (a < 16) return false;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      return !(r > 250 && g > 250 && b > 250);
    };

    let minX = cssW, maxX = -1, minY = cssH, maxY = -1;

    for (let y = 0; y < cssH; y++) {
      for (let x = 0; x < cssW; x++) {
        if (isDrawn((y * cssW + x) * 4)) {
          minY = y;
          y = cssH;
          break;
        }
      }
    }

    if (minY === cssH) return { x: 0, y: 0, w: Math.min(cssW, 200), h: Math.min(cssH, 200) };

    for (let y = cssH - 1; y >= minY; y--) {
      for (let x = 0; x < cssW; x++) {
        if (isDrawn((y * cssW + x) * 4)) {
          maxY = y;
          y = -1;
          break;
        }
      }
    }

    for (let x = 0; x < cssW; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (isDrawn((y * cssW + x) * 4)) {
          minX = x;
          x = cssW;
          break;
        }
      }
    }

    for (let x = cssW - 1; x >= minX; x--) {
      for (let y = minY; y <= maxY; y++) {
        if (isDrawn((y * cssW + x) * 4)) {
          maxX = x;
          x = -1;
          break;
        }
      }
    }

    const padding = 12;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(cssW - cropX, maxX - minX + padding * 2);
    const cropH = Math.min(cssH - cropY, maxY - minY + padding * 2);

    return { x: cropX, y: cropY, w: Math.max(cropW, 40), h: Math.max(cropH, 40) };
  };

  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes || sending) return;
    setSending(true);

    const gen = ++exportGenRef.current;

    const fail = (msg: string) => {
      if (exportGenRef.current !== gen) return;
      setSending(false);
      onError?.(msg);
    };

    const runExport = () => {
      try {
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        if (cssW <= 0 || cssH <= 0) {
          fail("Canvas is not ready. Please try again.");
          return;
        }

        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = cssW;
        fullCanvas.height = cssH;
        const fctx = fullCanvas.getContext("2d");
        if (!fctx) {
          fail("Could not prepare your doodle. Please try again.");
          return;
        }
        fctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, cssW, cssH);

        const crop = cropToContent(fullCanvas, cssW, cssH);

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = crop.w;
        exportCanvas.height = crop.h;
        const ectx = exportCanvas.getContext("2d");
        if (!ectx) {
          fail("Could not prepare your doodle. Please try again.");
          return;
        }
        ectx.fillStyle = "#FFFFFF";
        ectx.fillRect(0, 0, crop.w, crop.h);
        ectx.drawImage(fullCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

        const blobTimeout = setTimeout(() => {
          fail("Doodle export took too long. Try again with a simpler drawing.");
        }, 15000);

        exportCanvas.toBlob(
          (blob) => {
            clearTimeout(blobTimeout);
            if (exportGenRef.current !== gen) return;
            if (!blob) {
              fail("Could not export your doodle. Please try again.");
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              if (exportGenRef.current !== gen) return;
              setSending(false);
              onSend({
                imageData: reader.result as string,
                blob,
                width: crop.w,
                height: crop.h,
              });
            };
            reader.onerror = () => fail("Could not read doodle data. Please try again.");
            reader.readAsDataURL(blob);
          },
          "image/png",
          0.92,
        );
      } catch (err) {
        console.error("Doodle export failed:", err);
        fail("Could not export your doodle. Please try again.");
      }
    };

    requestAnimationFrame(runExport);
  }, [hasStrokes, sending, onSend, onError]);

  return createPortal(
    <div className="fixed inset-0 z-[600] flex flex-col bg-[#0b101e] text-white overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close doodle"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <span className="font-semibold text-[15px]">Draw a doodle</span>

        <button
          onClick={handleSend}
          disabled={!hasStrokes || sending}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative bg-[#161c2d] m-3 rounded-2xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 touch-none w-full h-full cursor-crosshair bg-white"
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/50 text-sm font-medium">Draw something cute ✨</p>
          </div>
        )}
      </div>

      <div
        className="shrink-0 border-t border-white/5 bg-[#0b101e] px-4 pt-3"
        style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "relative rounded-full w-9 h-9 shrink-0 transition-transform hover:scale-110",
                color === c && "ring-2 ring-primary ring-offset-2 ring-offset-[#0b101e]",
              )}
              style={{
                backgroundColor: c,
                border: c === "#FFFFFF" ? "1px solid rgba(255,255,255,0.3)" : "none",
              }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  brushSize === s ? "bg-primary/25 ring-1 ring-primary" : "hover:bg-white/10",
                )}
                aria-label={`Brush size ${s}`}
              >
                <div
                  className="rounded-full bg-white"
                  style={{ width: Math.min(s, 16), height: Math.min(s, 16) }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
              aria-label="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={clear}
              disabled={!hasStrokes}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
              aria-label="Clear canvas"
            >
              <Eraser className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
