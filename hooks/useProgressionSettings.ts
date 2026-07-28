"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type ProgressionSettings,
  type ProgressionHistory,
  normalizeProgressionSettings,
  PROGRESSION_SETTINGS_KEY,
  PROGRESSION_HISTORY_KEY,
} from "@/lib/progression";

/**
 * Persisted Progression drill state (settings + rolling-best history).
 *
 * Settings are loaded from Convex once on mount and saved after every
 * meaningful change. Local state is updated immediately so the UI never
 * waits on the network.
 */
export function useProgressionSettings(enabled: boolean) {
  const rawSettings = useQuery(
    api.settings.getSetting,
    enabled ? { key: PROGRESSION_SETTINGS_KEY } : "skip"
  );
  const rawHistory = useQuery(
    api.settings.getSetting,
    enabled ? { key: PROGRESSION_HISTORY_KEY } : "skip"
  );
  const setSetting = useMutation(api.settings.setSetting);

  const [settings, setSettings] = useState<ProgressionSettings>(() =>
    normalizeProgressionSettings({})
  );
  const [history, setHistory] = useState<ProgressionHistory>({});
  const [loadedRemote, setLoadedRemote] = useState(false);
  const loaded = !enabled || loadedRemote;

  useEffect(() => {
    if (!enabled) return;
    if (rawSettings !== undefined && rawHistory !== undefined) {
      setSettings(
        normalizeProgressionSettings(
          (rawSettings as Partial<ProgressionSettings>) ?? {}
        )
      );
      setHistory((rawHistory as ProgressionHistory) ?? {});
      setLoadedRemote(true);
    }
  }, [enabled, rawSettings, rawHistory]);

  const persistSettings = useCallback(
    (next: ProgressionSettings) => {
      if (!enabled) return;
      setSetting({ key: PROGRESSION_SETTINGS_KEY, value: next }).catch((err) => {
        console.error("Failed to save progression settings", err);
      });
    },
    [enabled, setSetting]
  );

  const persistHistory = useCallback(
    (next: ProgressionHistory) => {
      if (!enabled) return;
      setSetting({ key: PROGRESSION_HISTORY_KEY, value: next }).catch((err) => {
        console.error("Failed to save progression history", err);
      });
    },
    [enabled, setSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<ProgressionSettings>) => {
      setSettings((prev) => {
        const next = normalizeProgressionSettings({ ...prev, ...patch });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const updateHistory = useCallback(
    (next: ProgressionHistory) => {
      setHistory(next);
      persistHistory(next);
    },
    [persistHistory]
  );

  return {
    settings,
    history,
    loaded,
    updateSettings,
    updateHistory,
  };
}
