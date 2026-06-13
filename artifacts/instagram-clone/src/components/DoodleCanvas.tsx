import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Trash2, Send, ChevronLeft } from "lucide-react";

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
  "#000000",
  "#FFFFFF",
  "#FF0040",
  "#FF6B00",
  "#FFD700",
  "#00E676",
  "#0080FF",
  "#9D00FF",
  "#FF00FF",
  "#8B7355",
  "#E84393",
  "#4ECDC4",
  "#FFB347",
  "#1a1a2e",
  "#95A5A6",
  "#2ECC71",
  "#FF69B4",
  "#00CED1",
];

const SIZES = [2, 4, 8, 14, 22];

type Point = { x: number; y: number };

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function DoodleCanvas({ onClose, onSend, onError }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [sliderValue, setSliderValue] = useState(50);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sending, setSending] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);
  const exportGenRef = useRef(0);

  const actualBrushSize = brushSize * (sliderValue / 50);

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
    ctx.lineWidth = actualBrushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [color, actualBrushSize]);

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
    ctx.arc(pt.x, pt.y, actualBrushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [actualBrushSize, applyBrush]);

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
        const cornerRadius = Math.min(24, crop.w * 0.12, crop.h * 0.12);

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = crop.w;
        exportCanvas.height = crop.h;
        const ectx = exportCanvas.getContext("2d");
        if (!ectx) {
          fail("Could not prepare your doodle. Please try again.");
          return;
        }

        ectx.save();
        roundRectPath(ectx, 0, 0, crop.w, crop.h, cornerRadius);
        ectx.clip();
        ectx.fillStyle = "#FFFFFF";
        ectx.fillRect(0, 0, crop.w, crop.h);
        ectx.drawImage(fullCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        ectx.restore();

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
          className="w-9 h-9 flex items-center justify-center bg-primary rounded-full text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          aria-label="Send doodle"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[56px] sm:w-[60px] shrink-0 flex flex-col items-center py-3 overflow-y-auto scrollbar-hide gap-3 border-r border-white/5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="relative rounded-full w-8 h-8 shrink-0 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                border: c === "#FFFFFF" || c === "#000000" ? "1px solid rgba(255,255,255,0.25)" : "none",
              }}
              aria-label={`Color ${c}`}
            >
              {color === c && (
                <div className="absolute -inset-[3px] rounded-full border-2 border-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col bg-[#161c2d] min-w-0">
          <div
            ref={containerRef}
            className="flex-1 m-2 sm:m-3 rounded-2xl overflow-hidden bg-white shadow-lg relative"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="absolute inset-0 touch-none w-full h-full cursor-crosshair"
            />
            {!hasStrokes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-black/30 text-sm font-medium">Draw something cute ✨</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-[56px] sm:w-[60px] shrink-0 flex flex-col items-center py-3 border-l border-white/5">
          <div className="text-[10px] text-white/50 font-bold mb-3">SIZE</div>
          <div className="flex flex-col items-center gap-3 mb-4">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5"
                aria-label={`Brush size ${s}`}
              >
                <div
                  className="rounded-full bg-white transition-all"
                  style={{ width: Math.min(s, 14), height: Math.min(s, 14) }}
                />
                {brushSize === s && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center w-full min-h-[80px] px-2 relative">
            <div className="absolute inset-y-0 w-1 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-primary transition-all duration-75"
                style={{ height: `${sliderValue}%` }}
              />
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
              style={{ writingMode: "vertical-rl", direction: "rtl" }}
              aria-label="Brush size multiplier"
            />
            <div
              className="absolute w-3.5 h-3.5 bg-primary rounded-full shadow-lg pointer-events-none transition-all duration-75"
              style={{ bottom: `calc(${sliderValue}% - 7px)` }}
            />
          </div>
        </div>
      </div>

      <div
        className="shrink-0 border-t border-white/5 bg-[#0b101e] px-4 py-3 flex items-center justify-between"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
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
            className="p-2.5 hover:bg-destructive/20 text-destructive rounded-full transition-colors disabled:opacity-30"
            aria-label="Clear canvas"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
