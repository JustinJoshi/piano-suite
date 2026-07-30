import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ExperimentalFeaturesProvider,
  useExperimentalFeatures,
} from "@/hooks/useExperimentalFeatures";
import {
  DEFAULT_EXPERIMENTAL_FEATURES,
  EXPERIMENTAL_FEATURES_LOCAL_STORAGE_KEY,
} from "@/lib/experimental-features";

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
  return (
    <ExperimentalFeaturesProvider>{children}</ExperimentalFeaturesProvider>
  );
}

describe("useExperimentalFeatures", () => {
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

  it("defaults to disabled and persists locally when enabled", () => {
    const { result } = renderHook(() => useExperimentalFeatures(), {
      wrapper,
    });

    expect(result.current.enabled).toBe(
      DEFAULT_EXPERIMENTAL_FEATURES.enabled
    );

    act(() => {
      result.current.setEnabled(true);
    });

    expect(result.current.enabled).toBe(true);
    expect(setRemoteSetting).not.toHaveBeenCalled();

    const raw = window.localStorage.getItem(
      EXPERIMENTAL_FEATURES_LOCAL_STORAGE_KEY
    );
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).enabled).toBe(true);
  });

  it("shares enabled state across consumers without a refresh", () => {
    const { result } = renderHook(
      () => ({
        a: useExperimentalFeatures(),
        b: useExperimentalFeatures(),
      }),
      { wrapper }
    );

    expect(result.current.a.enabled).toBe(false);
    expect(result.current.b.enabled).toBe(false);

    act(() => {
      result.current.a.setEnabled(true);
    });

    expect(result.current.a.enabled).toBe(true);
    expect(result.current.b.enabled).toBe(true);
  });
});
