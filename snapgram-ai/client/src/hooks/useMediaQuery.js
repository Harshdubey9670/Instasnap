import { useState, useEffect } from "react";

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * Used to switch between the immersive mobile reel feed and the desktop
 * three-column browser without relying on Tailwind's `hidden`/`flex` pair
 * mounting both layouts (and their video elements) at once.
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
};

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
