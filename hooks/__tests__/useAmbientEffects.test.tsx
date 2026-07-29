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

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false }),
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("seeds defaults and persists route overrides locally when signed out", () => {
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
