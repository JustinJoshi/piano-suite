"use client";

import { useEffect, useState } from "react";

/**
 * Read a set of CSS custom properties from the computed style of <html>
 * and re-read them whenever the theme class changes.
 *
 * This lets WebGL/Canvas visuals stay in sync with the Tailwind theme
 * token system without hard-coding colors.
 */
export function useThemeCssVars(names: string[]): string[] {
  const [values, setValues] = useState<string[]>(() => readVars(names));
  const namesKey = names.join(",");

  useEffect(() => {
    const update = () => setValues(readVars(names));

    update();

    // Watch for class changes on <html>, which is how next-themes swaps themes.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          update();
          return;
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [namesKey, names]);

  return values;
}

function readVars(names: string[]): string[] {
  if (typeof window === "undefined") {
    return names.map(() => "");
  }
  const styles = getComputedStyle(document.documentElement);
  return names.map((name) => styles.getPropertyValue(name).trim());
}
