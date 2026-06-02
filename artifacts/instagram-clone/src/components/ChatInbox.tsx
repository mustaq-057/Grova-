import { memo } from "react";
import { Search } from "lucide-react";
import { usePresenceLabel } from "@/hooks/usePresenceLabel";
import { AvatarImage } from "@/components/AvatarImage";

type Props = {
  userName: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerLastSeen?: number;
  lastPreview?: string;
  active: boolean;
};

export const ChatInbox = memo(function ChatInbox({
  userName,
  partnerId,
  partnerName,
  partnerAvatar,
  partnerLastSeen,
  lastPreview,
  active,
}: Props) {
  const presence = usePresenceLabel(partnerLastSeen);

  return (
    <aside className="hidden lg:flex flex-col w-[280px] border-r border-border bg-background shrink-0 h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-base truncate">{userName}</span>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search"
            className="w-full bg-secondary/60 rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-semibold text-sm">Messages</span>
      </div>

      <button
        type="button"
        className={`flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-left transition-colors ${active ? "bg-secondary" : "hover:bg-secondary/60"}`}
      >
        <AvatarImage src={partnerAvatar} userId={partnerId} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{partnerName}</p>
          <p className="text-xs text-muted-foreground truncate">{lastPreview || presence.label}</p>
        </div>
        {presence.online && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
      </button>
    </aside>
  );
});
