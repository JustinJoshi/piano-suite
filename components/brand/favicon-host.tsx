"use client";

import { useEffect } from "react";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import { settingsToDataUrl } from "@/lib/logo-mark";

const FAVICON_LINK_ID = "piano-suite-dynamic-favicon";

/**
 * Keeps the tab favicon in sync with the applied logo mark.
 * Shipping `app/icon.svg` remains the SSR/first-paint fallback.
 */
export function FaviconHost() {
  const { settings } = useLogoMarkSettings();

  useEffect(() => {
    const href = settingsToDataUrl(settings, { baked: true });
    let link = document.getElementById(
      FAVICON_LINK_ID
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = FAVICON_LINK_ID;
      link.rel = "icon";
      link.type = "image/svg+xml";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [settings]);

  return null;
}
