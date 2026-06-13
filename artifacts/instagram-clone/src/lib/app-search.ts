import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

export const SEARCH_CHANGED = "grova-search-changed";

/** Navigate and notify listeners when query params change on the same path. */
export function navigateWithSearch(path: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(path, window.location.origin);
  window.history.pushState({}, "", `${url.pathname}${url.search}`);
  window.dispatchEvent(new Event(SEARCH_CHANGED));
}

/** Reactive URL search params — updates on route change and pushState navigations. */
export function useAppSearchParams(): URLSearchParams {
  const [location] = useLocation();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener("popstate", bump);
    window.addEventListener(SEARCH_CHANGED, bump);
    return () => {
      window.removeEventListener("popstate", bump);
      window.removeEventListener(SEARCH_CHANGED, bump);
    };
  }, []);

  useEffect(() => {
    setVersion((v) => v + 1);
  }, [location]);

  return useMemo(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
    [version, location],
  );
}
