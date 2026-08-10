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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
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
import { type ChladniRippleParams } from "@/lib/chladni-ripple-settings";

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
  applyRippleBackground: (
    params: ChladniRippleParams,
    target?: "home" | "everywhere"
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
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: AMBIENT_EFFECTS_SETTINGS_KEY } : "skip"
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
    if (!canPersist) return;
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
  }, [canPersist, remote, setRemoteSetting]);

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
      if (!canPersist) return;
      setRemoteSetting({
        key: AMBIENT_EFFECTS_SETTINGS_KEY,
        value: next,
      }).catch((err) => {
        console.error("Failed to save ambient effects", err);
      });
    },
    [canPersist, setRemoteSetting]
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

  const applyRippleBackground = useCallback(
    (params: ChladniRippleParams, target: "home" | "everywhere" = "home") => {
      if (target === "home") {
        const next = normalizeAmbientEffects({
          ...settings,
          ripple: params,
          routeBackgrounds: {
            ...settings.routeBackgrounds,
            "/": "chladni-ripple",
          },
        });
        setLocalSettings(next);
        persist(next);
      } else {
        const next = normalizeAmbientEffects({
          ...settings,
          ripple: params,
          defaultBackground: "chladni-ripple",
          applyEverywhere: true,
        });
        setLocalSettings(next);
        persist(next);
      }
    },
    [settings, persist]
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
      applyRippleBackground,
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
      applyRippleBackground,
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
