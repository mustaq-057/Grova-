import { memo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import type { ApiMessage } from "@/lib/api";
import {
  browserViewUrl,
  inlineMediaDownloadUrl,
  isMobileDevice,
  openFileInBrowser,
} from "@/lib/file-view";
import { MobileFileOpenSheet } from "@/components/MobileFileOpenSheet";

type Props = {
  msg: ApiMessage;
  isMe: boolean;
};

function fileIcon(mime?: string, name?: string): string {
  const m = mime ?? "";
  const n = (name ?? "").toLowerCase();
  if (m.includes("pdf") || n.endsWith(".pdf")) return "📄";
  if (m.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(n)) return "🎬";
  if (m.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/i.test(n)) return "🎵";
  if (m.includes("zip") || n.endsWith(".zip") || n.endsWith(".rar")) return "🗜️";
  if (m.includes("word") || n.endsWith(".doc") || n.endsWith(".docx")) return "📝";
  if (m.includes("sheet") || n.endsWith(".xls") || n.endsWith(".xlsx")) return "📊";
  if (m.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(n)) return "🖼️";
  if (m.includes("presentation") || n.endsWith(".ppt") || n.endsWith(".pptx")) return "📊";
  return "📎";
}

export const ChatFileBubble = memo(function ChatFileBubble({ msg, isMe }: Props) {
  const url = msg.fileData ?? "";
  const name = msg.text?.replace(/ · Uploading…$/, "") || "document";
  const uploading = msg.type === "file" && !url;
  const viewHref = url ? browserViewUrl(url, name, msg.fileType) : "";
  const saveHref = url ? inlineMediaDownloadUrl(url, name, msg.fileType) : "";
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const openView = (e: MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    if (isMobileDevice()) {
      setMobileSheetOpen(true);
      return;
    }
    openFileInBrowser(url, name, msg.fileType);
  };

  const textClass = isMe ? "text-white" : "text-foreground";
  const subClass = isMe ? "text-white/70" : "text-muted-foreground";
  const btnClass = isMe
    ? "bg-white/20 text-white hover:bg-white/30"
    : "bg-secondary text-foreground hover:bg-secondary/80";

  return (
    <>
      <div
        className={`flex flex-col gap-2 p-3 rounded-xl min-w-[200px] max-w-[min(280px,85vw)] ${
          isMe ? "bg-black/20" : "bg-secondary/80"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${!uploading && url ? "cursor-pointer" : ""}`}
          {...(!uploading && url ? { role: "button" } : {})}
          tabIndex={!uploading && url ? 0 : undefined}
          onClick={!uploading && url ? openView : undefined}
          onKeyDown={
            !uploading && url
              ? (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isMobileDevice()) setMobileSheetOpen(true);
                    else openFileInBrowser(url, name, msg.fileType);
                  }
                }
              : undefined
          }
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isMe ? "bg-white/10" : "bg-background/50"
            }`}
          >
            {uploading ? (
              <Loader2 className={`w-5 h-5 animate-spin ${isMe ? "text-white" : "text-primary"}`} />
            ) : (
              <span className="text-lg">{fileIcon(msg.fileType, name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${textClass}`}>{name}</p>
            <p className={`text-xs ${subClass}`}>
              {uploading
                ? "Uploading…"
                : msg.fileSize
                  ? `${(msg.fileSize / (1024 * 1024)).toFixed(1)} MB`
                  : msg.fileType || "File"}
            </p>
          </div>
        </div>

        {!uploading && url ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openView}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${btnClass}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isMobileDevice() ? "Open" : "View"}
            </button>
            <a
              href={saveHref}
              target="_blank"
              rel="noopener noreferrer"
              download={name}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${btnClass}`}
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </a>
          </div>
        ) : null}
      </div>

      <MobileFileOpenSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        fileUrl={url}
        fileName={name}
        mimeType={msg.fileType}
      />
    </>
  );
});
