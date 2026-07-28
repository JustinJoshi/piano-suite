"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type ArpeggioSettings,
  ARPEGGIO_SETTINGS_KEY,
  normalizeArpeggioSettings,
} from "@/lib/arpeggios";

/**
 * Persisted Arpeggios settings.
 *
 * Loads once from Convex and saves after every meaningful change. Local state
 * updates immediately so the UI never waits on the network.
 */
export function useArpeggioSettings(enabled: boolean) {
  const rawSettings = useQuery(
    api.settings.getSetting,
    enabled ? { key: ARPEGGIO_SETTINGS_KEY } : "skip"
  );
  const setSetting = useMutation(api.settings.setSetting);

  const [settings, setSettings] = useState<ArpeggioSettings>(() =>
    normalizeArpeggioSettings({})
  );
  const [loadedRemote, setLoadedRemote] = useState(false);
  const loaded = !enabled || loadedRemote;

  useEffect(() => {
    if (!enabled) return;
    if (rawSettings !== undefined) {
      setSettings(normalizeArpeggioSettings((rawSettings as Partial<ArpeggioSettings>) ?? {}));
      setLoadedRemote(true);
    }
  }, [enabled, rawSettings]);

  const persistSettings = useCallback(
    (next: ArpeggioSettings) => {
      if (!enabled) return;
      setSetting({ key: ARPEGGIO_SETTINGS_KEY, value: next }).catch((err) => {
        console.error("Failed to save arpeggio settings", err);
      });
    },
    [enabled, setSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<ArpeggioSettings>) => {
      setSettings((prev) => {
        const next = normalizeArpeggioSettings({ ...prev, ...patch });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const setConfig = useCallback(
    (updater: (config: ArpeggioSettings["config"]) => ArpeggioSettings["config"]) => {
      setSettings((prev) => {
        const next = normalizeArpeggioSettings({
          ...prev,
          config: updater(prev.config),
        });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  return {
    settings,
    loaded,
    updateSettings,
    setConfig,
  };
}
