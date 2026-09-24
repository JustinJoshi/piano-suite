"use client";

import { useEffect } from "react";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";

const THEME_COLOR_VARS = ["--background"];

/**
 * Keeps `<meta name="theme-color">` in step with the active theme, so the
 * mobile browser chrome (address bar, overscroll area, PWA title bar) is
 * the same studio colour as the page instead of a mismatched default.
 *
 * The root layout's `viewport.themeColor` is the first-paint value (Amber);
 * this host takes over once the client knows the chosen preset.
 */
export function ThemeColorHost() {
  const [background] = useThemeCssVars(THEME_COLOR_VARS);

  useEffect(() => {
    if (!background) return;
    const metas = document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (metas.length === 0) {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = background;
      document.head.appendChild(meta);
      return;
    }
    metas.forEach((meta) => {
      meta.content = background;
    });
  }, [background]);

  return null;
}
