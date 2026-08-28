import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_EVENTS,
  captureEvent,
  initAnalytics,
} from "@/lib/analytics";
import posthog from "posthog-js";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

const mockPosthog = vi.mocked(posthog);

describe("analytics", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;
  });

  it("locks the launch event list to exactly three names", () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
      "drill_started",
      "drill_completed",
      "pro_waitlist_click",
    ]);
  });

  it("is a no-op when NEXT_PUBLIC_POSTHOG_KEY is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    initAnalytics();
    captureEvent("drill_started", { pageId: "test-page" });
    await Promise.resolve();
    expect(mockPosthog.init).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it("captures known events when a key is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initAnalytics();
    captureEvent("drill_completed", { pageId: "test-page" });
    await flushAsync();
    expect(mockPosthog.capture).toHaveBeenCalledWith("drill_completed", {
      pageId: "test-page",
    });
    expect(mockPosthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ autocapture: false }),
    );
  });

  it("drops unknown event names without emitting anything", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    captureEvent("page_view" as never, {});
    await Promise.resolve();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
    expect(analyticsLog()).toHaveLength(0);
  });

  it("mirrors captures to window.__analyticsEvents for e2e", () => {
    captureEvent("drill_started", { pageId: "p" });
    const log = analyticsLog();
    expect(log).toHaveLength(1);
    expect(log[0].name).toBe("drill_started");
    expect(log[0].props).toEqual({ pageId: "p" });
  });

  it("mirrors even when unconfigured (no key) for e2e", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    captureEvent("pro_waitlist_click", {});
    expect(analyticsLog()).toHaveLength(1);
  });
});

function analyticsLog(): Array<{ name: string; props: unknown }> {
  return ((window as unknown as Record<string, unknown>).__analyticsEvents ??
    []) as Array<{ name: string; props: unknown }>;
}

function flushAsync(ticks = 3): Promise<void> {
  let p: Promise<void> = Promise.resolve();
  for (let i = 0; i < ticks; i += 1) {
    p = p.then(
      () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
    );
  }
  return p;
}
