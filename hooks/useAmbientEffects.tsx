"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AMBIENT_EFFECTS_SETTINGS_KEY,
  DEFAULT_AMBIENT_EFFECTS,
  type AmbientEffectKind,
  type AmbientEffectsSettings,
  type AmbientFloatKind,
  type AmbientFloatSettings,
  normalizeAmbientEffects,
  readAmbientEffectsFromLocalStorage,
  resolveBackgroundKind,
  resolveFloatVisible,
  seedAmbientFromHeroAtmosphere,
  writeAmbientEffectsToLocalStorage,
} from "@/lib/ambient-effects";

type AmbientEffectsContextValue = {
  settings: AmbientEffectsSettings;
  updateSettings: (patch: Partial<AmbientEffectsSettings>) => void;
  setDefaultBackground: (kind: AmbientEffectKind) => void;
  setApplyEverywhere: (applyEverywhere: boolean) => void;
  setRouteBackground: (
    pathname: string,
    kind: AmbientEffectKind | "inherit"
  ) => void;
  setScrimDarkness: (scrimDarkness: number) => void;
  updateFloat: (patch: Partial<AmbientFloatSettings>) => void;
  setFloatEnabled: (enabled: boolean) => void;
  setFloatKind: (kind: AmbientFloatKind) => void;
  setFloatRect: (rect: AmbientFloatSettings["rect"]) => void;
  openFloat: (kind?: AmbientFloatKind) => void;
  applyAsAmbientBackground: (
    kind: AmbientEffectKind,
    pathname?: string
  ) => void;
  backgroundFor: (pathname: string) => AmbientEffectKind;
  floatVisibleFor: (pathname: string) => boolean;
  defaults: AmbientEffectsSettings;
};

const AmbientEffectsContext =
  createContext<AmbientEffectsContextValue | null>(null);

/**
 * Single shared ambient-effects store for the whole app (host + settings + labs).
 */
export function AmbientEffectsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const remote = useQuery(
    api.settings.getSetting,
    isSignedIn ? { key: AMBIENT_EFFECTS_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] =
    useState<AmbientEffectsSettings | null>(() =>
      readAmbientEffectsFromLocalStorage()
    );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeAmbientEffects(
      remote as Partial<AmbientEffectsSettings>
    );
  }, [remote]);

  const seededDefault = useMemo(() => seedAmbientFromHeroAtmosphere(), []);

  const settings =
    localSettings ?? remoteSettings ?? seededDefault;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeAmbientEffectsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!isSignedIn) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local =
      readAmbientEffectsFromLocalStorage() ?? seedAmbientFromHeroAtmosphere();
    pushedLocalToRemote.current = true;
    setRemoteSetting({
      key: AMBIENT_EFFECTS_SETTINGS_KEY,
      value: local,
    }).catch((err) => {
      console.error("Failed to save ambient effects", err);
    });
  }, [isSignedIn, remote, setRemoteSetting]);

  const wroteSeedToLocal = useRef(false);
  useEffect(() => {
    if (wroteSeedToLocal.current) return;
    if (localSettings != null) return;
    if (remote !== undefined && remote != null) return;
    writeAmbientEffectsToLocalStorage(seededDefault);
    wroteSeedToLocal.current = true;
  }, [localSettings, remote, seededDefault]);

  const persist = useCallback(
    (next: AmbientEffectsSettings) => {
      writeAmbientEffectsToLocalStorage(next);
      if (!isSignedIn) return;
      setRemoteSetting({
        key: AMBIENT_EFFECTS_SETTINGS_KEY,
        value: next,
      }).catch((err) => {
        console.error("Failed to save ambient effects", err);
      });
    },
    [isSignedIn, setRemoteSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<AmbientEffectsSettings>) => {
      const next = normalizeAmbientEffects({ ...settings, ...patch });
      setLocalSettings(next);
      persist(next);
    },
    [persist, settings]
  );

  const setDefaultBackground = useCallback(
    (kind: AmbientEffectKind) => {
      updateSettings({ defaultBackground: kind });
    },
    [updateSettings]
  );

  const setApplyEverywhere = useCallback(
    (applyEverywhere: boolean) => {
      updateSettings({ applyEverywhere });
    },
    [updateSettings]
  );

  const setRouteBackground = useCallback(
    (pathname: string, kind: AmbientEffectKind | "inherit") => {
      const routeBackgrounds = { ...settings.routeBackgrounds };
      if (kind === "inherit") {
        delete routeBackgrounds[pathname];
      } else {
        routeBackgrounds[pathname] = kind;
      }
      updateSettings({ routeBackgrounds });
    },
    [settings.routeBackgrounds, updateSettings]
  );

  const setScrimDarkness = useCallback(
    (scrimDarkness: number) => {
      updateSettings({ scrimDarkness });
    },
    [updateSettings]
  );

  const updateFloat = useCallback(
    (patch: Partial<AmbientFloatSettings>) => {
      updateSettings({
        float: normalizeAmbientEffects({
          float: { ...settings.float, ...patch },
        }).float,
      });
    },
    [settings.float, updateSettings]
  );

  const setFloatEnabled = useCallback(
    (enabled: boolean) => {
      updateFloat({ enabled });
    },
    [updateFloat]
  );

  const setFloatKind = useCallback(
    (kind: AmbientFloatKind) => {
      updateFloat({ kind });
    },
    [updateFloat]
  );

  const setFloatRect = useCallback(
    (rect: AmbientFloatSettings["rect"]) => {
      updateFloat({ rect });
    },
    [updateFloat]
  );

  const openFloat = useCallback(
    (kind?: AmbientFloatKind) => {
      updateFloat({
        enabled: true,
        ...(kind ? { kind } : {}),
      });
    },
    [updateFloat]
  );

  const applyAsAmbientBackground = useCallback(
    (kind: AmbientEffectKind, pathname?: string) => {
      if (pathname) {
        setRouteBackground(pathname, kind);
      } else {
        updateSettings({
          defaultBackground: kind,
          applyEverywhere: true,
        });
      }
    },
    [setRouteBackground, updateSettings]
  );

  const backgroundFor = useCallback(
    (pathname: string) => resolveBackgroundKind(pathname, settings),
    [settings]
  );

  const floatVisibleFor = useCallback(
    (pathname: string) => resolveFloatVisible(pathname, settings),
    [settings]
  );

  const value = useMemo<AmbientEffectsContextValue>(
    () => ({
      settings,
      updateSettings,
      setDefaultBackground,
      setApplyEverywhere,
      setRouteBackground,
      setScrimDarkness,
      updateFloat,
      setFloatEnabled,
      setFloatKind,
      setFloatRect,
      openFloat,
      applyAsAmbientBackground,
      backgroundFor,
      floatVisibleFor,
      defaults: DEFAULT_AMBIENT_EFFECTS,
    }),
    [
      settings,
      updateSettings,
      setDefaultBackground,
      setApplyEverywhere,
      setRouteBackground,
      setScrimDarkness,
      updateFloat,
      setFloatEnabled,
      setFloatKind,
      setFloatRect,
      openFloat,
      applyAsAmbientBackground,
      backgroundFor,
      floatVisibleFor,
    ]
  );

  return (
    <AmbientEffectsContext.Provider value={value}>
      {children}
    </AmbientEffectsContext.Provider>
  );
}

/**
 * App-wide ambient effect preferences (per-route backgrounds + float panel).
 * Must be used under AmbientEffectsProvider.
 */
export function useAmbientEffects(): AmbientEffectsContextValue {
  const ctx = useContext(AmbientEffectsContext);
  if (!ctx) {
    throw new Error(
      "useAmbientEffects must be used within AmbientEffectsProvider"
    );
  }
  return ctx;
}
