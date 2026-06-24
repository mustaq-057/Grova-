import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, Loader2, ImagePlus, Type, Trash2 } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useGesture } from "@use-gesture/react";
import ReactDOM from "react-dom";
import { api } from "../lib/api";
import { uploadMediaFile } from "../lib/media-upload";

interface StoryEditorProps {
  file: File;
  onClose: () => void;
  onComplete: (uploaded?: boolean, story?: any) => void;
}

const FONTS = [
  { name: "Classic", value: "system-ui, sans-serif" },
  { name: "Modern", value: "'Inter', sans-serif" },
  { name: "Signature", value: "'Brush Script MT', cursive" },
  { name: "Typewriter", value: "'Courier New', monospace" },
];

const COLORS = ["#FFFFFF", "#000000", "#FF3B30", "#34C759", "#007AFF", "#FF9500", "#AF52DE", "#FF2D55"];

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  flipped: boolean;
}

// ── Transformable image (pan + pinch + rotate + tap to flip) ──────────────────
function TransformableImage({
  src,
  onTransformChange,
  isMain,
  isTyping,
  onDragOver,           // called with { x, y } every frame so parent tracks position
  onDragEnd,            // called when pointer released
  flipped,
  onFlipToggle,
}: {
  src: string;
  onTransformChange: (x: number, y: number, s: number, r: number) => void;
  isMain?: boolean;
  isTyping?: boolean;
  onDragOver?: (pos: { x: number; y: number }) => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
  flipped: boolean;
  onFlipToggle: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  useEffect(() => { onTransformChange(0, 0, 1, 0); }, []);

  const scaleX = useTransform(scale, (s) => (flipped ? -s : s));

  const bind = useGesture(
    {
      onDrag: ({ offset: [ox, oy], xy: [px, py], tap }) => {
        if (isTyping) return;
        if (tap) {
          onFlipToggle();
          return;
        }
        x.set(ox);
        y.set(oy);
        onTransformChange(ox, oy, scale.get(), rotate.get());
        onDragOver?.({ x: px, y: py });
      },
      onDragEnd: ({ xy: [px, py], tap }) => {
        if (tap) return;
        onDragEnd?.({ x: px, y: py });
      },
      onPinch: ({ offset: [s, a] }) => {
        if (isTyping) return;
        scale.set(s);
        rotate.set(a);
        onTransformChange(x.get(), y.get(), s, a);
      },
    },
    {
      drag: { 
        from: () => [x.get(), y.get()],
        filterTaps: true,
      },
      pinch: {
        from: () => [scale.get(), rotate.get()],
        scaleBounds: { min: 0.1, max: 10 },
        eventOptions: { passive: false },
      },
    }
  );

  return (
    <motion.img
      {...(bind() as any)}
      src={src}
      style={{ 
        x, 
        y, 
        scaleX,
        scaleY: scale,
        rotate,
        touchAction: "none" 
      }}
      initial={isMain ? false : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={
        isMain
          ? "w-full h-full object-contain absolute inset-0 pointer-events-auto z-0"
          : "max-w-[50%] max-h-[50%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 drop-shadow-xl border-2 border-white/80 rounded-xl object-contain"
      }
      draggable={false}
    />
  );
}

function DraggableText({
  text, fontFamily, color, isTyping,
  onTransformChange, onDragOver, onDragEnd
}: {
  text: string; fontFamily: string; color: string; isTyping: boolean;
  onTransformChange: (x: number, y: number, scale: number, rotate: number) => void;
  onDragOver?: (pos: { x: number; y: number }) => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);

  const bind = useGesture(
    {
      onDrag: ({ offset: [ox, oy], xy: [px, py] }) => {
        if (isTyping) return;
        x.set(ox);
        y.set(oy);
        onTransformChange(ox, oy, scale.get(), rotate.get());
        onDragOver?.({ x: px, y: py });
      },
      onDragEnd: ({ xy: [px, py] }) => {
        onDragEnd?.({ x: px, y: py });
      },
      onPinch: ({ offset: [s, a] }) => {
        if (isTyping) return;
        scale.set(s);
        rotate.set(a);
        onTransformChange(x.get(), y.get(), s, a);
      },
    },
    {
      drag: { from: () => [x.get(), y.get()] },
      pinch: {
        from: () => [scale.get(), rotate.get()],
        scaleBounds: { min: 0.5, max: 4 },
        eventOptions: { passive: false },
      },
    }
  );

  return (
    <motion.div
      {...(bind() as any)}
      style={{
        x, y, scale, rotate, touchAction: "none",
        fontFamily, color,
        fontSize: "clamp(24px, 8vw, 36px)",
        fontWeight: "bold",
        textShadow: "0px 2px 10px rgba(0,0,0,0.5)",
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto text-center whitespace-pre-wrap select-none"
    >
      {text}
    </motion.div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────
export function StoryEditor({ file, onClose, onComplete }: StoryEditorProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [textColor, setTextColor] = useState(COLORS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [textTransform, setTextTransform] = useState({ x: 0, y: 0, scale: 1, rotate: 0 });
  const [mainTransform, setMainTransform] = useState({ x: 0, y: 0, scale: 1, rotate: 0, flipped: false });
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // Drag-to-delete state
  const [draggingStickerPos, setDraggingStickerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBin, setHoveredBin] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const binRef = useRef<HTMLDivElement>(null);
  const isVideo = file.type.startsWith("video");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Check if drag position is over the delete bin
  const isOverBin = useCallback((pos: { x: number; y: number }) => {
    const bin = binRef.current;
    if (!bin) return false;
    const rect = bin.getBoundingClientRect();
    return pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom;
  }, []);

  const handleStickerDragOver = useCallback((id: string, pos: { x: number; y: number }) => {
    setDraggingStickerPos(pos);
    setHoveredBin(isOverBin(pos));
  }, [isOverBin]);

  const handleStickerDragEnd = useCallback((id: string, pos: { x: number; y: number }) => {
    setDraggingStickerPos(null);
    setHoveredBin(false);
    if (isOverBin(pos)) {
      setStickers(prev => prev.filter(s => s.id !== id));
    }
  }, [isOverBin]);
  const handleAddSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setStickers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), url, x: 0, y: 0, scale: 1, rotate: 0, flipped: false }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const bakeAndUpload = async () => {
    setUploading(true);
    try {
      let finalBlob: Blob | File = file;
      let textOverlayObj = null;

      if (!isVideo) {
        const dpr = 2;
        const canvas = document.createElement("canvas");
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");
        ctx.scale(dpr, dpr);

        const mainImg = await loadImage(imageUrl);
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.filter = "blur(30px) brightness(0.6)";
        const bgRatio = Math.max(W / mainImg.width, H / mainImg.height);
        ctx.drawImage(mainImg, (W - mainImg.width * bgRatio) / 2, (H - mainImg.height * bgRatio) / 2, mainImg.width * bgRatio, mainImg.height * bgRatio);
        ctx.restore();

        ctx.save();
        ctx.translate(W / 2 + mainTransform.x, H / 2 + mainTransform.y);
        ctx.rotate((mainTransform.rotate * Math.PI) / 180);
        ctx.scale(mainTransform.flipped ? -mainTransform.scale : mainTransform.scale, mainTransform.scale);
        const imgRatio = Math.min(W / mainImg.width, H / mainImg.height);
        ctx.drawImage(mainImg, -(mainImg.width * imgRatio) / 2, -(mainImg.height * imgRatio) / 2, mainImg.width * imgRatio, mainImg.height * imgRatio);
        ctx.restore();

        for (const sticker of stickers) {
          const sImg = await loadImage(sticker.url);
          ctx.save();
          ctx.translate(W / 2 + sticker.x, H / 2 + sticker.y);
          ctx.rotate((sticker.rotate * Math.PI) / 180);
          ctx.scale(sticker.flipped ? -sticker.scale : sticker.scale, sticker.scale);
          const sRatio = Math.min((W * 0.5) / sImg.width, (H * 0.5) / sImg.height);
          const sdw = sImg.width * sRatio;
          const sdh = sImg.height * sRatio;
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 5;
          ctx.beginPath();
          ctx.roundRect(-sdw / 2, -sdh / 2, sdw, sdh, 12);
          ctx.clip();
          ctx.drawImage(sImg, -sdw / 2, -sdh / 2, sdw, sdh);
          ctx.restore();
        }

        if (text.trim()) {
          ctx.save();
          ctx.translate(W / 2 + textTransform.x, H / 2 + textTransform.y);
          ctx.rotate((textTransform.rotate * Math.PI) / 180);
          ctx.scale(textTransform.scale, textTransform.scale);
          ctx.font = `bold 36px ${fontFamily}`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }

        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.85));
        if (!blob) throw new Error("Canvas export failed");
        finalBlob = blob;
      } else {
        if (text.trim()) {
          textOverlayObj = { 
            text, 
            fontFamily, 
            textColor, 
            x: (window.innerWidth / 2 + textTransform.x) / window.innerWidth, 
            y: (window.innerHeight / 2 + textTransform.y) / window.innerHeight,
            scale: textTransform.scale,
            rotate: textTransform.rotate
          };
        }
      }

      // Use the blob's actual content type (video/webm from camera, image/jpeg from canvas)
      const mime = finalBlob instanceof File ? finalBlob.type : isVideo ? "video/mp4" : "image/jpeg";
      const url = await uploadMediaFile(finalBlob, mime || (isVideo ? "video/mp4" : "image/jpeg"));
      const story = await api.addStory({ mediaUrl: url, kind: isVideo ? "reel" : "story", text_overlay: textOverlayObj ? JSON.stringify(textOverlayObj) : undefined });
      onComplete(true, story);
    } catch (err) {
      console.error("Failed to upload story", err);
      alert("Failed to upload story. Please try again.");
      setUploading(false);
    }
  };

  const isDraggingAnySticker = draggingStickerPos !== null;

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col font-sans touch-none overflow-hidden"
    >
      {/* Blurred background */}
      {!isVideo && imageUrl && (
        <div
          className="absolute inset-0 z-0 scale-110"
          style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(30px) brightness(0.5)" }}
        />
      )}

      {/* Media layer */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        {imageUrl && isVideo ? (
          <video src={imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-auto" />
        ) : imageUrl ? (
          <TransformableImage
            src={imageUrl}
            isMain
            isTyping={isTyping}
            flipped={mainTransform.flipped}
            onFlipToggle={() => setMainTransform(prev => ({ ...prev, flipped: !prev.flipped }))}
            onTransformChange={(x, y, s, r) => setMainTransform(prev => ({ ...prev, x, y, scale: s, rotate: r }))}
            onDragOver={pos => {
              setDraggingStickerPos(pos);
              setHoveredBin(isOverBin(pos));
            }}
            onDragEnd={pos => {
              setDraggingStickerPos(null);
              setHoveredBin(false);
              if (isOverBin(pos)) onClose(); // discard story if main image dropped in bin
            }}
          />
        ) : null}

        {!isVideo && (
          <AnimatePresence>
            {stickers.map(sticker => (
              <TransformableImage
                key={sticker.id}
                src={sticker.url}
                isTyping={isTyping}
                flipped={sticker.flipped}
                onFlipToggle={() => setStickers(prev => prev.map(st => st.id === sticker.id ? { ...st, flipped: !st.flipped } : st))}
                onTransformChange={(x, y, s, r) => setStickers(prev => prev.map(st => st.id === sticker.id ? { ...st, x, y, scale: s, rotate: r } : st))}
                onDragOver={pos => handleStickerDragOver(sticker.id, pos)}
                onDragEnd={pos => handleStickerDragEnd(sticker.id, pos)}
              />
            ))}
          </AnimatePresence>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Top Controls — Close | ImagePlus | Aa  |  (space)  |  ✓ Done */}
      {!isTyping && (
        <div className="absolute top-safe left-0 right-0 z-30 px-4 pt-4 flex items-center justify-between pointer-events-none">
          {/* Left group */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <X className="w-7 h-7 drop-shadow-md" />
            </button>

            {!isVideo && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                title="Add image sticker"
              >
                <ImagePlus className="w-6 h-6 drop-shadow-md" />
              </button>
            )}

            {/* Aa button — now in left group, right after ImagePlus */}
            <button
              onClick={() => setIsTyping(true)}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto flex items-center justify-center"
              title="Add text"
            >
              <span className="font-serif font-bold text-[26px] drop-shadow-md leading-none">Aa</span>
            </button>
          </div>

          {/* Right — Done / upload button */}
          <button
            onClick={bakeAndUpload}
            disabled={uploading}
            className="w-13 h-13 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 pointer-events-auto"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-7 h-7" />}
          </button>
        </div>
      )}

      {/* Draggable text */}
      {!isTyping && text && (
        <DraggableText
          text={text}
          fontFamily={fontFamily}
          color={textColor}
          isTyping={isTyping}
          onTransformChange={(x, y, s, r) => setTextTransform({ x, y, scale: s, rotate: r })}
          onDragOver={pos => {
            setDraggingStickerPos(pos);
            setHoveredBin(isOverBin(pos));
          }}
          onDragEnd={(pos) => {
            setDraggingStickerPos(null);
            setHoveredBin(false);
            if (isOverBin(pos)) setText("");
          }}
        />
      )}

      {/* Delete bin — appears at bottom center while dragging */}
      <AnimatePresence>
        {isDraggingAnySticker && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.6 }}
            transition={{ type: "spring", damping: 18, stiffness: 300 }}
            ref={binRef}
            className="absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
            style={{ bottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
          >
            <motion.div
              animate={hoveredBin ? {
                scale: [1.2, 1.35, 1.2],
                rotate: [-6, 6, -6, 0],
              } : { scale: 1, rotate: 0 }}
              transition={hoveredBin ? { repeat: Infinity, duration: 0.4 } : { duration: 0.2 }}
              className={`w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-2xl transition-colors duration-150 ${
                hoveredBin
                  ? "bg-red-500 shadow-red-500/60"
                  : "bg-black/70 border-2 border-white/40 backdrop-blur-md"
              }`}
              style={hoveredBin ? { boxShadow: "0 0 32px rgba(239,68,68,0.8), 0 0 64px rgba(239,68,68,0.4)" } : {}}
            >
              <Trash2
                className={`w-8 h-8 transition-all duration-150 ${
                  hoveredBin ? "text-white drop-shadow-lg" : "text-white/70"
                }`}
              />
            </motion.div>
            <motion.span
              animate={hoveredBin ? { opacity: 1, scale: 1.05 } : { opacity: 0.7, scale: 1 }}
              className={`text-xs font-semibold drop-shadow-lg tracking-wide ${
                hoveredBin ? "text-red-400" : "text-white/70"
              }`}
            >
              {hoveredBin ? "🔥 Release to delete" : "Drag here to delete"}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleAddSticker} accept="image/*" className="hidden" />

      {/* Text editing overlay */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/60 flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center p-4">
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full bg-transparent text-center resize-none outline-none overflow-hidden"
                style={{ fontFamily, color: textColor, fontSize: "clamp(24px, 8vw, 36px)", fontWeight: "bold", textShadow: "0px 2px 10px rgba(0,0,0,0.5)" }}
                placeholder="Type something..."
                rows={4}
              />
            </div>

            <div className="p-4 bg-black/40 backdrop-blur-md" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setIsTyping(false)} className="text-white font-semibold px-4 py-1">Done</button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: "none" }}>
                {FONTS.map(f => (
                  <button
                    key={f.name}
                    onClick={() => setFontFamily(f.value)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full border-2 transition-all text-white text-sm ${fontFamily === f.value ? "border-white bg-white/20" : "border-transparent bg-white/10 text-white/70"}`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 px-2" style={{ scrollbarWidth: "none" }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setTextColor(c)}
                    className={`w-8 h-8 shrink-0 rounded-full border-2 transition-all ${textColor === c ? "border-white scale-110" : "border-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Removed confirm sheet */}
    </motion.div>,
    document.body
  );
}
