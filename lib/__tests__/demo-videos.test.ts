import { beforeEach, describe, expect, it } from "vitest";
import {
  DEMO_INTRO_FLAG_PREFIX,
  demoIntroFlagKey,
  hasSeenDemoIntro,
  markDemoIntroSeen,
  toolDemoVideos,
} from "@/lib/demo-videos";

const TOOL_HREFS = Object.keys(toolDemoVideos);

describe("demo intro flag logic", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("builds per-tool keys in the piano-suite namespace", () => {
    expect(demoIntroFlagKey("/tools/chord-drill")).toBe(
      `${DEMO_INTRO_FLAG_PREFIX}/tools/chord-drill`,
    );
    expect(DEMO_INTRO_FLAG_PREFIX.startsWith("piano-suite:")).toBe(true);
  });

  it("has intro copy for every registered tool", () => {
    for (const href of TOOL_HREFS) {
      const demo = toolDemoVideos[href];
      expect(demo.introHeadline.length).toBeGreaterThan(0);
      expect(demo.introBody.length).toBeGreaterThan(0);
      expect(demo.introCta.length).toBeGreaterThan(0);
    }
  });

  it("reports not-seen before any dismissal", () => {
    expect(hasSeenDemoIntro("/tools/arpeggios")).toBe(false);
  });

  it("reports not-seen on the server (no window)", () => {
    // The helpers guard typeof window; simulate by deleting it.
    const originalWindow = globalThis.window;
    // @ts-expect-error test-only removal of the browser global
    delete globalThis.window;
    expect(hasSeenDemoIntro("/tools/arpeggios")).toBe(false);
    expect(() => markDemoIntroSeen("/tools/arpeggios")).not.toThrow();
    globalThis.window = originalWindow;
  });

  it("persists dismissal per tool and never for other tools", () => {
    markDemoIntroSeen("/tools/chord-drill");
    expect(hasSeenDemoIntro("/tools/chord-drill")).toBe(true);
    expect(hasSeenDemoIntro("/tools/progression")).toBe(false);

    markDemoIntroSeen("/tools/progression");
    expect(hasSeenDemoIntro("/tools/progression")).toBe(true);
    expect(hasSeenDemoIntro("/tools/root-cycling")).toBe(false);
  });

  it("stores exactly the flag value 'true' under the per-tool key", () => {
    markDemoIntroSeen("/tools/workshop");
    expect(
      window.localStorage.getItem(
        `${DEMO_INTRO_FLAG_PREFIX}/tools/workshop`,
      ),
    ).toBe("true");
  });
});
