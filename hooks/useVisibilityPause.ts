"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observe whether a DOM element is intersecting the viewport.
 *
 * Returns a ref to attach to the element and a boolean that is `true`
 * while any part of the element is visible. Useful for pausing RAF
 * render loops when a WebGL/Canvas component is scrolled off-screen.
 */
export function useVisibilityPause<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T | null>,
  boolean,
] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry?.isIntersecting ?? true);
      },
      { threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
