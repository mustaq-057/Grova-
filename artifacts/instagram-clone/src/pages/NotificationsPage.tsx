import { MOCK_USERS } from "@/lib/mock-data";
import { Heart, UserPlus } from "lucide-react";

const NOTIFICATIONS = [
  { id: "n1", type: "like" as const, user: MOCK_USERS[1], text: "liked your photo.", timeAgo: "2m", postImage: "https://picsum.photos/seed/post1/80/80" },
  { id: "n2", type: "follow" as const, user: MOCK_USERS[2], text: "started following you.", timeAgo: "15m", postImage: null },
  { id: "n3", type: "like" as const, user: MOCK_USERS[3], text: "liked your photo.", timeAgo: "1h", postImage: "https://picsum.photos/seed/coast800/80/80" },
  { id: "n4", type: "follow" as const, user: MOCK_USERS[4], text: "started following you.", timeAgo: "3h", postImage: null },
  { id: "n5", type: "like" as const, user: MOCK_USERS[5], text: "liked your photo.", timeAgo: "5h", postImage: "https://picsum.photos/seed/arch900/80/80" },
  { id: "n6", type: "like" as const, user: MOCK_USERS[0], text: "liked your photo.", timeAgo: "1d", postImage: "https://picsum.photos/seed/forest44/80/80" },
  { id: "n7", type: "follow" as const, user: MOCK_USERS[6], text: "started following you.", timeAgo: "2d", postImage: null },
];

export default function NotificationsPage() {
  return (
    <div className="max-w-[470px] mx-auto pb-16 md:pb-4">
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-base font-semibold">Notifications</h1>
      </div>

      <div className="divide-y divide-border">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer" data-testid={`notification-${n.id}`}>
            <div className="relative shrink-0">
              <img src={n.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 ${n.type === "like" ? "bg-red-500" : "bg-blue-500"}`}>
                {n.type === "like"
                  ? <Heart className="w-3 h-3 text-white fill-white" />
                  : <UserPlus className="w-3 h-3 text-white" />
                }
              </div>
            </div>
            <p className="text-sm flex-1 leading-snug">
              <span className="font-semibold">{n.user.username}</span>{" "}
              <span className="text-muted-foreground">{n.text}</span>{" "}
              <span className="text-muted-foreground text-xs">{n.timeAgo}</span>
            </p>
            {n.postImage && (
              <img src={n.postImage} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
