import { memo, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  isTangled?: boolean;
};

export const EditMessageBar = memo(function EditMessageBar({
  value,
  onChange,
  onSave,
  onCancel,
  saving = false,
  isTangled,
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div className="chat-panel-input relative w-full z-20 shrink-0 px-0 pt-1.5 pb-1">
      {/* Edit indicator preview above input */}
      <div className="absolute -top-[30px] left-[5%] w-[90%] bg-primary/20 backdrop-blur-md border border-primary/30 text-white text-[13px] px-4 py-1.5 rounded-t-2xl flex items-center justify-between z-10 font-medium">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">✏️</span>
          Editing message
        </div>
        <button onClick={onCancel} className="text-white/50 hover:text-white p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`message-input-pill flex items-center gap-[8px] sm:gap-[10px] py-[7px] sm:py-[9px] pr-[8px] sm:pr-[14px] pl-[5px] sm:pl-[9px] mx-[4px] md:mx-auto md:w-full md:max-w-[800px] ${
        isTangled 
          ? 'bg-[#1f2227] rounded-[40px] border-2 border-[#fcd34d] shadow-[0_0_30px_#fcd34d]' 
          : 'bg-[#1a1a1a] rounded-[40px]'
      } rounded-tl-none rounded-tr-none border-t-0 border-primary/30`}>
        
        {/* Cancel button matching the camera button slot */}
        <button
          type="button"
          onClick={onCancel}
          className="w-[38px] h-[38px] sm:w-[44px] sm:h-[44px] rounded-full active:scale-95 flex shrink-0 items-center justify-center text-white/50 hover:text-white transition-all bg-white/5 hover:bg-white/10 border-none"
          aria-label="Cancel editing"
        >
          <X className="w-[20px] h-[20px]" strokeWidth={1.8} />
        </button>

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              const isMobile = window.matchMedia("(max-width: 767px)").matches;
              if (!isMobile) {
                e.preventDefault();
                if (value.trim()) onSave();
              }
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder="Edit message..."
          rows={1}
          className="flex-1 w-0 min-w-0 bg-transparent text-[17px] placeholder-[#888] text-white focus:outline-none border-none resize-none m-0 p-0 block overflow-y-auto"
          style={{ minHeight: '24px', maxHeight: '120px', lineHeight: '24px' }}
          autoFocus
          disabled={saving}
        />

        <div className="pr-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !value.trim()}
            className={`send-btn p-2.5 rounded-full transition-all shrink-0 ${
              saving || !value.trim() ? "opacity-50 cursor-not-allowed bg-primary/60" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            aria-label="Save message"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
});
