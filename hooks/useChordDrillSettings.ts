"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  type ChordDrillSettings,
  type ChordDrillHistory,
  normalizeSettings,
  CHORD_DRILL_SETTINGS_KEY,
  CHORD_DRILL_HISTORY_KEY,
} from "@/lib/chord-drill";

/**
 * Persisted chord-drill state (settings + rolling-best history).
 *
 * Settings are loaded from Convex once on mount and saved after every
 * meaningful change. Local state is updated immediately so the UI never
 * waits on the network.
 */
export function useChordDrillSettings(enabled: boolean) {
  const rawSettings = useQuery(
    api.settings.getSetting,
    enabled ? { key: CHORD_DRILL_SETTINGS_KEY } : "skip"
  );
  const rawHistory = useQuery(
    api.settings.getSetting,
    enabled ? { key: CHORD_DRILL_HISTORY_KEY } : "skip"
  );
  const setSetting = useMutation(api.settings.setSetting);

  const [settings, setSettings] = useState<ChordDrillSettings>(() =>
    normalizeSettings({})
  );
  const [history, setHistory] = useState<ChordDrillHistory>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (rawSettings !== undefined && rawHistory !== undefined) {
      setSettings(normalizeSettings((rawSettings as Partial<ChordDrillSettings>) ?? {}));
      setHistory((rawHistory as ChordDrillHistory) ?? {});
      setLoaded(true);
    }
  }, [rawSettings, rawHistory]);

  const persistSettings = useCallback(
    (next: ChordDrillSettings) => {
      setSetting({ key: CHORD_DRILL_SETTINGS_KEY, value: next }).catch((err) => {
        console.error("Failed to save chord drill settings", err);
      });
    },
    [setSetting]
  );

  const persistHistory = useCallback(
    (next: ChordDrillHistory) => {
      setSetting({ key: CHORD_DRILL_HISTORY_KEY, value: next }).catch((err) => {
        console.error("Failed to save chord drill history", err);
      });
    },
    [setSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<ChordDrillSettings>) => {
      setSettings((prev) => {
        const next = normalizeSettings({ ...prev, ...patch });
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const updateHistory = useCallback(
    (next: ChordDrillHistory) => {
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
