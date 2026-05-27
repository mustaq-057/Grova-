import { motion } from "framer-motion";

const EMOJI_GROUPS = [
  { label: "Love", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💞","💓","💗","💖","💝","💘","😍","🥰","😘","💋","🫶"] },
  { label: "Faces", emojis: ["😊","😄","😂","🤣","😅","😭","😢","🥹","😩","😫","🥲","😳","🤔","🫣","🤗","😤","🙄","🤦","🫠","😬","😏","🥳","🤩","😇","🤤","😴","🤧","😷","🤒","🤑"] },
  { label: "Hands", emojis: ["👏","🙏","🫶","🤝","✌️","👋","🤙","👌","💪","🙌","👐","🤲","🫂","🤜","👊","✊","🤞","🫰","👈","👉"] },
  { label: "Nature", emojis: ["🌹","🌺","💐","🌸","🌼","🌻","🍀","🌿","🍃","🌙","⭐","🌟","✨","🔥","🌊","🌅","🌈","❄️","🌙","🦋"] },
  { label: "Misc",   emojis: ["🎉","🎊","💯","👑","📸","☕","🍜","🍕","🍰","🎂","🎁","🏡","🚗","✈️","🛌","💤","📱","💌","🔑","🕊️"] },
];

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export default function EmojiPicker({ onSelect, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
        data-testid="emoji-picker"
      >
        <div className="max-h-64 overflow-y-auto scrollbar-hide p-2">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 mb-1 font-semibold">{group.label}</p>
              <div className="flex flex-wrap gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); }}
                    className="w-9 h-9 text-xl flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                    data-testid={`emoji-${emoji}`}
                  >
                    {emoji}
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
