import { memo, useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Check, X, RotateCw, Settings2, 
  Image as ImageIcon, Crop, Sun, Sliders, Droplet, Thermometer, ChevronLeft, Wand2, Eye, Aperture
} from "lucide-react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

export type CropAspect = "free" | "original" | "1:1" | "4:5" | "16:9";

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

type EditTool = "rotate" | "brightness" | "contrast" | "saturation" | "warmth" | "bgBlur";

export const ImageCropModal = memo(function ImageCropModal({
  imageSrc,
  title = "Edit photo",
  initialAspect = "free",
  onCancel,
  onApply,
}: Props) {
  const [aspect, setAspect] = useState<CropAspect>(initialAspect);
  const [rotation, setRotation] = useState(0);
  const [naturalAspect, setNaturalAspect] = useState(1);
  
  const [presetFilter, setPresetFilter] = useState(FILTERS[0].value);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    bgBlur: 30,
  });

  const [activeTab, setActiveTab] = useState<"crop" | "edit" | "filter">("crop");
  const [activeTool, setActiveTool] = useState<EditTool | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [processing, setProcessing] = useState(false);

  const cropperRef = useRef<ReactCropperElement>(null);

  useEffect(() => {
    setAspect(initialAspect);
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => setNaturalAspect(img.width / img.height);
  }, [initialAspect, imageSrc]);

  const combinedFilter = [
    presetFilter !== "none" ? presetFilter : "",
    adjustments.brightness !== 100 ? `brightness(${adjustments.brightness}%)` : "",
    adjustments.contrast !== 100 ? `contrast(${adjustments.contrast}%)` : "",
    adjustments.saturation !== 100 ? `saturate(${adjustments.saturation}%)` : "",
    adjustments.warmth > 0 ? `sepia(${adjustments.warmth}%)` : "",
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
      }

      onApply(finalCanvas.toDataURL("image/jpeg", 0.92));
    } catch (e) {
      console.error("Crop Export Failed:", e);
      alert("Failed to crop image. Please try again.");
      setProcessing(false);
    }
  }, [combinedFilter, adjustments.bgBlur, onApply, processing]);

  const hapticFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const getCropperAspect = () => {
    if (aspect === "1:1") return 1;
    if (aspect === "4:5") return 4 / 5;
    if (aspect === "16:9") return 16 / 9;
    if (aspect === "original") return naturalAspect;
    return NaN; 
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
    }));
    setPresetFilter("none");
    hapticFeedback();
  };

  const renderToolSlider = () => {
    if (!activeTool) return null;

    if (activeTool === "rotate") {
      return (
        <div className="flex items-center gap-4 w-full px-6 animate-in fade-in slide-in-from-right-4 duration-200">
          <button onClick={() => setActiveTool(null)} className="p-2 -ml-2 text-white/70 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-[#FFD700] w-8 font-mono">{rotation}°</span>
          
          <div className="flex-1 relative flex items-center">
            {/* Custom dial background ticks */}
            <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20">
               {[...Array(11)].map((_, i) => (
                 <div key={i} className={`w-0.5 bg-white ${i === 5 ? 'h-3' : 'h-1.5'}`} />
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
              className="w-full accent-[#FFD700] touch-none h-8 opacity-0 z-10" // Hidden native slider taking touch
            />
            {/* Custom thumb */}
            <div 
               className="absolute w-1 h-4 bg-[#FFD700] pointer-events-none rounded-full"
               style={{ left: `calc(${((rotation + 45) / 90) * 100}% - 2px)` }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const r = (rotation + 90) % 360;
              setRotation(r);
              cropperRef.current?.cropper.rotateTo(r);
              hapticFeedback();
            }}
            className="p-2 bg-white/10 rounded-full text-white shrink-0"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      );
    }

    const config = {
      brightness: { min: 0, max: 200, val: adjustments.brightness, label: "Brightness" },
      contrast: { min: 0, max: 200, val: adjustments.contrast, label: "Contrast" },
      saturation: { min: 0, max: 200, val: adjustments.saturation, label: "Saturation" },
      warmth: { min: 0, max: 100, val: adjustments.warmth, label: "Warmth" },
      bgBlur: { min: 0, max: 100, val: adjustments.bgBlur, label: "Bg Blur" },
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
        <div className="flex items-center gap-4 w-full">
          <input 
            type="range" min={config.min} max={config.max} value={config.val}
            onChange={(e) => updateAdjustment(activeTool as keyof typeof adjustments, Number(e.target.value))}
            onDoubleClick={() => updateAdjustment(activeTool as keyof typeof adjustments, activeTool === 'warmth' ? 0 : activeTool === 'bgBlur' ? 30 : 100)}
            className="flex-1 accent-[#FFD700] touch-none h-2"
          />
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-[#0a0a0a] flex flex-col safe-area-top safe-area-bottom select-none touch-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <button type="button" onClick={onCancel} className="p-2 text-white/80 hover:text-white bg-white/5 rounded-full" aria-label="Cancel">
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
            aria-label="Auto Enhance"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={applyCrop} 
            disabled={processing}
            className="p-2 px-4 ml-1 bg-[#FFD700] text-black font-bold text-sm rounded-full flex items-center gap-1 disabled:opacity-50"
          >
            {processing ? "Saving..." : <><Check className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full overflow-hidden min-h-0 py-8 px-4" style={{ filter: isComparing ? "none" : combinedFilter }}>
        <Cropper
          src={imageSrc}
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
        <style>{`
          .cropper-custom-styles .cropper-modal {
            background-color: rgba(0,0,0,0.85); /* Dark overlay outside crop box */
          }
          .cropper-custom-styles .cropper-view-box {
            outline: 1.5px solid #FFD700;
            outline-color: rgba(255, 215, 0, 0.6);
            border-radius: 0;
          }
          .cropper-custom-styles .cropper-line {
            background-color: transparent;
          }
          /* Grid lines inside */
          .cropper-custom-styles .cropper-dashed {
            border: 0 dashed rgba(255,255,255,0.4);
          }
          .cropper-custom-styles .cropper-dashed.dashed-h {
            border-top-width: 1px;
            border-bottom-width: 1px;
            top: 33.333%;
            height: 33.333%;
          }
          .cropper-custom-styles .cropper-dashed.dashed-v {
            border-left-width: 1px;
            border-right-width: 1px;
            left: 33.333%;
            width: 33.333%;
          }
          .cropper-custom-styles .cropper-center { display: none; }
          
          /* Corner L-Brackets */
          .cropper-custom-styles .cropper-point {
            background-color: transparent !important;
            opacity: 1 !important;
          }
          
          /* The touch targets */
          .cropper-custom-styles .cropper-point.point-nw,
          .cropper-custom-styles .cropper-point.point-ne,
          .cropper-custom-styles .cropper-point.point-sw,
          .cropper-custom-styles .cropper-point.point-se {
            width: 30px; height: 30px;
          }
          .cropper-custom-styles .cropper-point.point-n,
          .cropper-custom-styles .cropper-point.point-s,
          .cropper-custom-styles .cropper-point.point-e,
          .cropper-custom-styles .cropper-point.point-w {
            width: 30px; height: 30px;
          }

          /* Visual Brackets */
          .cropper-custom-styles .cropper-point::before {
             content: '';
             position: absolute;
             background: transparent;
             border: 0 solid #FFD700;
          }
          .cropper-custom-styles .cropper-point.point-nw::before {
             width: 16px; height: 16px;
             border-top-width: 3px; border-left-width: 3px;
             top: 0; left: 0;
          }
          .cropper-custom-styles .cropper-point.point-ne::before {
             width: 16px; height: 16px;
             border-top-width: 3px; border-right-width: 3px;
             top: 0; right: 0;
          }
          .cropper-custom-styles .cropper-point.point-sw::before {
             width: 16px; height: 16px;
             border-bottom-width: 3px; border-left-width: 3px;
             bottom: 0; left: 0;
          }
          .cropper-custom-styles .cropper-point.point-se::before {
             width: 16px; height: 16px;
             border-bottom-width: 3px; border-right-width: 3px;
             bottom: 0; right: 0;
          }
          
          /* Visual Edge lines */
          .cropper-custom-styles .cropper-point.point-n::before {
             width: 20px; height: 0; border-top-width: 3px;
             top: 0; left: 5px;
          }
          .cropper-custom-styles .cropper-point.point-s::before {
             width: 20px; height: 0; border-bottom-width: 3px;
             bottom: 0; left: 5px;
          }
          .cropper-custom-styles .cropper-point.point-e::before {
             height: 20px; width: 0; border-right-width: 3px;
             top: 5px; right: 0;
          }
          .cropper-custom-styles .cropper-point.point-w::before {
             height: 20px; width: 0; border-left-width: 3px;
             top: 5px; left: 0;
          }
        `}</style>
      </div>

      <div className="shrink-0 bg-[#0a0a0a] border-t border-white/5 pb-6">
        <div className="h-[100px] flex items-center justify-center border-b border-white/5">
          {activeTab === "crop" && (
            <div className="flex items-center gap-3 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in py-2">
              <button
                onClick={() => { setAspect("free"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-16 h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "free" ? "bg-white/5 text-[#FFD700]" : "text-white/60"}`}
              >
                <div className="w-7 h-7 border-2 border-current rounded border-dashed" />
                <span className="text-[10px] font-semibold">Custom</span>
              </button>

              <button
                onClick={() => { setAspect("original"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-16 h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "original" ? "bg-white/5 text-[#FFD700]" : "text-white/60"}`}
              >
                <div className="w-7 h-5 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">Original</span>
              </button>

              <button
                onClick={() => { setAspect("4:5"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-16 h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "4:5" ? "bg-white/5 text-[#FFD700]" : "text-white/60"}`}
              >
                <div className="w-6 h-7 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">4:5</span>
              </button>

              <button
                onClick={() => { setAspect("1:1"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-16 h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "1:1" ? "bg-white/5 text-[#FFD700]" : "text-white/60"}`}
              >
                <div className="w-6 h-6 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">1:1</span>
              </button>
              
              <button
                onClick={() => { setAspect("16:9"); hapticFeedback(); }}
                className={`flex flex-col items-center justify-center gap-2 w-16 h-[72px] rounded-2xl shrink-0 transition-all ${aspect === "16:9" ? "bg-white/5 text-[#FFD700]" : "text-white/60"}`}
              >
                <div className="w-8 h-5 border-2 border-current rounded" />
                <span className="text-[10px] font-semibold">16:9</span>
              </button>
            </div>
          )}

          {activeTab === "edit" && (
            activeTool ? renderToolSlider() : (
              <div className="flex items-center gap-4 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in">
                {[
                  { id: "rotate", icon: RotateCw, label: "Rotate" },
                  { id: "brightness", icon: Sun, label: "Brightness" },
                  { id: "contrast", icon: Sliders, label: "Contrast" },
                  { id: "saturation", icon: Droplet, label: "Saturation" },
                  { id: "warmth", icon: Thermometer, label: "Warmth" },
                  { id: "bgBlur", icon: Aperture, label: "Bg Blur" },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveTool(tool.id as EditTool)}
                    className="flex flex-col items-center gap-1.5 shrink-0 text-white/60 hover:text-[#FFD700]"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center transition-colors">
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold">{tool.label}</span>
                  </button>
                ))}
              </div>
            )
          )}

          {activeTab === "filter" && (
            <div className="flex items-center gap-3 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in py-2">
              {FILTERS.map((f) => (
                <div key={f.name} className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPresetFilter(f.value);
                      hapticFeedback();
                    }}
                    className={`w-[60px] h-[60px] rounded-xl shrink-0 transition-all border-2 object-cover overflow-hidden ${
                      presetFilter === f.value ? "border-[#FFD700] scale-105 shadow-lg shadow-[#FFD700]/20" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    style={{ filter: f.value !== 'none' ? f.value : 'none' }}
                  >
                    <img src={imageSrc} className="w-full h-full object-cover" alt={f.name} />
                  </button>
                  <span className={`text-[10px] font-semibold ${presetFilter === f.value ? "text-[#FFD700]" : "text-white/60"}`}>
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-around items-center pt-4 px-2">
          <button
            type="button"
            onClick={() => { setActiveTab("crop"); setActiveTool(null); }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "crop" ? "text-[#FFD700]" : "text-white/50"}`}
          >
            <Crop className="w-5 h-5" />
            <span className="text-[10px] font-bold">Crop</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("filter")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "filter" ? "text-[#FFD700]" : "text-white/50"}`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Filters</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "edit" ? "text-[#FFD700]" : "text-white/50"}`}
          >
            <Settings2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Adjust</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});
