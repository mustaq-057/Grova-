import { memo } from "react";

type Props = {
  isMe: boolean;
  partnerName: string;
};

export const DeletedMessageNotice = memo(function DeletedMessageNotice({ isMe, partnerName }: Props) {
  return (
    <div className="my-5 px-6 text-center max-w-md mx-auto" data-testid="message-deleted">
      <p className="text-sm text-muted-foreground font-medium">
        {isMe ? "You deleted a message" : `${partnerName} deleted a message`}
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-2 leading-relaxed">
        Messages can be deleted within 3 minutes after sending. They may have already been seen or
        forwarded, and they may also be reported.
      </p>
    </div>
  );
});
