import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import {
  metronomeBlock,
  drillShortcutsBlock,
  seedWorkshopPage,
} from "./workshop-seed";

test.describe("/tools/workshop grid", () => {
  test("drag to reposition persists across reload", async ({ page }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, [
      metronomeBlock("e2e-a", 100),
      metronomeBlock("e2e-b", 120),
    ]);
    await page.goto("/tools/workshop");

    const tiles = page.locator("[data-workshop-tile]");
    await expect(tiles).toHaveCount(2);
    await expect(page.getByTestId("bpm-display").first()).toHaveText("100 BPM");

    // Drag the first tile's handle onto the second tile.
    const source = tiles.first();
    const target = tiles.nth(1);
    await source.getByLabel("Drag to reorder").hover();
    await page.mouse.down();

    const targetBox = await target.boundingBox();
    if (!targetBox) throw new Error("target tile has no bounding box");
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 12 }
    );
    await page.mouse.up();

    await expect(page.getByTestId("bpm-display").first()).toHaveText("120 BPM");

    await page.reload();
    await expect(tiles).toHaveCount(2);
    await expect(page.getByTestId("bpm-display").first()).toHaveText("120 BPM");
  });

  test("resize handle grows the tile and persists the span", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, [metronomeBlock("e2e-a", 100, { w: 2, h: 1 })]);
    await page.goto("/tools/workshop");

    const tile = page.locator("[data-workshop-tile]").first();
    await expect(tile).toHaveClass(/xl:col-span-2/);

    const box = await tile.boundingBox();
    if (!box) throw new Error("tile has no bounding box");

    const handle = page.getByLabel("Resize tile");
    await handle.hover();
    await page.mouse.down();
    // One column width at xl is roughly half a 2-wide tile; overshoot so
    // the delta reliably rounds to +1 column.
    await page.mouse.move(box.x + box.width + box.width / 2, box.y + 10, {
      steps: 8,
    });
    await page.mouse.up();

    await expect(tile).toHaveClass(/xl:col-span-3/);

    await page.reload();
    await expect(page.locator("[data-workshop-tile]").first()).toHaveClass(
      /xl:col-span-3/
    );
  });

  test("ready-made drills live on the grid, which fills the page", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, [
      drillShortcutsBlock("e2e-drills"),
      metronomeBlock("e2e-a", 100),
    ]);
    await page.goto("/tools/workshop");

    const grid = page.getByTestId("workshop-grid");
    await expect(grid).toHaveAttribute("data-grid-full", "true");

    // The old above-the-grid strip is gone; the shortcuts are a tile.
    const drillsTile = page.locator('[data-tile-id="e2e-drills"]');
    await expect(drillsTile).toHaveCount(1);
    await expect(
      drillsTile.getByText("In a hurry?")
    ).toBeVisible();
    await expect(
      drillsTile.getByRole("link", { name: /chord drill/i })
    ).toHaveAttribute("href", "/tools/chord-drill");

    // Drag the drills tile onto the metronome tile: order swaps, persists.
    const metronomeTile = page.locator('[data-tile-id="e2e-a"]');
    await drillsTile.getByLabel("Drag to reorder").hover();
    await page.mouse.down();
    const box = await metronomeTile.boundingBox();
    if (!box) throw new Error("target tile has no bounding box");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 12,
    });
    await page.mouse.up();

    await expect(grid.locator("[data-workshop-tile]").first()).toHaveAttribute(
      "data-tile-id",
      "e2e-a"
    );

    await page.reload();
    await expect(grid.locator("[data-workshop-tile]").first()).toHaveAttribute(
      "data-tile-id",
      "e2e-a"
    );
  });

  test("grid chrome is visible only while dragging", async ({ page }) => {
    await signInAsTestUser(page);
    await seedWorkshopPage(page, [
      metronomeBlock("e2e-a", 100),
      metronomeBlock("e2e-b", 120),
    ]);
    await page.goto("/tools/workshop");

    const grid = page.getByTestId("workshop-grid");
    const tiles = page.locator("[data-workshop-tile]");
    await expect(tiles).toHaveCount(2);

    await expect(grid).not.toHaveAttribute("data-grid-active");
    await expect(page.getByTestId("grid-guide")).toHaveCount(0);

    await tiles.first().getByLabel("Drag to reorder").hover();
    await page.mouse.down();
    const box = await tiles.nth(1).boundingBox();
    if (!box) throw new Error("tile has no bounding box");
    await page.mouse.move(box.x + 10, box.y + 10, { steps: 6 });

    await expect(grid).toHaveAttribute("data-grid-active", "true");
    await expect(page.getByTestId("grid-guide").first()).toBeVisible();

    await page.mouse.up();

    await expect(grid).not.toHaveAttribute("data-grid-active");
    await expect(page.getByTestId("grid-guide")).toHaveCount(0);
  });
});
