import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, X, Settings2, Image as ImageIcon, Crop, Sun, Sliders, Droplet, 
  Thermometer, ChevronLeft, Wand2, Eye, Aperture, Focus, FlipHorizontal, 
  FlipVertical, RotateCcw, Palette, CloudFog, Lock, Unlock, Eraser, 
  Sparkles, Type, Frame, Maximize, MousePointer2, Trash2, Plus, 
  Move, Zap, Layout
} from 'lucide-react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

export type CropAspect = 'free' | 'original' | '1:1' | '4:5' | '16:9' | 'locked';

type Props = {
  imageSrc: string;
  title?: string;
  initialAspect?: CropAspect;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
};

// --- PRESETS & FILTERS ---
const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Clarendon', value: 'contrast(1.2) saturate(1.35)' },
  { name: 'Gingham', value: 'brightness(1.05) hue-rotate(-10deg)' },
  { name: 'Moon', value: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { name: 'Lark', value: 'contrast(0.9) saturate(1.1) brightness(1.1)' },
  { name: 'Reyes', value: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { name: 'Juno', value: 'saturate(1.3) contrast(1.15) hue-rotate(-5deg)' },
  { name: 'Slumber', value: 'saturate(0.66) brightness(1.05) sepia(0.2)' },
  { name: 'Crema', value: 'sepia(0.5) contrast(1.25) brightness(1.15) saturate(0.9)' },
  { name: 'Ludwig', value: 'sepia(0.25) contrast(1.05) saturate(1.5)' },
  { name: 'Aden', value: 'sepia(0.2) brightness(1.2) saturate(0.85)' },
  { name: 'Perpetua', value: 'contrast(1.1) brightness(1.25) saturate(1.1)' },
  { name: 'Noir', value: 'grayscale(1) contrast(1.3) brightness(0.9)' },
  { name: 'Aesthetic', value: 'sepia(0.3) saturate(1.2) contrast(0.9) hue-rotate(-10deg)' },
];

const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Playfair', value: '"Playfair Display", serif' },
  { name: 'Caveat', value: 'Caveat, cursive' },
  { name: 'Cinzel', value: 'Cinzel, serif' },
  { name: 'Space Mono', value: '"Space Mono", monospace' },
];

const COLORS = ['#FFFFFF', '#000000', '#FFD700', '#FF3B30', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];

type EditTool = 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'tint';
type EffectTool = 'fade' | 'vignette' | 'bgBlur' | 'grain' | 'dust' | 'lightLeak';
type Tab = 'crop' | 'filters' | 'adjust' | 'effects' | 'heal' | 'text' | 'frames';
type FrameType = 'none' | 'polaroid' | 'film' | 'minimal' | 'kodak';

type TextOverlay = {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
};

// --- HELPER TO GENERATE SVG NOISE FOR GRAIN ---
const getGrainSvg = (amount: number) => {
  if (amount <= 0) return '';
  const opacity = amount / 100;
  return `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${opacity}'/%3E%3C/svg%3E")`;
};

// --- HELPER FOR DUST/SCRATCHES ---
const getDustSvg = (amount: number) => {
  if (amount <= 0) return '';
  const opacity = amount / 100;
  // A simple static SVG simulating scratches
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cg stroke='%23fff' stroke-width='1' opacity='${opacity}'%3E%3Cpath d='M50,50 L70,120 M150,10 L140,80 M300,200 L320,250 M50,300 L90,310 M380,50 L350,100 M200,350 L210,390'/%3E%3Ccircle cx='100' cy='200' r='1' fill='%23fff'/%3E%3Ccircle cx='250' cy='80' r='1.5' fill='%23fff'/%3E%3Ccircle cx='320' cy='300' r='0.5' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E")`;
};

export const ImageCropModal = memo(function ImageCropModal({
  imageSrc,
  title = 'Aesthetic Studio',
  initialAspect = 'free',
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
    brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0,
  });
  const [effects, setEffects] = useState({
    fade: 0, vignette: 0, bgBlur: 30, grain: 0, dust: 0, lightLeak: 0,
  });

  const [activeTab, setActiveTab] = useState<Tab>('crop');
  const [activeTool, setActiveTool] = useState<EditTool | EffectTool | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Frame State
  const [frame, setFrame] = useState<FrameType>('none');

  // Text Overlay State
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [draggingText, setDraggingText] = useState<string | null>(null);

  // Retouching (Healing Brush) State
  const [brushSize, setBrushSize] = useState(20);
  const [healMode, setHealMode] = useState<'local' | 'ai'>('local');
  const [aiPrompt, setAiPrompt] = useState('');
  const retouchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasRect, setCanvasRect] = useState<{ left: number, top: number, width: number, height: number } | null>(null);
  const isDrawing = useRef(false);
  const pathRef = useRef<{x: number, y: number}[]>([]);

  const cropperRef = useRef<ReactCropperElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAspect(initialAspect);
    const img = new Image();
    img.src = currentImageSrc;
    img.onload = () => setNaturalAspect(img.width / img.height);
  }, [initialAspect, currentImageSrc]);

  // Sync Cropper layout and disable interactions when not in Crop mode
  useEffect(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    if (activeTab === 'heal' || activeTab === 'text') {
      cropper.disable();
      const updateRect = () => {
        const data = cropper.getCanvasData();
        if (data) setCanvasRect(data);
      };
      updateRect();
      window.addEventListener('resize', updateRect);
      return () => window.removeEventListener('resize', updateRect);
    } else {
      cropper.enable();
      setCanvasRect(null);
      setActiveTextId(null);
      return undefined;
    }
  }, [activeTab]);

  // AI Retouch Processing
  const processAiRetouch = async () => {
    if (pathRef.current.length === 0 || !canvasRect || !currentImageSrc) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = currentImageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const W = img.width;
      const H = img.height;
      const scaleX = W / canvasRect.width;
      const scaleY = H / canvasRect.height;
      const brushR = Math.round((brushSize * (scaleX + scaleY)) / 2);

      // Resize original image to max 1024x1024 for the AI API
      const MAX_DIM = 1024;
      let targetW = W;
      let targetH = H;
      if (W > MAX_DIM || H > MAX_DIM) {
        if (W > H) {
          targetH = Math.round((H * MAX_DIM) / W);
          targetW = MAX_DIM;
        } else {
          targetW = Math.round((W * MAX_DIM) / H);
          targetH = MAX_DIM;
        }
      }

      const resizedImageCanvas = document.createElement('canvas');
      resizedImageCanvas.width = targetW; resizedImageCanvas.height = targetH;
      const resizedCtx = resizedImageCanvas.getContext('2d')!;
      resizedCtx.drawImage(img, 0, 0, targetW, targetH);
      const optimizedImageSrc = resizedImageCanvas.toDataURL("image/jpeg", 0.9);

      // Create mask at the resized resolution
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = targetW; maskCanvas.height = targetH;
      const mCtx = maskCanvas.getContext('2d')!;
      mCtx.fillStyle = 'black';
      mCtx.fillRect(0, 0, targetW, targetH);
      
      const scaleX_resized = targetW / canvasRect.width;
      const scaleY_resized = targetH / canvasRect.height;
      const brushR_resized = Math.round((brushSize * (scaleX_resized + scaleY_resized)) / 2);

      mCtx.lineCap = "round"; mCtx.lineJoin = "round";
      mCtx.lineWidth = brushR_resized * 2; mCtx.strokeStyle = "white"; mCtx.fillStyle = "white";
      mCtx.beginPath();
      mCtx.moveTo(pathRef.current[0].x * scaleX_resized, pathRef.current[0].y * scaleY_resized);
      for (let i = 1; i < pathRef.current.length; i++) {
          mCtx.lineTo(pathRef.current[i].x * scaleX_resized, pathRef.current[i].y * scaleY_resized);
      }
      mCtx.closePath();
      mCtx.stroke();
      mCtx.fill();

      const maskDataUrl = maskCanvas.toDataURL("image/jpeg", 0.9);

      const response = await fetch('/api/ai/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: optimizedImageSrc,
          mask: maskDataUrl,
          prompt: aiPrompt || "clean background, seamless, high quality"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process AI request');
      }

      setCurrentImageSrc(data.resultUrl);
      if (cropperRef.current?.cropper) {
         cropperRef.current.cropper.replace(data.resultUrl);
      }
      
      const overlayCtx = retouchCanvasRef.current?.getContext('2d');
      if (overlayCtx) overlayCtx.clearRect(0, 0, canvasRect.width, canvasRect.height);
      pathRef.current = [];

    } catch (e: any) {
      alert(e.message || 'AI Processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Advanced Multi-pass Content-Aware Healing
  const processRetouch = () => {
    if (pathRef.current.length === 0 || !canvasRect) return;
    
    setProcessing(true);
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = currentImageSrc;
      img.onload = () => {
          const W = img.width;
          const H = img.height;

          const scaleX = W / canvasRect.width;
          const scaleY = H / canvasRect.height;
          const brushR = Math.round((brushSize * (scaleX + scaleY)) / 2);

          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = W; maskCanvas.height = H;
          const mCtx = maskCanvas.getContext('2d')!;
          mCtx.lineCap = "round"; mCtx.lineJoin = "round";
          mCtx.lineWidth = brushR * 2; mCtx.strokeStyle = "white"; mCtx.fillStyle = "white";
          mCtx.beginPath();
          mCtx.moveTo(pathRef.current[0].x * scaleX, pathRef.current[0].y * scaleY);
          for (let i = 1; i < pathRef.current.length; i++) {
              mCtx.lineTo(pathRef.current[i].x * scaleX, pathRef.current[i].y * scaleY);
          }
          mCtx.closePath();
          mCtx.stroke();
          mCtx.fill(); // Smart Lasso for local mode too
          const maskData = mCtx.getImageData(0, 0, W, H).data;

          const srcCanvas = document.createElement('canvas');
          srcCanvas.width = W; srcCanvas.height = H;
          const sCtx = srcCanvas.getContext('2d')!;
          sCtx.drawImage(img, 0, 0);
          const srcData = sCtx.getImageData(0, 0, W, H);
          const pixels = srcData.data;

          const sourceRingWidth = Math.max(4, Math.round(brushR * 0.4));
          const featherRadius = Math.max(2, Math.round(brushR * 0.15));

          const maskedPixels: number[] = [];
          for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
              if (maskData[(y * W + x) * 4 + 3] > 128) maskedPixels.push(y * W + x);
            }
          }

          for (let pass = 0; pass < 2; pass++) {
            for (const idx of maskedPixels) {
              const px = idx % W; const py = Math.floor(idx / W);
              let rAcc = 0, gAcc = 0, bAcc = 0, wTotal = 0;
              const innerR = brushR + pass * 2;
              const outerR = innerR + sourceRingWidth;

              for (let dy = -outerR; dy <= outerR; dy++) {
                for (let dx = -outerR; dx <= outerR; dx++) {
                  const nx = px + dx; const ny = py + dy;
                  if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                  const dist2 = dx * dx + dy * dy;
                  if (dist2 > outerR * outerR) continue;

                  const ni = ny * W + nx;
                  if (maskData[ni * 4 + 3] > 64) continue;

                  const dist = Math.sqrt(dist2);
                  const weight = 1.0 / (dist + 1.0);

                  rAcc += pixels[ni * 4] * weight;
                  gAcc += pixels[ni * 4 + 1] * weight;
                  bAcc += pixels[ni * 4 + 2] * weight;
                  wTotal += weight;
                }
              }

              if (wTotal > 0) {
                pixels[idx * 4] = Math.round(rAcc / wTotal);
                pixels[idx * 4 + 1] = Math.round(gAcc / wTotal);
                pixels[idx * 4 + 2] = Math.round(bAcc / wTotal);
              }
            }
          }

          const healCanvas = document.createElement('canvas');
          healCanvas.width = W; healCanvas.height = H;
          const hCtx = healCanvas.getContext('2d')!;
          hCtx.putImageData(srcData, 0, 0);

          const blendCanvas = document.createElement('canvas');
          blendCanvas.width = W; blendCanvas.height = H;
          const blCtx = blendCanvas.getContext('2d')!;
          blCtx.filter = `blur(${featherRadius}px)`;
          blCtx.drawImage(img, 0, 0);
          blCtx.filter = 'none';
          blCtx.globalCompositeOperation = 'destination-in';
          blCtx.drawImage(maskCanvas, 0, 0);

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = W; finalCanvas.height = H;
          const fCtx = finalCanvas.getContext('2d')!;
          fCtx.drawImage(img, 0, 0);
          fCtx.drawImage(healCanvas, 0, 0);
          fCtx.drawImage(blendCanvas, 0, 0);

          const newDataUrl = finalCanvas.toDataURL("image/jpeg", 1.0); // Highest quality
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
    }, 10);
  };

  const combinedFilter = [
    presetFilter !== 'none' ? presetFilter : '',
    adjustments.brightness !== 100 ? `brightness(${adjustments.brightness}%)` : '',
    adjustments.contrast !== 100 ? `contrast(${adjustments.contrast}%)` : '',
    adjustments.saturation !== 100 ? `saturate(${adjustments.saturation}%)` : '',
    adjustments.warmth > 0 ? `sepia(${adjustments.warmth}%)` : '',
    adjustments.tint !== 0 ? `hue-rotate(${adjustments.tint}deg)` : '',
  ].filter(Boolean).join(' ') || 'none';

  // --- MEGA EXPORT PIPELINE ---
  const applyCrop = useCallback(async () => {
    if (processing) return;
    setProcessing(true);
    // Use timeout to allow UI to render 'Saving...'
    setTimeout(async () => {
      try {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) throw new Error("Cropper not ready");

        const sourceCanvas = cropper.getCroppedCanvas({
          fillColor: "transparent",
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
        });

        if (!sourceCanvas) throw new Error("Could not get cropped canvas");

        // Prepare frame dimensions
        let finalW = sourceCanvas.width;
        let finalH = sourceCanvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (frame === 'polaroid') {
           finalW = sourceCanvas.width * 1.1;
           finalH = sourceCanvas.height * 1.3;
           offsetX = sourceCanvas.width * 0.05;
           offsetY = sourceCanvas.height * 0.05;
        } else if (frame === 'film') {
           finalW = sourceCanvas.width * 1.15;
           finalH = sourceCanvas.height * 1.15;
           offsetX = sourceCanvas.width * 0.075;
           offsetY = sourceCanvas.height * 0.075;
        } else if (frame === 'minimal') {
           finalW = sourceCanvas.width * 1.05;
           finalH = sourceCanvas.height * 1.05;
           offsetX = sourceCanvas.width * 0.025;
           offsetY = sourceCanvas.height * 0.025;
        } else if (frame === 'kodak') {
           finalW = sourceCanvas.width * 1.1;
           finalH = sourceCanvas.height * 1.2;
           offsetX = sourceCanvas.width * 0.05;
           offsetY = sourceCanvas.height * 0.05;
        }

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = finalW;
        finalCanvas.height = finalH;
        const ctx = finalCanvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        // 1. Draw Frame Background
        if (frame !== 'none') {
          ctx.fillStyle = frame === 'film' ? '#111' : frame === 'kodak' ? '#FFD700' : '#FFF';
          ctx.fillRect(0, 0, finalW, finalH);
          if (frame === 'kodak') {
             ctx.fillStyle = '#000';
             ctx.font = `bold ${finalW * 0.03}px monospace`;
             ctx.fillText("KODAK PORTRA 400", finalW * 0.05, finalH * 0.95);
          }
        }

        // 2. Draw Background Blur (if applicable and no frame)
        if (effects.bgBlur > 0 && frame === 'none') {
             ctx.filter = `blur(${effects.bgBlur}px) brightness(0.6) ${combinedFilter}`;
             const scale = Math.max(finalW / sourceCanvas.width, finalH / sourceCanvas.height);
             const bgW = sourceCanvas.width * scale;
             const bgH = sourceCanvas.height * scale;
             ctx.drawImage(sourceCanvas, (finalW - bgW) / 2, (finalH - bgH) / 2, bgW, bgH);
        }

        // 3. Draw Main Image with Filters
        ctx.filter = combinedFilter;
        ctx.drawImage(sourceCanvas, offsetX, offsetY);
        ctx.filter = 'none';

        // 4. Apply Vintage Fade
        if (effects.fade > 0) {
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = `rgba(50, 45, 45, ${effects.fade / 100})`;
          ctx.fillRect(offsetX, offsetY, sourceCanvas.width, sourceCanvas.height);
          ctx.globalCompositeOperation = "source-over";
        }

        // 5. Apply Vignette
        if (effects.vignette > 0) {
          const v = effects.vignette / 100;
          const gradient = ctx.createRadialGradient(
            offsetX + sourceCanvas.width / 2, offsetY + sourceCanvas.height / 2, 0,
            offsetX + sourceCanvas.width / 2, offsetY + sourceCanvas.height / 2, Math.max(sourceCanvas.width, sourceCanvas.height) / 1.2
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, `rgba(0,0,0,${v * 1.5})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(offsetX, offsetY, sourceCanvas.width, sourceCanvas.height);
        }

        // 6. Apply Grain
        if (effects.grain > 0) {
           const noiseCanvas = document.createElement('canvas');
           noiseCanvas.width = 300; noiseCanvas.height = 300;
           const nCtx = noiseCanvas.getContext('2d')!;
           for (let i = 0; i < 300*300; i++) {
             const val = Math.random() * 255;
             nCtx.fillStyle = `rgba(${val},${val},${val},${(effects.grain/100) * 0.15})`;
             nCtx.fillRect(i % 300, Math.floor(i / 300), 1, 1);
           }
           ctx.globalCompositeOperation = 'overlay';
           const pat = ctx.createPattern(noiseCanvas, 'repeat');
           if (pat) {
             ctx.fillStyle = pat;
             ctx.fillRect(offsetX, offsetY, sourceCanvas.width, sourceCanvas.height);
           }
           ctx.globalCompositeOperation = 'source-over';
        }

        // 7. Light Leaks
        if (effects.lightLeak > 0) {
          ctx.globalCompositeOperation = 'screen';
          const llGrad = ctx.createLinearGradient(offsetX, offsetY, offsetX + sourceCanvas.width, offsetY + sourceCanvas.height);
          if (effects.lightLeak === 1) {
            llGrad.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
            llGrad.addColorStop(0.3, 'rgba(0,0,0,0)');
          } else if (effects.lightLeak === 2) {
            llGrad.addColorStop(0.8, 'rgba(0,0,0,0)');
            llGrad.addColorStop(1, 'rgba(255, 50, 50, 0.5)');
          } else {
            llGrad.addColorStop(0, 'rgba(255, 0, 100, 0.3)');
            llGrad.addColorStop(1, 'rgba(255, 200, 0, 0.3)');
          }
          ctx.fillStyle = llGrad;
          ctx.fillRect(offsetX, offsetY, sourceCanvas.width, sourceCanvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }

        // 8. Draw Text Overlays
        if (texts.length > 0) {
          texts.forEach(t => {
            ctx.font = `${t.fontSize * (sourceCanvas.width / 300)}px ${t.fontFamily}`;
            ctx.fillStyle = t.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Calculate absolute position based on percentages
            const x = offsetX + (t.x / 100) * sourceCanvas.width;
            const y = offsetY + (t.y / 100) * sourceCanvas.height;
            // Add subtle shadow for visibility
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(t.text, x, y);
            ctx.shadowBlur = 0; // reset
          });
        }

        onApply(finalCanvas.toDataURL("image/jpeg", 1.0));
      } catch (e) {
        console.error("Crop Export Failed:", e);
        alert("Failed to process high-fidelity export. Please try again.");
        setProcessing(false);
      }
    }, 50);
  }, [combinedFilter, effects, frame, texts, onApply, processing]);

  const hapticFeedback = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const updateState = (setter: React.Dispatch<React.SetStateAction<any>>, key: string, value: number) => {
    setter((prev: any) => ({ ...prev, [key]: value }));
    hapticFeedback();
  };

  const autoEnhance = () => {
    setAdjustments({ brightness: 110, contrast: 115, saturation: 110, warmth: 5, tint: 0 });
    setEffects(prev => ({ ...prev, vignette: 15, fade: 5, grain: 20 }));
    setPresetFilter('none');
    hapticFeedback();
  };

  const addText = () => {
    const newText: TextOverlay = {
      id: Math.random().toString(36).substring(7),
      text: 'AESTHETIC',
      x: 50, y: 50,
      fontSize: 24,
      fontFamily: FONTS[0].value,
      color: '#FFFFFF'
    };
    setTexts([...texts, newText]);
    setActiveTextId(newText.id);
    hapticFeedback();
  };

  const updateActiveText = (key: keyof TextOverlay, value: any) => {
    setTexts(texts.map(t => t.id === activeTextId ? { ...t, [key]: value } : t));
  };

  const handleTextDrag = (e: React.PointerEvent, id: string) => {
    if (activeTab !== 'text') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingText(id);
    setActiveTextId(id);
    
    const onMove = (moveEvent: PointerEvent) => {
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      setTexts(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    };
    
    const onUp = () => {
      setDraggingText(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const renderSlider = (
    val: number, min: number, max: number, label: string, def: number, 
    onChange: (v: number) => void
  ) => (
    <div className="flex flex-col w-full px-6 gap-2 animate-in fade-in slide-in-from-right-4 duration-200 shrink-0">
      <div className="flex items-center justify-between">
        <button onClick={() => setActiveTool(null)} className="p-1 -ml-1 text-white/70 hover:text-white flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-semibold">{label}</span>
        </button>
        <span className="text-xs text-[#FFD700] font-mono bg-[#FFD700]/10 px-2 py-0.5 rounded">{Math.round(val)}</span>
      </div>
      <div className="flex items-center gap-4 w-full relative py-2">
        <input 
          type="range" min={min} max={max} value={val}
          onChange={(e) => onChange(Number(e.target.value))}
          onDoubleClick={() => onChange(def)}
          className="flex-1 accent-[#FFD700] touch-none h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FFD700] [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-[#000000] flex flex-col safe-area-top safe-area-bottom select-none touch-none animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-black/50 backdrop-blur-md z-50">
        <button type="button" onClick={onCancel} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90">
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-white tracking-widest uppercase">{title}</p>
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
            className="p-2 text-white/80 hover:text-white transition-opacity active:opacity-50"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button type="button" onClick={autoEnhance} className="p-2 text-white/80 hover:text-[#FFD700] transition-colors active:scale-90">
            <Wand2 className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            onClick={applyCrop} 
            disabled={processing}
            className="p-2 px-4 ml-2 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-extrabold text-sm rounded-full flex items-center gap-1 shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:opacity-50 active:scale-95 transition-all"
          >
            {processing ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div className="flex-1 relative w-full overflow-hidden min-h-0 bg-[#0a0a0a]" ref={containerRef}>
        
        {/* Frame Previews */}
        {frame === 'polaroid' && <div className="absolute inset-4 bg-white z-[1] shadow-2xl pointer-events-none" style={{ bottom: '15%' }} />}
        {frame === 'film' && <div className="absolute inset-0 bg-[#111] z-[1] pointer-events-none border-x-[16px] border-[#000] border-dashed" />}
        {frame === 'minimal' && <div className="absolute inset-2 bg-white z-[1] pointer-events-none" />}
        {frame === 'kodak' && (
           <div className="absolute inset-4 bg-[#FFD700] z-[1] shadow-2xl pointer-events-none flex flex-col justify-end pb-2 pl-4">
             <span className="text-black font-mono font-bold text-lg tracking-widest">KODAK PORTRA 400</span>
           </div>
        )}

        {/* Live Effects Overlays */}
        <div className="absolute inset-0 z-[5] pointer-events-none mix-blend-screen transition-opacity duration-300" style={{
           backgroundColor: `rgba(50, 45, 45, ${effects.fade / 100})`, opacity: isComparing ? 0 : 1
        }} />
        <div className="absolute inset-0 z-[6] pointer-events-none transition-opacity duration-300" style={{
           background: `radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(0,0,0,${(effects.vignette / 100) * 1.5}) 100%)`, opacity: isComparing ? 0 : 1
        }} />
        <div className="absolute inset-0 z-[7] pointer-events-none mix-blend-overlay transition-opacity duration-300" style={{
           backgroundImage: getGrainSvg(effects.grain), opacity: isComparing ? 0 : 1
        }} />
        <div className="absolute inset-0 z-[8] pointer-events-none mix-blend-screen transition-opacity duration-300" style={{
           backgroundImage: getDustSvg(effects.dust), opacity: isComparing ? 0 : 1
        }} />
        
        {effects.lightLeak > 0 && (
          <div className="absolute inset-0 z-[9] pointer-events-none mix-blend-screen transition-opacity duration-300 opacity-60" style={{
            background: effects.lightLeak === 1 ? 'linear-gradient(45deg, #ff6400 0%, transparent 40%)' :
                        effects.lightLeak === 2 ? 'linear-gradient(225deg, transparent 60%, #ff3232 100%)' :
                        'linear-gradient(180deg, #ff0064 0%, transparent 50%, #ffc800 100%)',
            opacity: isComparing ? 0 : 0.6
          }} />
        )}

        {/* Healing Overlay */}
        {activeTab === 'heal' && canvasRect && (
          <canvas
             ref={retouchCanvasRef}
             style={{
               position: 'absolute', left: canvasRect.left, top: canvasRect.top,
               width: canvasRect.width, height: canvasRect.height, zIndex: 200,
               touchAction: 'none', cursor: 'crosshair', pointerEvents: processing ? 'none' : 'auto'
             }}
             width={canvasRect.width} height={canvasRect.height}
             onPointerDown={(e) => {
                isDrawing.current = true;
                const rect = retouchCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (!ctx) return;
                ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = brushSize;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; 
                ctx.shadowColor = "#FFFFFF"; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                pathRef.current = [{x: e.clientX - rect.left, y: e.clientY - rect.top}];
             }}
             onPointerMove={(e) => {
                if (!isDrawing.current) return;
                const rect = retouchCanvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (!ctx) return;
                ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
                pathRef.current.push({x: e.clientX - rect.left, y: e.clientY - rect.top});
             }}
             onPointerUp={() => { 
                isDrawing.current = false; 
                
                // Smart Lasso: visually fill the shape on screen
                const ctx = retouchCanvasRef.current?.getContext('2d');
                if (ctx && pathRef.current.length > 2) {
                   ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                   ctx.closePath();
                   ctx.fill();
                }

                if (healMode === 'local') processRetouch(); 
             }}
             onPointerOut={() => { 
                if (isDrawing.current) { 
                  isDrawing.current = false; 
                  if (healMode === 'local') processRetouch(); 
                } 
             }}
          />
        )}

        {/* Text Overlays */}
        {activeTab === 'text' && texts.map(t => (
          <div
            key={t.id}
            onPointerDown={(e) => handleTextDrag(e, t.id)}
            className={`absolute z-[250] transform -translate-x-1/2 -translate-y-1/2 cursor-move p-2 rounded ${activeTextId === t.id ? 'ring-2 ring-[#FFD700] ring-offset-2 ring-offset-black/50 bg-black/20' : ''}`}
            style={{ 
               left: `${t.x}%`, top: `${t.y}%`, 
               color: t.color, fontFamily: t.fontFamily, fontSize: `${t.fontSize}px`,
               textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {t.text}
          </div>
        ))}

        {/* CROP OVERLAYS */}
        {activeTab === 'crop' && (
          <div className="absolute top-6 right-4 flex flex-col gap-3 z-[140] animate-in fade-in slide-in-from-right-4">
            <button onClick={() => { cropperRef.current?.cropper.scaleX(cropperRef.current.cropper.getData().scaleX === -1 ? 1 : -1); hapticFeedback(); }} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white hover:text-[#FFD700] transition-colors shadow-xl border border-white/10"><FlipHorizontal className="w-4 h-4" /></button>
            <button onClick={() => { cropperRef.current?.cropper.scaleY(cropperRef.current.cropper.getData().scaleY === -1 ? 1 : -1); hapticFeedback(); }} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white hover:text-[#FFD700] transition-colors shadow-xl border border-white/10"><FlipVertical className="w-4 h-4" /></button>
            <button onClick={() => { cropperRef.current?.cropper.reset(); setAspect('free'); setRotation(0); hapticFeedback(); }} className="w-10 h-10 rounded-full bg-red-500/20 backdrop-blur-xl flex items-center justify-center text-red-400 hover:text-red-300 transition-colors mt-2 border border-red-500/30"><RotateCcw className="w-4 h-4" /></button>
          </div>
        )}

        {/* MAIN CROPPER */}
        <div 
          className={`w-full h-full relative z-10 ${(frame !== 'none' && activeTab === 'crop') ? 'p-8' : ''} ${activeTab === 'heal' ? 'opacity-80' : ''}`} 
          style={{ filter: isComparing ? 'none' : combinedFilter, transition: 'filter 0.3s ease' }}
        >
          <Cropper
            src={currentImageSrc}
            style={{ height: '100%', width: '100%' }}
            initialAspectRatio={NaN} aspectRatio={aspect === 'locked' && lockedAspect ? lockedAspect : aspect === '1:1' ? 1 : aspect === '4:5' ? 4/5 : aspect === '16:9' ? 16/9 : aspect === 'original' ? naturalAspect : NaN}
            guides={true} ref={cropperRef} background={false} viewMode={1} dragMode={activeTab === 'text' ? 'none' : 'crop'} rotatable={true} responsive={true}
            movable={false} zoomable={false}
            checkOrientation={false} minCropBoxHeight={20} minCropBoxWidth={20} className="cropper-custom-styles"
          />
        </div>

        {/* AESTHETIC CROPPER STYLES */}
        <style>{`
          .cropper-custom-styles .cropper-modal { background-color: rgba(0,0,0,0.85); transition: background-color 0.3s; }
          .cropper-custom-styles .cropper-view-box { outline: 1.5px solid #FFD700; outline-color: rgba(255, 215, 0, 0.8); border-radius: 2px; }
          .cropper-custom-styles .cropper-line { background-color: transparent; }
          .cropper-custom-styles .cropper-dashed { border: 0 dashed rgba(255,255,255,0.3); }
          .cropper-custom-styles .cropper-dashed.dashed-h { border-top-width: 1px; border-bottom-width: 1px; top: 33.333%; height: 33.333%; }
          .cropper-custom-styles .cropper-dashed.dashed-v { border-left-width: 1px; border-right-width: 1px; left: 33.333%; width: 33.333%; }
          .cropper-custom-styles .cropper-center { display: none; }
          .cropper-custom-styles .cropper-point { background-color: transparent !important; opacity: 1 !important; }
          .cropper-custom-styles .cropper-point.point-nw, .cropper-custom-styles .cropper-point.point-ne,
          .cropper-custom-styles .cropper-point.point-sw, .cropper-custom-styles .cropper-point.point-se { width: 30px; height: 30px; }
          .cropper-custom-styles .cropper-point::before { content: ''; position: absolute; background: transparent; border: 0 solid #FFD700; box-shadow: 0 0 10px rgba(255,215,0,0.2); }
          .cropper-custom-styles .cropper-point.point-nw::before { width: 16px; height: 16px; border-top-width: 3px; border-left-width: 3px; top: 0; left: 0; border-top-left-radius: 2px; }
          .cropper-custom-styles .cropper-point.point-ne::before { width: 16px; height: 16px; border-top-width: 3px; border-right-width: 3px; top: 0; right: 0; border-top-right-radius: 2px; }
          .cropper-custom-styles .cropper-point.point-sw::before { width: 16px; height: 16px; border-bottom-width: 3px; border-left-width: 3px; bottom: 0; left: 0; border-bottom-left-radius: 2px; }
          .cropper-custom-styles .cropper-point.point-se::before { width: 16px; height: 16px; border-bottom-width: 3px; border-right-width: 3px; bottom: 0; right: 0; border-bottom-right-radius: 2px; }
        `}</style>
      </div>

      {/* BOTTOM CONTROL PANEL */}
      <div className="shrink-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 pb-safe z-[150] rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Dynamic Tool Area */}
        <div className="h-[110px] flex flex-col justify-center border-b border-white/5 relative overflow-hidden">
          
          {/* CROP TOOLS */}
          {activeTab === 'crop' && (
            <div className="flex flex-col items-center w-full px-6 gap-2 animate-in fade-in slide-in-from-bottom-2 h-full justify-center">
               <div className="flex justify-between w-full max-w-sm px-2 text-[10px] text-white/50 font-mono">
                 <span>-45°</span><span className="text-[#FFD700] text-xs font-bold">{rotation}°</span><span>45°</span>
               </div>
               <div className="relative flex items-center w-full max-w-sm h-8">
                  <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-30">
                     {[...Array(21)].map((_, i) => <div key={i} className={`w-0.5 bg-white rounded-full ${i === 10 ? 'h-4 bg-[#FFD700]' : i%5===0 ? 'h-3' : 'h-1.5'}`} />)}
                  </div>
                  <input type="range" min="-45" max="45" value={rotation} onChange={(e) => { const val = Number(e.target.value); setRotation(val); cropperRef.current?.cropper.rotateTo(val); hapticFeedback(); }} onDoubleClick={() => { setRotation(0); cropperRef.current?.cropper.rotateTo(0); hapticFeedback(); }} className="w-full accent-transparent touch-none h-8 opacity-0 z-10 cursor-ew-resize" />
                  <div className="absolute w-1 h-5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none rounded-full transition-all duration-75" style={{ left: `calc(${((rotation + 45) / 90) * 100}% - 2px)` }} />
               </div>
               <div className="flex items-center gap-4 mt-2 overflow-x-auto no-scrollbar w-full max-w-sm pb-1">
                 {['free', 'locked', 'original', '1:1', '4:5', '16:9'].map(a => (
                   <button key={a} onClick={() => { if(a==='locked') { if(aspect==='locked'){setAspect('free')}else{const d=cropperRef.current?.cropper.getCropBoxData();if(d?.width){setLockedAspect(d.width/d.height);setAspect('locked')}} } else {setAspect(a as CropAspect)}; hapticFeedback(); }} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${aspect === a ? 'bg-[#FFD700] text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                     {a.toUpperCase()}
                   </button>
                 ))}
               </div>
            </div>
          )}

          {/* ADJUST TOOLS */}
          {activeTab === 'adjust' && (
            <div className="absolute inset-0 flex items-center justify-center">
              {activeTool ? (
                activeTool === 'brightness' ? renderSlider(adjustments.brightness, 0, 200, 'Brightness', 100, v => updateState(setAdjustments, 'brightness', v)) :
                activeTool === 'contrast' ? renderSlider(adjustments.contrast, 0, 200, 'Contrast', 100, v => updateState(setAdjustments, 'contrast', v)) :
                activeTool === 'saturation' ? renderSlider(adjustments.saturation, 0, 200, 'Saturation', 100, v => updateState(setAdjustments, 'saturation', v)) :
                activeTool === 'warmth' ? renderSlider(adjustments.warmth, 0, 100, 'Warmth', 0, v => updateState(setAdjustments, 'warmth', v)) :
                activeTool === 'tint' ? renderSlider(adjustments.tint, -100, 100, 'Tint', 0, v => updateState(setAdjustments, 'tint', v)) : null
              ) : (
                <div className="flex items-center gap-6 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in h-full">
                  {[
                    { id: 'brightness', icon: Sun, label: 'Brightness', val: adjustments.brightness !== 100 },
                    { id: 'contrast', icon: Sliders, label: 'Contrast', val: adjustments.contrast !== 100 },
                    { id: 'saturation', icon: Droplet, label: 'Saturation', val: adjustments.saturation !== 100 },
                    { id: 'warmth', icon: Thermometer, label: 'Warmth', val: adjustments.warmth !== 0 },
                    { id: 'tint', icon: Palette, label: 'Tint', val: adjustments.tint !== 0 },
                  ].map((tool) => (
                    <button key={tool.id} onClick={() => { setActiveTool(tool.id as EditTool); hapticFeedback(); }} className="flex flex-col items-center gap-2 shrink-0 group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${tool.val ? 'bg-[#FFD700]/20 text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white'}`}>
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${tool.val ? 'text-[#FFD700]' : 'text-white/50'}`}>{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* EFFECTS TOOLS */}
          {activeTab === 'effects' && (
             <div className="absolute inset-0 flex items-center justify-center">
             {activeTool ? (
               activeTool === 'fade' ? renderSlider(effects.fade, 0, 100, 'Fade', 0, v => updateState(setEffects, 'fade', v)) :
               activeTool === 'vignette' ? renderSlider(effects.vignette, 0, 100, 'Vignette', 0, v => updateState(setEffects, 'vignette', v)) :
               activeTool === 'grain' ? renderSlider(effects.grain, 0, 100, 'Film Grain', 0, v => updateState(setEffects, 'grain', v)) :
               activeTool === 'dust' ? renderSlider(effects.dust, 0, 100, 'Vintage Dust', 0, v => updateState(setEffects, 'dust', v)) :
               activeTool === 'bgBlur' ? renderSlider(effects.bgBlur, 0, 100, 'Bg Blur', 30, v => updateState(setEffects, 'bgBlur', v)) :
               activeTool === 'lightLeak' ? renderSlider(effects.lightLeak, 0, 3, 'Light Leaks (0-3)', 0, v => updateState(setEffects, 'lightLeak', v)) : null
             ) : (
               <div className="flex items-center gap-6 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in h-full">
                 {[
                   { id: 'grain', icon: Sparkles, label: 'Grain', val: effects.grain !== 0 },
                   { id: 'dust', icon: Zap, label: 'Dust', val: effects.dust !== 0 },
                   { id: 'lightLeak', icon: Aperture, label: 'Leaks', val: effects.lightLeak !== 0 },
                   { id: 'fade', icon: CloudFog, label: 'Fade', val: effects.fade !== 0 },
                   { id: 'vignette', icon: Focus, label: 'Vignette', val: effects.vignette !== 0 },
                   { id: 'bgBlur', icon: Layout, label: 'Bg Blur', val: effects.bgBlur !== 30 },
                 ].map((tool) => (
                   <button key={tool.id} onClick={() => { setActiveTool(tool.id as EffectTool); hapticFeedback(); }} className="flex flex-col items-center gap-2 shrink-0 group">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${tool.val ? 'bg-[#FFD700]/20 text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white'}`}>
                       <tool.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-[10px] font-bold tracking-wider uppercase ${tool.val ? 'text-[#FFD700]' : 'text-white/50'}`}>{tool.label}</span>
                   </button>
                 ))}
               </div>
             )}
           </div>
          )}

          {/* TEXT TOOLS */}
          {activeTab === 'text' && (
            <div className="flex flex-col w-full h-full p-4 gap-2 animate-in fade-in">
              {activeTextId ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="text" 
                      value={texts.find(t => t.id === activeTextId)?.text || ''} 
                      onChange={(e) => updateActiveText('text', e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white outline-none focus:border-[#FFD700] transition-colors"
                      placeholder="Type something..."
                    />
                    <button onClick={() => setTexts(texts.filter(t => t.id !== activeTextId))} className="p-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30"><Trash2 className="w-5 h-5" /></button>
                    <button onClick={() => setActiveTextId(null)} className="p-2.5 bg-[#FFD700]/20 text-[#FFD700] rounded-xl hover:bg-[#FFD700]/30"><Check className="w-5 h-5" /></button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {FONTS.map(f => (
                      <button key={f.name} onClick={() => updateActiveText('fontFamily', f.value)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${texts.find(t=>t.id===activeTextId)?.fontFamily === f.value ? 'bg-white text-black' : 'bg-white/10 text-white'}`} style={{fontFamily: f.value}}>{f.name}</button>
                    ))}
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    {COLORS.map(c => (
                      <button key={c} onClick={() => updateActiveText('color', c)} className="w-6 h-6 rounded-full shrink-0 border border-white/20" style={{backgroundColor: c, boxShadow: texts.find(t=>t.id===activeTextId)?.color === c ? '0 0 0 2px black, 0 0 0 4px white' : 'none'}} />
                    ))}
                  </div>
                </>
              ) : (
                <button onClick={addText} className="w-full h-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 border-dashed text-white/70 hover:text-white transition-colors">
                  <Plus className="w-6 h-6" />
                  <span className="font-bold tracking-widest">ADD TEXT</span>
                </button>
              )}
            </div>
          )}

          {/* FRAMES TAB */}
          {activeTab === 'frames' && (
            <div className="flex items-center gap-4 px-6 w-full overflow-x-auto no-scrollbar animate-in fade-in h-full">
               {(['none', 'polaroid', 'film', 'minimal', 'kodak'] as FrameType[]).map(f => (
                 <button key={f} onClick={() => { setFrame(f); hapticFeedback(); }} className="flex flex-col items-center gap-2 shrink-0">
                   <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${frame === f ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/10 bg-white/5'}`}>
                     <Frame className={`w-6 h-6 ${frame === f ? 'text-[#FFD700]' : 'text-white/50'}`} />
                   </div>
                   <span className={`text-[10px] font-bold uppercase ${frame === f ? 'text-[#FFD700]' : 'text-white/50'}`}>{f}</span>
                 </button>
               ))}
            </div>
          )}

          {/* FILTERS TAB */}
          {activeTab === 'filters' && (
            <div className="flex items-center gap-3 px-4 w-full overflow-x-auto no-scrollbar animate-in fade-in h-full">
              {FILTERS.map((f) => (
                <div key={f.name} className="flex flex-col items-center gap-2 shrink-0">
                  <button onClick={() => { setPresetFilter(f.value); hapticFeedback(); }} className={`w-[64px] h-[64px] rounded-2xl shrink-0 transition-all border-2 object-cover overflow-hidden relative group ${presetFilter === f.value ? 'border-[#FFD700] scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={currentImageSrc} className="w-full h-full object-cover" style={{ filter: f.value !== 'none' ? f.value : 'none' }} alt={f.name} />
                    {presetFilter === f.value && <div className="absolute inset-0 bg-[#FFD700]/20 flex items-center justify-center"><Check className="w-6 h-6 text-white drop-shadow-md" /></div>}
                  </button>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${presetFilter === f.value ? 'text-[#FFD700]' : 'text-white/50'}`}>{f.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* HEAL TAB */}
          {activeTab === 'heal' && (
            <div className="flex flex-col items-center justify-center w-full px-6 gap-2 animate-in fade-in h-full">
               
               <div className="flex items-center gap-2 mb-1 w-full max-w-sm bg-white/5 rounded-full p-1 border border-white/10">
                 <button onClick={() => setHealMode('local')} className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${healMode === 'local' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white/80'}`}>Local Fast</button>
                 <button onClick={() => setHealMode('ai')} className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ${healMode === 'ai' ? 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'text-[#FFD700]/50 hover:text-[#FFD700]/80'}`}><Sparkles className="w-3 h-3" /> Cloud AI</button>
               </div>

               {healMode === 'ai' && (
                 <div className="flex items-center gap-2 w-full max-w-sm">
                   <input type="text" placeholder="Prompt (e.g. remove object)" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FFD700] transition-colors" />
                   <button onClick={processAiRetouch} disabled={processing || pathRef.current.length === 0} className="bg-[#FFD700] text-black px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#FFF055] transition-colors">Generate</button>
                 </div>
               )}

               <div className="flex items-center justify-between w-full max-w-sm mt-1">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Brush Size</span>
                  <span className="text-[10px] text-[#FFD700] font-mono">{brushSize}px</span>
               </div>
               <input type="range" min="5" max="100" value={brushSize} onChange={(e) => { setBrushSize(Number(e.target.value)); hapticFeedback(); }} className="w-full max-w-sm accent-[#FFD700] touch-none h-1.5 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#FFD700] [&::-webkit-slider-thumb]:rounded-full shadow-inner" />
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'crop', icon: Crop, label: 'Crop' },
            { id: 'filters', icon: ImageIcon, label: 'Filters' },
            { id: 'adjust', icon: Settings2, label: 'Adjust' },
            { id: 'effects', icon: Sparkles, label: 'Effects' },
            { id: 'heal', icon: Eraser, label: 'Heal' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'frames', icon: Frame, label: 'Frames' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as Tab); setActiveTool(null); hapticFeedback(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all shrink-0 font-bold tracking-widest text-xs uppercase ${activeTab === tab.id ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/90'}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-black' : 'text-current'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
});
