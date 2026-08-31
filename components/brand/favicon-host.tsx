"use client";

import { useEffect } from "react";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import { isShippingLogoMark } from "@/lib/logo-mark-settings";
import { settingsToDataUrl } from "@/lib/logo-mark";

const FAVICON_LINK_ID = "piano-suite-dynamic-favicon";

/**
 * Keeps the tab favicon in sync with the applied logo mark. The shipping
 * `app/icon.svg` (musical note) is the SSR/first-paint default; a dynamic
 * link is only injected once a custom Logo Lab mark is applied.
 */
export function FaviconHost() {
  const { settings } = useLogoMarkSettings();

  useEffect(() => {
    const existing = document.getElementById(
      FAVICON_LINK_ID
    ) as HTMLLinkElement | null;

    if (isShippingLogoMark(settings)) {
      existing?.remove();
      return;
    }

    let link = existing;
    if (!link) {
      link = document.createElement("link");
      link.id = FAVICON_LINK_ID;
      link.rel = "icon";
      link.type = "image/svg+xml";
      document.head.appendChild(link);
    }
    link.href = settingsToDataUrl(settings, { baked: true });
  }, [settings]);

  return null;
}
