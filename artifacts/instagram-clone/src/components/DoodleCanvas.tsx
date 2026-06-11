import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Trash2, Send, Eraser } from "lucide-react";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DoodleData {
  /** PNG data-URL of the cropped stroke area (transparent background) */
  imageData: string;
  canvasX: number;
  canvasY: number;
  width: number;
  height: number;
}

interface DoodleCanvasProps {
  onClose: () => void;
  onSend: (data: DoodleData) => void;
}

// ─── 24 Crayon colours ───────────────────────────────────────────────────────

const COLORS = [
  // Row 1 – reds / pinks / purples
  "#FF2020", "#FF6B35", "#FFD700", "#ADFF2F",
  // Row 2 – greens / teals
  "#00E676", "#00BCD4", "#2979FF", "#7C4DFF",
  // Row 3 – dark tones
  "#FF4081", "#E040FB", "#F06292", "#FFAB40",
  // Row 4 – pastels
  "#80CBC4", "#80DEEA", "#B39DDB", "#FFF59D",
  // Row 5 – naturals
  "#A5D6A7", "#EF9A9A", "#BCAAA4", "#90A4AE",
  // Row 6 – darks + neutrals
  "#FF8A65", "#CE93D8", "#FFFFFF", "#000000",
];

const BRUSH_SIZES = [2, 5, 9, 14, 22];

type Point = { x: number; y: number };

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoodleCanvas({ onClose, onSend }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState("#FF2020");
  const [brushSize, setBrushSize] = useState(5);
  const [eraser, setEraser] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sending, setSending] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);
  const minXRef = useRef(Infinity);
  const minYRef = useRef(Infinity);
  const maxXRef = useRef(-Infinity);
  const maxYRef = useRef(-Infinity);

  // ── Canvas sizing ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ctx = canvas.getContext("2d")!;
      const snap = historyRef.current.length ? canvas.toDataURL("image/png") : null;
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

  // ── History ────────────────────────────────────────────────────────────────

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

  // ── Drawing ────────────────────────────────────────────────────────────────

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

  const getPoint = (e: React.PointerEvent): Point => ({ x: e.clientX, y: e.clientY });

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

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes || sending) return;
    setSending(true);

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
  }, [hasStrokes, sending, onSend, onClose]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[600] overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* Transparent drawing canvas */}
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
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 py-3 bg-gradient-to-b from-black/65 to-transparent pointer-events-none"
        style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <button
          onClick={onClose}
          className="pointer-events-auto w-10 h-10 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Close doodle"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-white/70 text-[13px] font-semibold tracking-wide select-none pointer-events-none">
          ✏️ Doodle
        </p>

        <div className="flex gap-2 pointer-events-auto">
          {/* Undo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-35"
            aria-label="Undo"
          >
            <Undo2 className="w-[18px] h-[18px]" />
          </button>
          {/* Clear */}
          <button
            onClick={clear}
            className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Clear canvas"
          >
            <Trash2 className="w-[16px] h-[16px]" />
          </button>
        </div>
      </div>

      {/* ── Bottom toolbar ── */}
      <div
        className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-2 px-3 pt-3"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 12px) + 10px)",
          background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      >
        {/* Brush size row */}
        <div className="flex items-center gap-3 pointer-events-auto mb-0.5">
          {BRUSH_SIZES.map(s => {
            const active = brushSize === s && !eraser;
            return (
              <button
                key={s}
                onClick={() => { setBrushSize(s); setEraser(false); }}
                className="flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{ width: s + 18, height: s + 18 }}
                aria-label={`Brush size ${s}`}
              >
                <span
                  className="rounded-full block transition-all duration-150"
                  style={{
                    width: s,
                    height: s,
                    backgroundColor: eraser ? "#888" : color,
                    boxShadow: active
                      ? `0 0 0 2.5px #fff, 0 0 0 4.5px rgba(255,255,255,0.3), 0 0 12px ${color}80`
                      : "0 0 0 1px rgba(255,255,255,0.25)",
                    opacity: active ? 1 : 0.6,
                    transform: active ? "scale(1.15)" : "scale(1)",
                  }}
                />
              </button>
            );
          })}

          {/* Eraser toggle */}
          <button
            onClick={() => setEraser(e => !e)}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-semibold transition-all active:scale-95 ${
              eraser
                ? "bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.35)]"
                : "bg-white/20 text-white backdrop-blur-sm"
            }`}
            aria-label="Eraser"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Erase</span>
          </button>
        </div>

        {/* Colour palette + send */}
        <div className="flex items-center w-full max-w-[420px] gap-2 pointer-events-auto">
          {/* Compact 24-colour grid */}
          <div
            className="flex-1 grid gap-[5px]"
            style={{ gridTemplateColumns: "repeat(12, 1fr)" }}
          >
            {COLORS.map(c => {
              const active = color === c && !eraser;
              return (
                <button
                  key={c}
                  onClick={() => { setColor(c); setEraser(false); }}
                  className="rounded-full transition-all active:scale-90"
                  style={{
                    aspectRatio: "1",
                    backgroundColor: c,
                    boxShadow: active
                      ? `0 0 0 2px #fff, 0 0 0 4px rgba(255,255,255,0.25), 0 0 10px ${c}90`
                      : c === "#FFFFFF"
                        ? "inset 0 0 0 1px rgba(0,0,0,0.3)"
                        : c === "#000000"
                          ? "inset 0 0 0 1px rgba(255,255,255,0.25)"
                          : "none",
                    transform: active ? "scale(1.25)" : "scale(1)",
                  }}
                  aria-label={`Color ${c}`}
                />
              );
            })}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!hasStrokes || sending}
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-95 transition-all disabled:opacity-35 disabled:scale-95"
            style={{
              background: hasStrokes && !sending
                ? "linear-gradient(135deg, #f72585, #b5179e)"
                : "rgba(255,255,255,0.15)",
              boxShadow: hasStrokes && !sending
                ? "0 4px 20px rgba(247,37,133,0.55), 0 0 0 1px rgba(247,37,133,0.3)"
                : "none",
            }}
            aria-label="Send doodle"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {/* Hint overlay */}
      {!hasStrokes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/45 text-sm font-medium bg-black/25 px-5 py-2.5 rounded-full backdrop-blur-sm select-none animate-pulse">
            ✏️ Draw anywhere on the chat
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
