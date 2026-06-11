import { memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { cn } from "@/lib/utils";

export type BubbleStyleId = 
  | "default"
  | "cat-dog" 
  | "heart-pepe" | "pig-shark" | "tongue-bear" | "doge" 
  | "frog-chick" | "hungry-dog" | "dino" | "dachshund" 
  | "excited-pepe" | "shouting"
  | "bubble-gum" | "crystal-skull" 
  | "golden-crown" | "fire-demon" | "ice-cube" | "space-helmet" 
  | "toxic-slime" | "cloud-angel" | "library" | "angry-model" | "islamic-serenity"
  | "hijab-knife" | "hijab-skull" | "hijab-haram" | "hijab-sparkle" | "little-my";

interface BubbleStyleSelectorProps {
  show: boolean;
  onClose: () => void;
  currentStyle: BubbleStyleId;
  onSelect: (style: BubbleStyleId) => void;
}

const BUBBLE_STYLES: { id: BubbleStyleId; label: string; }[] = [
  { id: "default", label: "Default" },
  { id: "cat-dog", label: "Cat dog" },
  { id: "heart-pepe", label: "Heart Pepe" },
  { id: "pig-shark", label: "Pig shark" },
  { id: "tongue-bear", label: "Tongue bear" },
  { id: "doge", label: "Doge" },
  { id: "frog-chick", label: "Frog chick" },
  { id: "hungry-dog", label: "Hungry dog" },
  { id: "dino", label: "Dino" },
  { id: "dachshund", label: "Dachshund" },
  { id: "excited-pepe", label: "Excited Pepe" },
  { id: "shouting", label: "Shouting" },
  { id: "bubble-gum", label: "Bubble Gum" },
  { id: "crystal-skull", label: "Crystal Skull" },
  { id: "golden-crown", label: "Golden Crown" },
  { id: "fire-demon", label: "Fire Demon" },
  { id: "ice-cube", label: "Ice Cube" },
  { id: "space-helmet", label: "Space Helmet" },
  { id: "toxic-slime", label: "Toxic Slime" },
  { id: "cloud-angel", label: "Cloud Angel" },
  { id: "library", label: "Library" },
  { id: "angry-model", label: "Angry Model" },
  { id: "islamic-serenity", label: "Islamic Serenity" },
  { id: "hijab-knife", label: "Hijab Knife" },
  { id: "hijab-skull", label: "Hijab Skull" },
  { id: "hijab-haram", label: "Haram Bro" },
  { id: "hijab-sparkle", label: "Hijab Sparkle" },
  { id: "little-my", label: "Little My" },
];

export const BubbleStyleSelector = memo(function BubbleStyleSelector({
  show,
  onClose,
  currentStyle,
  onSelect,
}: BubbleStyleSelectorProps) {
  return (
    <Sheet open={show} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl border-white/10 bg-background/95 backdrop-blur-xl p-0 h-[85vh] flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-white/5 shrink-0 flex flex-row items-center justify-between sticky top-0 bg-background/95 backdrop-blur-xl z-20">
          <button onClick={onClose} className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
          <SheetTitle className="text-base font-semibold m-0 text-center flex-1">Select bubble style</SheetTitle>
          <button onClick={onClose} className="text-sm font-bold text-primary hover:text-primary/80">Save</button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-12 flex flex-col items-center">
          
          <div className="w-full max-w-sm mb-6 flex flex-col gap-3">
            <div className={cn("bubble-style-preview self-end max-w-[85%]", `bubble-${currentStyle}`)}>
              <div className="bubble-content px-4 py-2.5 text-[15px] leading-relaxed">
                Did you know you can change your bubble style and all your chats get the new look? So cool!
              </div>
            </div>
            <div className="bubble-style-preview self-start max-w-[85%] bubble-default bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm">
              <div className="bubble-content px-4 py-2.5 text-[15px] leading-relaxed">
                Looks awesome! I'm changing mine.
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mb-6 px-4">
            The bubble applies to all chats. It only affects messages you send after saving.
          </p>

          <button
            onClick={() => onSelect("default")}
            className={cn(
              "w-full max-w-sm mb-8 py-3 rounded-xl font-semibold transition-colors border",
              currentStyle === "default" || !currentStyle
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-secondary/50 hover:bg-secondary border-border"
            )}
          >
            Reset to Plain Text (Default)
          </button>

          <div className="grid grid-cols-3 gap-y-8 gap-x-4 w-full max-w-sm">
            {BUBBLE_STYLES.filter(s => s.id !== "default").map((style) => (
              <button
                key={style.id}
                onClick={() => onSelect(style.id)}
                className="flex flex-col items-center gap-2 group outline-none"
              >
                <div className={cn(
                  "w-20 h-14 rounded-2xl flex items-center justify-center transition-all overflow-visible relative",
                  currentStyle === style.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-secondary/50" : "hover:bg-secondary/30"
                )}>
                   <div className={cn("w-14 h-8 bubble-icon", `bubble-${style.id}`)} />
                </div>
                <span className="text-[11px] font-medium text-foreground/80">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
