import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

/**
 * Delay soundfont fetches so the UI loading state is visible long enough to
 * assert. smplr loads built-in pianos from these hosts:
 *   - SplendidGrandPiano: smpldsnds.github.io/sfzinstruments-splendid-grand-piano
 *   - FluidR3_GM / MusyngKite: gleitz.github.io/midi-js-soundfonts
 */
async function delaySoundfontFetches(page: import("@playwright/test").Page) {
  await page.route(
    /(midi-js-soundfonts|sfzinstruments-splendid-grand-piano)/,
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 750));
      await route.continue();
    }
  );
}

test.describe("/settings/audio", () => {
  test("shows a loading indicator while switching soundfont presets", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await delaySoundfontFetches(page);

    await page.goto("/settings/audio");
    await expect(page.getByRole("heading", { name: "Audio" })).toBeVisible();

    const presetBtn = page.getByTestId("audio-preset-fluidr3-acoustic-grand-piano");
    await expect(presetBtn).toBeVisible();

    // Switch to a built-in FluidR3 piano to trigger a fresh soundfont fetch.
    await presetBtn.click();

    const loading = page.getByTestId("audio-preset-loading");
    await expect(loading).toBeVisible();
    await expect(loading).toContainText("Loading");

    // The indicator disappears once samples are ready.
    await expect(loading).toBeHidden({ timeout: 15000 });
  });
});
