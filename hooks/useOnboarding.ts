"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ONBOARDING_INSTANT_PARAM,
  ONBOARDING_RESET_PARAM,
  ONBOARDING_STORAGE_KEY,
} from "@/lib/onboarding";

function getHasCompletedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setCompletedInStorage(completed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (completed) {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
    // Notify useSyncExternalStore subscribers in the same window.
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: ONBOARDING_STORAGE_KEY,
        newValue: completed ? "true" : null,
      })
    );
  } catch {
    // Ignore storage errors (e.g. private browsing).
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function computeInstantMode(): boolean {
  if (typeof window === "undefined") return false;
  const search = window.location.search;
  const isInstantParam =
    search.includes(ONBOARDING_INSTANT_PARAM) ||
    search.includes(`${ONBOARDING_INSTANT_PARAM}&`);
  const isResetParam =
    search.includes(ONBOARDING_RESET_PARAM) ||
    search.includes(`${ONBOARDING_RESET_PARAM}&`);
  const envInstant = process.env.NEXT_PUBLIC_ONBOARDING_INSTANT === "true";
  return isInstantParam || isResetParam || envInstant || prefersReducedMotion();
}

function subscribeToStorage(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === ONBOARDING_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function useOnboardingStorageValue(): boolean {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getHasCompletedFromStorage(),
    () => false
  );
}

/**
 * Tracks whether the user has completed the `/tools` onboarding flow.
 *
 * State lives in `localStorage` only. The flow can be bypassed instantly via:
 * - `?onboarding=instant` query parameter
 * - `?onboarding=reset` query parameter (also clears completion)
 * - `NEXT_PUBLIC_ONBOARDING_INSTANT=true` environment variable
 * - `prefers-reduced-motion: reduce`
 */
export function useOnboarding() {
  const mounted = useClientMounted();
  const [isInstant] = useState<boolean>(() => computeInstantMode());
  const [resetOnMount] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.location.search.includes(ONBOARDING_RESET_PARAM)
      : false
  );
  const isCompleted = useOnboardingStorageValue();

  useEffect(() => {
    if (resetOnMount) {
      setCompletedInStorage(false);
    }
  }, [resetOnMount]);

  const markComplete = useCallback(() => {
    setCompletedInStorage(true);
  }, []);

  const reset = useCallback(() => {
    setCompletedInStorage(false);
  }, []);

  return {
    isCompleted,
    markComplete,
    reset,
    isInstant,
    mounted,
  };
}
