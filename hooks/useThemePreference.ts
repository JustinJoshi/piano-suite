"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { defaultTheme, isThemeId, type ThemeId } from "@/lib/themes";

const THEME_STORAGE_KEY = "piano-suite-theme";

// Use layout effect so the first client render matches the server snapshot
// (mounted = false) and only flips to true after hydration, avoiding a
// React hydration mismatch on theme-dependent visuals.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Manages the active theme for the app.
 *
 * - Reads/writes the theme from localStorage via next-themes.
 * - Syncs the choice to Convex when the user has Pro sync (`canPersist`).
 * - Falls back to a Pro user's remote preference when there is no local
 *   value (e.g. first visit on a new device).
 */
export function useThemePreference() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { canPersist } = useAuthAccess();
  const [mounted, setMounted] = useState(false);

  const remoteTheme = useQuery(
    api.settings.getSetting,
    canPersist ? { key: "theme" } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const currentTheme: ThemeId =
    resolvedTheme && isThemeId(resolvedTheme) ? resolvedTheme : defaultTheme;

  // Persist theme changes to Convex when Pro sync is available.
  useEffect(() => {
    if (!canPersist) return;
    if (!theme || theme === "system" || !isThemeId(theme)) return;
    if (remoteTheme === undefined) return;
    if (remoteTheme === theme) return;

    setRemoteSetting({ key: "theme", value: theme }).catch((err) => {
      console.error("Failed to save theme preference", err);
    });
  }, [canPersist, theme, remoteTheme, setRemoteSetting]);

  // If there is no local value, apply the Pro user's remote preference.
  useEffect(() => {
    if (!canPersist) return;
    if (remoteTheme === undefined) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(THEME_STORAGE_KEY)) return;

    const value = remoteTheme;
    if (isThemeId(value)) {
      setTheme(value);
    }
  }, [canPersist, remoteTheme, setTheme]);

  // Defer the mounted flag until after hydration so theme-dependent visuals
  // (e.g. the active checkmark on theme cards) match between SSR and the
  // initial client render, avoiding React hydration mismatches.
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: currentTheme,
    setTheme: (id: ThemeId) => setTheme(id),
    mounted,
  };
}
