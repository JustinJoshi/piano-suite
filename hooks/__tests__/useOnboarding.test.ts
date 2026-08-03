import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

describe("useOnboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("starts incomplete when localStorage is empty", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isCompleted).toBe(false);
    expect(result.current.mounted).toBe(true);
  });

  it("reads completed state from localStorage", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isCompleted).toBe(true);
  });

  it("marks complete and persists to localStorage", () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.markComplete();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
  });

  it("reset clears persisted state", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isCompleted).toBe(false);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
  });

  it("enables instant mode from query parameter", () => {
    window.history.replaceState({}, "", "?onboarding=instant");

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isInstant).toBe(true);

    window.history.replaceState({}, "", "/");
  });

  it("enables instant mode and clears state from reset query parameter", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    window.history.replaceState({}, "", "?onboarding=reset");

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isInstant).toBe(true);
    expect(result.current.isCompleted).toBe(false);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();

    window.history.replaceState({}, "", "/");
  });

  it("enables instant mode when reduced motion is preferred", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.isInstant).toBe(true);

    window.matchMedia = originalMatchMedia;
  });
});
