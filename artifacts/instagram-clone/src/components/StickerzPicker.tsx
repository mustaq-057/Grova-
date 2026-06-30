import { useState, useMemo, useEffect } from "react";
import { getLocalBlobUrl } from "@/lib/media-url";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CUSTOM_STICKERZ, type CustomSticker, getAllStickers, addCustomSticker, removeCustomSticker } from "@/lib/stickerz";
import { uploadMediaFile } from "@/lib/media-upload";
import { Plus, Loader2, Crop } from "lucide-react";
import Cropper from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(new File([blob], "cropped.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", 0.95);
  });
}

interface StickerzPickerProps {
  onSelect: (sticker: CustomSticker) => void;
  onClose: () => void;
}

export function StickerzPicker({ onSelect, onClose }: StickerzPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stickers, setStickers] = useState(getAllStickers);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<"list" | "crop" | "caption">("list");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [stickerToDelete, setStickerToDelete] = useState<CustomSticker | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const onUpdate = () => setStickers(getAllStickers());
    window.addEventListener("custom_stickerz_updated", onUpdate);
    return () => window.removeEventListener("custom_stickerz_updated", onUpdate);
  }, []);

  const filteredStickers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query 
      ? stickers.filter(s => s.caption.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
      : stickers;
  }, [searchQuery, stickers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setUploadCaption("");
    setStep("crop");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleNextCrop = async () => {
    if (!croppedAreaPixels || !uploadPreview) return;
    try {
      const croppedFile = await getCroppedImg(uploadPreview, croppedAreaPixels);
      if (croppedFile) {
        setUploadFile(croppedFile);
        setUploadPreview(URL.createObjectURL(croppedFile));
        setStep("caption");
      }
    } catch (e) {
      console.error(e);
      setAlertMessage("Failed to crop image.");
    }
  };

  const handleSave = async () => {
    if (!uploadFile) return;
    setIsSaving(true);
    try {
      const url = await uploadMediaFile(uploadFile, uploadFile.type);
      addCustomSticker(url, uploadCaption || "custom sticker");
      setUploadFile(null);
      setUploadPreview("");
      setStep("list");
    } catch (err) {
      console.error("Failed to upload custom sticker", err);
      setAlertMessage("Failed to save sticker. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, sticker: CustomSticker) => {
    if (sticker.category === "Custom") {
      e.preventDefault();
      setStickerToDelete(sticker);
    }
  };

  const confirmDelete = () => {
    if (stickerToDelete) {
      removeCustomSticker(stickerToDelete.id);
      setStickerToDelete(null);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed z-[301] bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-24 md:w-[400px] md:rounded-3xl bg-[#1c1c1c] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-[70vh] md:h-[600px] border border-white/10"
        role="dialog"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold text-white">Stickerz</h2>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {stickerToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
                <h3 className="text-white text-lg font-bold">Delete Sticker?</h3>
                <p className="text-white/70 text-sm">Are you sure you want to delete "{stickerToDelete.caption}"? This cannot be undone.</p>
                <div className="flex justify-end gap-3 mt-2">
                  <button onClick={() => setStickerToDelete(null)} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors">Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
                </div>
              </div>
            </motion.div>
          )}

          {alertMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 w-full max-w-xs flex flex-col gap-4 items-center text-center shadow-2xl">
                <h3 className="text-white text-lg font-bold">Notice</h3>
                <p className="text-white/70 text-sm">{alertMessage}</p>
                <button onClick={() => setAlertMessage(null)} className="mt-2 w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors">OK</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step === "list" && (
          <div className="px-4 py-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stickerz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {step === "crop" ? (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 pb-24">
            <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-black border border-white/10">
              <Cropper
                image={uploadPreview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="flex gap-3 w-full shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUploadFile(null);
                  setUploadPreview("");
                  setStep("list");
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextCrop}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Crop className="w-4 h-4" />
                Next
              </button>
            </div>
          </div>
        ) : step === "caption" ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center p-6 gap-6">
            <div className="w-40 h-40 shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-2 shadow-xl mt-4">
              <img src={uploadPreview} alt="preview" className="w-full h-full object-contain" />
            </div>
            <input
              type="text"
              placeholder="Give it a caption (e.g., 'angry cat')"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full max-w-sm shrink-0 bg-[#2a2a2a] text-white text-center rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3 w-full max-w-sm shrink-0 mt-auto pb-24">
              <button
                type="button"
                onClick={() => setStep("crop")}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-24">
          {filteredStickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <p>No stickerz found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <label className="group flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border border-dashed border-white/20 hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="w-full aspect-square rounded-lg flex items-center justify-center">
                  <Plus className="w-8 h-8 text-white/50 group-hover:text-white/80" />
                </div>
                <span className="text-[9px] text-center text-white/50 w-full pb-1">Add Custom</span>
              </label>
              {filteredStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => onSelect(sticker)}
                  onContextMenu={(e) => handleContextMenu(e, sticker)}
                  className="group flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-white/10 transition-colors active:scale-95 relative"
                >
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                    <img 
                      src={getLocalBlobUrl(sticker.url) || sticker.url} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 text-transparent"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                  <span className="text-[9px] text-center text-white/70 break-words w-full px-1 pb-1 group-hover:text-white">
                    {sticker.caption}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </motion.div>
    </>
  );
}
