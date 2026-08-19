import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  LOGO_MARK_LOCAL_STORAGE_KEY,
} from "@/lib/logo-mark-settings";

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(async () => undefined),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => ({ canPersist: false, canAccess: true }),
}));

describe("useLogoMarkSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("starts from defaults when localStorage is empty", () => {
    const { result } = renderHook(() => useLogoMarkSettings());
    expect(result.current.settings.mode).toEqual(
      DEFAULT_LOGO_MARK_SETTINGS.mode
    );
  });

  it("applySettings writes localStorage and bumps generation", () => {
    const { result } = renderHook(() => useLogoMarkSettings());
    act(() => {
      result.current.applySettings({
        ...DEFAULT_LOGO_MARK_SETTINGS,
        mode: [2, 3],
      });
    });
    expect(result.current.settings.mode).toEqual([2, 3]);
    expect(result.current.settings.generation).toBe(1);
    const raw = window.localStorage.getItem(LOGO_MARK_LOCAL_STORAGE_KEY);
    expect(raw).toContain('"mode":[2,3]');
  });

  it("resetSettings restores the shipping default", () => {
    const { result } = renderHook(() => useLogoMarkSettings());
    act(() => {
      result.current.applySettings({
        ...DEFAULT_LOGO_MARK_SETTINGS,
        mode: [4, 5],
      });
    });
    act(() => {
      result.current.resetSettings();
    });
    expect(result.current.settings.mode).toEqual(
      DEFAULT_LOGO_MARK_SETTINGS.mode
    );
    expect(result.current.settings.generation).toBe(2);
  });
});
