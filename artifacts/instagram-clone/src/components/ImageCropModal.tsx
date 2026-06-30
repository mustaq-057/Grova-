import { memo, useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Check, X, RotateCw, Settings2, 
  Image as ImageIcon, Crop, Sun, Sliders, Droplet, Thermometer, ChevronLeft, Wand2, Eye, Aperture,
  Focus, FlipHorizontal, FlipVertical, RotateCcw, Palette, CloudFog, Lock, Unlock, Eraser
} from "lucide-react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

export type CropAspect = "free" | "original" | "1:1" | "4:5" | "16:9" | "locked";

type Props = {
  imageSrc: string;
  title?: string;
  initialAspect?: CropAspect;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
};

const FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Clarendon", value: "contrast(1.2) saturate(1.35)" },
  { name: "Gingham", value: "brightness(1.05) hue-rotate(-10deg)" },
  { name: "Moon", value: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Lark", value: "contrast(0.9) saturate(1.1) brightness(1.1)" },
  { name: "Reyes", value: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { name: "Juno", value: "saturate(1.3) contrast(1.15) hue-rotate(-5deg)" },
  { name: "Slumber", value: "saturate(0.66) brightness(1.05) sepia(0.2)" },
  { name: "Crema", value: "sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)" },
  { name: "Ludwig", value: "sepia(0.25) contrast(1.05) saturate(1.5)" },
  { name: "Aden", value: "sepia(0.2) brightness(1.2) saturate(0.85)" },
  { name: "Perpetua", value: "contrast(1.1) brightness(1.25) saturate(1.1)" },
];

type EditTool = "brightness" | "contrast" | "saturation" | "warmth" | "tint" | "fade" | "vignette" | "bgBlur";

export const ImageCropModal = memo(function ImageCropModal({
  imageSrc,
  title = "Edit photo",
  initialAspect = "free",
  onCancel,
  onApply,
}: Props) {
  const [currentImageSrc, setCurrentImageSrc] = useState(imageSrc);
  const [aspect, setAspect] = useState<CropAspect>(initialAspect);
  const [lockedAspect, setLockedAspect] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [naturalAspect, setNaturalAspect] = useState(1);
  
  const [presetFilter, setPresetFilter] = useState(FILTERS[0].value);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    tint: 0,
    fade: 0,
    vignette: 0,
    bgBlur: 30,
  });

  const [activeTab, setActiveTab] = useState<"crop" | "edit" | "filter" | "retouch">("crop");
  const [activeTool, setActiveTool] = useState<EditTool | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Retouching (Healing Brush) State
  const [brushSize, setBrushSize] = useState(25);
  const retouchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);
  const isDrawing = useRef(false);
  const pathRef = useRef<{x: number, y: number}[]>([]);

  const cropperRef = useRef<ReactCropperElement>(null);

  useEffect(() => {
    setAspect(initialAspect);
    const img = new Image();
    img.src = currentImageSrc;
    img.onload = () => setNaturalAspect(img.width / img.height);
  }, [initialAspect, currentImageSrc]);

  // Sync Cropper layout and disable interactions when in Retouch mode
  useEffect(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    if (activeTab === "retouch") {
      cropper.disable();
      const updateRect = () => {
        const data = cropper.getCanvasData();
        if (data) setCanvasRect(data);
      };
      updateRect();
      // Ensure it updates if window resizes
      window.addEventListener('resize', updateRect);
      return () => window.removeEventListener('resize', updateRect);
    } else {
      cropper.enable();
      setCanvasRect(null);
      return undefined;
    }
  }, [activeTab]);

  const processRetouch = () => {
    if (pathRef.current.length === 0 || !canvasRect) return;
    
    setProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImageSrc;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const scaleX = img.width / canvasRect.width;
        const scaleY = img.height / canvasRect.height;
        
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        const mCtx = maskCanvas.getContext('2d');
        if (!mCtx) return;
        
        mCtx.lineCap = "round";
        mCtx.lineJoin = "round";
        mCtx.lineWidth = brushSize * scaleX;
        mCtx.strokeStyle = "white";
        mCtx.beginPath();
        mCtx.moveTo(pathRef.current[0].x * scaleX, pathRef.current[0].y * scaleY);
        for (let i = 1; i < pathRef.current.length; i++) {
            mCtx.lineTo(pathRef.current[i].x * scaleX, pathRef.current[i].y * scaleY);
        }
        mCtx.stroke();

        // Algorithmic Inpaint Simulation (Blur & Smudge clone)
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = img.width;
        blurCanvas.height = img.height;
        const bCtx = blurCanvas.getContext('2d');
        if (!bCtx) return;
        
        // Heavy blur to smudge surrounding colors into the erased area
        bCtx.filter = `blur(${brushSize * scaleX * 0.8}px)`;
        bCtx.drawImage(img, 0, 0);
        
        bCtx.filter = "none";
        bCtx.globalCompositeOperation = "destination-in";
        bCtx.drawImage(maskCanvas, 0, 0);

        // Draw the smudge patch back over the original image
        ctx.drawImage(blurCanvas, 0, 0);

        const newDataUrl = canvas.toDataURL("image/jpeg", 1.0);
        setCurrentImageSrc(newDataUrl);
        if (cropperRef.current?.cropper) {
           cropperRef.current.cropper.replace(newDataUrl);
        }
        
        const overlayCtx = retouchCanvasRef.current?.getContext('2d');
        if (overlayCtx) overlayCtx.clearRect(0, 0, canvasRect.width, canvasRect.height);
        pathRef.current = [];
        setProcessing(false);
    };
    img.onerror = () => {
      setProcessing(false);
      pathRef.current = [];
    };
  };

  const combinedFilter = [
    presetFilter !== "none" ? presetFilter : "",
    adjustments.brightness !== 100 ? `brightness(${adjustments.brightness}%)` : "",
    adjustments.contrast !== 100 ? `contrast(${adjustments.contrast}%)` : "",
    adjustments.saturation !== 100 ? `saturate(${adjustments.saturation}%)` : "",
    adjustments.warmth > 0 ? `sepia(${adjustments.warmth}%)` : "",
    adjustments.tint !== 0 ? `hue-rotate(${adjustments.tint}deg)` : "",
  ].filter(Boolean).join(" ") || "none";

  const applyCrop = useCallback(async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) throw new Error("Cropper not ready");

      const sourceCanvas = cropper.getCroppedCanvas({
        fillColor: "transparent",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!sourceCanvas) throw new Error("Could not get cropped canvas");

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = sourceCanvas.width;
      finalCanvas.height = sourceCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      
      if (ctx) {
        if (adjustments.bgBlur > 0) {
           ctx.filter = `blur(${adjustments.bgBlur}px) brightness(0.6) ${combinedFilter}`;
           const scale = Math.max(finalCanvas.width / sourceCanvas.width, finalCanvas.height / sourceCanvas.height);
           const bgW = sourceCanvas.width * scale;
           const bgH = sourceCanvas.height * scale;
           ctx.drawImage(sourceCanvas, (finalCanvas.width - bgW) / 2, (finalCanvas.height - bgH) / 2, bgW, bgH);
        }

        ctx.filter = combinedFilter;
        ctx.drawImage(sourceCanvas, 0, 0);

        if (adjustments.fade > 0) {
          ctx.filter = "none";
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = `rgba(50, 45, 45, ${adjustments.fade / 100})`;
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        if (adjustments.vignette > 0) {
          const v = adjustments.vignette / 100;
          const gradient = ctx.createRadialGradient(
            finalCanvas.width / 2, finalCanvas.height / 2, 0,
            finalCanvas.width / 2, finalCanvas.height / 2, Math.max(finalCanvas.width, finalCanvas.height) / 1.4
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, `rgba(0,0,0,${v * 1.5})`);
          ctx.filter = "none";
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        }
      }

      onApply(finalCanvas.toDataURL("image/jpeg", 0.95));
    } catch (e) {
      console.error("Crop Export Failed:", e);
      alert("Failed to crop image. Please try again.");
      setProcessing(false);
    }
  }, [combinedFilter, adjustments.bgBlur, adjustments.vignette, adjustments.fade, onApply, processing]);

  const hapticFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const getCropperAspect = () => {
    if (aspect === "locked" && lockedAspect) return lockedAspect;
    if (aspect === "1:1") return 1;
    if (aspect === "4:5") return 4 / 5;
    if (aspect === "16:9") return 16 / 9;
    if (aspect === "original") return naturalAspect;
    return NaN; 
  };

  const toggleAspectLock = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    if (aspect === "locked") {
      setAspect("free");
      hapticFeedback();
    } else {
      const data = cropper.getCropBoxData();
      if (data.width && data.height) {
        setLockedAspect(data.width / data.height);
        setAspect("locked");
        hapticFeedback();
      }
    }
  };

  const updateAdjustment = (key: keyof typeof adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
    hapticFeedback();
  };

  const autoEnhance = () => {
    setAdjustments((prev) => ({
      ...prev,
      brightness: 110,
      contrast: 115,
      saturation: 110,
      warmth: 0,
      vignette: 10,
      fade: 0,
      tint: 0,
    }));
    setPresetFilter("none");
    hapticFeedback();
  };

  const renderToolSlider = () => {
    if (!activeTool) return null;

    const config = {
      brightness: { min: 0, max: 200, val: adjustments.brightness, label: "Brightness", default: 100 },
      contrast: { min: 0, max: 200, val: adjustments.contrast, label: "Contrast", default: 100 },
      saturation: { min: 0, max: 200, val: adjustments.saturation, label: "Saturation", default: 100 },
      warmth: { min: 0, max: 100, val: adjustments.warmth, label: "Warmth", default: 0 },
      tint: { min: -100, max: 100, val: adjustments.tint, label: "Tint", default: 0 },
      fade: { min: 0, max: 100, val: adjustments.fade, label: "Fade", default: 0 },
      vignette: { min: 0, max: 100, val: adjustments.vignette, label: "Vignette", default: 0 },
      bgBlur: { min: 0, max: 100, val: adjustments.bgBlur, label: "Bg Blur", default: 30 },
    }[activeTool as keyof typeof adjustments];

    return (
      <div className="flex flex-col w-full px-6 gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveTool(null)} className="p-1 -ml-1 text-white/70 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">{config.label}</span>
          </button>
          <span className="text-xs text-[#FFD700] font-mono">{Math.round(config.val)}</span>
        </div>
        <div className="flex items-center gap-4 w-full relative">
          <input 
            type="range" min={config.min} max={config.max} value={config.val}
            onChange={(e) => updateAdjustment(activeTool as keyof typeof adjustments, Number(e.target.value))}
            onDoubleClick={() => updateAdjustment(activeTool as keyof typeof adjustments, config.default)}
            className="flex-1 accent-[#FFD700] touch-none h-2"
          />
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-[#0a0a0a] flex flex-col safe-area-top safe-area-bottom select-none touch-none animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <button type="button" onClick={onCancel} className="p-2 text-white/80 hover:text-white bg-white/5 rounded-full transition-transform active:scale-95" aria-label="Cancel">
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onMouseLeave={() => setIsComparing(false)}
            className="p-2 text-white/80 hover:text-white transition-opacity active:opacity-50"
            aria-label="Compare"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={autoEnhance} 
            className="p-2 text-white/80 hover:text-[#FFD700] transition-opacity active:opacity-50"
            title="AI Smart Lighting"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={applyCrop} 
            disabled={processing}
            className="p-2 px-4 ml-1 bg-[#FFD700] text-black font-bold text-sm rounded-full flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {processing ? "Saving..." : <><Check className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full overflow-hidden min-h-0 pt-8 pb-4 px-4">
        
        {/* Real-time Film Fade Preview layer */}
        <div className="absolute inset-0 z-[5] pointer-events-none mix-blend-screen" style={{
           backgroundColor: `rgba(50, 45, 45, ${adjustments.fade / 100})`,
           opacity: isComparing ? 0 : 1,
           transition: "opacity 0.2s"
        }} />

        {/* Real-time Vignette Preview layer */}
        <div className="absolute inset-0 z-[10] pointer-events-none" style={{
           background: `radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,${(adjustments.vignette / 100) * 1.5}) 100%)`,
           opacity: isComparing ? 0 : 1,
           transition: "opacity 0.2s"
        }} />

        {/* Retouching (Healing Brush) Overlay Canvas */}
        {activeTab === "retouch" && canvasRect && (
          <canvas
             ref={retouchCanvasRef}
             style={{
               position: 'absolute',
               left: canvasRect.left,
               top: canvasRect.top,
               width: canvasRect.width,
               height: canvasRect.height,
               zIndex: 200,
               touchAction: 'none',
               cursor: 'crosshair',
               pointerEvents: processing ? 'none' : 'auto'
             }}
             width={canvasRect.width}
             height={canvasRect.height}
             onPointerDown={(e) => {
                isDrawing.current = true;
                const rect = retouchCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (!ctx) return;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.lineWidth = brushSize;
                ctx.strokeStyle = "rgba(255, 215, 0, 0.6)"; // Aesthetic yellow smudge line
                ctx.beginPath();
                ctx.moveTo(x, y);
                pathRef.current = [{x, y}];
             }}
             onPointerMove={(e) => {
                if (!isDrawing.current) return;
                const rect = retouchCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (!ctx) return;
                ctx.lineTo(x, y);
                ctx.stroke();
                pathRef.current.push({x, y});
             }}
             onPointerUp={() => {
                isDrawing.current = false;
                processRetouch();
             }}
             onPointerCancel={() => {
                isDrawing.current = false;
                pathRef.current = [];
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);
             }}
             onPointerOut={(e) => {
                if (isDrawing.current) {
                  isDrawing.current = false;
                  processRetouch();
                }
             }}
          />
        )}

        {/* Top Right Crop Buttons */}
        {activeTab === "crop" && (
          <div className="absolute top-10 right-6 flex flex-col gap-3 z-[140] animate-in fade-in slide-in-from-right-4">
            <button 
              onClick={() => { cropperRef.current?.cropper.scaleX(cropperRef.current.cropper.getData().scaleX === -1 ? 1 : -1); hapticFeedback(); }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white border border-white/10 transition-transform active:scale-90 shadow-lg shadow-black/20"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { cropperRef.current?.cropper.scaleY(cropperRef.current.cropper.getData().scaleY === -1 ? 1 : -1); hapticFeedback(); }}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white border border-white/10 transition-transform active:scale-90 shadow-lg shadow-black/20"
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { cropperRef.current?.cropper.reset(); setAspect("free"); hapticFeedback(); setRotation(0); }}
              className="w-9 h-9 rounded-full bg-[#FFD700]/10 backdrop-blur-xl flex items-center justify-center text-[#FFD700] border border-[#FFD700]/30 transition-transform active:scale-90 mt-2 shadow-lg shadow-black/20"
              title="Reset Crop"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className={`w-full h-full relative ${activeTab === "retouch" ? "opacity-90" : ""}`} style={{ filter: isComparing ? "none" : combinedFilter, transition: "filter 0.2s" }}>
          <Cropper
            src={currentImageSrc}
            style={{ height: "100%", width: "100%" }}
            initialAspectRatio={NaN}
            aspectRatio={getCropperAspect()}
            guides={true}
            ref={cropperRef}
            background={false}
            viewMode={0}
            dragMode="crop"
            rotatable={true}
            responsive={true}
            checkOrientation={false}
            minCropBoxHeight={20}
            minCropBoxWidth={20}
            className="cropper-custom-styles"
          />
        </div>
        <style>{`
          .cropper-custom-styles .cropper-modal { background-color: rgba(0,0,0,0.85); }
          .cropper-custom-styles .cropper-view-box { outline: 1.5px solid #FFD700; outline-color: rgba(255, 215, 0, 0.6); border-radius: 0; }
          .cropper-custom-styles .cropper-line { background-color: transparent; }
          .cropper-custom-styles .cropper-dashed { border: 0 dashed rgba(255,255,255,0.4); }
          .cropper-custom-styles .cropper-dashed.dashed-h { border-top-width: 1px; border-bottom-width: 1px; top: 33.333%; height: 33.333%; }
          .cropper-custom-styles .cropper-dashed.dashed-v { border-left-width: 1px; border-right-width: 1px; left: 33.333%; width: 33.333%; }
          .cropper-custom-styles .cropper-center { display: none; }
          .cropper-custom-styles .cropper-point { background-color: transparent !important; opacity: 1 !important; }
          .cropper-custom-styles .cropper-point.point-nw, .cropper-custom-styles .cropper-point.point-ne,
          .cropper-custom-styles .cropper-point.point-sw, .cropper-custom-styles .cropper-point.point-se { width: 30px; height: 30px; }
          .cropper-custom-styles .cropper-point.point-n, .cropper-custom-styles .cropper-point.point-s,
          .cropper-custom-styles .cropper-point.point-e, .cropper-custom-styles .cropper-point.point-w { width: 30px; height: 30px; }
          .cropper-custom-styles .cropper-point::before { content: ''; position: absolute; background: transparent; border: 0 solid #FFD700; }
          .cropper-custom-styles .cropper-point.point-nw::before { width: 16px; height: 16px; border-top-width: 3px; border-left-width: 3px; top: 0; left: 0; }
          .cropper-custom-styles .cropper-point.point-ne::before { width: 16px; height: 16px; border-top-width: 3px; border-right-width: 3px; top: 0; right: 0; }
          .cropper-custom-styles .cropper-point.point-sw::before { width: 16px; height: 16px; border-bottom-width: 3px; border-left-width: 3px; bottom: 0; left: 0; }
          .cropper-custom-styles .cropper-point.point-se::before { width: 16px; height: 16px; border-bottom-width: 3px; border-right-width: 3px; bottom: 0; right: 0; }
          .cropper-custom-styles .cropper-point.point-n::before { width: 20px; height: 0; border-top-width: 3px; top: 0; left: 5px; }
          .cropper-custom-styles .cropper-point.point-s::before { width: 20px; height: 0; border-bottom-width: 3px; bottom: 0; left: 5px; }
          .cropper-custom-styles .cropper-point.point-e::before { height: 20px; width: 0; border-right-width: 3px; top: 5px; right: 0; }
          .cropper-custom-styles .cropper-point.point-w::before { height: 20px; width: 0; border-left-width: 3px; top: 5px; left: 0; }
        `}</style>
      </div>

      <div className="shrink-0 bg-[#0a0a0a] border-t border-white/5 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[150]">
        
        {activeTab === "crop" && (
           <div className="flex flex-col items-center w-full px-6 pt-4 pb-2 animate-in fade-in slide-in-from-bottom-2">
             <span className="text-[10px] text-[#FFD700] font-mono mb-1">{rotation}°</span>
             <div className="flex-1 relative flex items-center w-full max-w-sm">
                <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20">
                   {[...Array(15)].map((_, i) => (
                     <div key={i} className={`w-0.5 bg-white ${i === 7 ? 'h-3' : 'h-1.5'}`} />
                   ))}
                </div>
                <input 
                  type="range" min="-45" max="45" value={rotation}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRotation(val);
                    cropperRef.current?.cropper.rotateTo(val);
                    hapticFeedback();
                  }}
                  onDoubleClick={() => {
                     setRotation(0);
                     cropperRef.current?.cropper.rotateTo(0);
                     hapticFeedback();
                  }}
                  className="w-full accent-[#FFD700] touch-none h-8 opacity-0 z-10"
                />
                <div 
                   className="absolute w-1 h-4 bg-[#FFD700] pointer-events-none rounded-full"
                   style={{ left: `calc(${((rotation + 45) / 90) * 100}% - 2px)` }}
                />
             </div>
           </div>
        )}

        <div className="h-[90px] flex items-center justify-center border-b border-white/5 relative">
          
          {/* RETOUCH TAB */}
          {activeTab === "retouch" && (
            <div className="flex flex-col items-center justify-center w-full px-6 gap-2 animate-in fade-in slide-in-from-left-4 h-full">
               <div className="flex items-center justify-between w-full max-w-sm">
                  <span className="text-xs font-semibold text-white/70">Healing Brush Size</span>
                  <span className="text-xs text-[#FFD700] font-mono">{brushSize}px</span>
               </div>
               <div className="flex items-center gap-4 w-full max-w-sm relative">
                  <input 
                    type="range" min="5" max="100" value={brushSize}
                    onChange={(e) => { setBrushSize(Number(e.target.value)); hapticFeedback(); }}
                    className="flex-1 accent-[#FFD700] touch-none h-2"
                  />
               </div>
            </div>
          )}

          {activeTab === "crop" && (
            <div className="flex items-center gap-3 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in py-2 absolute inset-0">
              <button
                onClick={() => { setAspect("free"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "free" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                <div className="w-7 h-7 border-2 border-current rounded border-dashed" />
                <span className="text-[10px] font-semibold">Custom</span>
              </button>

              <button
                onClick={toggleAspectLock}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "locked" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                {aspect === "locked" ? <Lock className="w-5 h-5 mb-1" /> : <Unlock className="w-5 h-5 mb-1 opacity-50" />}
                <span className="text-[10px] font-semibold">{aspect === "locked" ? "Locked" : "Lock Ratio"}</span>
              </button>

              <button
                onClick={() => { setAspect("original"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "original" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                <div className="w-7 h-5 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">Original</span>
              </button>

              <button
                onClick={() => { setAspect("4:5"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "4:5" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                <div className="w-6 h-7 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">4:5</span>
              </button>

              <button
                onClick={() => { setAspect("1:1"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "1:1" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                <div className="w-6 h-6 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">1:1</span>
              </button>
              
              <button
                onClick={() => { setAspect("16:9"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-[72px] h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "16:9" ? "bg-white/10 text-[#FFD700] shadow-sm shadow-[#FFD700]/10" : "hover:bg-white/5 text-white/60 hover:text-white"}`}
              >
                <div className="w-8 h-5 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">16:9</span>
              </button>
            </div>
          )}

          {activeTab === "edit" && (
            <div className="absolute inset-0 flex items-center justify-center">
              {activeTool ? renderToolSlider() : (
                <div className="flex items-center gap-4 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in h-full">
                  {[
                    { id: "brightness", icon: Sun, label: "Brightness" },
                    { id: "contrast", icon: Sliders, label: "Contrast" },
                    { id: "saturation", icon: Droplet, label: "Saturation" },
                    { id: "warmth", icon: Thermometer, label: "Warmth" },
                    { id: "tint", icon: Palette, label: "Tint" },
                    { id: "fade", icon: CloudFog, label: "Fade" },
                    { id: "vignette", icon: Focus, label: "Vignette" },
                    { id: "bgBlur", icon: Aperture, label: "Bg Blur" },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => setActiveTool(tool.id as EditTool)}
                      className="flex flex-col items-center gap-1.5 shrink-0 text-white/60 hover:text-[#FFD700] transition-colors"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wide">{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "filter" && (
            <div className="flex items-center gap-3 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in py-2 absolute inset-0">
              {FILTERS.map((f) => (
                <div key={f.name} className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPresetFilter(f.value);
                      hapticFeedback();
                    }}
                    className={`w-[60px] h-[60px] rounded-2xl shrink-0 transition-all border-2 object-cover overflow-hidden ${
                      presetFilter === f.value ? "border-[#FFD700] scale-110 shadow-lg shadow-[#FFD700]/20" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ filter: f.value !== 'none' ? f.value : 'none' }}
                  >
                    <img src={currentImageSrc} className="w-full h-full object-cover" alt={f.name} />
                  </button>
                  <span className={`text-[10px] font-semibold mt-1 ${presetFilter === f.value ? "text-[#FFD700]" : "text-white/50"}`}>
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-around items-center pt-4 px-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => { setActiveTab("crop"); setActiveTool(null); hapticFeedback(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === "crop" ? "text-[#FFD700] -translate-y-1" : "text-white/40 hover:text-white/80"}`}
          >
            <Crop className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-wide">Crop</span>
            {activeTab === "crop" && <div className="w-1 h-1 rounded-full bg-[#FFD700] mt-1 animate-in zoom-in" />}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("filter"); hapticFeedback(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === "filter" ? "text-[#FFD700] -translate-y-1" : "text-white/40 hover:text-white/80"}`}
          >
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-wide">Filters</span>
            {activeTab === "filter" && <div className="w-1 h-1 rounded-full bg-[#FFD700] mt-1 animate-in zoom-in" />}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("edit"); hapticFeedback(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === "edit" ? "text-[#FFD700] -translate-y-1" : "text-white/40 hover:text-white/80"}`}
          >
            <Settings2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-wide">Adjust</span>
            {activeTab === "edit" && <div className="w-1 h-1 rounded-full bg-[#FFD700] mt-1 animate-in zoom-in" />}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("retouch"); hapticFeedback(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${activeTab === "retouch" ? "text-[#FFD700] -translate-y-1" : "text-white/40 hover:text-white/80"}`}
          >
            <Eraser className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-wide">Heal</span>
            {activeTab === "retouch" && <div className="w-1 h-1 rounded-full bg-[#FFD700] mt-1 animate-in zoom-in" />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});
