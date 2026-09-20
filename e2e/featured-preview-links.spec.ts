import { test, expect } from "@playwright/test";

// Signed-out journey from a featured marketplace card to its playable seed
// detail route. Uses the shipped seed fixtures only — no stored page may be
// created just by visiting. The explicit empty storageState override below
// keeps this spec signed out under any config, including the committed
// playwright.config.ts whose chromium project carries authenticated state.
test.describe("/marketplace featured Try-it links", () => {
  test.use({
    storageState: { cookies: [] as never[], origins: [] as never[] },
  });

  test("first featured card links to its playable seed detail", async ({
    page,
  }) => {
    await page.goto("/marketplace");

    // Dev servers compile routes on demand; wait for hydration before the
    // soft navigation or the click can land before Next is attached.
    const firstTitle = "Play your first Cmaj7";
    const tryIt = page
      .getByRole("link", { name: `Try it: ${firstTitle}` })
      .first();
    await expect(tryIt).toBeVisible();
    await expect(page.locator("h1", { hasText: "Marketplace" })).toBeVisible();

    // Label-in-name (WCAG 2.5.3): the accessible name must contain the
    // entire visible label "Try it", plus the seed title.
    await expect(tryIt).toHaveAccessibleName(`Try it: ${firstTitle}`);
    await expect(tryIt).toHaveText(/Try it/);

    // Action-colour convention: the control must not carry the brand variant
    // (brand hue labels, it does not invite a press).
    await expect(tryIt).not.toHaveClass(/bg-primary/);
    await expect(tryIt).toHaveClass(/bg-action/);

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

  for (const width of [375, 768, 1024, 1280]) {
    test(`featured card controls stay inside their card at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/marketplace");

      const card = page
        .getByRole("article")
        .filter({ has: page.getByRole("link", { name: /Try it/ }) })
        .first();
      await expect(card).toBeVisible();

      const overflow = await card.evaluate((cardEl) => {
        const cardBox = cardEl.getBoundingClientRect();
        const report = {
          viewportOverflow: document.documentElement.scrollWidth > window.innerWidth,
          controls: [] as Array<{ label: string; outside: boolean; overlap: boolean }>,
        };
        const controls = Array.from(
          cardEl.querySelectorAll<HTMLElement>("a[href], button")
        ).filter((el) => {
          const text = el.textContent ?? "";
          return text.includes("Try it") || text.includes("Copy");
        });
        for (const control of controls) {
          const box = control.getBoundingClientRect();
          const outside =
            box.left < cardBox.left - 0.5 ||
            box.right > cardBox.right + 0.5 ||
            box.bottom > cardBox.bottom + 0.5;
          const overlap = controls.some((other) => {
            if (other === control) return false;
            const o = other.getBoundingClientRect();
            return (
              box.left < o.right - 0.5 &&
              o.left < box.right - 0.5 &&
              box.top < o.bottom - 0.5 &&
              o.top < box.bottom - 0.5
            );
          });
          report.controls.push({
            label: (control.textContent ?? "").trim().slice(0, 40),
            outside,
            overlap,
          });
        }
        return report;
      });

      expect(overflow.viewportOverflow, "no horizontal page overflow").toBe(false);
      for (const control of overflow.controls) {
        expect(
          control.outside,
          `"${control.label}" stays inside its card`
        ).toBe(false);
        expect(
          control.overlap,
          `"${control.label}" does not overlap a sibling control`
        ).toBe(false);
      }
    });
  }
});
