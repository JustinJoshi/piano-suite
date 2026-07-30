import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  AmbientEffectsProvider,
  useAmbientEffects,
} from "@/hooks/useAmbientEffects";
import {
  AMBIENT_EFFECTS_LOCAL_STORAGE_KEY,
  DEFAULT_AMBIENT_EFFECTS,
} from "@/lib/ambient-effects";

const setRemoteSetting = vi.fn(() => Promise.resolve(null));
const useAuthAccessMock = vi.fn(() => ({
  authDisabled: false,
  isSignedIn: false,
  canAccess: false,
  canPersist: false,
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => useAuthAccessMock(),
}));

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => setRemoteSetting,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AmbientEffectsProvider>{children}</AmbientEffectsProvider>;
}

describe("useAmbientEffects", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    setRemoteSetting.mockClear();
    useAuthAccessMock.mockReturnValue({
      authDisabled: false,
      isSignedIn: false,
      canAccess: false,
      canPersist: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("seeds defaults and persists route overrides locally when not Pro", () => {
    const { result } = renderHook(() => useAmbientEffects(), { wrapper });

    expect(result.current.settings.defaultBackground).toBe(
      DEFAULT_AMBIENT_EFFECTS.defaultBackground
    );

    act(() => {
      result.current.setRouteBackground(
        "/tools/chord-drill",
        "chladni-ripple"
      );
    });

    expect(result.current.backgroundFor("/tools/chord-drill")).toBe(
      "chladni-ripple"
    );
    expect(setRemoteSetting).not.toHaveBeenCalled();

    const raw = window.localStorage.getItem(AMBIENT_EFFECTS_LOCAL_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).routeBackgrounds["/tools/chord-drill"]).toBe(
      "chladni-ripple"
    );
  });

  it("does not sync ambient prefs when signed-in Free (!canPersist)", () => {
    useAuthAccessMock.mockReturnValue({
      authDisabled: false,
      isSignedIn: true,
      canAccess: true,
      canPersist: false,
    });

    const { result } = renderHook(() => useAmbientEffects(), { wrapper });

    act(() => {
      result.current.setDefaultBackground("julia");
    });

    expect(result.current.settings.defaultBackground).toBe("julia");
    expect(setRemoteSetting).not.toHaveBeenCalled();
  });

  it("syncs ambient prefs to Convex when canPersist", () => {
    useAuthAccessMock.mockReturnValue({
      authDisabled: false,
      isSignedIn: true,
      canAccess: true,
      canPersist: true,
    });

    const { result } = renderHook(() => useAmbientEffects(), { wrapper });

    act(() => {
      result.current.setDefaultBackground("lissajous");
    });

    expect(setRemoteSetting).toHaveBeenCalled();
  });

  it("opens the float panel", () => {
    const { result } = renderHook(() => useAmbientEffects(), { wrapper });

    act(() => {
      result.current.openFloat("julia");
    });

    expect(result.current.settings.float.enabled).toBe(true);
    expect(result.current.settings.float.kind).toBe("julia");
    expect(result.current.floatVisibleFor("/tools/arpeggios")).toBe(true);
  });
});
