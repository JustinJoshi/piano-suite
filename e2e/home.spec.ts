import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test("loads the public landing page", async ({ page }) => {
    await page.goto("/");

    // The landing page should render without requiring authentication.
    await expect(page.locator("body")).toContainText("Piano Suite");
  });

  // Phase 1.2: one sentence, one button. The hero CTA is the only primary
  // call to action — duplicates further down the page are removed.
  test("landing has exactly one primary CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Start free" })).toHaveCount(
      1
    );
    await expect(
      page.getByRole("link", { name: /open the workshop/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /enter the workshop/i })
    ).toHaveCount(0);
  });

  // Phase 1.4: the landing halves. Hero, three doors, how it works,
  // starter templates, evidence, story — six sections, footer excluded.
  test("landing renders at most six top-level sections", async ({ page }) => {
    await page.goto("/");

    const count = await page.locator("main > section").count();
    expect(count).toBeLessThanOrEqual(6);
  });

  // Phase 1.3: the CTA leads to a three-door chooser, not a dense page.
  test("anonymous visitor: CTA → /start → Build door → workshop", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start free" }).click();

    await expect(page).toHaveURL(/\/start$/);
    await expect(
      page.getByRole("heading", { name: /how do you want to begin/i })
    ).toBeVisible();

    for (const door of ["Play", "Build", "Learn"]) {
      await expect(
        page.getByRole("link", { name: new RegExp(door, "i") })
      ).toBeVisible();
    }

    await page.getByRole("link", { name: /^build/i }).click();
    await expect(page).toHaveURL(/\/tools\/workshop$/);

    // Keep going to a running metronome, all anonymous.
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await page.getByRole("link", { name: /open the marketplace/i }).click();
    await page.getByRole("button", { name: /add metronome/i }).click();
    await page.getByRole("link", { name: /back to workshop/i }).click();
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM");
    await page.getByRole("button", { name: /start metronome/i }).click();
    await expect(
      page.getByRole("button", { name: /stop metronome/i })
    ).toBeVisible();
  });
});
