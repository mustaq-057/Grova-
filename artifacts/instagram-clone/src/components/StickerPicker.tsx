import { motion } from "framer-motion";

const PACKS = [
  {
    label: "❤️ Love",
    stickers: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💞","💓","💗","💖","💝","💘","💟","🥰","😍","😘","💋","🫶","🤗"],
  },
  {
    label: "😂 Funny",
    stickers: ["😂","🤣","💀","😭","😩","😫","🤦","🤦‍♀️","🤦‍♂️","🙄","😤","😒","😑","🫠","😬","🤪","🥴","😵","🫥","😵‍💫","🤡","🫨"],
  },
  {
    label: "🥺 Cute",
    stickers: ["🥺","🥹","🫣","🤭","😊","🥰","😇","🥲","☺️","😌","🫡","🤩","😏","😼","🐱","🐶","🐼","🐨","🐰","🦊","🐸","🐧"],
  },
  {
    label: "🎉 Hype",
    stickers: ["🎉","🎊","🎈","🥳","🤩","🏆","👑","⭐","🌟","✨","💥","🔥","💯","🎯","🫡","👏","🙌","🫶","✌️","🤙","💪","🦾"],
  },
  {
    label: "✨ Mood",
    stickers: ["🌙","⭐","🌈","🌊","🌸","🌺","🌻","🌹","🍀","🦋","🕊️","🌅","🌄","🌃","🌌","⚡","❄️","🌙","☁️","🌤","🌿","🍃"],
  },
];

type Props = { onSelect: (sticker: string) => void; onClose: () => void };

export default function StickerPicker({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
        data-testid="sticker-picker"
      >
        <div className="max-h-64 overflow-y-auto scrollbar-hide">
          {PACKS.map((pack) => (
            <div key={pack.label} className="p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1 font-semibold">
                {pack.label}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {pack.stickers.map((s) => (
                  <button
                    key={s}
                    onClick={() => { onSelect(s); onClose(); }}
                    className="w-10 h-10 text-2xl flex items-center justify-center rounded-lg hover:bg-secondary transition-colors hover:scale-110 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
