"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  DEFAULT_HERO_MULTIGRID_SETTINGS,
  HERO_MULTIGRID_SETTINGS_KEY,
  type HeroMultigridSettings,
  type LabMultigridSnapshot,
  mergeLabSnapshotIntoHeroMultigrid,
  normalizeHeroMultigridSettings,
  readHeroMultigridSettingsFromLocalStorage,
  writeHeroMultigridSettingsToLocalStorage,
} from "@/lib/multigrid-hero-settings";

/**
 * Home-hero Multigrid appearance preferences.
 *
 * - localStorage for everyone
 * - Convex when Pro sync (`canPersist`) is available
 */
export function useHeroMultigridSettings() {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: HERO_MULTIGRID_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] =
    useState<HeroMultigridSettings | null>(() =>
      readHeroMultigridSettingsFromLocalStorage()
    );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeHeroMultigridSettings(
      remote as Partial<HeroMultigridSettings>
    );
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_HERO_MULTIGRID_SETTINGS;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeHeroMultigridSettingsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readHeroMultigridSettingsFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({
      key: HERO_MULTIGRID_SETTINGS_KEY,
      value: local,
    }).catch((err) => {
      console.error("Failed to save hero Multigrid settings", err);
    });
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: HeroMultigridSettings) => {
      writeHeroMultigridSettingsToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({
        key: HERO_MULTIGRID_SETTINGS_KEY,
        value: next,
      }).catch((err) => {
        console.error("Failed to save hero Multigrid settings", err);
      });
    },
    [canPersist, setRemoteSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<HeroMultigridSettings>) => {
      setLocalSettings((prev) => {
        const base =
          prev ?? remoteSettings ?? DEFAULT_HERO_MULTIGRID_SETTINGS;
        const next = normalizeHeroMultigridSettings({ ...base, ...patch });
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const applyFromLab = useCallback(
    (lab: LabMultigridSnapshot) => {
      setLocalSettings((prev) => {
        const base =
          prev ?? remoteSettings ?? DEFAULT_HERO_MULTIGRID_SETTINGS;
        const next = mergeLabSnapshotIntoHeroMultigrid(base, lab);
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const resetSettings = useCallback(() => {
    setLocalSettings((prev) => {
      const base =
        prev ?? remoteSettings ?? DEFAULT_HERO_MULTIGRID_SETTINGS;
      const next = normalizeHeroMultigridSettings({
        ...DEFAULT_HERO_MULTIGRID_SETTINGS,
        generation: base.generation + 1,
      });
      persist(next);
      return next;
    });
  }, [persist, remoteSettings]);

  return {
    settings,
    updateSettings,
    applyFromLab,
    resetSettings,
  };
}
