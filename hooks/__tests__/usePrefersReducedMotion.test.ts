import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  prefersReducedMotion,
  usePrefersReducedMotion,
} from "@/hooks/usePrefersReducedMotion";

type ChangeListener = (event: { matches: boolean }) => void;

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

/** Installs a controllable matchMedia stub; returns a change emitter. */
function stubMatchMedia(initialMatches: boolean) {
  let listener: ChangeListener | null = null;
  const mediaQuery = {
    matches: initialMatches,
    media: REDUCE_QUERY,
    addEventListener: vi.fn((_: string, cb: ChangeListener) => {
      listener = cb;
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(
    mediaQuery
  ) as unknown as typeof window.matchMedia;
  return (matches: boolean) => {
    act(() => {
      listener?.({ matches });
    });
  };
}

function restoreMatchMedia(original: typeof window.matchMedia | undefined) {
  if (original) {
    window.matchMedia = original;
  } else {
    // @ts-expect-error test-only removal of the property
    delete window.matchMedia;
  }
}

describe("usePrefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    restoreMatchMedia(originalMatchMedia);
  });

  it("reports false when reduced motion is not preferred", () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reports true when reduced motion is preferred", () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const emitChange = stubMatchMedia(false);

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    emitChange(true);
    expect(result.current).toBe(true);

    emitChange(false);
    expect(result.current).toBe(false);
  });

  it("removes its change listener on unmount", () => {
    stubMatchMedia(false);

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    unmount();

    const stub = window.matchMedia as unknown as ReturnType<typeof vi.fn>;
    const mediaQuery = stub.mock.results[0]?.value as {
      removeEventListener: ReturnType<typeof vi.fn>;
    };
    expect(mediaQuery.removeEventListener).toHaveBeenCalled();
  });

  it("prefersReducedMotion() is false without matchMedia", () => {
    // @ts-expect-error simulate a host without matchMedia
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
  });
});
