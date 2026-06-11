import { useEffect, useRef, useState, useCallback } from "react";
import { X, Image as ImageIcon, RefreshCcw, Zap, ZapOff } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

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

  const handleCapture = () => {
    if (!videoRef.current || !stream) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // If front camera, we might want to flip the image horizontally
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
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
          
          {/* Empty div for balancing flex layout */}
          <div className="w-12" />
        </div>

        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
          {error ? (
            <p className="text-white/50 text-center px-4">{error}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`min-w-full min-h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-t from-black/60 to-transparent pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="w-12 h-12 rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all overflow-hidden"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          
          <div className="relative flex flex-col items-center gap-4">
            {/* Capture button */}
            <button 
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
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
