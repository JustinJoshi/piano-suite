"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type RootCyclingSettings,
  ROOT_CYCLING_SETTINGS_KEY,
  normalizeRootCyclingSettings,
} from "@/lib/root-cycling";

/**
 * Persisted Root Cycling drill settings.
 *
 * Loads once from Convex and saves after every meaningful change. Local state
 * updates immediately so the UI never waits on the network.
 */
export function useRootCyclingSettings(enabled: boolean) {
  const rawSettings = useQuery(
    api.settings.getSetting,
    enabled ? { key: ROOT_CYCLING_SETTINGS_KEY } : "skip"
  );
  const setSetting = useMutation(api.settings.setSetting);

  const [settings, setSettings] = useState<RootCyclingSettings>(() =>
    normalizeRootCyclingSettings({})
  );
  const [loadedRemote, setLoadedRemote] = useState(false);
  const loaded = !enabled || loadedRemote;

  useEffect(() => {
    if (!enabled) return;
    if (rawSettings !== undefined) {
      setSettings(
        normalizeRootCyclingSettings(
          (rawSettings as Partial<RootCyclingSettings>) ?? {}
        )
      );
      setLoadedRemote(true);
    }
  }, [enabled, rawSettings]);

  const persistSettings = useCallback(
    (next: RootCyclingSettings) => {
      if (!enabled) return;
      setSetting({ key: ROOT_CYCLING_SETTINGS_KEY, value: next }).catch((err) => {
        console.error("Failed to save root-cycling settings", err);
      });
    },
    [enabled, setSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<RootCyclingSettings>) => {
      setSettings((prev) => {
        const next = normalizeRootCyclingSettings({ ...prev, ...patch });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const toggleRootIncluded = useCallback(
    (pc: number) => {
      setSettings((prev) => {
        const included = prev.includedPcs.includes(pc)
          ? prev.includedPcs.filter((p) => p !== pc)
          : [...prev.includedPcs, pc];
        const next = normalizeRootCyclingSettings({ ...prev, includedPcs: included });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const resetRoots = useCallback(() => {
    setSettings((prev) => {
      const next = normalizeRootCyclingSettings({ ...prev, includedPcs: [] });
      persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  return {
    settings,
    loaded,
    updateSettings,
    toggleRootIncluded,
    resetRoots,
  };
}
