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
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_SETTINGS,
  normalizeAudioSettings,
  readAudioSettingsFromLocalStorage,
  writeAudioSettingsToLocalStorage,
  type AudioSettings,
} from "@/lib/audio-settings";
import type { AudioEngineState } from "@/lib/audio-engine";

type AudioSettingsContextValue = {
  settings: AudioSettings;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setPreset: (preset: AudioSettings["preset"]) => void;
  setSustain: (sustain: boolean) => void;
  setCustomKit: (customKit: AudioSettings["customKit"]) => void;
  loaded: boolean;
  engineState: AudioEngineState;
  setEngineState: (state: AudioEngineState) => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(
  null
);

/**
 * Shared audio preferences store.
 *
 * - localStorage for everyone (instant, works signed-out)
 * - Convex `settings` key when Pro sync (`canPersist`) is available
 * - Remote hydrates only when there is no local value yet
 *
 * Mounted once in the root layout so `AudioEngineHost` and every settings page
 * see the same state and preset changes take effect immediately.
 */
export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: AUDIO_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] = useState<AudioSettings | null>(
    () => readAudioSettingsFromLocalStorage()
  );
  const [engineState, setEngineState] = useState<AudioEngineState>("idle");

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeAudioSettings(remote as Partial<AudioSettings>);
  }, [remote]);

  const settings = localSettings ?? remoteSettings ?? DEFAULT_AUDIO_SETTINGS;

  const wroteRemoteToLocal = useRef(false);

  // Mirror remote → localStorage once when this browser has no local preference.
  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeAudioSettingsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  // When Pro sync is available with local prefs but empty remote, push local once.
  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readAudioSettingsFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({ key: AUDIO_SETTINGS_KEY, value: local }).catch((err) => {
      console.error("Failed to save audio settings", err);
    });
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: AudioSettings) => {
      writeAudioSettingsToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({ key: AUDIO_SETTINGS_KEY, value: next }).catch(
        (err) => {
          console.error("Failed to save audio settings", err);
        }
      );
    },
    [canPersist, setRemoteSetting]
  );

  const updateSettings = useCallback(
    (patch: Partial<AudioSettings>) => {
      setLocalSettings((prev) => {
        const base = prev ?? remoteSettings ?? DEFAULT_AUDIO_SETTINGS;
        const next = normalizeAudioSettings({ ...base, ...patch });
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const setEnabled = useCallback(
    (enabled: boolean) => updateSettings({ enabled }),
    [updateSettings]
  );
  const setVolume = useCallback(
    (volume: number) => updateSettings({ volume }),
    [updateSettings]
  );
  const setPreset = useCallback(
    (preset: AudioSettings["preset"]) => updateSettings({ preset }),
    [updateSettings]
  );
  const setSustain = useCallback(
    (sustain: boolean) => updateSettings({ sustain }),
    [updateSettings]
  );
  const setCustomKit = useCallback(
    (customKit: AudioSettings["customKit"]) => updateSettings({ customKit }),
    [updateSettings]
  );

  const value = useMemo(
    () => ({
      settings,
      setEnabled,
      setVolume,
      setPreset,
      setSustain,
      setCustomKit,
      loaded: localSettings !== null || remoteSettings !== null,
      engineState,
      setEngineState,
    }),
    [
      settings,
      setEnabled,
      setVolume,
      setPreset,
      setSustain,
      setCustomKit,
      localSettings,
      remoteSettings,
      engineState,
      setEngineState,
    ]
  );

  return (
    <AudioSettingsContext.Provider value={value}>
      {children}
    </AudioSettingsContext.Provider>
  );
}

/**
 * Audio preferences React hook.
 *
 * Must be used inside `AudioSettingsProvider` (mounted in the root layout).
 */
export function useAudioSettings() {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) {
    throw new Error(
      "useAudioSettings must be used within AudioSettingsProvider"
    );
  }
  return ctx;
}
