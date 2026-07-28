"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_HERO_ATMOSPHERE,
  HERO_ATMOSPHERE_SETTINGS_KEY,
  type HeroAtmosphereKind,
  type HeroAtmosphereSettings,
  normalizeHeroAtmosphere,
  readHeroAtmosphereFromLocalStorage,
  writeHeroAtmosphereToLocalStorage,
} from "@/lib/hero-atmosphere";

/**
 * Which math visual drives the welcome-page hero atmosphere.
 *
 * localStorage for everyone; Convex when signed in (same pattern as Chladni).
 */
export function useHeroAtmosphereKind() {
  const { isSignedIn } = useUser();
  const remote = useQuery(
    api.settings.getSetting,
    isSignedIn ? { key: HERO_ATMOSPHERE_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] =
    useState<HeroAtmosphereSettings | null>(() =>
      readHeroAtmosphereFromLocalStorage()
    );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeHeroAtmosphere(remote as Partial<HeroAtmosphereSettings>);
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_HERO_ATMOSPHERE;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeHeroAtmosphereToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!isSignedIn) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readHeroAtmosphereFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({ key: HERO_ATMOSPHERE_SETTINGS_KEY, value: local }).catch(
      (err) => {
        console.error("Failed to save hero atmosphere kind", err);
      }
    );
  }, [isSignedIn, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: HeroAtmosphereSettings) => {
      writeHeroAtmosphereToLocalStorage(next);
      if (!isSignedIn) return;
      setRemoteSetting({ key: HERO_ATMOSPHERE_SETTINGS_KEY, value: next }).catch(
        (err) => {
          console.error("Failed to save hero atmosphere kind", err);
        }
      );
    },
    [isSignedIn, setRemoteSetting]
  );

  const setKind = useCallback(
    (kind: HeroAtmosphereKind) => {
      const next = normalizeHeroAtmosphere({ kind });
      setLocalSettings(next);
      persist(next);
    },
    [persist]
  );

  return {
    kind: settings.kind,
    setKind,
  };
}
