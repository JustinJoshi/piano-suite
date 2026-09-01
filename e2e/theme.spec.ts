import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { themeIds, type ThemeId } from "@/lib/themes";

const EXPECTED_PRIMARY: Record<ThemeId, string> = {
  amber: "#c9a227",
  rose: "#e11d48",
  emerald: "#10b981",
  ocean: "#06b6d4",
  violet: "#8b5cf6",
  slate: "#94a3b8",
};

async function expectExclusiveTheme(page: import("@playwright/test").Page, themeId: ThemeId) {
  const html = page.locator("html");
  await expect(html).toHaveClass(new RegExp(`(?:^|\\s)${themeId}(?:\\s|$)`));

  for (const other of themeIds) {
    if (other === themeId) continue;
    await expect(html).not.toHaveClass(new RegExp(`(?:^|\\s)${other}(?:\\s|$)`));
  }

  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim()
      .toLowerCase()
  );
  expect(primary).toBe(EXPECTED_PRIMARY[themeId]);
}

test.describe("/settings/theme", () => {
  test("lets an authenticated user switch themes", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/settings/theme");

    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Amber", exact: false })
    ).toBeVisible();

    // Select a non-default theme.
    await page.getByTestId("theme-card-rose").click();
    await expectExclusiveTheme(page, "rose");

    // A later-in-CSS theme, then back to an earlier one — this is the
    // regression that failed when ThemeProvider omitted `themes={themeIds}`.
    await page.getByTestId("theme-card-slate").click();
    await expectExclusiveTheme(page, "slate");

    await page.getByTestId("theme-card-ocean").click();
    await expectExclusiveTheme(page, "ocean");

    await page.getByTestId("theme-card-amber").click();
    await expectExclusiveTheme(page, "amber");
  });

  test("sidebar links to the settings page with the theme section", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools");

    // Phase 1.5: one settings page with sections.
    await page
      .locator("aside nav")
      .getByRole("link", { name: "Settings" })
      .click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "Theme" })).toBeVisible();
  });
});
