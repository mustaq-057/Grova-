import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { usePinch } from "@use-gesture/react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  draggable?: boolean;
  onZoomChange?: (isZooming: boolean) => void;
};

export function ZoomableImage({ src, alt, className, loading = "lazy", draggable = false, onZoomChange }: Props) {
  const controls = useAnimation();
  const [isZooming, setIsZooming] = useState(false);

  const bind = usePinch(
    ({ offset: [s], active, event }) => {
      if (active) {
        if (!isZooming) {
          setIsZooming(true);
          onZoomChange?.(true);
        }
        if (event?.cancelable) {
          event.preventDefault();
        }
        controls.set({ scale: s });
      } else {
        setIsZooming(false);
        onZoomChange?.(false);
        controls.start({ scale: 1, x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } });
      }
    },
    {
      scaleBounds: { min: 1, max: 4 },
      modifierKey: null,
    }
  );

  return (
    <motion.img
      {...(bind() as any)}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      draggable={draggable}
      animate={controls}
      style={{
        zIndex: isZooming ? 50 : 1,
        position: isZooming ? "relative" : "static",
        touchAction: "pan-y",
        transformOrigin: "center center",
      }}
    />
  );
}
