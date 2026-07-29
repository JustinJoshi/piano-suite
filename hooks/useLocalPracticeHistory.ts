"use client";

import { useEffect, useState } from "react";
import { LOCAL_HISTORY_CHANGED_EVENT } from "@/lib/local-practice-history";

/**
 * Bumps when Free-tier local practice history changes so Tracking / Technique
 * panels re-read localStorage without a full page reload.
 */
export function useLocalPracticeHistoryVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(LOCAL_HISTORY_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.removeEventListener(LOCAL_HISTORY_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  return version;
}
