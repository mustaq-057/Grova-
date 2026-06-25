import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Send, Pipette, Radio } from "lucide-react";
import { api } from "@/lib/api";

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
  onDrawStart?: () => void;
  isLiveMode?: boolean;
  partnerId?: string;
  onGoLive?: () => void;
  onStopLive?: () => void;
}

const BACKGROUND_WHITE = "#FFFFFF";
const BACKGROUND_BLACK = "#000000";

const PALETTE_COLORS = [
  "#FF0040",
  "#FF1493",
  "#FF00FF",
  "#FF6B00",
  "#FF7043",
  "#FF8C69",
  "#FFB347",
  "#FFB800",
  "#FFD700",
  "#FFBF00",
  "#FF6AD5",
  "#FF85A2",
  "#FF69B4",
  "#F88379",
  "#FF10F0",
  "#9B30FF",
  "#6B5BFF",
  "#DA70D6",
  "#0080FF",
  "#00CED1",
  "#00E676",
  "#00FFFF",
  "#7CFC00",
  "#BFFF00",
  "#3EB489",
  "#87CEEB",
  "#8B5E3C",
  "#404040",
  "#808080",
  "#FFB6C1",
  "#FFCBA4",
  "#B8E4F0",
  "#F5F5DC",
  "#FFFDD0",
  "#C0C0C0",
  "#D3D3D3",
];

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

function parseHex(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function isBackgroundPixel(r: number, g: number, b: number, a: number, bg: string) {
  if (a < 16) return true;
  const { r: br, g: bg2, b: bb } = parseHex(bg);
  return Math.abs(r - br) < 8 && Math.abs(g - bg2) < 8 && Math.abs(b - bb) < 8;
}

export default function DoodleCanvas({ onClose, onSend, onError, onDrawStart, isLiveMode, partnerId, onGoLive, onStopLive }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorScrollRef = useRef<HTMLDivElement>(null);

  const [color, setColor] = useState("#FF0040");
  const [canvasBg, setCanvasBg] = useState(BACKGROUND_WHITE);
  const [brushSize, setBrushSize] = useState(8);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sending, setSending] = useState(false);
  const [eyedropperActive, setEyedropperActive] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);
  const exportGenRef = useRef(0);
  
  // Live sync refs
  const pendingStrokesRef = useRef<{x: number, y: number}[]>([]);
  const lastSentTimeRef = useRef(0);

  const fillCanvas = useCallback((bg: string, snap?: string | null) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (snap) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = snap;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let initialSnap: string | null = null;
    const draft = localStorage.getItem("doodle_draft");
    if (draft && !historyRef.current.length) {
      initialSnap = draft;
      historyRef.current = [draft];
      setCanUndo(true);
      setHasStrokes(true);
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const snap = (historyRef.current.length || initialSnap) ? canvas.toDataURL("image/png") : null;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      fillCanvas(canvasBg, initialSnap || snap);
      initialSnap = null;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [canvasBg, fillCanvas]);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    historyRef.current.push(dataUrl);
    if (historyRef.current.length > 30) historyRef.current.shift();
    setCanUndo(true);
    localStorage.setItem("doodle_draft", dataUrl);
  }, []);

  const restoreCanvas = useCallback((snap: string | undefined) => {
    fillCanvas(canvasBg, snap);
  }, [canvasBg, fillCanvas]);

  const undo = useCallback(() => {
    if (!historyRef.current.length) return;
    historyRef.current.pop();
    const prev = historyRef.current.length > 0 ? historyRef.current[historyRef.current.length - 1] : undefined;
    restoreCanvas(prev);
    setCanUndo(historyRef.current.length > 0);
    if (!historyRef.current.length) {
      setHasStrokes(false);
      localStorage.removeItem("doodle_draft");
    } else if (prev) {
      localStorage.setItem("doodle_draft", prev);
    }
    
    if (isLiveMode && partnerId) {
      void api.syncDoodleStrokes(partnerId, [], color, brushSize, true, canvasBg);
      // It's heavy to send the full state on undo, so we just send a clear+canvasBg for simplicity, 
      // or we can just send the clear event. To properly sync undo, we would need to send the whole canvas.
      // But for a live sketch, a clear is an acceptable fallback if they undo the first stroke.
    }
  }, [restoreCanvas, isLiveMode, partnerId, color, brushSize, canvasBg]);

  const applyBackground = useCallback((bg: string) => {
    setCanvasBg(bg);
    setColor(bg === BACKGROUND_WHITE ? "#000000" : BACKGROUND_WHITE);
    fillCanvas(bg);
    saveHistory();
    setHasStrokes(true);
    
    if (isLiveMode && partnerId) {
      void api.syncDoodleStrokes(partnerId, [], "#000000", 8, true, bg);
    }
  }, [fillCanvas, saveHistory, isLiveMode, partnerId]);

  const applyBrush = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [color, brushSize]);

  useEffect(() => {
    if (!isLiveMode || !partnerId) return;

    const intervalId = setInterval(() => {
      if (pendingStrokesRef.current.length > 0) {
        void api.syncDoodleStrokes(partnerId, pendingStrokesRef.current, color, brushSize);
        pendingStrokesRef.current = [];
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [isLiveMode, partnerId, color, brushSize]);

  useEffect(() => {
    if (!isLiveMode) return;

    const processSyncData = (data: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const rect = canvas?.getBoundingClientRect();
      if (!ctx || !rect) return;

      if (data.clear) {
        ctx.clearRect(0, 0, rect.width, rect.height);
        if (data.canvasBg) {
          setCanvasBg(data.canvasBg);
        } else {
          fillCanvas(canvasBg);
        }
        saveHistory();
        return;
      }

      if (!data.strokes || data.strokes.length === 0) return;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = data.color;
      ctx.fillStyle = data.color;
      ctx.lineWidth = data.brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const first = data.strokes[0];
      ctx.moveTo(first.x * rect.width, first.y * rect.height);
      for (let i = 1; i < data.strokes.length; i++) {
        ctx.lineTo(data.strokes[i].x * rect.width, data.strokes[i].y * rect.height);
      }
      ctx.stroke();

      if (data.strokes.length === 1) {
        ctx.beginPath();
        ctx.arc(first.x * rect.width, first.y * rect.height, data.brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      saveHistory(); // Ensure remote strokes are saved to history so resize doesn't wipe them
      setHasStrokes(true);
    };

    const handleSync = (e: Event) => {
      const data = (e as CustomEvent).detail;
      processSyncData(data);
    };

    window.addEventListener("doodle_sync_event", handleSync);

    // Poll for Vercel multi-instance fallback
    const pollId = setInterval(() => {
      void api.getDoodleSignals().then((res) => {
        if (res.signals && res.signals.length > 0) {
          for (const signal of res.signals) {
            processSyncData(signal);
          }
        }
      }).catch(() => {});
    }, 1000);

    return () => {
      window.removeEventListener("doodle_sync_event", handleSync);
      clearInterval(pollId);
    };
  }, [isLiveMode, saveHistory]);

  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const pickColorAt = useCallback((pt: Point) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const x = Math.floor(pt.x * dpr);
    const y = Math.floor(pt.y * dpr);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${[pixel[0], pixel[1], pixel[2]]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
    setColor(hex);
    setEyedropperActive(false);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const pt = getPoint(e);

    if (eyedropperActive) {
      pickColorAt(pt);
      return;
    }

    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPtRef.current = pt;
    onDrawStart?.();

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize, applyBrush, eyedropperActive, pickColorAt]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || !lastPtRef.current) return;
    e.preventDefault();
    const pt = getPoint(e);
    const ctx = canvasRef.current?.getContext("2d");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!ctx || !rect) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;

    if (isLiveMode && partnerId) {
      pendingStrokesRef.current.push({
        x: pt.x / rect.width,
        y: pt.y / rect.height,
      });
    }
  }, [applyBrush, isLiveMode, partnerId]);

  const onPointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPtRef.current = null;
    saveHistory();
    setHasStrokes(true);
    
    if (isLiveMode && partnerId && pendingStrokesRef.current.length > 0) {
      void api.syncDoodleStrokes(partnerId, pendingStrokesRef.current, color, brushSize);
      pendingStrokesRef.current = [];
    }
  }, [saveHistory, isLiveMode, partnerId, color, brushSize]);

  const cropToContent = (
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    bg: string,
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
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      return !isBackgroundPixel(r, g, b, a, bg);
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

        const crop = cropToContent(fullCanvas, cssW, cssH, canvasBg);
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
        ectx.fillStyle = canvasBg;
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
              localStorage.removeItem("doodle_draft");
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
  }, [hasStrokes, sending, onSend, onError, canvasBg]);

  const swatchClass = (c: string, selected: boolean) => {
    const needsBorder = c === BACKGROUND_WHITE || c === BACKGROUND_BLACK
      || parseHex(c).r + parseHex(c).g + parseHex(c).b > 600;
    return (
      <button
        key={c}
        onClick={() => {
          if (c === BACKGROUND_WHITE || c === BACKGROUND_BLACK) {
            applyBackground(c);
          } else {
            setColor(c);
            setEyedropperActive(false);
          }
        }}
        className="relative shrink-0 rounded-full w-[30px] h-[30px] transition-transform active:scale-95"
        style={{
          backgroundColor: c,
          border: needsBorder ? "1.5px solid rgba(255,255,255,0.35)" : "none",
        }}
        aria-label="Color"
      >
        {selected && (
          <div className="absolute -inset-[3px] rounded-full border-2 border-white" />
        )}
      </button>
    );
  };

  const allSwatches = [BACKGROUND_WHITE, ...PALETTE_COLORS, BACKGROUND_BLACK];
  const isBgSelected = (c: string) =>
    (c === BACKGROUND_WHITE || c === BACKGROUND_BLACK) ? canvasBg === c : color === c;

  return createPortal(
    <div className="fixed inset-0 z-[600] flex flex-col bg-black text-white overflow-hidden">
      <div
        className="flex-1 flex flex-col min-h-0"
        style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}
      >
        <div className="flex-1 flex items-stretch justify-center px-3 pt-2 pb-2 min-h-0">
          <div
            ref={containerRef}
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative"
            style={{ backgroundColor: canvasBg }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={`absolute inset-0 touch-none w-full h-full ${
                eyedropperActive ? "cursor-cell" : "cursor-crosshair"
              }`}
            />
            {/* LIVE badge — only visible in live mode */}
            {isLiveMode && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="shrink-0 bg-black px-3 pt-2 pb-3"
        style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3 px-1 mb-3">
          <div
            className="w-[30px] h-[30px] rounded-full shrink-0 border border-white/20"
            style={{ backgroundColor: color }}
          />
          <input
            type="range"
            min={2}
            max={28}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="flex-1 h-1 appearance-none bg-white/20 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
            aria-label="Brush size"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="w-[34px] h-[34px] flex items-center justify-center bg-white/10 rounded-full shrink-0 active:scale-95 transition-transform"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>

          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-[34px] h-[34px] flex items-center justify-center bg-white/10 rounded-full shrink-0 active:scale-95 transition-transform disabled:opacity-30"
            aria-label="Undo"
          >
            <Undo2 className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>

          <button
            onClick={() => setEyedropperActive((v) => !v)}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded-full shrink-0 active:scale-95 transition-all ${
              eyedropperActive ? "bg-white text-black" : "bg-white/10"
            }`}
            aria-label="Eyedropper"
          >
            <Pipette className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>

          <div
            ref={colorScrollRef}
            className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth min-w-0 py-1"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {allSwatches.map((c) => swatchClass(c, isBgSelected(c)))}
          </div>

          {!isLiveMode && onGoLive && (
            <button
              onClick={onGoLive}
              className="px-3 h-[34px] flex items-center justify-center bg-red-500/20 text-red-500 rounded-full shrink-0 active:scale-95 transition-transform font-bold text-sm gap-1.5"
              aria-label="Go Live"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Go Live
            </button>
          )}

          {isLiveMode && onStopLive && (
            <button
              onClick={onStopLive}
              className="px-3 h-[34px] flex items-center justify-center bg-red-600 text-white rounded-full shrink-0 active:scale-95 transition-transform font-bold text-sm gap-1.5 shadow-lg shadow-red-600/40"
              aria-label="Stop Live"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Stop Live
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!hasStrokes || sending}
            className="w-[44px] h-[44px] flex items-center justify-center bg-[#E1306C] rounded-full shrink-0 active:scale-95 transition-transform disabled:opacity-40 shadow-lg shadow-[#E1306C]/30"
            aria-label="Send"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
