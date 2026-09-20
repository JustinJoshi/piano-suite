import { test, expect } from "@playwright/test";

// Signed-out journey from a featured marketplace card to its playable seed
// detail route. Uses the shipped seed fixtures only — no stored page may be
// created just by visiting.
test.describe("/marketplace featured Try-it links", () => {
  test("first featured card links to its playable seed detail", async ({
    page,
  }) => {
    await page.goto("/marketplace");

    // Dev servers compile routes on demand; wait for hydration before the
    // soft navigation or the click can land before Next is attached.
    const tryIt = page
      .getByRole("link", { name: "Try Play your first Cmaj7" })
      .first();
    await expect(tryIt).toBeVisible();
    await expect(page.locator("h1", { hasText: "Marketplace" })).toBeVisible();

    const before = await page.evaluate(() =>
      window.localStorage.getItem("custom-practice-pages-v2")
    );

    await tryIt.click();

    await expect(page).toHaveURL(/\/marketplace\/first-chords$/, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Play your first Cmaj7" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /fork to my workshop/i })
    ).toBeVisible();

    const after = await page.evaluate(() =>
      window.localStorage.getItem("custom-practice-pages-v2")
    );
    expect(after).toBe(before);
  });
});
