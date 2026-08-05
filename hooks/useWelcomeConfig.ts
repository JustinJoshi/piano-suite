"use client";

import { createContext, useContext } from "react";
import type { WelcomeConfig } from "@/lib/welcome-config";

export interface WelcomeConfigContextValue {
  config: WelcomeConfig;
  updateConfig: (
    patch:
      | Partial<WelcomeConfig>
      | ((prev: WelcomeConfig) => WelcomeConfig)
  ) => void;
}

export const WelcomeConfigContext = createContext<WelcomeConfigContextValue | null>(
  null
);

export function useWelcomeConfig(): WelcomeConfigContextValue {
  const context = useContext(WelcomeConfigContext);
  if (!context) {
    throw new Error(
      "useWelcomeConfig must be used within a WelcomeConfigProvider"
    );
  }
  return context;
}
