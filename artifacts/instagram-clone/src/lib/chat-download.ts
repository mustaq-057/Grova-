import type { ApiMessage } from "./api";
import { messagePreview, scrubUndecryptedServerText } from "./message-utils";

const W = 480;
const PAD = 20;
const BUBBLE_MAX = 320;
const LINE_H = 18;
const GAP = 12;
const HEADER_H = 72;
const MAX_PAGE_HEIGHT = 12000;
const MAX_MESSAGES_PER_PAGE = 120;
const IMAGE_BLOCK_H = 180;
const GIF_BLOCK_H = 180;
const META_H = 14;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function exportBody(msg: ApiMessage): string {
  const cleaned = scrubUndecryptedServerText(msg);
  if (cleaned.type === "text" && cleaned.text?.trim()) {
    if (cleaned.text.startsWith("🔒")) return cleaned.text;
    return cleaned.text.trim();
  }
  return messagePreview(cleaned);
}

function formatExportLine(msg: ApiMessage, isMe: boolean, myName: string, partnerName: string): string {
  const who = isMe ? myName : partnerName;
  const time = formatMsgTime(msg.timestamp);
  const body = exportBody(msg);
  return `[${time}] ${who}: ${body}`;
}

/** Readable plain-text export (preferred). */
export function downloadChatAsText(
  messages: ApiMessage[],
  myId: string,
  myName: string,
  partnerName: string,
): void {
  const sorted = [...messages]
    .filter((m) => !m.deleted && m.variant !== "cute")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const lines = [
    `Grova chat export — ${myName} & ${partnerName}`,
    `Exported ${new Date().toLocaleString()}`,
    "",
    ...sorted.map((m) => formatExportLine(m, m.senderId === myId, myName, partnerName)),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grova-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function measureMessage(ctx: CanvasRenderingContext2D, msg: ApiMessage, isMe: boolean): number {
  if (msg.type === "audio") return META_H + 52 + GAP;
  if (msg.type === "gif") return META_H + GIF_BLOCK_H + GAP;
  if (msg.type === "image") return META_H + IMAGE_BLOCK_H + GAP;
  if (msg.type === "file") return META_H + 56 + GAP;
  const text = exportBody(msg);
  ctx.font = "14px system-ui, sans-serif";
  const lines = wrapLines(ctx, text, BUBBLE_MAX - 24);
  return META_H + lines.length * LINE_H + 28 + GAP;
}

async function drawMessage(
  ctx: CanvasRenderingContext2D,
  y: number,
  msg: ApiMessage,
  isMe: boolean,
  myName: string,
  partnerName: string,
): Promise<number> {
  const x = isMe ? W - PAD - BUBBLE_MAX : PAD;
  const sender = isMe ? myName : partnerName;

  ctx.fillStyle = "#8e8e8e";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText(`${sender} · ${formatMsgTime(msg.timestamp)}`, x, y + 10);

  const bodyY = y + META_H;

  if (msg.type === "audio") {
    ctx.fillStyle = isMe ? "#0095f6" : "#3a3a3c";
    roundRect(ctx, x, bodyY, BUBBLE_MAX, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px system-ui";
    ctx.fillText("🎤 Voice message", x + 16, bodyY + 26);
    return bodyY + 44 + GAP;
  }

  if (msg.type === "image" || msg.type === "gif") {
    const h = msg.type === "gif" ? GIF_BLOCK_H : IMAGE_BLOCK_H;
    const src = msg.imageUrl || msg.gifUrl || msg.imageData;
    let drewImage = false;

    if (src && (src.startsWith("http") || src.startsWith("data:"))) {
      try {
        const img = await loadImage(src);
        const ratio = Math.min((BUBBLE_MAX - 8) / img.width, (h - 8) / img.height, 1);
        const iw = img.width * ratio;
        const ih = img.height * ratio;
        ctx.fillStyle = isMe ? "#0095f6" : "#3a3a3c";
        roundRect(ctx, x, bodyY, BUBBLE_MAX, h, 18);
        ctx.fill();
        ctx.save();
        roundRect(ctx, x + 4, bodyY + 4, BUBBLE_MAX - 8, h - 8, 14);
        ctx.clip();
        ctx.drawImage(img, x + 4 + (BUBBLE_MAX - 8 - iw) / 2, bodyY + 4 + (h - 8 - ih) / 2, iw, ih);
        ctx.restore();
        drewImage = true;
      } catch {
        /* placeholder below */
      }
    }

    if (!drewImage) {
      ctx.fillStyle = isMe ? "#0095f6" : "#3a3a3c";
      roundRect(ctx, x, bodyY, BUBBLE_MAX, h, 18);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "13px system-ui";
      ctx.fillText(msg.type === "gif" ? "GIF" : "Photo", x + 16, bodyY + 28);
    }

    const caption = msg.text?.trim();
    if (caption && !caption.startsWith("e2e:")) {
      ctx.fillStyle = "#ccc";
      ctx.font = "12px system-ui";
      const lines = wrapLines(ctx, caption, BUBBLE_MAX - 24).slice(0, 2);
      lines.forEach((line, i) => ctx.fillText(line, x + 12, bodyY + h + 14 + i * 14));
      return bodyY + h + 14 + lines.length * 14 + GAP;
    }
    return bodyY + h + GAP;
  }

  if (msg.type === "file") {
    ctx.fillStyle = isMe ? "#0095f6" : "#3a3a3c";
    roundRect(ctx, x, bodyY, BUBBLE_MAX, 48, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "13px system-ui";
    const name = msg.text || "File attachment";
    ctx.fillText(`📎 ${name.slice(0, 36)}`, x + 14, bodyY + 28);
    return bodyY + 48 + GAP;
  }

  const text = exportBody(msg);
  ctx.font = "14px system-ui, sans-serif";
  const lines = wrapLines(ctx, text, BUBBLE_MAX - 24);
  const bubbleH = Math.max(lines.length * LINE_H + 20, 36);

  ctx.fillStyle = isMe ? "#0095f6" : "#3a3a3c";
  roundRect(ctx, x, bodyY, BUBBLE_MAX, bubbleH, 18);
  ctx.fill();

  ctx.fillStyle = "#fff";
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 12, bodyY + 18 + i * LINE_H);
  });

  return bodyY + bubbleH + GAP;
}

/** Export chat as readable PNG pages (all visible messages). */
export async function downloadChatAsImage(
  messages: ApiMessage[],
  myId: string,
  myName: string,
  partnerName: string,
  onProgress?: (current: number, total: number) => void,
): Promise<number> {
  const sorted = [...messages]
    .filter((m) => !m.deleted && m.variant !== "cute")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (sorted.length === 0) {
    throw new Error("No messages to export");
  }

  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;
  mctx.font = "14px system-ui, sans-serif";

  const msgHeights = sorted.map((msg) => measureMessage(mctx, msg, msg.senderId === myId));

  const pages: ApiMessage[][] = [];
  let currentPage: ApiMessage[] = [];
  let currentPageHeight = PAD + HEADER_H;

  for (let i = 0; i < sorted.length; i++) {
    const msgHeight = msgHeights[i];
    const wouldOverflowHeight = currentPageHeight + msgHeight > MAX_PAGE_HEIGHT;
    const wouldOverflowCount = currentPage.length >= MAX_MESSAGES_PER_PAGE;

    if (currentPage.length > 0 && (wouldOverflowHeight || wouldOverflowCount)) {
      pages.push(currentPage);
      currentPage = [sorted[i]];
      currentPageHeight = PAD + HEADER_H + msgHeight;
    } else {
      currentPage.push(sorted[i]);
      currentPageHeight += msgHeight;
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);

  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    onProgress?.(pageNum + 1, pages.length);
    const pageMessages = pages[pageNum];

    let totalH = PAD + HEADER_H;
    for (const msg of pageMessages) {
      totalH += measureMessage(mctx, msg, msg.senderId === myId);
    }
    totalH += PAD;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = Math.max(totalH, 400);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px system-ui";
    ctx.fillText(`${myName} & ${partnerName}`, PAD, PAD + 18);
    ctx.fillStyle = "#8e8e8e";
    ctx.font = "11px system-ui";
    const dateStr = new Date().toLocaleDateString();
    const pageStr = pages.length > 1 ? ` · Part ${pageNum + 1} of ${pages.length}` : "";
    ctx.fillText(`${dateStr}${pageStr} · ${pageMessages.length} messages`, PAD, PAD + 36);

    let y = PAD + HEADER_H;
    for (const msg of pageMessages) {
      y = await drawMessage(ctx, y, msg, msg.senderId === myId, myName, partnerName);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to export"))), "image/png");
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix =
      pages.length > 1
        ? `-part-${String(pageNum + 1).padStart(2, "0")}-of-${pages.length}`
        : "";
    a.download = `grova-chat-${new Date().toISOString().slice(0, 10)}${suffix}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (pageNum < pages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return pages.length;
}
