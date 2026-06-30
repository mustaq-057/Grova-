import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Check, X, ZoomIn, ZoomOut, RotateCw, Maximize, Settings2, 
  Image as ImageIcon, Crop, Sun, Sliders, Droplet, Thermometer, ChevronLeft, Wand2, Eye, Aperture 
} from "lucide-react";
import Cropper, { Area } from "react-easy-crop";

export type CropAspect = "free" | "1:1" | "4:5";

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

const getRadianAngle = (degreeValue: number) => {
  return (degreeValue * Math.PI) / 180;
};

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0,
  filter: string = "none",
  bgBlur: number = 30
): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const safeArea = Math.max(image.width, image.height) * 2;

  const offscreen = document.createElement("canvas");
  offscreen.width = safeArea;
  offscreen.height = safeArea;
  const offCtx = offscreen.getContext("2d")!;

  offCtx.translate(safeArea / 2, safeArea / 2);
  offCtx.rotate(getRadianAngle(rotation));
  offCtx.translate(-safeArea / 2, -safeArea / 2);

  offCtx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const dx = Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x);
  const dy = Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y);

  ctx.filter = `blur(${bgBlur}px) brightness(0.6) ${filter}`;
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const bgW = image.width * scale;
  const bgH = image.height * scale;
  ctx.drawImage(image, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);

  ctx.filter = filter;
  ctx.drawImage(offscreen, dx, dy);

  return canvas.toDataURL("image/jpeg", 0.92);
};

type EditTool = "rotate" | "brightness" | "contrast" | "saturation" | "warmth" | "bgBlur";

export const ImageCropModal = memo(function ImageCropModal({
  imageSrc,
  title = "Edit photo",
  initialAspect = "4:5",
  onCancel,
  onApply,
}: Props) {
  const [aspect, setAspect] = useState<CropAspect>(initialAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const [presetFilter, setPresetFilter] = useState(FILTERS[0].value);
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0,
    bgBlur: 30,
  });

  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageAspect, setImageAspect] = useState<number>(4 / 3);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeTab, setActiveTab] = useState<"crop" | "edit" | "filter">("crop");
  const [activeTool, setActiveTool] = useState<EditTool | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setAspect(initialAspect);
  }, [initialAspect]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    setImageAspect(mediaSize.width / mediaSize.height);
  }, []);

  const combinedFilter = [
    presetFilter !== "none" ? presetFilter : "",
    adjustments.brightness !== 100 ? `brightness(${adjustments.brightness}%)` : "",
    adjustments.contrast !== 100 ? `contrast(${adjustments.contrast}%)` : "",
    adjustments.saturation !== 100 ? `saturate(${adjustments.saturation}%)` : "",
    adjustments.warmth > 0 ? `sepia(${adjustments.warmth}%)` : "",
  ].filter(Boolean).join(" ") || "none";

  const applyCrop = useCallback(async () => {
    if (!croppedAreaPixels || processing) return;
    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, combinedFilter, adjustments.bgBlur);
      onApply(croppedImage);
    } catch (e) {
      console.error("Crop Export Failed:", e);
      alert("Failed to crop image. Please try again.");
      setProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, combinedFilter, adjustments.bgBlur, onApply, processing]);

  const hapticFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const currentAspectValue =
    aspect === "1:1" ? 1 : aspect === "4:5" ? 4 / 5 : imageAspect;

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
          <span className="text-xs text-white/50 w-8">{rotation}°</span>
          <input 
            type="range" min="-45" max="45" value={rotation}
            onChange={(e) => {
              setRotation(Number(e.target.value));
              hapticFeedback();
            }}
            className="flex-1 accent-primary touch-none h-2"
          />
          <button
            type="button"
            onClick={() => {
              setRotation((r) => (r + 90) % 360);
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
          <span className="text-xs text-white/50">{Math.round(config.val)}</span>
        </div>
        <div className="flex items-center gap-4 w-full">
          <input 
            type="range" min={config.min} max={config.max} value={config.val}
            onChange={(e) => updateAdjustment(activeTool as keyof typeof adjustments, Number(e.target.value))}
            onDoubleClick={() => updateAdjustment(activeTool as keyof typeof adjustments, activeTool === 'warmth' ? 0 : 100)}
            className="flex-1 accent-primary touch-none h-2"
          />
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black/95 flex flex-col safe-area-top safe-area-bottom select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <button type="button" onClick={onCancel} className="p-2 text-white/80 hover:text-white" aria-label="Cancel">
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-semibold text-white">{title}</p>
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
            className="p-2 text-white/80 hover:text-white transition-opacity active:opacity-50"
            aria-label="Auto Enhance"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={applyCrop} 
            disabled={processing}
            className="p-2 text-primary font-semibold text-sm flex items-center gap-1 disabled:opacity-50"
          >
            {processing ? "Saving..." : <><Check className="w-5 h-5" /> Done</>}
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full overflow-hidden bg-black min-h-0" style={{ filter: isComparing ? "none" : combinedFilter }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={currentAspectValue}
          objectFit={objectFit}
          onCropChange={(c) => { setCrop(c); hapticFeedback(); }}
          onRotationChange={(r) => { setRotation(r); hapticFeedback(); }}
          onCropComplete={onCropComplete}
          onZoomChange={(z) => { setZoom(z); hapticFeedback(); }}
          onMediaLoaded={onMediaLoaded}
          onInteractionStart={() => setIsInteracting(true)}
          onInteractionEnd={() => setIsInteracting(false)}
          showGrid={isInteracting}
          style={{
            containerStyle: { backgroundColor: "transparent" },
            cropAreaStyle: { 
              border: "1px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)" 
            },
          }}
        />
      </div>

      <div className="shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-6">
        <div className="h-[90px] flex items-center justify-center border-b border-white/5">
          {activeTab === "crop" && (
            <div className="flex items-center gap-2 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setObjectFit(objectFit === "cover" ? "contain" : "cover");
                  hapticFeedback();
                }}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white flex items-center gap-1.5 shrink-0 mr-2"
              >
                <Maximize className="w-3.5 h-3.5" />
                {objectFit === "cover" ? "Fit" : "Fill"}
              </button>
              {(["free", "1:1", "4:5"] as CropAspect[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAspect(a);
                    hapticFeedback();
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    aspect === a ? "bg-primary text-primary-foreground" : "bg-white/15 text-white"
                  }`}
                >
                  {a === "free" ? "Original" : a}
                </button>
              ))}
            </div>
          )}

          {activeTab === "edit" && (
            activeTool ? renderToolSlider() : (
              <div className="flex items-center gap-6 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in">
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
                    className="flex flex-col items-center gap-1.5 shrink-0 text-white/70 hover:text-white"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                      <tool.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium">{tool.label}</span>
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
                    className={`w-14 h-14 rounded-xl shrink-0 transition-all border-2 object-cover overflow-hidden ${
                      presetFilter === f.value ? "border-primary scale-105 shadow-lg shadow-primary/20" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    style={{ filter: f.value !== 'none' ? f.value : 'none' }}
                  >
                    <img src={imageSrc} className="w-full h-full object-cover" alt={f.name} />
                  </button>
                  <span className={`text-[10px] font-semibold ${presetFilter === f.value ? "text-primary" : "text-white/70"}`}>
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-around items-center pt-3 px-2">
          <button
            type="button"
            onClick={() => { setActiveTab("crop"); setActiveTool(null); }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "crop" ? "text-primary" : "text-white/50"}`}
          >
            <Crop className="w-5 h-5" />
            <span className="text-[10px] font-medium">Crop</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("filter")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "filter" ? "text-primary" : "text-white/50"}`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Filter</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${activeTab === "edit" ? "text-primary" : "text-white/50"}`}
          >
            <Settings2 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Edit</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});
