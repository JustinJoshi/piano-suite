import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { metronomeBlock, seedWorkshopPage } from "./workshop-seed";

const STARTER_PICKER_KEY = "piano-suite:starter-picker-dismissed-v1";

test.describe("/tools/workshop block library", () => {
  test("first run: templates, blank grid, block library add flow", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, []);
    // Remove the dismissed flag to exercise the real first-run state.
    await page.evaluate((key) => localStorage.removeItem(key), STARTER_PICKER_KEY);
    await page.goto("/tools/workshop");

    // First run greets with ready-made templates.
    await expect(page.getByText("How do you want to start?")).toBeVisible();
    // Guided routes lead the picker.
    await expect(page.getByTestId("picker-route-music-theory")).toBeVisible();
    await expect(
      page.getByTestId("picker-route-finger-flexibility")
    ).toBeVisible();
    await page.getByRole("button", { name: /start from scratch/i }).click();

    // Blank workshop: an empty grid canvas plus the block library entry point.
    await expect(page.getByTestId("workshop-grid")).toHaveAttribute(
      "data-grid-empty",
      "true"
    );
    await page
      .getByRole("link", { name: /open the block library/i })
      .click();
    // Dev server compiles routes on demand and parallel workers contend,
    // so the soft navigation needs more than the default 5s window.
    await expect(page).toHaveURL(/\/tools\/workshop\/blocks$/, {
      timeout: 15_000,
    });

    // Plus adds the component; the button flips to an added state.
    await page.getByRole("button", { name: /add metronome/i }).click();
    await expect(
      page.getByRole("button", { name: /metronome added/i })
    ).toBeVisible();

    // Back in the workshop, the component is on the grid and persists.
    await page
      .getByRole("link", { name: /back to workshop/i })
      .click();
    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM");

    await page.reload();
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM");
  });

  test("pages menu creates and switches between custom pages", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, [metronomeBlock("e2e-a", 100)]);
    await page.goto("/tools/workshop");

    await expect(page.getByTestId("bpm-display")).toHaveText("100 BPM");

    await page.getByRole("button", { name: /e2e grid/i }).click();
    await page.getByRole("button", { name: /new page/i }).click();

    // The fresh page is a blank grid.
    await expect(page.getByTestId("workshop-grid")).toHaveAttribute(
      "data-grid-empty",
      "true"
    );

    // Switch back to the seeded page.
    await page.getByRole("button", { name: /^my practice page/i }).click();
    await page
      .getByRole("button", { name: "Switch to E2E Grid" })
      .click();
    await expect(page.getByTestId("bpm-display")).toHaveText("100 BPM");
  });
});
