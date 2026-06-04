import { useCallback, useEffect, useRef, useState } from "react";
import { useDelayedSpinner } from "./useDelayedSpinner";

const DEFAULT_SAFETY_MS = 10_000;

/** Initial feature load — skeleton only while empty; auto-stops after safety timeout. */
export function useFeatureLoading(isEmpty: boolean, safetyMs = DEFAULT_SAFETY_MS) {
  const [fetching, setFetching] = useState(true);
  const showLoading = useDelayedSpinner(fetching && isEmpty);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafety = useCallback(() => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  }, []);

  useEffect(() => {
    safetyRef.current = setTimeout(() => setFetching(false), safetyMs);
    return clearSafety;
  }, [safetyMs, clearSafety]);

  const finishLoading = useCallback(() => {
    clearSafety();
    setFetching(false);
  }, [clearSafety]);

  return { fetching, setFetching, showLoading, finishLoading };
}
