import { useEffect, useRef, useState, useCallback } from "react";
import { X, Image as ImageIcon, RefreshCcw, Zap, ZapOff } from "lucide-react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import vintageCameraImg from "../vintage-camera.png";
import { StoryEditor } from "./StoryEditor";

interface CameraOverlayProps {
  onClose: (uploaded?: boolean, story?: any) => void;
  onCapture?: (file: File) => void;
  mode?: "chat" | "story";
}

export function CameraOverlay({ onClose, onCapture, mode = "chat" }: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"Full" | "16:9" | "4:3" | "1:1">("Full");
  const [error, setError] = useState<string | null>(null);
  const [vintageMode, setVintageMode] = useState(false);
  const [storyFiles, setStoryFiles] = useState<File[]>([]);
  
  const [zoom, setZoom] = useState(1);
  const pinchStartRef = useRef<{ dist: number, zoom: number } | null>(null);
  
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Camera access denied or unavailable.");
    }
  }, []);

  useEffect(() => {
    void startCamera(facingMode);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [facingMode, startCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  useEffect(() => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        // @ts-ignore - torch constraint is not in standard TS types yet
        track.applyConstraints({ advanced: [{ torch: flashOn }] }).catch(() => {
          console.warn("Flashlight not supported by this device/camera.");
        });
      } catch (err) {
        console.error("Failed to apply flashlight constraint", err);
      }
    }
  }, [flashOn]);

  const toggleRatio = () => {
    setAspectRatio(prev => prev === "Full" ? "16:9" : prev === "16:9" ? "4:3" : prev === "4:3" ? "1:1" : "Full");
  };

  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const videoRatio = vw / vh;
    
    let targetRatio = 9 / 16;
    if (aspectRatio === "Full") targetRatio = vw / vh;
    if (aspectRatio === "4:3") targetRatio = 3 / 4;
    if (aspectRatio === "1:1") targetRatio = 1;
    if (vw > vh && targetRatio < 1) targetRatio = 1 / targetRatio; // Landscape fallback

    let cw = vw;
    let ch = vh;
    if (videoRatio > targetRatio) {
      cw = vh * targetRatio;
    } else {
      ch = vw / targetRatio;
    }

    const cropW = cw / zoom;
    const cropH = ch / zoom;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    if (facingMode === "user") {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }
    
    if (vintageMode) {
      ctx.filter = "sepia(0.4) contrast(1.1) saturate(1.2) brightness(1.05) hue-rotate(-5deg)";
    }
    
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, cw, ch);
    
    if (vintageMode) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      
      const gradient = ctx.createRadialGradient(cw/2, ch/2, cw * 0.4, cw/2, ch/2, Math.max(cw, ch) * 0.8);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let i = 0; i < 1500; i++) {
        ctx.fillRect(Math.random() * cw, Math.random() * ch, 2, 2);
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      for (let i = 0; i < 1500; i++) {
        ctx.fillRect(Math.random() * cw, Math.random() * ch, 3, 3);
      }

      ctx.fillStyle = "#ff9900";
      ctx.font = "bold 32px 'Courier New', Courier, monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(255, 153, 0, 0.5)";
      ctx.shadowBlur = 10;
      
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      ctx.fillText(`'${yy} ${mm} ${dd}`, cw - 30, ch - 30);
    }
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      if (mode === "story") {
        setStoryFiles([file]);
      } else if (onCapture) {
        onCapture(file);
      }
    }, "image/jpeg", 0.7);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const selected = files.sort((a, b) => a.lastModified - b.lastModified); // Sort chronologically
    if (selected.some(f => f.type.startsWith("video/"))) {
      setError("Stories support photos only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (mode === "story") {
      setStoryFiles(selected);
    } else if (onCapture) {
      onCapture(selected[0]);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartRef.current = { dist, zoom };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const { dist: startDist, zoom: startZoom } = pinchStartRef.current;
      
      const delta = dist / startDist;
      let newZoom = startZoom * delta;
      newZoom = Math.max(1, Math.min(newZoom, 5));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    pinchStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    let newZoom = zoom - e.deltaY * 0.005;
    newZoom = Math.max(1, Math.min(newZoom, 5));
    setZoom(newZoom);
  };

  if (storyFiles.length > 0) {
    return <StoryEditor files={storyFiles} onClose={() => setStoryFiles([])} onComplete={(uploaded, story) => onClose(uploaded, story)} />;
  }

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
          
          <button onClick={toggleRatio} className="h-8 px-3 flex items-center justify-center text-sm font-bold text-white bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-colors active:scale-95">
            {aspectRatio}
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black w-full">
          {error ? (
            <p className="text-white/50 text-center px-4">{error}</p>
          ) : (
            <div 
               className={`relative w-full flex items-center justify-center overflow-hidden transition-all duration-300 ${aspectRatio === "Full" ? "h-full" : "max-h-full"}`}
               style={{ 
                 aspectRatio: aspectRatio === "Full" ? "auto" : aspectRatio === "16:9" ? "9/16" : aspectRatio === "4:3" ? "3/4" : "1/1",
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
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover origin-center ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                style={{
                  transform: `scale(${zoom}) ${facingMode === "user" ? "scaleX(-1)" : ""}`,
                  filter: vintageMode ? "sepia(0.4) contrast(1.1) saturate(1.2) brightness(1.05) hue-rotate(-5deg)" : "none",
                  transition: pinchStartRef.current ? "none" : "transform 0.1s ease-out"
                }}
              />
              {vintageMode && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%)" }} />
                  <div className="absolute bottom-6 right-6 font-mono text-2xl font-bold text-[#ff9900] tracking-widest pointer-events-none" style={{ textShadow: "0 0 10px rgba(255,153,0,0.5)" }}>
                    '{String(new Date().getFullYear()).slice(-2)} {String(new Date().getMonth() + 1).padStart(2, '0')} {String(new Date().getDate()).padStart(2, '0')}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-t from-black/60 to-transparent pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-12 h-12 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all overflow-hidden"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          
          <div className="relative flex items-center justify-center">
            {/* Vintage Mode Toggle */}
            <button
              onClick={() => setVintageMode(v => !v)}
              className="absolute -right-16 w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all bg-black/40 border border-white/20 hover:bg-white/10 overflow-hidden"
              title="Toggle Vintage Camera"
            >
              {vintageMode ? (
                <div className="w-5 h-5 rounded-full border-2 border-white" />
              ) : (
                <img src={vintageCameraImg} alt="Vintage" loading="eager" fetchPriority="high" className="w-full h-full object-cover bg-neutral-800" />
              )}
            </button>

            {/* Capture button */}
            <div className="relative flex items-center justify-center">
              <button 
                onClick={handleCapture}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${vintageMode ? "border-[#ff9900]/80 shadow-[0_0_20px_rgba(255,153,0,0.4)] p-0.5" : "border-white"}`}
              >
                {vintageMode ? (
                  <img src={vintageCameraImg} alt="Vintage Camera" loading="eager" fetchPriority="high" className="w-full h-full rounded-full object-cover bg-neutral-800" />
                ) : (
                  <div className="w-16 h-16 rounded-full transition-all bg-white" />
                )}
              </button>
            </div>
          </div>

          <button 
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
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
