"use client";

import { useCallback, useState } from "react";
import {
  WelcomeConfigContext,
  type WelcomeConfigContextValue,
} from "@/hooks/useWelcomeConfig";
import {
  defaultWelcomeConfig,
  validateWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/welcome-config";

const STORAGE_KEY = "piano-suite:welcome-config";

function readStoredConfig(): WelcomeConfig {
  if (typeof window === "undefined") return defaultWelcomeConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return validateWelcomeConfig(JSON.parse(raw));
    }
  } catch {
    // Ignore invalid or missing localStorage values.
  }
  return defaultWelcomeConfig;
}

interface WelcomeConfigProviderProps {
  children: React.ReactNode;
  /** Controlled config. When omitted, the provider reads from localStorage. */
  value?: WelcomeConfig;
  /** Controlled change handler. Required when `value` is provided. */
  onChange?: (config: WelcomeConfig) => void;
}

export function WelcomeConfigProvider({
  children,
  value,
  onChange,
}: WelcomeConfigProviderProps) {
  const isControlled = value !== undefined;
  const [internalConfig, setInternalConfig] = useState<WelcomeConfig>(
    isControlled ? defaultWelcomeConfig : readStoredConfig
  );

  const updateConfig: WelcomeConfigContextValue["updateConfig"] = useCallback(
    (patch) => {
      if (isControlled) {
        const next =
          typeof patch === "function"
            ? patch(value)
            : validateWelcomeConfig({ ...value, ...patch });
        onChange?.(next);
        return;
      }

      setInternalConfig((prev) => {
        const next =
          typeof patch === "function"
            ? patch(prev)
            : validateWelcomeConfig({ ...prev, ...patch });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors (e.g. private browsing).
        }
        return next;
      });
    },
    [isControlled, onChange, value]
  );

  const config = isControlled ? value : internalConfig;

  return (
    <WelcomeConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </WelcomeConfigContext.Provider>
  );
}
