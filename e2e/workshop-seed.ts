import { type Page } from "@playwright/test";
import { STORAGE_KEY } from "@/lib/custom-practice-storage";

export const WORKSHOP_PAGE_ID = "e2e-grid-page";

export function metronomeBlock(
  id: string,
  bpm: number,
  size?: { w: number; h: number }
) {
  return {
    id,
    type: "metronome",
    version: 1,
    config: { bpm },
    ...(size ? { size } : {}),
  };
}

export function drillShortcutsBlock(
  id: string,
  size?: { w: number; h: number }
) {
  return {
    id,
    type: "drillShortcuts",
    version: 1,
    config: {},
    ...(size ? { size } : {}),
  };
}

/**
 * Seeds the workshop localStorage store. Must run on the app origin after
 * sign-in so Clerk's session cookie and the page store coexist.
 */
export async function seedWorkshopPage(page: Page, blocks: unknown[]) {
  await page.evaluate(
    ({ key, pageId, seedBlocks }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 2,
          pages: [
            {
              id: pageId,
              title: "E2E Grid",
              blocks: seedBlocks,
              updatedAt: Date.now(),
            },
          ],
          activePageId: pageId,
        })
      );
      // Seeded scenarios test the grid, not the first-run template picker.
      localStorage.setItem("piano-suite:starter-picker-dismissed-v1", "true");
    },
    { key: STORAGE_KEY, pageId: WORKSHOP_PAGE_ID, seedBlocks: blocks }
  );
}
