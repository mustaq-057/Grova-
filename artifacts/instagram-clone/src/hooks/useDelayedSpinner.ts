import { useEffect, useRef, useState } from "react";

/** Show a spinner only if loading stays active past `delayMs` (avoids flash on fast empty APIs). */
export function useDelayedSpinner(active: boolean, delayMs = 280): boolean {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setShow(false);
      return;
    }
    timerRef.current = setTimeout(() => setShow(true), delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [active, delayMs]);

  return show;
}
