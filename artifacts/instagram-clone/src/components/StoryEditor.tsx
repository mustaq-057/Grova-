import { useState, useRef, useEffect } from "react";
import { X, Check, Type, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
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

export function StoryEditor({ file, onClose, onComplete }: StoryEditorProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; initialX: number; initialY: number }>({
    isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0
  });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTyping) return;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const bakeAndUpload = async () => {
    setUploading(true);
    try {
      const img = new Image();
      img.src = imageUrl;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Draw the text
      if (text.trim()) {
        const scaleX = img.width / window.innerWidth;
        const scaleY = img.height / window.innerHeight;
        
        ctx.font = `bold ${Math.round(40 * scaleY)}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Add a subtle shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10 * scaleY;
        ctx.shadowOffsetX = 2 * scaleY;
        ctx.shadowOffsetY = 2 * scaleY;

        ctx.fillText(text, position.x * scaleX, position.y * scaleY);
      }

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.8));
      if (!blob) throw new Error("Canvas export failed");

      // Upload to B2
      const { url } = await api.uploadStoryToB2(blob);
      
      // Save to DB
      await api.addStory({ mediaUrl: url });
      
      onComplete();
    } catch (err) {
      console.error("Failed to upload story", err);
      alert("Failed to upload story. Please try again.");
      setUploading(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col font-sans touch-none"
    >
      <div className="absolute inset-0">
        {imageUrl && <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
      </div>

      {!isTyping && (
        <div className="absolute top-safe left-0 right-0 p-4 flex justify-between items-center z-10">
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full">
            <X className="w-7 h-7 drop-shadow-md" />
          </button>
          <button onClick={() => setIsTyping(true)} className="p-2 text-white hover:bg-white/10 rounded-full">
            <Type className="w-7 h-7 drop-shadow-md" />
          </button>
        </div>
      )}

      {/* Render the draggable text */}
      {!isTyping && text && (
        <div 
          className="absolute z-20 cursor-move text-center whitespace-pre-wrap select-none"
          style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translate(-50%, -50%)',
            fontFamily,
            color: textColor,
            fontSize: '40px',
            fontWeight: 'bold',
            textShadow: '0px 2px 10px rgba(0,0,0,0.5)',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
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
            className="absolute inset-0 z-30 bg-black/60 flex flex-col"
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
        <div className="absolute bottom-safe right-0 p-6 z-10">
          <button 
            onClick={bakeAndUpload}
            disabled={uploading}
            className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-7 h-7" />}
          </button>
        </div>
      )}
    </motion.div>,
    document.body
  );
}
