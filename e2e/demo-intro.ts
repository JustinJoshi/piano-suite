import type { Page } from "@playwright/test";
import { demoIntroFlagKey, toolDemoVideos } from "@/lib/demo-videos";

/**
 * Mark every tool's first-visit demo-intro overlay as seen before any
 * page loads. Most specs read like a returning visitor; the overlay's
 * own behavior is exercised live in a11y.spec.ts, which dismisses it
 * with real clicks after the onboarding skip.
 */
export async function markDemoIntrosSeen(page: Page): Promise<void> {
  const flags = Object.fromEntries(
    Object.keys(toolDemoVideos).map((href) => [demoIntroFlagKey(href), "true"]),
  );
  await page.addInitScript((fs) => {
    for (const [key, value] of Object.entries(fs)) {
      window.localStorage.setItem(key, value);
    }
  }, flags);
}
