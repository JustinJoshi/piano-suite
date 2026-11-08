import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { AnalyticsProvider } from "../analytics-provider";
import {
  capturePageview,
  identifyUser,
  initAnalytics,
  resetAnalytics,
} from "@/lib/analytics";

const useUserMock = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/start",
}));

vi.mock("@/lib/analytics", () => ({
  initAnalytics: vi.fn(),
  capturePageview: vi.fn(),
  identifyUser: vi.fn(),
  resetAnalytics: vi.fn(),
}));

const mockInit = vi.mocked(initAnalytics);
const mockPageview = vi.mocked(capturePageview);
const mockIdentify = vi.mocked(identifyUser);
const mockReset = vi.mocked(resetAnalytics);

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes PostHog and captures the current path", () => {
    useUserMock.mockReturnValue({ isLoaded: false, user: null });

    render(<AnalyticsProvider>child</AnalyticsProvider>);

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockPageview).toHaveBeenCalledWith("/start");
  });

  it("identifies the signed-in Clerk user", () => {
    useUserMock.mockReturnValue({ isLoaded: true, user: { id: "user_1" } });

    render(<AnalyticsProvider>child</AnalyticsProvider>);

    expect(mockIdentify).toHaveBeenCalledWith("user_1");
    expect(mockReset).not.toHaveBeenCalled();
  });

  it("resets PostHog when the user signs out", () => {
    useUserMock.mockReturnValue({ isLoaded: true, user: { id: "user_1" } });
    const { rerender } = render(
      <AnalyticsProvider>child</AnalyticsProvider>
    );
    expect(mockIdentify).toHaveBeenCalledWith("user_1");

    useUserMock.mockReturnValue({ isLoaded: true, user: null });
    rerender(<AnalyticsProvider>child</AnalyticsProvider>);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("does not reset on a first anonymous load", () => {
    useUserMock.mockReturnValue({ isLoaded: true, user: null });

    render(<AnalyticsProvider>child</AnalyticsProvider>);

    expect(mockReset).not.toHaveBeenCalled();
  });
});
