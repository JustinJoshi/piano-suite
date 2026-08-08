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

    const presetSelect = page.getByTestId("audio-preset");
    await expect(presetSelect).toHaveValue("splendid-grand-piano");

    // Switch to FluidR3 to trigger a fresh soundfont fetch.
    await presetSelect.selectOption("fluidr3-piano");

    const loading = page.getByTestId("audio-preset-loading");
    await expect(loading).toBeVisible();
    await expect(loading).toContainText("Loading");

    // The indicator disappears once samples are ready.
    await expect(loading).toBeHidden({ timeout: 15000 });
    await expect(presetSelect).toHaveValue("fluidr3-piano");
  });
});
