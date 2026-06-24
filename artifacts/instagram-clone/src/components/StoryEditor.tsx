import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, Loader2, ImagePlus, Type, Trash2 } from "lucide-react";
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
  { name: "Typewriter", value: "'Courier New', monospace" },
];

const COLORS = ["#FFFFFF", "#000000", "#FF3B30", "#34C759", "#007AFF", "#FF9500", "#AF52DE", "#FF2D55"];

interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
}

// ── Transformable image (pan + pinch) ─────────────────────────────────────────
function TransformableImage({
  src,
  onTransformChange,
  isMain,
  isTyping,
  onDragOver,           // called with { x, y } every frame so parent tracks position
  onDragEnd,            // called when pointer released
}: {
  src: string;
  onTransformChange: (x: number, y: number, s: number) => void;
  isMain?: boolean;
  isTyping?: boolean;
  onDragOver?: (pos: { x: number; y: number }) => void;
  onDragEnd?: (pos: { x: number; y: number }) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => { onTransformChange(0, 0, 1); }, []);

  const bind = useGesture(
    {
      onDrag: ({ offset: [ox, oy], xy: [px, py] }) => {
        if (isTyping) return;
        x.set(ox);
        y.set(oy);
        onTransformChange(ox, oy, scale.get());
        onDragOver?.({ x: px, y: py });
      },
      onDragEnd: ({ xy: [px, py] }) => {
        onDragEnd?.({ x: px, y: py });
      },
      onPinch: ({ offset: [s] }) => {
        if (isTyping) return;
        scale.set(s);
        onTransformChange(x.get(), y.get(), s);
      },
    },
    {
      drag: { from: () => [x.get(), y.get()] },
      pinch: {
        from: () => [scale.get(), 0],
        scaleBounds: { min: 0.1, max: 10 },
        eventOptions: { passive: false },
      },
    }
  );

  return (
    <motion.img
      {...(bind() as any)}
      src={src}
      style={{ x, y, scale, touchAction: "none" }}
      className={
        isMain
          ? "w-full h-full object-contain absolute inset-0 pointer-events-auto z-0"
          : "max-w-[50%] max-h-[50%] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 drop-shadow-xl border-2 border-white/80 rounded-xl object-contain"
      }
      draggable={false}
    />
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
  const [textPosition, setTextPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [mainTransform, setMainTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // Drag-to-delete state
  const [draggingStickerPos, setDraggingStickerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredBin, setHoveredBin] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // for confirm sheet

  const fileInputRef = useRef<HTMLInputElement>(null);
  const binRef = useRef<HTMLDivElement>(null);

  const textDragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
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
      setPendingDeleteId(id); // show confirm sheet
    }
  }, [isOverBin]);

  // Text drag
  const handleTextPointerDown = (e: React.PointerEvent) => {
    if (isTyping) return;
    textDragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: textPosition.x, initialY: textPosition.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleTextPointerMove = (e: React.PointerEvent) => {
    if (!textDragRef.current.isDragging) return;
    setTextPosition({ x: textDragRef.current.initialX + e.clientX - textDragRef.current.startX, y: textDragRef.current.initialY + e.clientY - textDragRef.current.startY });
  };
  const handleTextPointerUp = (e: React.PointerEvent) => {
    textDragRef.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleAddSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setStickers(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), url, x: 0, y: 0, scale: 1 }]);
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
        ctx.scale(mainTransform.scale, mainTransform.scale);
        const imgRatio = Math.min(W / mainImg.width, H / mainImg.height);
        ctx.drawImage(mainImg, -(mainImg.width * imgRatio) / 2, -(mainImg.height * imgRatio) / 2, mainImg.width * imgRatio, mainImg.height * imgRatio);
        ctx.restore();

        for (const sticker of stickers) {
          const sImg = await loadImage(sticker.url);
          ctx.save();
          ctx.translate(W / 2 + sticker.x, H / 2 + sticker.y);
          ctx.scale(sticker.scale, sticker.scale);
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
          ctx.font = `bold 40px ${fontFamily}`;
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 10;
          ctx.fillText(text, textPosition.x, textPosition.y);
        }

        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.85));
        if (!blob) throw new Error("Canvas export failed");
        finalBlob = blob;
      } else {
        if (text.trim()) {
          textOverlayObj = { text, fontFamily, textColor, x: textPosition.x / window.innerWidth, y: textPosition.y / window.innerHeight };
        }
      }

      const { url } = await api.uploadStoryToB2(finalBlob, isVideo ? "video" : "image");
      await api.addStory({ mediaUrl: url, text_overlay: textOverlayObj ? JSON.stringify(textOverlayObj) : undefined });
      onComplete();
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
            onTransformChange={(x, y, s) => setMainTransform({ x, y, scale: s })}
          />
        ) : null}

        {!isVideo && stickers.map(sticker => (
          <TransformableImage
            key={sticker.id}
            src={sticker.url}
            isTyping={isTyping}
            onTransformChange={(x, y, s) => setStickers(prev => prev.map(st => st.id === sticker.id ? { ...st, x, y, scale: s } : st))}
            onDragOver={pos => handleStickerDragOver(sticker.id, pos)}
            onDragEnd={pos => handleStickerDragEnd(sticker.id, pos)}
          />
        ))}

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
        <div
          className="absolute z-30 cursor-move text-center whitespace-pre-wrap select-none"
          style={{
            left: textPosition.x,
            top: textPosition.y,
            transform: "translate(-50%, -50%)",
            fontFamily,
            color: textColor,
            fontSize: "40px",
            fontWeight: "bold",
            textShadow: "0px 2px 10px rgba(0,0,0,0.5)",
            touchAction: "none",
          }}
          onPointerDown={handleTextPointerDown}
          onPointerMove={handleTextPointerMove}
          onPointerUp={handleTextPointerUp}
          onPointerCancel={handleTextPointerUp}
        >
          {text}
        </div>
      )}

      {/* Delete bin — appears at bottom center while dragging a sticker */}
      <AnimatePresence>
        {isDraggingAnySticker && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            ref={binRef}
            className="absolute bottom-safe mb-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none"
            style={{ bottom: "max(2rem, env(safe-area-inset-bottom))" }}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 ${hoveredBin ? "bg-red-500 scale-125" : "bg-black/60 border-2 border-white/30"}`}>
              <Trash2 className={`w-7 h-7 ${hoveredBin ? "text-white" : "text-white/70"}`} />
            </div>
            <span className="text-white/70 text-xs font-medium drop-shadow-sm">
              {hoveredBin ? "Release to delete" : "Drag here to delete"}
            </span>
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
                style={{ fontFamily, color: textColor, fontSize: "40px", fontWeight: "bold", textShadow: "0px 2px 10px rgba(0,0,0,0.5)" }}
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

      {/* Delete sticker confirm sheet */}
      <AnimatePresence>
        {pendingDeleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-50"
              onClick={() => setPendingDeleteId(null)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="absolute bottom-0 left-0 right-0 z-[51] bg-[#1c1c1e] rounded-t-2xl overflow-hidden"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
              <p className="text-center text-white/60 text-sm mb-4 px-6">Remove this image from your story?</p>
              <div className="border-t border-white/10">
                <button
                  onClick={() => { setStickers(prev => prev.filter(s => s.id !== pendingDeleteId)); setPendingDeleteId(null); }}
                  className="w-full py-4 text-red-500 font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-5 h-5" /> Delete Image
                </button>
              </div>
              <div className="border-t border-white/10">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  className="w-full py-4 text-white font-medium text-base hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}
