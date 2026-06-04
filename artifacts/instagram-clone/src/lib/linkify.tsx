import { memo, useMemo } from "react";

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/gi;

export function splitTextWithUrls(text: string): Array<{ type: "text" | "url"; value: string }> {
  const parts: Array<{ type: "text" | "url"; value: string }> = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    parts.push({ type: "url", value: match[0] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length ? parts : [{ type: "text", value: text }];
}

type Props = {
  text: string;
  className?: string;
};

export const MessageText = memo(function MessageText({ text, className }: Props) {
  const parts = useMemo(() => splitTextWithUrls(text), [text]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === "url" ? (
          <a
            key={`${i}-${part.value}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part.value}
          </a>
        ) : (
          <span key={`${i}-t`}>{part.value}</span>
        ),
      )}
    </span>
  );
});
