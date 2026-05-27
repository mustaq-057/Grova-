import { useState, useRef } from "react";
import { ImagePlus, MapPin, Tag, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Create() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [step, setStep] = useState<"upload" | "edit">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setStep("edit");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    setPreview(null);
    setCaption("");
    setLocation("");
    setStep("upload");
  };

  return (
    <div className="max-w-[640px] mx-auto px-4 py-6 pb-16 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Create new post</h1>
        {step === "edit" && (
          <button
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-reset"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {step === "upload" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 py-20 cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="upload-dropzone"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <ImagePlus className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">Drag and drop a photo</p>
            <p className="text-sm text-muted-foreground mt-1">or click to select from your device</p>
          </div>
          <button
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="button-select-photo"
          >
            Select from device
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            data-testid="input-file"
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {/* Preview image */}
          {preview && (
            <div className="rounded-xl overflow-hidden aspect-square w-full">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" data-testid="img-preview" />
            </div>
          )}

          {/* Caption */}
          <div className="border border-border rounded-xl p-3">
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground text-foreground"
              maxLength={2200}
              data-testid="input-caption"
            />
            <div className="flex justify-between items-center mt-2 border-t border-border pt-2">
              <span className="text-xs text-muted-foreground">{caption.length} / 2200</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground text-foreground"
                data-testid="input-location"
              />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Tag people */}
          <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tag people</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Advanced settings row */}
          <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors">
            <span className="text-sm text-muted-foreground">Advanced settings</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Share button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            data-testid="button-share"
          >
            Share
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
