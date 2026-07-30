"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  DEFAULT_HERO_CHLADNI_SETTINGS,
  HERO_CHLADNI_SETTINGS_KEY,
  type HeroChladniSettings,
  type LabPatternSnapshot,
  mergeLabSnapshotIntoHero,
  normalizeHeroChladniSettings,
  readHeroChladniSettingsFromLocalStorage,
  writeHeroChladniSettingsToLocalStorage,
} from "@/lib/chladni-hero-settings";

/**
 * Home-hero Chladni appearance preferences.
 *
 * - localStorage for everyone (instant, works signed-out)
 * - Convex `settings` key when Pro sync (`canPersist`) is available
 * - Remote hydrates only when there is no local value yet (theme-style)
 */
export function useHeroChladniSettings() {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: HERO_CHLADNI_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] = useState<HeroChladniSettings | null>(
    () => readHeroChladniSettingsFromLocalStorage()
  );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeHeroChladniSettings(remote as Partial<HeroChladniSettings>);
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_HERO_CHLADNI_SETTINGS;

  const wroteRemoteToLocal = useRef(false);

  // Mirror remote → localStorage once when this browser has no local preference.
  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeHeroChladniSettingsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  // When Pro sync is available with local prefs but empty remote, push local once.
  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readHeroChladniSettingsFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({ key: HERO_CHLADNI_SETTINGS_KEY, value: local }).catch(
      (err) => {
        console.error("Failed to save hero Chladni settings", err);
      }
    );
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: HeroChladniSettings) => {
      writeHeroChladniSettingsToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({ key: HERO_CHLADNI_SETTINGS_KEY, value: next }).catch(
        (err) => {
          console.error("Failed to save hero Chladni settings", err);
        }
      );
    },
    [canPersist, setRemoteSetting]
  );

  const setHeroSettings = useCallback(
    (next: HeroChladniSettings) => {
      const normalized = normalizeHeroChladniSettings(next);
      setLocalSettings(normalized);
      persist(normalized);
    },
    [persist]
  );

  const updateSettings = useCallback(
    (patch: Partial<HeroChladniSettings>) => {
      setLocalSettings((prev) => {
        const base = prev ?? remoteSettings ?? DEFAULT_HERO_CHLADNI_SETTINGS;
        const next = normalizeHeroChladniSettings({ ...base, ...patch });
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const applyFromLab = useCallback(
    (lab: LabPatternSnapshot) => {
      setLocalSettings((prev) => {
        const base = prev ?? remoteSettings ?? DEFAULT_HERO_CHLADNI_SETTINGS;
        const next = mergeLabSnapshotIntoHero(base, lab);
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const resetSettings = useCallback(() => {
    setLocalSettings((prev) => {
      const base = prev ?? remoteSettings ?? DEFAULT_HERO_CHLADNI_SETTINGS;
      const next = normalizeHeroChladniSettings({
        ...DEFAULT_HERO_CHLADNI_SETTINGS,
        generation: base.generation + 1,
      });
      persist(next);
      return next;
    });
  }, [persist, remoteSettings]);

  return {
    settings,
    setSettings: setHeroSettings,
    updateSettings,
    applyFromLab,
    resetSettings,
  };
}
