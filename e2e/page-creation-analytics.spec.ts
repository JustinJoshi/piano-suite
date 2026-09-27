import { test, expect, type Page } from "@playwright/test";
import { markDemoIntrosSeen } from "./demo-intro";

type MirroredEvent = {
  name: string;
  props: Record<string, unknown>;
};

/**
 * page_created instrumentation, asserted through the window mirror so the
 * spec needs no PostHog key and writes nothing to a live analytics service.
 */
async function pageCreations(page: Page): Promise<MirroredEvent[]> {
  const events = await page.evaluate(
    () =>
      (window as unknown as { __analyticsEvents?: MirroredEvent[] })
        .__analyticsEvents ?? []
  );
  return events.filter((event) => event.name === "page_created");
}

test.describe("page_created analytics", () => {
  test.use({ storageState: { cookies: [] as never[], origins: [] as never[] } });

  test.beforeEach(({ page }) => markDemoIntrosSeen(page));

  test("template pick emits one page_created with origin template", async ({
    page,
  }) => {
    await page.goto("/tools/workshop");

    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /First chords/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible();

    const events = await pageCreations(page);
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({
      origin: "template",
      templateId: "first-chords",
    });
  });

  test("duplicate emits one page_created with origin duplicate", async ({
    page,
  }) => {
    await page.goto("/tools/workshop");

    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /start from scratch/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible();

    await page.getByRole("button", { name: /My Practice Page/i }).click();
    await page.getByRole("button", { name: /duplicate page/i }).click();

    const events = await pageCreations(page);
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({ origin: "duplicate" });
  });

  test("route seed emits one page_created with origin route", async ({
    page,
  }) => {
    await page.goto("/routes/music-theory");

    await page.getByTestId("seed-workshop").click();
    await expect(page).toHaveURL(/\/tools\/workshop$/, { timeout: 15_000 });

    const events = await pageCreations(page);
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({
      origin: "route",
      templateId: "music-theory-starter",
      routeId: "music-theory",
    });
  });

  test("client-side navigation adds no further creations", async ({ page }) => {
    await page.goto("/tools/workshop");

    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /First chords/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible();

    await page
      .getByRole("link", { name: /open the block library/i })
      .click();
    await expect(page).toHaveURL(/\/tools\/workshop\/blocks$/, {
      timeout: 15_000,
    });

    const events = await pageCreations(page);
    expect(events).toHaveLength(1);
  });

  test("creation payloads carry no page title", async ({ page }) => {
    await page.goto("/tools/workshop");

    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /First chords/i }).click();
    await expect(page.getByTestId("workshop-grid")).toBeVisible();

    const events = await pageCreations(page);
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0].props)).not.toContain("First chords");
  });
});
