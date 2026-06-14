import { useEffect, useRef, useState, useCallback } from "react";
import { X, Image as ImageIcon, RefreshCcw, Zap, ZapOff, Aperture } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface CameraOverlayProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraOverlay({ onClose, onCapture }: CameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"Full" | "16:9" | "4:3" | "1:1">("Full");
  const [error, setError] = useState<string | null>(null);
  const [vintageMode, setVintageMode] = useState(false);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Camera access denied or unavailable.");
    }
  }, [stream]);

  useEffect(() => {
    void startCamera(facingMode);
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const toggleRatio = () => {
    setAspectRatio(prev => prev === "Full" ? "16:9" : prev === "16:9" ? "4:3" : prev === "4:3" ? "1:1" : "Full");
  };

  const handleCapture = () => {
    if (!videoRef.current || !stream) return;
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

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const sx = (vw - cw) / 2;
    const sy = (vh - ch) / 2;

    if (facingMode === "user") {
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);
    }
    
    if (vintageMode) {
      ctx.filter = "sepia(0.6) contrast(1.2) brightness(0.9) saturate(0.8) hue-rotate(-10deg)";
    }
    
    ctx.drawImage(video, sx, sy, cw, ch, 0, 0, cw, ch);
    
    if (vintageMode) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";
      
      const gradient = ctx.createRadialGradient(cw/2, ch/2, cw * 0.3, cw/2, ch/2, Math.max(cw, ch) * 0.7);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);

      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let i = 0; i < 3000; i++) {
        ctx.fillRect(Math.random() * cw, Math.random() * ch, 2, 2);
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
      for (let i = 0; i < 3000; i++) {
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
      onCapture(file);
    }, "image/jpeg", 0.9);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onCapture(file);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[300] bg-black flex flex-col"
      >
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
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
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                style={vintageMode ? { filter: "sepia(0.6) contrast(1.2) brightness(0.9) saturate(0.8) hue-rotate(-10deg)" } : undefined}
              />
              {vintageMode && (
                <>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)" }} />
                  <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }} />
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
              className={`absolute -left-16 w-10 h-10 rounded-full flex items-center justify-center transition-all ${vintageMode ? "bg-[#ff9900]/20 text-[#ff9900] border-2 border-[#ff9900]/50" : "bg-black/40 text-white/70 border border-white/20 hover:bg-white/10"}`}
              title="Vintage Camera"
            >
              <Aperture className="w-5 h-5" />
            </button>

            {/* Capture button */}
            <button 
              onClick={handleCapture}
              className={`w-20 h-20 rounded-full border-4 flex items-center justify-center active:scale-90 transition-all ${vintageMode ? "border-[#ff9900]/80 shadow-[0_0_20px_rgba(255,153,0,0.4)]" : "border-white"}`}
            >
              <div className={`w-16 h-16 rounded-full transition-colors ${vintageMode ? "bg-gradient-to-br from-[#ff9900] to-[#cc7a00]" : "bg-white"}`} />
            </button>
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
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
