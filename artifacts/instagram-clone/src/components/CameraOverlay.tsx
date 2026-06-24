import { useEffect, useRef, useState, useCallback } from "react";
import { X, Image as ImageIcon, RefreshCcw, Zap, ZapOff, Check } from "lucide-react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import vintageCameraImg from "../vintage-camera.png";
import disposableCameraImg from "../disposable.png";
import photoBoothImg from "../fantasticfour.png";
import { StoryEditor } from "./StoryEditor";

type CameraStyle = "normal" | "vintage" | "disposable";
type CameraMode = "normal" | "vintage" | "disposable" | "photoBooth";

interface CameraOverlayProps {
  onClose: (uploaded?: boolean, story?: any) => void;
  onCapture?: (file: File) => void;
  mode?: "chat" | "story";
}

const MODE_LABELS: Record<CameraMode, string> = {
  normal: "Default",
  vintage: "Vintage",
  disposable: "Disposable",
  photoBooth: "Photo Booth",
};

const STYLE_FILTERS: Record<CameraStyle, string> = {
  normal: "none",
  vintage: "sepia(0.4) contrast(1.1) saturate(1.2) brightness(1.05) hue-rotate(-5deg)",
  disposable: "contrast(1.4) saturate(1.3) brightness(1.1) sepia(0.3) hue-rotate(-15deg) blur(0.5px)",
};

function applyStyleToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  sx: number, sy: number, cropW: number, cropH: number,
  cw: number, ch: number,
  style: CameraStyle,
  facingMode: "user" | "environment"
) {
  if (facingMode === "user") {
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
  }
  ctx.filter = STYLE_FILTERS[style];
  ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cw, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStr = `'${yy} ${mm} ${dd}`;

  if (style === "vintage") {
    const gradient = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.4, cw / 2, ch / 2, Math.max(cw, ch) * 0.8);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 1500; i++) ctx.fillRect(Math.random() * cw, Math.random() * ch, 2, 2);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 1500; i++) ctx.fillRect(Math.random() * cw, Math.random() * ch, 3, 3);
    ctx.fillStyle = "#ff9900";
    ctx.font = "bold 32px 'Courier New', Courier, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(255,153,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(dateStr, cw - 30, ch - 30);
  } else if (style === "disposable") {
    const gradient = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.2, cw / 2, ch / 2, Math.max(cw, ch) * 1.0);
    gradient.addColorStop(0, "rgba(255,255,255,0.1)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);
    
    // Light leak
    const leakGrad = ctx.createLinearGradient(0, 0, cw, 0);
    leakGrad.addColorStop(0, "rgba(255,50,0,0.3)");
    leakGrad.addColorStop(0.2, "rgba(0,0,0,0)");
    leakGrad.addColorStop(0.8, "rgba(0,0,0,0)");
    leakGrad.addColorStop(1, "rgba(255,100,0,0.2)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = leakGrad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = "source-over";

    const imgData = ctx.getImageData(0, 0, cw, ch);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 50;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

export function CameraOverlay({ onClose, onCapture, mode = "chat" }: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"Full" | "16:9" | "4:3" | "1:1">("Full");
  const [error, setError] = useState<string | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>("normal");
  const [modeOverlay, setModeOverlay] = useState<string | null>(null);
  const [flashDotActive, setFlashDotActive] = useState(false);

  // Photo booth state
  const [photoBoothStyle, setPhotoBoothStyle] = useState<CameraStyle>("normal");
  const [photoBoothFiles, setPhotoBoothFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [activeQuadrant, setActiveQuadrant] = useState(0);
  const [boothComplete, setBoothComplete] = useState(false);
  const [boothReviewing, setBoothReviewing] = useState(false);
  const [boothTransforms, setBoothTransforms] = useState(Array(4).fill({ zoom: 1, x: 0, y: 0 }));

  const [storyFiles, setStoryFiles] = useState<File[]>([]);
  const [zoom, setZoom] = useState(1);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const startCamera = useCallback(async (fm: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fm, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = newStream;
      if (videoRef.current) videoRef.current.srcObject = newStream;
      setError(null);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Camera access denied or unavailable.");
    }
  }, []);

  useEffect(() => {
    void startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        // @ts-ignore
        track.applyConstraints({ advanced: [{ torch: flashOn }] }).catch(() => {});
      } catch {}
    }
  }, [flashOn]);

  const switchMode = (newMode: CameraMode) => {
    setCameraMode(newMode);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setModeOverlay(MODE_LABELS[newMode]);
    overlayTimerRef.current = setTimeout(() => setModeOverlay(null), 1000);
    
    if (newMode !== "photoBooth") {
      setPhotoBoothFiles([null, null, null, null]);
      setBoothTransforms(Array(4).fill({ zoom: 1, x: 0, y: 0 }));
      setActiveQuadrant(0);
      setBoothComplete(false);
      setBoothReviewing(false);
    }
    if (newMode === "disposable") {
      setAspectRatio("Full");
    }
  };

  const toggleCamera = () => setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  const toggleFlash = () => setFlashOn((f) => !f);
  const toggleRatio = () => {
    if (cameraMode === "disposable") return;
    setAspectRatio((prev) =>
      prev === "Full" ? "16:9" : prev === "16:9" ? "4:3" : prev === "4:3" ? "1:1" : "Full"
    );
  };

  const buildCroppedCanvas = (style: CameraStyle): HTMLCanvasElement | null => {
    if (!videoRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoRatio = vw / vh;

    let targetRatio = 9 / 16;
    if (aspectRatio === "Full" || style === "disposable") targetRatio = vw / vh;
    if (aspectRatio === "4:3") targetRatio = 3 / 4;
    if (aspectRatio === "1:1") targetRatio = 1;
    if (vw > vh && targetRatio < 1) targetRatio = 1 / targetRatio;

    let cw = vw, ch = vh;
    if (videoRatio > targetRatio) cw = vh * targetRatio;
    else ch = vw / targetRatio;

    const cropW = cw / zoom;
    const cropH = ch / zoom;
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    applyStyleToCanvas(ctx, video, sx, sy, cropW, cropH, cw, ch, style, facingMode);
    return canvas;
  };

  const handleCapture = () => {
    const style = cameraMode === "photoBooth" ? photoBoothStyle : (cameraMode as CameraStyle);

    if (style === "disposable") {
      setFlashDotActive(true);
      setTimeout(() => setFlashDotActive(false), 150);
    }

    const canvas = buildCroppedCanvas(style);
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });

        if (cameraMode === "photoBooth") {
          const updated = [...photoBoothFiles];
          updated[activeQuadrant] = file;
          setPhotoBoothFiles(updated);
          setBoothReviewing(true);
        } else if (mode === "story") {
          setStoryFiles([file]);
        } else if (onCapture) {
          onCapture(file);
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const confirmBoothShot = () => {
    if (activeQuadrant === 3) {
      setBoothReviewing(false);
      setBoothComplete(true);
    } else {
      setBoothReviewing(false);
      setActiveQuadrant((q) => q + 1);
    }
  };

  const retakeBoothShot = () => {
    const updated = [...photoBoothFiles];
    updated[activeQuadrant] = null;
    setPhotoBoothFiles(updated);
    setBoothReviewing(false);
    const newTransforms = [...boothTransforms];
    newTransforms[activeQuadrant] = { zoom: 1, x: 0, y: 0 };
    setBoothTransforms(newTransforms);
  };

  const handleBoothUpload = async () => {
    const files = photoBoothFiles.filter(Boolean) as File[];
    if (files.length < 4) return;

    const imgs = await Promise.all(
      files.map(
        (f) =>
          new Promise<HTMLImageElement>((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = URL.createObjectURL(f);
          })
      )
    );

    const W = imgs[0].naturalWidth * 2;
    const H = imgs[0].naturalHeight * 2;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const hw = W / 2, hh = H / 2;
    const gap = 4;
    
    const drawQuadrant = (img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number, transform: {zoom:number, x:number, y:number}) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(dx, dy, dw, dh);
      ctx.clip();

      ctx.translate(dx + dw / 2, dy + dh / 2);
      
      const screenQuadW = window.innerWidth / 2;
      const scaleRatio = dw / screenQuadW;

      ctx.translate(transform.x * scaleRatio, transform.y * scaleRatio);
      ctx.scale(transform.zoom, transform.zoom);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const boxRatio = dw / dh;
      let drawW = dw, drawH = dh;
      if (imgRatio > boxRatio) {
        drawW = dh * imgRatio;
      } else {
        drawH = dw / imgRatio;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    };

    drawQuadrant(imgs[0], 0,          0,          hw - gap / 2, hh - gap / 2, boothTransforms[0]);
    drawQuadrant(imgs[1], hw + gap/2, 0,          hw - gap / 2, hh - gap / 2, boothTransforms[1]);
    drawQuadrant(imgs[2], 0,          hh + gap/2, hw - gap / 2, hh - gap / 2, boothTransforms[2]);
    drawQuadrant(imgs[3], hw + gap/2, hh + gap/2, hw - gap / 2, hh - gap / 2, boothTransforms[3]);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photobooth-${Date.now()}.jpg`, { type: "image/jpeg" });
        if (mode === "story") setStoryFiles([file]);
        else if (onCapture) onCapture(file);
      },
      "image/jpeg",
      0.9
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const selected = files.sort((a, b) => a.lastModified - b.lastModified);
    if (selected.some((f) => f.type.startsWith("video/"))) {
      setError("Stories support photos only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (mode === "story") setStoryFiles(selected);
    else if (onCapture) onCapture(selected[0]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (cameraMode === "photoBooth" && boothReviewing) {
        pinchStartRef.current = { dist, zoom: boothTransforms[activeQuadrant].zoom };
      } else {
        pinchStartRef.current = { dist, zoom };
      }
    } else if (e.touches.length === 1 && cameraMode === "photoBooth" && boothReviewing) {
      panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const delta = dist / pinchStartRef.current.dist;
      if (cameraMode === "photoBooth" && boothReviewing) {
        const newZ = Math.max(1, Math.min(pinchStartRef.current.zoom * delta, 5));
        setBoothTransforms(prev => {
          const next = [...prev];
          next[activeQuadrant] = { ...next[activeQuadrant], zoom: newZ };
          return next;
        });
      } else {
        setZoom(Math.max(1, Math.min(pinchStartRef.current.zoom * delta, 5)));
      }
    } else if (e.touches.length === 1 && panStartRef.current && cameraMode === "photoBooth" && boothReviewing) {
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setBoothTransforms(prev => {
        const next = [...prev];
        next[activeQuadrant] = { 
          ...next[activeQuadrant], 
          x: next[activeQuadrant].x + dx,
          y: next[activeQuadrant].y + dy 
        };
        return next;
      });
    }
  };

  const handleTouchEnd = () => { 
    pinchStartRef.current = null; 
    panStartRef.current = null;
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (cameraMode === "photoBooth" && boothReviewing) {
      setBoothTransforms(prev => {
        const next = [...prev];
        const newZ = Math.max(1, Math.min(next[activeQuadrant].zoom - e.deltaY * 0.005, 5));
        next[activeQuadrant] = { ...next[activeQuadrant], zoom: newZ };
        return next;
      });
    } else {
      setZoom((z) => Math.max(1, Math.min(z - e.deltaY * 0.005, 5)));
    }
  };

  if (storyFiles.length > 0) {
    return (
      <StoryEditor
        files={storyFiles}
        onClose={() => setStoryFiles([])}
        onComplete={(uploaded, story) => onClose(uploaded, story)}
      />
    );
  }

  const isDisposable = cameraMode === "disposable" || (cameraMode === "photoBooth" && photoBoothStyle === "disposable");
  const isVintage = cameraMode === "vintage" || (cameraMode === "photoBooth" && photoBoothStyle === "vintage");

  const liveFilter =
    isVintage ? STYLE_FILTERS.vintage :
    isDisposable ? STYLE_FILTERS.disposable : "none";

  const MODES: { key: CameraMode; label: string }[] = [
    { key: "vintage", label: "Vintage" },
    { key: "disposable", label: "Disposable" },
    { key: "normal", label: "Default" },
    { key: "photoBooth", label: "4 Shot" },
  ];

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[300] bg-black flex flex-col"
      >
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={() => onClose()} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <X className="w-8 h-8" />
          </button>
          <button onClick={toggleFlash} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
            {flashOn ? <Zap className="w-7 h-7" /> : <ZapOff className="w-7 h-7" />}
          </button>
          {!isDisposable ? (
            <button onClick={toggleRatio} className="h-8 px-3 flex items-center justify-center text-sm font-bold text-white bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-colors active:scale-95">
              {aspectRatio}
            </button>
          ) : (
            <div className="h-8 px-3" />
          )}
        </div>

        <AnimatePresence>
          {modeOverlay && (
            <motion.div
              key={modeOverlay}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="px-8 py-4 bg-black/70 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
                <p className="text-white text-2xl font-bold tracking-widest uppercase">{modeOverlay}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black w-full">
          {error ? (
            <p className="text-white/50 text-center px-4">{error}</p>
          ) : cameraMode === "photoBooth" ? (
            <div 
              className="relative w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-black"
              onTouchStart={boothReviewing ? handleTouchStart : undefined}
              onTouchMove={boothReviewing ? handleTouchMove : undefined}
              onTouchEnd={boothReviewing ? handleTouchEnd : undefined}
              onWheel={boothReviewing ? handleWheel : undefined}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isActive = idx === activeQuadrant && !boothComplete;
                const captured = photoBoothFiles[idx];
                const transform = boothTransforms[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => { if (isActive && !boothReviewing) handleCapture(); }}
                    className={`relative overflow-hidden bg-black/80 ${isActive && !boothReviewing ? "ring-2 ring-white/70 cursor-pointer" : ""}`}
                  >
                    {captured ? (
                      <img 
                        src={URL.createObjectURL(captured)} 
                        className="w-full h-full object-cover origin-center" 
                        style={{
                          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`
                        }}
                        alt={`shot ${idx + 1}`} 
                      />
                    ) : isActive ? (
                      <video
                        ref={(node) => {
                          if (idx === activeQuadrant && !boothReviewing) {
                            videoRef.current = node;
                            if (node && streamRef.current && node.srcObject !== streamRef.current) {
                              node.srcObject = streamRef.current;
                            }
                          }
                        }}
                        autoPlay playsInline muted
                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                        style={{ filter: liveFilter }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-bold">{idx + 1}</div>
                    )}
                    {isActive && !boothComplete && !boothReviewing && (
                      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none animate-pulse" />
                    )}
                    {isActive && boothReviewing && (
                      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-2 border-white/30" />
                    )}
                  </div>
                );
              })}
              <video
                ref={(node) => {
                  if (cameraMode === "photoBooth" && !boothComplete) {
                    if (!photoBoothFiles[activeQuadrant] || boothReviewing) {
                      videoRef.current = node;
                      if (node && streamRef.current && node.srcObject !== streamRef.current) {
                        node.srcObject = streamRef.current;
                      }
                    }
                  }
                }}
                autoPlay playsInline muted
                className="hidden"
              />
            </div>
          ) : (
            <div
              className={`relative w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${aspectRatio === "Full" ? "h-full" : "max-h-full"}`}
              style={{
                aspectRatio:
                  aspectRatio === "Full" ? "auto" :
                  aspectRatio === "16:9" ? "9/16" :
                  aspectRatio === "4:3" ? "3/4" : "1/1",
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <video
                ref={(node) => {
                  videoRef.current = node;
                  if (node && streamRef.current && node.srcObject !== streamRef.current) {
                    node.srcObject = streamRef.current;
                  }
                }}
                autoPlay playsInline muted
                className={`absolute inset-0 w-full h-full object-cover origin-center ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                style={{
                  transform: `scale(${zoom}) ${facingMode === "user" ? "scaleX(-1)" : ""}`,
                  filter: liveFilter,
                  transition: pinchStartRef.current ? "none" : "transform 0.1s ease-out",
                }}
              />

              {isVintage && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%)" }} />
                  <div className="absolute bottom-6 right-6 font-mono text-2xl font-bold text-[#ff9900] tracking-widest pointer-events-none" style={{ textShadow: "0 0 10px rgba(255,153,0,0.5)" }}>
                    '{String(new Date().getFullYear()).slice(-2)} {String(new Date().getMonth() + 1).padStart(2, "0")} {String(new Date().getDate()).padStart(2, "0")}
                  </div>
                </>
              )}

              {isDisposable && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1) 10%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)" }} />
                  <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-60" style={{ background: "linear-gradient(90deg, rgba(255,50,0,0.3) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(255,100,0,0.2) 100%)" }} />
                  <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />
                  <div className="absolute inset-0 pointer-events-none border-[12vw] border-black/90 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] rounded-[20vw] z-20 mix-blend-multiply" />
                  <div className="absolute z-30 pointer-events-none" style={{ top: "calc(12vw - 18px)", right: "calc(12vw - 18px)" }}>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-orange-400/60"
                      style={{
                        background: flashDotActive
                          ? "radial-gradient(circle, #fff 10%, #ffdd00 50%, #ff6600 100%)"
                          : "radial-gradient(circle, #ffaa00 20%, #cc5500 100%)",
                        boxShadow: flashDotActive
                          ? "0 0 18px 8px rgba(255,220,0,0.8)"
                          : "0 0 6px 2px rgba(255,120,0,0.4)",
                        transition: "background 0.08s, box-shadow 0.08s",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-center mb-6 px-4 w-full">
            <div className="flex gap-8 overflow-x-auto w-full scrollbar-hide snap-x snap-mandatory px-[30vw]">
              {MODES.map(({ key, label }) => {
                const isActive = cameraMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => switchMode(key)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-1 text-sm font-semibold whitespace-nowrap transition-all snap-center ${
                      isActive ? "text-white drop-shadow-md" : "text-white/60"
                    }`}
                  >
                    <span>{label}</span>
                    <div className={`h-[3px] w-5 rounded-full transition-colors ${isActive ? "bg-yellow-500" : "bg-transparent"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {cameraMode === "photoBooth" && !boothComplete && !boothReviewing && (
            <div className="flex items-center justify-center mb-2 gap-2">
              {(["normal", "vintage", "disposable"] as CameraStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setPhotoBoothStyle(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                    photoBoothStyle === s
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white/60 border-white/20 hover:border-white/50"
                  }`}
                >
                  {s === "normal" ? "Default" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}

          {cameraMode === "photoBooth" && boothReviewing && (
             <div className="flex items-center justify-center mb-2 px-4">
               <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                 Pinch to zoom / drag to pan
               </span>
             </div>
          )}

          <div className="p-4 flex justify-between items-center">
            {!(cameraMode === "photoBooth" && boothReviewing) ? (
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="w-12 h-12 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all overflow-hidden"
               >
                 <ImageIcon className="w-6 h-6" />
               </button>
            ) : <div className="w-12 h-12" />}

            <div className="relative flex items-center justify-center">
              {cameraMode === "photoBooth" && boothReviewing ? (
                <div className="flex gap-4 items-center">
                  <button onClick={retakeBoothShot} className="w-14 h-14 rounded-full bg-red-500/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-lg">
                    <X className="w-7 h-7" />
                  </button>
                  <button onClick={confirmBoothShot} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-all shadow-xl">
                    <Check className="w-8 h-8" />
                  </button>
                </div>
              ) : cameraMode === "photoBooth" && boothComplete ? (
                <button
                  onClick={handleBoothUpload}
                  className="px-6 h-14 rounded-full bg-white text-black font-bold text-base active:scale-95 transition-all shadow-lg"
                >
                  Upload 4 Shots
                </button>
              ) : (
                <button
                  onClick={handleCapture}
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${
                    isVintage
                      ? "border-[#ff9900]/80 shadow-[0_0_20px_rgba(255,153,0,0.4)] p-0.5"
                      : isDisposable
                      ? "border-green-500/80 shadow-[0_0_20px_rgba(34,197,94,0.4)] p-0.5"
                      : cameraMode === "photoBooth"
                      ? "border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.4)] p-0.5"
                      : "border-white"
                  }`}
                >
                  {isVintage ? (
                    <img src={vintageCameraImg} alt="Vintage" className="w-full h-full rounded-full object-cover bg-neutral-800" />
                  ) : isDisposable ? (
                    <img src={disposableCameraImg} alt="Disposable" className="w-full h-full rounded-full object-cover bg-neutral-800" />
                  ) : cameraMode === "photoBooth" ? (
                    <img src={photoBoothImg} alt="Photo Booth" className="w-full h-full rounded-full object-cover bg-neutral-800" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white" />
                  )}
                </button>
              )}
            </div>

            {!(cameraMode === "photoBooth" && boothReviewing) ? (
              <button
                onClick={toggleCamera}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <RefreshCcw className="w-6 h-6" />
              </button>
            ) : <div className="w-12 h-12" />}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
