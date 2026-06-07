import { memo } from "react";

type Props = {
  isMe: boolean;
  partnerName: string;
};

export const DeletedMessageNotice = memo(function DeletedMessageNotice({ isMe, partnerName }: Props) {
  return (
    <div className="my-2 px-3 text-center" data-testid="message-deleted">
      <p className="text-xs text-muted-foreground/80 italic">
        {isMe ? "Unsent" : `${partnerName} unsent a message`}
      </p>
    </div>
  );
});
