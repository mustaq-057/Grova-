import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolvePostMediaUrl } from "@/lib/media-url";

type Props = {
  urls: string[];
  alt: string;
  ratioClass: string;
};

export function PostCarousel({ urls, alt, ratioClass }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (urls.length <= 1) {
    const url = urls[0] ?? "";
    return (
      <div className={`${ratioClass} bg-secondary/30 overflow-hidden`}>
        <img
          src={resolvePostMediaUrl(url) ?? url}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${ratioClass} bg-secondary/30 overflow-hidden group`}>
      <div ref={emblaRef} className="overflow-hidden h-full touch-pan-y">
        <div className="flex h-full">
          {urls.map((url, i) => (
            <div key={`${url}-${i}`} className="min-w-0 shrink-0 grow-0 basis-full h-full">
              <img
                src={resolvePostMediaUrl(url) ?? url}
                alt={`${alt} ${i + 1}`}
                className="w-full h-full object-cover select-none"
                loading={i === 0 ? "lazy" : "eager"}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-4 h-4 text-neutral-700" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
          aria-label="Next photo"
        >
          <ChevronRight className="w-4 h-4 text-neutral-700" />
        </button>
      )}

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {urls.map((_, i) => (
          <span
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === selected ? "w-1.5 h-1.5 bg-white scale-110" : "w-1.5 h-1.5 bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
