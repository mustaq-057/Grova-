import { useRef, useState, useEffect, useCallback } from "react";
import { X, Undo, Trash2, Send, ChevronLeft, ChevronRight, Plus } from "lucide-react";

export const DOODLE_HEIGHT_STEP = 320;
export const DOODLE_MIN_HEIGHT = 280;

interface DoodleCanvasProps {
  onClose: () => void;
  onSend: (imageData: string) => void;
  canvasHeight: number;
  onExpandCanvas: () => void;
}

const COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#fda4af", "#fdba74", "#fef08a", "#bbf7d0", "#bae6fd"
];

const BRUSH_PRESETS = [4, 8, 12, 18, 26];

type Point = { x: number; y: number };

function applyBrush(ctx: CanvasRenderingContext2D, color: string, size: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function clearDrawingSurface(ctx: CanvasRenderingContext2D, pixelW: number, pixelH: number) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.restore();
}

export default function DoodleCanvas({ onClose, onSend, canvasHeight, onExpandCanvas }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPointRef = useRef<Point | null>(null);
  const colorRef = useRef("#000000");
  const brushRef = useRef(8);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const expandCooldownRef = useRef(0);
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [canUndo, setCanUndo] = useState(false);
  const [expandCount, setExpandCount] = useState(0);

  colorRef.current = currentColor;
  brushRef.current = brushSize;

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d", { alpha: true });
  };

  const layoutCanvas = useCallback((preserveSnapshot?: string) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssW = Math.max(1, Math.floor(container.clientWidth));
    const cssH = Math.max(DOODLE_MIN_HEIGHT, canvasHeightRef.current);

    container.style.minHeight = `${cssH}px`;
    container.style.height = `${cssH}px`;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyBrush(ctx, colorRef.current, brushRef.current);

    if (preserveSnapshot) {
      const img = new Image();
      img.onload = () => {
        clearDrawingSurface(ctx, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        applyBrush(ctx, colorRef.current, brushRef.current);
        const drawH = (img.height / img.width) * cssW;
        ctx.drawImage(img, 0, 0, cssW, drawH);
      };
      img.src = preserveSnapshot;
    } else {
      clearDrawingSurface(ctx, canvas.width, canvas.height);
    }
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = canvas.toDataURL("image/png");
    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push(snap);
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
    setCanUndo(historyIndexRef.current > 0);
  }, []);

  useEffect(() => {
    const snap = canvasRef.current?.toDataURL("image/png");
    layoutCanvas(snap);
  }, [canvasHeight, layoutCanvas]);

  useEffect(() => {
    layoutCanvas();
    pushHistory();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      const snap = canvasRef.current?.toDataURL("image/png");
      layoutCanvas(snap);
    });
    ro.observe(container);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
    };
    // Mount once — do not depend on layoutCanvas or height changes wipe the drawing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const restoreSnapshot = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    const snap = historyRef.current[index];
    if (!canvas || !ctx || !snap) return;

    const img = new Image();
    img.onload = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      clearDrawingSurface(ctx, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyBrush(ctx, colorRef.current, brushRef.current);
      ctx.drawImage(img, 0, 0, cssW, cssH);
    };
    img.src = snap;
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    restoreSnapshot(historyIndexRef.current);
    setCanUndo(historyIndexRef.current > 0);
  };

  const clearCanvas = () => {
    layoutCanvas();
    pushHistory();
  };

  const handleExpandCanvas = useCallback(() => {
    if (expandCount >= 3) return;
    const snap = canvasRef.current?.toDataURL("image/png");
    setExpandCount(prev => prev + 1);
    onExpandCanvas();
    if (snap) {
      requestAnimationFrame(() => layoutCanvas(snap));
    }
  }, [layoutCanvas, onExpandCanvas, expandCount]);



  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getPoint(e);
    const ctx = getCtx();
    if (!ctx) return;
    applyBrush(ctx, colorRef.current, brushRef.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastPointRef.current = { x, y };
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getPoint(e);

    const ctx = getCtx();
    const last = lastPointRef.current;
    if (!ctx || !last) return;

    applyBrush(ctx, colorRef.current, brushRef.current);

    const midX = (last.x + x) / 2;
    const midY = (last.y + y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);

    lastPointRef.current = { x, y };
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setIsDrawing(false);
    lastPointRef.current = null;
    getCtx()?.closePath();
    pushHistory();
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const octx = exportCanvas.getContext("2d");
    if (!octx) return;

    // Draw a black background instead of white
    octx.fillStyle = "#000000";
    octx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    octx.drawImage(canvas, 0, 0);

    onSend(exportCanvas.toDataURL("image/jpeg", 0.82));
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      role="region"
      aria-label="Doodle drawing area"
      data-testid="doodle-panel"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md active:scale-95 transition-transform"
          aria-label="Close"
        >
          <X className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex gap-4 pointer-events-auto">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="p-2.5 rounded-full bg-black/40 text-white disabled:opacity-50 backdrop-blur-md active:scale-95 transition-transform"
            aria-label="Undo"
          >
            <Undo className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md active:scale-95 transition-transform"
            aria-label="Clear"
          >
            <Trash2 className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-transparent scrollbar-hide relative"
      >
        <div ref={containerRef} className="relative w-full min-h-[100dvh]">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
            className="block w-full cursor-crosshair touch-none"
            style={{ touchAction: "none" }}
            data-testid="doodle-canvas"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 pt-12 pointer-events-none bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-4">
        {expandCount < 3 && (
          <button
            onClick={handleExpandCanvas}
            className="pointer-events-auto px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white text-[15px] font-medium backdrop-blur-xl active:scale-95 transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            Add space
          </button>
        )}
        
        <div className="w-full relative flex items-center pointer-events-auto">
          <div className="flex-1 flex items-center gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide shrink-0 snap-x">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCurrentColor(color)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 shrink-0 transition-transform snap-center shadow-lg ${
                  currentColor === color
                    ? "scale-110 ring-2 ring-white/50 border-white"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleSend}
            className="absolute right-4 shrink-0 w-12 h-12 rounded-full bg-[#d91a92] flex items-center justify-center text-white shadow-[0_4px_20px_rgba(217,26,146,0.5)] active:scale-95 transition-transform"
            aria-label="Send doodle"
          >
            <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
