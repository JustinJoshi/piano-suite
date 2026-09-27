import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type HeroWindow = Window & { __heroNoteLog?: string[] };

/** Records the shared MIDI note stream the hero plays through. */
async function recordNoteLog(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const log: string[] = [];
    window.addEventListener("midi-note-on", (event) => {
      log.push(`on:${(event as CustomEvent<{ note: number }>).detail.note}`);
    });
    window.addEventListener("midi-note-off", (event) => {
      log.push(`off:${(event as CustomEvent<{ note: number }>).detail.note}`);
    });
    (window as HeroWindow).__heroNoteLog = log;
  });
}

async function noteLog(page: import("@playwright/test").Page) {
  return page.evaluate(() => (window as HeroWindow).__heroNoteLog ?? []);
}

test.describe("hero keyboard (keyboard only)", () => {
  test("reaches and plays the hero instrument with no pointer event", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await recordNoteLog(page);
    await page.goto("/");

    const entry = page.getByRole("button", { name: /play this keyboard/i });
    await expect(entry).toBeVisible({ timeout: 15_000 });

    // Uninvolved reading: letters never claim anything on their own.
    await page.keyboard.press("a");
    expect(await noteLog(page)).toEqual([]);

    // One tab stop: the entry is reachable by keyboard, and focus is enough.
    let reached = false;
    for (let i = 0; i < 60 && !reached; i += 1) {
      await page.keyboard.press("Tab");
      reached = await entry.evaluate((el) => el === document.activeElement);
    }
    expect(reached).toBe(true);
    await expect(entry).toBeFocused();

    await page.keyboard.press("Enter");

    await page.keyboard.down("a");
    await expect.poll(() => noteLog(page)).toContain("on:60");
    await page.keyboard.up("a");
    await expect.poll(() => noteLog(page)).toContain("off:60");

    // The decorative key shapes stay hidden; the entry does not.
    for (const keybed of await page.getByTestId("keybed").all()) {
      await expect(keybed).toHaveAttribute("aria-hidden", "true");
    }
    expect(
      await entry.evaluate((el) => el.closest("[aria-hidden]") !== null)
    ).toBe(false);
  });

  test("the hero surface has no axe violations, none suppressed", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /play this keyboard/i })
    ).toBeVisible({ timeout: 15_000 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    // @axe-core/playwright has no disableAnimations helper; freezing
    // transitions at scan time keeps the scan deterministic.
    await page.addStyleTag({
      content:
        "*, *::before, *::after { transition: none !important; animation: none !important; }",
    });

    // The hero surface: the section carrying the instrument.
    await page.evaluate(() => {
      document
        .querySelector("[data-testid=\"hero-instrument\"]")
        ?.closest("section")
        ?.setAttribute("data-hero-surface", "");
    });

    const results = await new AxeBuilder({ page })
      .include("[data-hero-surface]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const describeViolations = results.violations
      .map((v) => {
        const targets = v.nodes.map((n) => n.target.join(" ")).join("; ");
        return `${v.id} (${v.impact}): ${targets}`;
      })
      .join("\n");

    // Nothing suppressed: every finding at every impact fails the scan.
    expect(results.violations, describeViolations).toEqual([]);
  });
});
