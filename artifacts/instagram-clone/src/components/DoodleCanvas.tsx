import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Trash2, Send, ChevronLeft, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DoodleData {
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

const COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0040", // Red
  "#FF6B00", // Orange
  "#FFD700", // Yellow
  "#00E676", // Green
  "#0080FF", // Blue
  "#9D00FF", // Purple
  "#FF00FF", // Magenta
  "#8B7355", // Brown/Grey
];

const SIZES = [2, 4, 8, 14, 22];

type Point = { x: number; y: number };

export default function DoodleCanvas({ onClose, onSend }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [sliderValue, setSliderValue] = useState(50);
  const [canUndo, setCanUndo] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sending, setSending] = useState(false);
  const [moreSpace, setMoreSpace] = useState(false);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<Point | null>(null);
  const historyRef = useRef<string[]>([]);

  // Calculate actual brush size based on base size and slider (slider acts as multiplier 0.5x to 2x)
  const actualBrushSize = brushSize * (sliderValue / 50);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const ctx = canvas.getContext("2d")!;
      const snap = historyRef.current.length ? canvas.toDataURL("image/png") : null;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
      
      // Fill white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      if (snap) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = snap;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [moreSpace]); // Re-run when canvas size changes

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
    
    // Fill white
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
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
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    historyRef.current = [];
    setCanUndo(false);
    setHasStrokes(false);
  }, []);

  const applyBrush = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = actualBrushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [color, actualBrushSize]);

  const getPoint = (e: React.PointerEvent): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
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
    ctx.fillStyle = color;
    ctx.fill();
  }, [actualBrushSize, applyBrush, color]);

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

  const handleSend = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes || sending) return;
    setSending(true);

    // Downscale from DPR-scaled canvas to CSS pixel size for a reasonable file size.
    // On a 3x phone a 400px canvas is 1200px internally → huge PNG. Export at 1x CSS size.
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = cssW;
    exportCanvas.height = cssH;
    const ectx = exportCanvas.getContext("2d")!;
    ectx.drawImage(canvas, 0, 0, cssW, cssH);

    onSend({ 
      imageData: exportCanvas.toDataURL("image/png"), 
      canvasX: 0, 
      canvasY: 0, 
      width: cssW, 
      height: cssH 
    });
  }, [hasStrokes, sending, onSend]);

  return createPortal(
    <div className="fixed inset-0 z-[600] flex flex-col bg-[#0b101e] text-white overflow-hidden">
      
      {/* Top Header - safe-area-inset-top requires inline style */}
      {/* eslint-disable-next-line css-inline-styles -- env(safe-area-inset-top) for notched devices */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5 pt-3"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors" aria-label="Close doodle canvas">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-semibold text-[15px]">Draw in chat</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMoreSpace(!moreSpace)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0080FF]/15 text-[#0080FF] rounded-lg text-sm font-medium hover:bg-[#0080FF]/25 transition-colors"
          >
            <Maximize className="w-4 h-4" />
            More space
          </button>
          
          <button onClick={undo} disabled={!canUndo} className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30" aria-label="Undo drawing">
            <Undo2 className="w-5 h-5" />
          </button>
          
          <button onClick={clear} className="p-2 hover:bg-[#FF0040]/20 text-[#FF0040] rounded-full transition-colors" aria-label="Clear canvas">
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleSend} 
            disabled={!hasStrokes || sending}
            className="w-9 h-9 flex items-center justify-center bg-[#0080FF] rounded-full text-white hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:bg-[#0080FF]/50"
          >
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
          
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors ml-1" aria-label="Close drawing">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* Left Sidebar (Colors) */}
        <div className="w-[60px] shrink-0 flex flex-col items-center py-4 overflow-y-auto scrollbar-hide gap-4 border-r border-white/5">
          {COLORS.map(c => (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            // eslint-disable-next-line css-inline-styles -- dynamic color value from state
            <button
              key={c}
              onClick={() => setColor(c)}
              className="relative rounded-full w-8 h-8 shrink-0 transition-transform hover:scale-110"
              style={{ backgroundColor: c, border: c === "#000000" ? "1px solid rgba(255,255,255,0.2)" : "none" }}
              aria-label={`Select ${c} color`}
            >
              {color === c && (
                <div className="absolute -inset-[4px] rounded-full border-2 border-[#0080FF]" />
              )}
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-[#161c2d] p-0 md:p-2">
          <div 
            ref={containerRef} 
            className={cn(
              "flex-1 bg-white shadow-lg overflow-hidden relative transition-all duration-300",
              moreSpace ? "m-0 rounded-none" : "m-2 md:m-4 rounded-xl md:rounded-2xl"
            )}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="absolute inset-0 touch-none w-full h-full cursor-crosshair"
            />
          </div>
        </div>

        {/* Right Sidebar (Sizes & Opacity/Size Multiplier Slider) */}
        <div className="w-[60px] shrink-0 flex flex-col items-center py-4 border-l border-white/5 bg-[#0b101e] z-10">
          <div className="text-[10px] text-white/50 font-bold mb-4">SIZE</div>
          <div className="flex flex-col items-center justify-between h-[200px] mb-8">
            {SIZES.map(s => (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5"
                aria-label={`Brush size ${s}`}
              >
                {/* eslint-disable-next-line css-inline-styles -- dynamic size from brushSize state */}
              <div 
                  className="rounded-full bg-white transition-all" 
                  style={{ width: s, height: s }}
                />
                {brushSize === s && (
                  <div className="absolute inset-0 rounded-full border-2 border-[#0080FF]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center w-full min-h-[100px] px-2 relative group">
            {/* Slider track */}
            <div className="absolute inset-y-0 w-1 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
              {/* eslint-disable-next-line css-inline-styles -- dynamic height from slider state */}
              <div 
                className="w-full bg-[#0080FF] transition-all duration-75" 
                style={{ height: `${sliderValue}%` }}
              />
            </div>
            {/* Slider input */}
            {/* eslint-disable-next-line css-inline-styles -- writingMode not available in Tailwind */}
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
              style={{ writingMode: 'vertical-rl', direction: 'rtl' }}
              aria-label="Brush size multiplier"
            />
            {/* Slider thumb representation */}
            {/* eslint-disable-next-line css-inline-styles -- dynamic calc() position from slider state */}
            <div 
              className="absolute w-4 h-4 bg-[#0080FF] rounded-full shadow-lg pointer-events-none transition-all duration-75"
              style={{ bottom: `calc(${sliderValue}% - 8px)` }}
            >
              <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 -mx-1 bg-[#0080FF]" />
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
