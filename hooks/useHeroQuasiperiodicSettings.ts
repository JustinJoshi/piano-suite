"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  DEFAULT_HERO_QUASIPERIODIC_SETTINGS,
  HERO_QUASIPERIODIC_SETTINGS_KEY,
  type HeroQuasiperiodicSettings,
  type LabQuasiperiodicSnapshot,
  mergeLabSnapshotIntoHeroQuasiperiodic,
  normalizeHeroQuasiperiodicSettings,
  readHeroQuasiperiodicSettingsFromLocalStorage,
  writeHeroQuasiperiodicSettingsToLocalStorage,
} from "@/lib/quasiperiodic-hero-settings";

/**
 * Home-hero Quasiperiodic appearance preferences.
 *
 * - localStorage for everyone (instant, works signed-out)
 * - Convex `settings` key when Pro sync (`canPersist`) is available
 * - Remote hydrates only when there is no local value yet
 */
export function useHeroQuasiperiodicSettings() {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: HERO_QUASIPERIODIC_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] =
    useState<HeroQuasiperiodicSettings | null>(() =>
      readHeroQuasiperiodicSettingsFromLocalStorage()
    );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeHeroQuasiperiodicSettings(
      remote as Partial<HeroQuasiperiodicSettings>
    );
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_HERO_QUASIPERIODIC_SETTINGS;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeHeroQuasiperiodicSettingsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readHeroQuasiperiodicSettingsFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({
      key: HERO_QUASIPERIODIC_SETTINGS_KEY,
      value: local,
    }).catch((err) => {
      console.error("Failed to save hero Quasiperiodic settings", err);
    });
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: HeroQuasiperiodicSettings) => {
      writeHeroQuasiperiodicSettingsToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({
        key: HERO_QUASIPERIODIC_SETTINGS_KEY,
        value: next,
      }).catch((err) => {
        console.error("Failed to save hero Quasiperiodic settings", err);
      });
    },
    [canPersist, setRemoteSetting]
  );

  const setHeroSettings = useCallback(
    (next: HeroQuasiperiodicSettings) => {
      const normalized = normalizeHeroQuasiperiodicSettings(next);
      setLocalSettings(normalized);
      persist(normalized);
    },
    [persist]
  );

  const updateSettings = useCallback(
    (patch: Partial<HeroQuasiperiodicSettings>) => {
      setLocalSettings((prev) => {
        const base =
          prev ?? remoteSettings ?? DEFAULT_HERO_QUASIPERIODIC_SETTINGS;
        const next = normalizeHeroQuasiperiodicSettings({ ...base, ...patch });
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const applyFromLab = useCallback(
    (lab: LabQuasiperiodicSnapshot) => {
      setLocalSettings((prev) => {
        const base =
          prev ?? remoteSettings ?? DEFAULT_HERO_QUASIPERIODIC_SETTINGS;
        const next = mergeLabSnapshotIntoHeroQuasiperiodic(base, lab);
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const resetSettings = useCallback(() => {
    setLocalSettings((prev) => {
      const base =
        prev ?? remoteSettings ?? DEFAULT_HERO_QUASIPERIODIC_SETTINGS;
      const next = normalizeHeroQuasiperiodicSettings({
        ...DEFAULT_HERO_QUASIPERIODIC_SETTINGS,
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
