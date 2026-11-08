import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_EVENTS,
  captureEvent,
  capturePageview,
  identifyUser,
  initAnalytics,
  resetAnalytics,
} from "@/lib/analytics";
import posthog from "posthog-js";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

const mockPosthog = vi.mocked(posthog);

describe("analytics", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;
  });

  it("locks the launch event list to the known set of names", () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
      "drill_started",
      "drill_completed",
      "pro_waitlist_click",
      "door_clicked",
      "page_created",
      "block_added",
      "page_published",
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
      expect.objectContaining({
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        capture_heatmaps: true,
        capture_dead_clicks: true,
        capture_exceptions: true,
        disable_session_recording: false,
        session_recording: { maskAllInputs: true },
      }),
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

  it("is a no-op for the new events without a key, but still mirrors them", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    captureEvent("door_clicked", { doorId: "play" });
    captureEvent("page_created", { origin: "scratch" });
    captureEvent("block_added", { type: "metronome" });
    await Promise.resolve();

    expect(mockPosthog.init).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();

    const log = analyticsLog();
    expect(log.map((e) => e.name)).toEqual([
      "door_clicked",
      "page_created",
      "block_added",
    ]);
  });

  it("captures the new events when a key is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    captureEvent("page_created", { origin: "fork" });
    await flushAsync();
    expect(mockPosthog.capture).toHaveBeenCalledWith("page_created", {
      origin: "fork",
    });
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

describe("capturePageview", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;
  });

  it("mirrors $pageview to window.__analyticsEvents for e2e", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initAnalytics();
    capturePageview("/tools/workshop");
    await flushAsync();

    const log = analyticsLog();
    expect(log).toHaveLength(1);
    expect(log[0].name).toBe("$pageview");
    expect(log[0].props).toEqual({ $current_url: "/tools/workshop" });
    expect(mockPosthog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "/tools/workshop",
    });
  });

  it("does not emit to posthog when the PostHog key is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    capturePageview("/tools/workshop");
    await Promise.resolve();

    expect(mockPosthog.init).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it("still drops $pageview passed through captureEvent's unknown-name guard", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    captureEvent("$pageview" as never, {});
    await flushAsync();

    expect(mockPosthog.capture).not.toHaveBeenCalled();
    expect(analyticsLog()).toHaveLength(0);
  });

  it("records the path only, never a query string", () => {
    capturePageview("/tools/workshop?invite=abc&next=%2Fsettings");
    const log = analyticsLog();
    const props = log[0].props as Record<string, unknown>;
    expect(props.$current_url).toBe("/tools/workshop");
    expect(String(props.$current_url)).not.toContain("?");
  });
});

describe("identity", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("identifies the signed-in Clerk user", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initAnalytics();
    identifyUser("user_abc");
    await flushAsync();

    expect(mockPosthog.identify).toHaveBeenCalledWith("user_abc");
  });

  it("resets the person on sign-out", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initAnalytics();
    resetAnalytics();
    await flushAsync();

    expect(mockPosthog.reset).toHaveBeenCalled();
  });

  it("does nothing without a key", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    identifyUser("user_abc");
    resetAnalytics();
    await Promise.resolve();

    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(mockPosthog.reset).not.toHaveBeenCalled();
  });
});
