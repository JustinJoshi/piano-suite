"use client";

import { useEffect, type RefObject } from "react";

/**
 * Let `[data-roll-reveal]` elements under `rootRef` rise into place as they
 * reach the reader, a few at a time. The CSS only hides them when scripting
 * is on and motion is welcome (app/roll.css), so nothing is ever lost.
 */
export function useRollReveal(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-roll-reveal]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty("--reveal-delay", `${n * 80}ms`);
          el.setAttribute("data-revealed", "");
          observer.unobserve(el);
          n += 1;
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}
