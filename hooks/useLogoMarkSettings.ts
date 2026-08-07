"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  LOGO_MARK_SETTINGS_KEY,
  normalizeLogoMarkSettings,
  readLogoMarkSettingsFromLocalStorage,
  writeLogoMarkSettingsToLocalStorage,
  type LogoMarkSettings,
} from "@/lib/logo-mark-settings";

/**
 * Active brand-mark preferences.
 *
 * - localStorage for everyone (instant, works signed-out)
 * - Convex `settings` key when Pro sync (`canPersist`) is available
 * - Remote hydrates only when there is no local value yet (theme-style)
 */
export function useLogoMarkSettings() {
  const { canPersist } = useAuthAccess();
  const remote = useQuery(
    api.settings.getSetting,
    canPersist ? { key: LOGO_MARK_SETTINGS_KEY } : "skip"
  );
  const setRemoteSetting = useMutation(api.settings.setSetting);

  const [localSettings, setLocalSettings] = useState<LogoMarkSettings | null>(
    () => readLogoMarkSettingsFromLocalStorage()
  );

  const remoteSettings = useMemo(() => {
    if (remote == null || remote === undefined) return null;
    return normalizeLogoMarkSettings(remote as Partial<LogoMarkSettings>);
  }, [remote]);

  const settings =
    localSettings ?? remoteSettings ?? DEFAULT_LOGO_MARK_SETTINGS;

  const wroteRemoteToLocal = useRef(false);

  useEffect(() => {
    if (wroteRemoteToLocal.current) return;
    if (localSettings != null) return;
    if (!remoteSettings) return;
    writeLogoMarkSettingsToLocalStorage(remoteSettings);
    wroteRemoteToLocal.current = true;
  }, [localSettings, remoteSettings]);

  const pushedLocalToRemote = useRef(false);
  useEffect(() => {
    if (!canPersist) return;
    if (remote === undefined) return;
    if (remote != null) return;
    if (pushedLocalToRemote.current) return;
    const local = readLogoMarkSettingsFromLocalStorage();
    if (!local) return;
    pushedLocalToRemote.current = true;
    setRemoteSetting({ key: LOGO_MARK_SETTINGS_KEY, value: local }).catch(
      (err) => {
        console.error("Failed to save logo mark settings", err);
      }
    );
  }, [canPersist, remote, setRemoteSetting]);

  const persist = useCallback(
    (next: LogoMarkSettings) => {
      writeLogoMarkSettingsToLocalStorage(next);
      if (!canPersist) return;
      setRemoteSetting({ key: LOGO_MARK_SETTINGS_KEY, value: next }).catch(
        (err) => {
          console.error("Failed to save logo mark settings", err);
        }
      );
    },
    [canPersist, setRemoteSetting]
  );

  const applySettings = useCallback(
    (draft: LogoMarkSettings) => {
      setLocalSettings((prev) => {
        const base = prev ?? remoteSettings ?? DEFAULT_LOGO_MARK_SETTINGS;
        const next = normalizeLogoMarkSettings({
          ...draft,
          generation: base.generation + 1,
        });
        persist(next);
        return next;
      });
    },
    [persist, remoteSettings]
  );

  const resetSettings = useCallback(() => {
    setLocalSettings((prev) => {
      const base = prev ?? remoteSettings ?? DEFAULT_LOGO_MARK_SETTINGS;
      const next = normalizeLogoMarkSettings({
        ...DEFAULT_LOGO_MARK_SETTINGS,
        generation: base.generation + 1,
      });
      persist(next);
      return next;
    });
  }, [persist, remoteSettings]);

  return {
    settings,
    applySettings,
    resetSettings,
  };
}
