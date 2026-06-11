import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo, Trash2, Send, Eraser } from "lucide-react";

// ─── Public types ────────────────────────────────────────────────────────────

export interface DoodleData {
  /** PNG data‑URL of the cropped stroke area (transparent background) */
  imageData: string;
  /** Cropped area's position/size relative to viewport at draw time */
  canvasX: number;
  canvasY: number;
  width: number;
  height: number;
}

interface DoodleCanvasProps {
  onClose: () => void;
  onSend: (data: DoodleData) => void;
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const COLORS = [
  "#ff2a00", "#ff8800", "#ffdd00", "#00cc55",
  "#00aaff", "#6644ff", "#ff44cc", "#ffffff",
  "#000000", "#888888",
];

const BRUSH_SIZES = [3, 6, 10, 16, 24];

type Point = { x: number; y: number };

// ─── Component ───────────────────────────────────────────────────────────────

export default function DoodleCanvas({ onClose, onSend }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#ff2a00");
  const [brushSize, setBrushSize] = useState(6);
  const [eraser, setEraser] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);
  // bounding box of all drawn pixels (in CSS px)
  const minXRef = useRef(Infinity);
  const minYRef = useRef(Infinity);
  const maxXRef = useRef(-Infinity);
  const maxYRef = useRef(-Infinity);

  // ── Set up canvas to cover full viewport ────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ctx = canvas.getContext("2d")!;
      const snap = historyRef.current.length
        ? canvas.toDataURL("image/png")
        : null;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      if (snap) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
        img.src = snap;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── History ─────────────────────────────────────────────────────────────

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL("image/png"));
    setCanUndo(true);
  }, []);

  const restoreCanvas = useCallback((snap: string | undefined) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (snap) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
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
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    historyRef.current = [];
    setCanUndo(false);
    setHasStrokes(false);
    minXRef.current = Infinity; minYRef.current = Infinity;
    maxXRef.current = -Infinity; maxYRef.current = -Infinity;
  }, []);

  // ── Drawing helpers ─────────────────────────────────────────────────────

  const applyBrush = useCallback((ctx: CanvasRenderingContext2D) => {
    if (eraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [eraser, color, brushSize]);

  const expandBounds = (x: number, y: number, r: number) => {
    minXRef.current = Math.min(minXRef.current, x - r);
    minYRef.current = Math.min(minYRef.current, y - r);
    maxXRef.current = Math.max(maxXRef.current, x + r);
    maxYRef.current = Math.max(maxYRef.current, y + r);
  };

  const getPoint = (e: React.PointerEvent): Point => ({
    x: e.clientX, y: e.clientY,
  });

  // ── Pointer events ──────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getPoint(e);
    lastPtRef.current = pt;
    expandBounds(pt.x, pt.y, brushSize);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = eraser ? "rgba(0,0,0,1)" : color;
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.fill();
  }, [brushSize, applyBrush, eraser, color]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current || !lastPtRef.current) return;
    e.preventDefault();
    const pt = getPoint(e);
    expandBounds(pt.x, pt.y, brushSize);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    applyBrush(ctx);
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;
  }, [brushSize, applyBrush]);

  const onPointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPtRef.current = null;
    saveHistory();
    setHasStrokes(true);
  }, [saveHistory]);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;

    const PAD = 12;
    const x = Math.max(0, Math.floor(minXRef.current - PAD));
    const y = Math.max(0, Math.floor(minYRef.current - PAD));
    const w = Math.min(window.innerWidth - x, Math.ceil(maxXRef.current - minXRef.current + PAD * 2));
    const h = Math.min(window.innerHeight - y, Math.ceil(maxYRef.current - minYRef.current + PAD * 2));
    if (w <= 0 || h <= 0) { onClose(); return; }

    const dpr = window.devicePixelRatio || 1;
    const exp = document.createElement("canvas");
    exp.width = w * dpr;
    exp.height = h * dpr;
    const oct = exp.getContext("2d")!;
    oct.drawImage(canvas, x * dpr, y * dpr, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);

    onSend({ imageData: exp.toDataURL("image/png"), canvasX: x, canvasY: y, width: w, height: h });
  }, [hasStrokes, onSend, onClose]);

  // ── UI ───────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[600] overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* Transparent canvas — the chat is VISIBLE through it */}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="absolute inset-0 touch-none"
        style={{ cursor: eraser ? "cell" : "crosshair" }}
      />

      {/* ── Top bar ── */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Close doodle"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-40"
            aria-label="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={clear}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-3 pb-[env(safe-area-inset-bottom,16px)] px-4 pt-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">

        {/* Brush-size row */}
        <div className="flex items-center gap-5 pointer-events-auto">
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              onClick={() => { setBrushSize(s); setEraser(false); }}
              className="flex items-center justify-center rounded-full transition-all active:scale-95"
              style={{ width: s + 14, height: s + 14 }}
              aria-label={`Brush size ${s}`}
            >
              <span
                className="rounded-full bg-white block transition-all"
                style={{
                  width: s,
                  height: s,
                  boxShadow: brushSize === s && !eraser ? "0 0 0 2.5px #fff, 0 0 0 4.5px rgba(255,255,255,0.35)" : "none",
                  opacity: brushSize === s && !eraser ? 1 : 0.55,
                }}
              />
            </button>
          ))}
          <button
            onClick={() => setEraser(e => !e)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-[13px] font-semibold transition-all active:scale-95 ${eraser ? "bg-white text-black" : "bg-white/20 text-white"}`}
            aria-label="Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span>Erase</span>
          </button>
        </div>

        {/* Color row + Send */}
        <div className="flex items-center w-full max-w-md gap-2 pointer-events-auto">
          {/* Scrollable colors */}
          <div className="flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-hide pl-1 pr-2 py-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setEraser(false); }}
                className="shrink-0 rounded-full transition-all active:scale-95"
                style={{
                  backgroundColor: c,
                  width: color === c && !eraser ? 34 : 28,
                  height: color === c && !eraser ? 34 : 28,
                  boxShadow: color === c && !eraser
                    ? "0 0 0 2.5px #fff, 0 0 0 5px rgba(255,255,255,0.25)"
                    : c === "#ffffff" ? "inset 0 0 0 1.5px rgba(0,0,0,0.25)" : "none",
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasStrokes}
            className="shrink-0 w-12 h-12 rounded-full bg-[#d91a92] flex items-center justify-center text-white shadow-[0_4px_20px_rgba(217,26,146,0.5)] active:scale-95 transition-all disabled:opacity-40 disabled:scale-95"
            aria-label="Send doodle"
          >
            <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Hint */}
      {!hasStrokes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/40 text-sm font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm select-none">
            ✏️ Draw anywhere on the chat
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
