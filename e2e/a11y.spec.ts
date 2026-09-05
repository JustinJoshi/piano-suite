import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Signed-out project: all three routes are public after Phase 2.1.
test.describe("workshop a11y (signed out)", () => {
  test.use({
    storageState: { cookies: [] as never[], origins: [] as never[] },
  });

  async function scanForSeriousViolations(page: import("@playwright/test").Page) {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    return results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
  }

  function describeViolations(
    violations: Awaited<ReturnType<typeof scanForSeriousViolations>>
  ): string {
    return violations
      .map((v) => {
        const targets = v.nodes.map((n) => n.target.join(" ")).join("; ");
        return `${v.id} (${v.impact}): ${targets}`;
      })
      .join("\n");
  }

  test("block library and marketplace report zero serious/critical violations", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/tools/workshop/blocks");
    await expect(page).toHaveURL(/\/tools\/workshop\/blocks$/, {
      timeout: 15_000,
    });
    await expect(
      page.getByTestId("marketplace-card-metronome").first()
    ).toBeVisible({ timeout: 15_000 });

    const blocksViolations = await scanForSeriousViolations(page);
    expect(
      blocksViolations,
      `blocks route:\n${describeViolations(blocksViolations)}`
    ).toEqual([]);

    await page.goto("/marketplace");
    await expect(page).toHaveURL(/\/marketplace$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /marketplace/i })
    ).toBeVisible({ timeout: 15_000 });

    const marketplaceViolations = await scanForSeriousViolations(page);
    expect(
      marketplaceViolations,
      `marketplace route:\n${describeViolations(marketplaceViolations)}`
    ).toEqual([]);
  });

  test("workshop page reports zero serious/critical violations", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/tools/workshop");
    await expect(page).toHaveURL(/\/tools\/workshop$/, { timeout: 15_000 });

    // A fresh signed-out browser gets the onboarding overlay; axe on an
    // overlay-dimmed DOM reports focus traps. Dismiss it, then the starter
    // picker, so the scan sees the real dashboard.
    await page.getByRole("button", { name: /skip/i }).click();
    await expect(
      page.getByRole("link", { name: /open the block library/i })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible({
      timeout: 15_000,
    });

    const violations = await scanForSeriousViolations(page);
    expect(
      violations,
      `workshop route:\n${describeViolations(violations)}`
    ).toEqual([]);
  });
});
