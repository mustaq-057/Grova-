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
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#78716c",
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
  const [colorsOpen, setColorsOpen] = useState(true);

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
    const snap = canvasRef.current?.toDataURL("image/png");
    onExpandCanvas();
    if (snap) {
      requestAnimationFrame(() => layoutCanvas(snap));
    }
  }, [layoutCanvas, onExpandCanvas]);

  const maybeExpandWhileDrawing = (y: number) => {
    const container = containerRef.current;
    if (!container) return;
    const h = container.getBoundingClientRect().height;
    if (y < h - 72) return;
    const now = Date.now();
    if (now - expandCooldownRef.current < 400) return;
    expandCooldownRef.current = now;
    handleExpandCanvas();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

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
    maybeExpandWhileDrawing(y);

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

    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    octx.drawImage(canvas, 0, 0);

    onSend(exportCanvas.toDataURL("image/jpeg", 0.92));
    onClose();
  };

  return (
    <div
      className="border-t border-border/80 bg-background shrink-0 flex flex-col"
      role="region"
      aria-label="Doodle drawing area in chat"
      data-testid="doodle-panel"
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-secondary/40 border-b border-border/50">
        <p className="text-xs font-semibold text-foreground truncate">Draw in chat</p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleExpandCanvas}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-primary/15 text-primary hover:bg-primary/25"
            title="Add more drawing space"
          >
            <Plus className="w-3.5 h-3.5" />
            More space
          </button>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg bg-secondary disabled:opacity-40"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded-lg bg-destructive/15 text-destructive"
            aria-label="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground"
            aria-label="Send doodle"
            data-testid="button-send-doodle"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-secondary"
            aria-label="Close doodle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0" style={{ height: Math.min(canvasHeight, typeof window !== "undefined" ? window.innerHeight * 0.55 : 480) }}>
        {/* Left — color drawer */}
        <aside
          className={`shrink-0 flex flex-col border-r border-border/60 bg-card/95 transition-[width] duration-200 overflow-hidden ${
            colorsOpen ? "w-[3.25rem] sm:w-14" : "w-9"
          }`}
        >
          <button
            type="button"
            onClick={() => setColorsOpen((o) => !o)}
            className="p-2 border-b border-border/50 text-muted-foreground hover:text-foreground"
            aria-label={colorsOpen ? "Collapse colors" : "Expand colors"}
          >
            {colorsOpen ? <ChevronLeft className="w-4 h-4 mx-auto" /> : <ChevronRight className="w-4 h-4 mx-auto" />}
          </button>
          {colorsOpen && (
            <div className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col items-center gap-1.5 scrollbar-hide">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCurrentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 shrink-0 transition-transform ${
                    currentColor === color
                      ? "border-primary scale-110 ring-2 ring-primary/30"
                      : color === "#ffffff"
                        ? "border-border"
                        : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          )}
          {!colorsOpen && (
            <button
              type="button"
              onClick={() => setColorsOpen(true)}
              className="mx-auto mt-2 w-7 h-7 rounded-full border-2 border-primary"
              style={{ backgroundColor: currentColor }}
              aria-label="Open color drawer"
            />
          )}
        </aside>

        {/* Center — scrollable white drawing sheet */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-white scrollbar-hide"
        >
          <div ref={containerRef} className="relative w-full">
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

        {/* Right — brush size */}
        <aside className="w-[3.25rem] sm:w-14 shrink-0 flex flex-col items-center gap-2 py-2 px-1 border-l border-border/60 bg-card/95">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Size</span>
          {BRUSH_PRESETS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              className={`rounded-full border-2 flex items-center justify-center transition-all ${
                brushSize === size ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
              style={{ width: Math.min(28, 10 + size), height: Math.min(28, 10 + size) }}
              aria-label={`Brush size ${size}`}
              title={`Size ${size}`}
            >
              <span
                className="rounded-full bg-foreground"
                style={{ width: Math.max(4, size / 2.5), height: Math.max(4, size / 2.5) }}
              />
            </button>
          ))}
          <div className="flex-1 flex flex-col items-center justify-center w-full px-0.5 min-h-[4rem]">
            <span className="text-[10px] font-bold text-foreground mb-1">{brushSize}</span>
            <input
              type="range"
              min={2}
              max={36}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 h-1 accent-primary -rotate-90 origin-center"
              aria-label="Brush size slider"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
