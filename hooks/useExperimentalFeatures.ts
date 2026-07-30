"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  DEFAULT_EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURES_SETTINGS_KEY,
  type ExperimentalFeaturesSettings,
  normalizeExperimentalFeatures,
  readExperimentalFeaturesFromLocalStorage,
  writeExperimentalFeaturesToLocalStorage,
} from "@/lib/experimental-features";

/**
 * Opt-in experimental features flag (off by default).
 *
 * localStorage for everyone; Convex when Pro sync (`canPersist`) is available.
 */
export function useExperimentalFeatures() {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: EXPERIMENTAL_FEATURES_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] =
    useState<ExperimentalFeaturesSettings | null>(() =>
      readExperimentalFeaturesFromLocalStorage()
    );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeExperimentalFeatures(
      remote as Partial<ExperimentalFeaturesSettings>
    );
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_EXPERIMENTAL_FEATURES;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeExperimentalFeaturesToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readExperimentalFeaturesFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({
      key: EXPERIMENTAL_FEATURES_SETTINGS_KEY,
      value: local,
    }).catch((err) => {
      console.error("Failed to save experimental features preference", err);
    });
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: ExperimentalFeaturesSettings) => {
      writeExperimentalFeaturesToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({
        key: EXPERIMENTAL_FEATURES_SETTINGS_KEY,
        value: next,
      }).catch((err) => {
        console.error("Failed to save experimental features preference", err);
      });
    },
    [canPersist, setRemoteSetting]
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      const next = normalizeExperimentalFeatures({ enabled });
      setLocalSettings(next);
      persist(next);
    },
    [persist]
  );

  return {
    enabled: settings.enabled,
    setEnabled,
  };
}
