import { useState, useRef, useEffect } from "react";
import { X, Check, Type, Loader2, ImagePlus } from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import ReactDOM from "react-dom";
import { api } from "../lib/api";

interface StoryEditorProps {
  file: File;
  onClose: () => void;
  onComplete: () => void;
}

const FONTS = [
  { name: "Classic", value: "system-ui, sans-serif" },
  { name: "Modern", value: "'Inter', sans-serif" },
  { name: "Signature", value: "'Brush Script MT', cursive" },
  { name: "Typewriter", value: "'Courier New', monospace" }
];

const COLORS = ["#FFFFFF", "#000000", "#FF3B30", "#34C759", "#007AFF", "#FF9500", "#AF52DE", "#FF2D55"];

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
}

function TransformableImage({ 
  src, 
  onTransformChange, 
  isMain, 
  isTyping 
}: { 
  src: string, 
  onTransformChange: (x: number, y: number, s: number) => void, 
  isMain?: boolean, 
  isTyping?: boolean 
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  // Synchronize initial state to parent
  useEffect(() => {
    onTransformChange(0, 0, 1);
  }, []);

  const bind = useGesture({
    onDrag: ({ offset: [ox, oy] }) => {
      if (isTyping) return;
      x.set(ox);
      y.set(oy);
      onTransformChange(ox, oy, scale.get());
    },
    onPinch: ({ offset: [s] }) => {
      if (isTyping) return;
      scale.set(s);
      onTransformChange(x.get(), y.get(), s);
    }
  }, {
    drag: { from: () => [x.get(), y.get()] },
    pinch: { 
      from: () => [scale.get(), 0],
      scaleBounds: { min: 0.1, max: 10 },
      // Important to use pointers for pinch in web
      eventOptions: { passive: false }
    }
  });

  return (
    <motion.img 
      {...(bind() as any)}
      src={src} 
      style={{ x, y, scale, touchAction: 'none' }} 
      className={
        isMain 
        ? "w-full h-full object-contain absolute inset-0 pointer-events-auto z-0" 
        : "max-w-[50%] max-h-[50%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 drop-shadow-xl border-2 border-white/80 rounded-xl object-contain"
      } 
      draggable={false}
    />
  );
}

export function StoryEditor({ file, onClose, onComplete }: StoryEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [textPosition, setTextPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [mainTransform, setMainTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const textDragRef = useRef({
    isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0
  });

  const isVideo = file.type.startsWith("video");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleTextPointerDown = (e: React.PointerEvent) => {
    if (isTyping) return;
    textDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: textPosition.x,
      initialY: textPosition.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!textDragRef.current.isDragging) return;
    const dx = e.clientX - textDragRef.current.startX;
    const dy = e.clientY - textDragRef.current.startY;
    setTextPosition({
      x: textDragRef.current.initialX + dx,
      y: textDragRef.current.initialY + dy
    });
  };

  const handleTextPointerUp = (e: React.PointerEvent) => {
    textDragRef.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleAddSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith("image/")) {
      alert("Only images can be added as stickers.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setStickers(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), url, x: 0, y: 0, scale: 1 }
    ]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Pre-load an image returning an HTMLImageElement
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const bakeAndUpload = async () => {
    setUploading(true);
    try {
      let finalBlob: Blob | File = file;
      let textOverlayObj = null;

      if (!isVideo) {
        // Baking Image Story
        const dpr = 2; // For higher quality export
        const canvas = document.createElement("canvas");
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");
        
        ctx.scale(dpr, dpr);

        // 1. Draw blurred background
        const mainImg = await loadImage(imageUrl);
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);
        
        ctx.save();
        ctx.filter = "blur(30px) brightness(0.6)";
        // Cover logic for background
        const bgRatio = Math.max(W / mainImg.width, H / mainImg.height);
        const bgW = mainImg.width * bgRatio;
        const bgH = mainImg.height * bgRatio;
        ctx.drawImage(mainImg, (W - bgW) / 2, (H - bgH) / 2, bgW, bgH);
        ctx.restore();

        // 2. Draw transformed main image
        ctx.save();
        ctx.translate(W / 2 + mainTransform.x, H / 2 + mainTransform.y);
        ctx.scale(mainTransform.scale, mainTransform.scale);
        // Contain logic for main image
        const imgRatio = Math.min(W / mainImg.width, H / mainImg.height);
        const dw = mainImg.width * imgRatio;
        const dh = mainImg.height * imgRatio;
        ctx.drawImage(mainImg, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();

        // 3. Draw stickers
        for (const sticker of stickers) {
          const sImg = await loadImage(sticker.url);
          ctx.save();
          ctx.translate(W / 2 + sticker.x, H / 2 + sticker.y);
          ctx.scale(sticker.scale, sticker.scale);
          
          // Max width 50% for stickers as defined in CSS
          const sRatio = Math.min((W * 0.5) / sImg.width, (H * 0.5) / sImg.height);
          const sdw = sImg.width * sRatio;
          const sdh = sImg.height * sRatio;
          
          // Add border and shadow to sticker
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 5;
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 4;
          ctx.lineJoin = "round";
          
          ctx.beginPath();
          ctx.roundRect(-sdw / 2, -sdh / 2, sdw, sdh, 12);
          ctx.fill(); // Fill shadow
          
          ctx.clip(); // Clip image to rounded rect
          ctx.drawImage(sImg, -sdw / 2, -sdh / 2, sdw, sdh);
          
          ctx.stroke(); // Draw border
          ctx.restore();
        }

        // 4. Draw Text
        if (text.trim()) {
          ctx.font = `bold 40px ${fontFamily}`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          ctx.fillText(text, textPosition.x, textPosition.y);
        }

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
        if (!blob) throw new Error("Canvas export failed");
        finalBlob = blob;
      } else {
        // Video Story logic remains unchanged
        if (text.trim()) {
          textOverlayObj = {
            text,
            fontFamily,
            textColor,
            x: textPosition.x / window.innerWidth,
            y: textPosition.y / window.innerHeight
          };
        }
      }

      const { url } = await api.uploadStoryToB2(finalBlob, isVideo ? "video" : "image");
      
      await api.addStory({ 
        mediaUrl: url, 
        text_overlay: textOverlayObj ? JSON.stringify(textOverlayObj) : undefined 
      });
      
      onComplete();
    } catch (err) {
      console.error("Failed to upload story", err);
      alert("Failed to upload story. Please try again.");
      setUploading(false);
    }
  };

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col font-sans touch-none overflow-hidden"
    >
      {/* Blurred Static Background for Images */}
      {!isVideo && imageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[30px] brightness-[0.6] scale-110" 
          style={{ backgroundImage: `url(${imageUrl})` }} 
        />
      )}

      {/* Main Container */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {imageUrl && isVideo ? (
          <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-auto" />
        ) : imageUrl ? (
          <TransformableImage 
            src={imageUrl} 
            isMain 
            isTyping={isTyping} 
            onTransformChange={(x, y, s) => setMainTransform({ x, y, scale: s })} 
          />
        ) : null}
        
        {!isVideo && stickers.map(sticker => (
          <TransformableImage 
            key={sticker.id}
            src={sticker.url}
            isTyping={isTyping}
            onTransformChange={(x, y, s) => {
              setStickers(prev => prev.map(st => st.id === sticker.id ? { ...st, x, y, scale: s } : st));
            }}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Top Controls */}
      {!isTyping && (
        <div className="absolute top-safe left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Close */}
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
              <X className="w-7 h-7 drop-shadow-md" />
            </button>
            {/* Add image from gallery — only for images, shown next to close */}
            {!isVideo && (
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white hover:bg-white/10 rounded-full flex items-center justify-center">
                <ImagePlus className="w-6 h-6 drop-shadow-md" />
              </button>
            )}
          </div>

          {/* Text / Aa — right side */}
          <button onClick={() => setIsTyping(true)} className="p-2 text-white hover:bg-white/10 rounded-full flex items-center justify-center pointer-events-auto">
            <span className="font-serif font-bold text-[26px] drop-shadow-md leading-none">Aa</span>
          </button>
        </div>
      )}

      {/* Hidden File Input for Stickers */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleAddSticker} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Render the draggable text */}
      {!isTyping && text && (
        <div 
          className="absolute z-30 cursor-move text-center whitespace-pre-wrap select-none"
          style={{ 
            left: textPosition.x, 
            top: textPosition.y,
            transform: 'translate(-50%, -50%)',
            fontFamily,
            color: textColor,
            fontSize: '40px',
            fontWeight: 'bold',
            textShadow: '0px 2px 10px rgba(0,0,0,0.5)',
            touchAction: 'none'
          }}
          onPointerDown={handleTextPointerDown}
          onPointerMove={handleTextPointerMove}
          onPointerUp={handleTextPointerUp}
          onPointerCancel={handleTextPointerUp}
        >
          {text}
        </div>
      )}

      {/* Typing Overlay */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 flex flex-col"
          >
             <div className="flex-1 flex items-center justify-center p-4">
                <textarea
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full bg-transparent text-center resize-none outline-none overflow-hidden"
                  style={{
                    fontFamily,
                    color: textColor,
                    fontSize: '40px',
                    fontWeight: 'bold',
                    textShadow: '0px 2px 10px rgba(0,0,0,0.5)'
                  }}
                  placeholder="Type something..."
                  rows={4}
                />
             </div>
             
             {/* Font & Color Pickers */}
             <div className="p-4 bg-black/40 backdrop-blur-md pb-safe">
               <div className="flex justify-between items-center mb-4">
                 <button onClick={() => setIsTyping(false)} className="text-white font-semibold">Done</button>
               </div>
               
               {/* Fonts */}
               <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-2">
                 {FONTS.map(f => (
                   <button
                     key={f.name}
                     onClick={() => setFontFamily(f.value)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full border-2 transition-all ${fontFamily === f.value ? "border-white bg-white/20" : "border-transparent bg-white/10 text-white/70"}`}
                     style={{ fontFamily: f.value }}
                   >
                     {f.name}
                   </button>
                 ))}
               </div>

               {/* Colors */}
               <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar px-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      className={`w-8 h-8 shrink-0 rounded-full border-2 ${textColor === c ? "border-white scale-110" : "border-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done Button */}
      {!isTyping && (
        <div className="absolute bottom-safe right-0 p-6 z-30 pointer-events-none">
          <button 
            onClick={bakeAndUpload}
            disabled={uploading}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 pointer-events-auto"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-7 h-7" />}
          </button>
        </div>
      )}
    </motion.div>,
    document.body
  );
}

