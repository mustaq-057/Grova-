import { memo } from "react";
import { Download, ExternalLink, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { browserViewUrl, inlineMediaDownloadUrl } from "@/lib/file-view";

type Props = {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType?: string;
};

export const MobileFileOpenSheet = memo(function MobileFileOpenSheet({
  open,
  onClose,
  fileUrl,
  fileName,
  mimeType,
}: Props) {
  const viewUrl = browserViewUrl(fileUrl, fileName, mimeType);
  const downloadUrl = inlineMediaDownloadUrl(fileUrl, fileName, mimeType);

  const saveToDevice = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    onClose();
  };

  const openInBrowser = () => {
    window.open(viewUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const shareFile = async () => {
    try {
      const res = await fetch(downloadUrl, { credentials: "include" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: mimeType || blob.type || "application/octet-stream" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        onClose();
        return;
      }
    } catch {
      /* fall through */
    }
    saveToDevice();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-black/50 flex items-end justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold truncate pr-2">{fileName}</p>
              <button type="button" onClick={onClose} className="p-1 text-muted-foreground" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Choose how to open this file on your phone</p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={saveToDevice}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium"
              >
                <Download className="w-5 h-5 text-primary" />
                Save to device / Downloads
              </button>
              <button
                type="button"
                onClick={openInBrowser}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium"
              >
                <ExternalLink className="w-5 h-5 text-primary" />
                Open in browser
              </button>
              {"share" in navigator ? (
                <button
                  type="button"
                  onClick={() => void shareFile()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium"
                >
                  <Share2 className="w-5 h-5 text-primary" />
                  Share to Drive / other apps
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
});
