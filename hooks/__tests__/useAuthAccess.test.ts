import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const useUserMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
  useAuth: () => useAuthMock(),
}));

import { useAuthAccess } from "@/hooks/useAuthAccess";

describe("useAuthAccess", () => {
  const originalAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    useUserMock.mockReturnValue({ isSignedIn: false });
    useAuthMock.mockReturnValue({ isLoaded: true, has: () => false });
  });

  afterEach(() => {
    if (originalAuthDisabled === undefined) {
      delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    } else {
      process.env.NEXT_PUBLIC_AUTH_DISABLED = originalAuthDisabled;
    }
    vi.clearAllMocks();
  });

  it("denies access and persist when signed out", () => {
    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canAccess).toBe(false);
    expect(result.current.canPersist).toBe(false);
    expect(result.current.isSignedIn).toBe(false);
  });

  it("allows access but not persist for signed-in Free (no sync / Pro)", () => {
    useUserMock.mockReturnValue({ isSignedIn: true });
    useAuthMock.mockReturnValue({
      isLoaded: true,
      has: () => false,
    });

    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canAccess).toBe(true);
    expect(result.current.canPersist).toBe(false);
  });

  it("allows persist when Clerk has sync feature", () => {
    useUserMock.mockReturnValue({ isSignedIn: true });
    useAuthMock.mockReturnValue({
      isLoaded: true,
      has: (params: { feature?: string; plan?: string }) =>
        params.feature === "sync",
    });

    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canPersist).toBe(true);
  });

  it("allows persist when Clerk has Pro plan (fallback)", () => {
    useUserMock.mockReturnValue({ isSignedIn: true });
    useAuthMock.mockReturnValue({
      isLoaded: true,
      has: (params: { feature?: string; plan?: string }) =>
        params.plan === "pro",
    });

    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canPersist).toBe(true);
  });

  it("treats unloaded auth as not entitled", () => {
    useUserMock.mockReturnValue({ isSignedIn: true });
    useAuthMock.mockReturnValue({
      isLoaded: false,
      has: () => true,
    });

    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canAccess).toBe(true);
    expect(result.current.canPersist).toBe(false);
  });

  it("treats AUTH_DISABLED as full Pro-equivalent persist", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    useUserMock.mockReturnValue({ isSignedIn: false });
    useAuthMock.mockReturnValue({ isLoaded: true, has: () => false });

    const { result } = renderHook(() => useAuthAccess());
    expect(result.current.canAccess).toBe(true);
    expect(result.current.canPersist).toBe(true);
    expect(result.current.authDisabled).toBe(true);
  });
});
