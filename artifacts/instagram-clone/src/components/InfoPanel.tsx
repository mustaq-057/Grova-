import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Video, Ban, Wifi, WifiOff, Search, Download, AlertCircle, Trash2 } from "lucide-react";
import { api, type ApiMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isOnline } from "@/lib/offline";
import { usePresenceLabel } from "@/hooks/usePresenceLabel";

interface InfoPanelProps {
  show: boolean;
  onClose: () => void;
  partnerName: string;
  partnerAvatar: string;
  partnerLastSeen: number | undefined;
  online: boolean;
  blocked: boolean;
  onToggleBlock: () => void;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

export const InfoPanel = memo(function InfoPanel({
  show,
  onClose,
  partnerName,
  partnerAvatar,
  partnerLastSeen,
  online,
  blocked,
  onToggleBlock,
  onAudioCall,
  onVideoCall,
}: InfoPanelProps) {
  const { user } = useAuth();
  const presence = usePresenceLabel(partnerLastSeen);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-full max-w-sm bg-card border-l border-border z-50 flex flex-col"
      >
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Info</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            aria-label="Close info panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center mb-6">
            <img
              src={partnerAvatar}
              alt={`Avatar of ${partnerName}`}
              className="w-24 h-24 rounded-full object-cover mb-3"
            />
            <h3 className="text-xl font-semibold">{partnerName}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {online ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  {presence.label}
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onAudioCall}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
              aria-label="Start audio call"
            >
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-medium">Audio Call</span>
            </button>
            <button
              onClick={onVideoCall}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95"
              aria-label="Start video call"
            >
              <Video className="w-5 h-5 text-primary" />
              <span className="font-medium">Video Call</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Actions</h4>
            <div className="space-y-2">
              <button
                onClick={onToggleBlock}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 ${
                  blocked ? "text-destructive hover:bg-destructive/10 focus:ring-destructive/50" : "hover:bg-secondary focus:ring-primary/50"
                }`}
                aria-label={blocked ? "Unblock user" : "Block user"}
              >
                <Ban className="w-5 h-5" />
                <span className="font-medium">{blocked ? "Unblock" : "Block"}</span>
              </button>

            </div>
          </div>

          {!isOnline() && (
            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-500">
                <p className="font-semibold">Offline Mode</p>
                <p className="text-xs mt-1">Messages will be sent when you're back online.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
