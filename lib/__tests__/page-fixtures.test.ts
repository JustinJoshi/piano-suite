import { describe, expect, it } from "vitest";
import { buildStream } from "@/lib/feature-blocks/build-stream";
import { getManifest, validatePageWiring } from "@/lib/feature-blocks/manifest";
import { normalizeStoredBlock } from "@/lib/feature-blocks/schemas";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import { starterTemplates } from "@/lib/starter-templates";

/**
 * Shared harness for every page fixture that ships with the app (starter
 * templates and marketplace seeds). `normalizeStoredBlock` silently corrects
 * invalid configs, so a typo'd key or dropped value produces a page that
 * looks fine and does nothing. These tests pin what authorship must survive.
 *
 * The invariant is not "round-trips unchanged": normalizers legitimately fill
 * in defaults, so a partial config gains keys. What must never happen is an
 * author-written key being changed or dropped.
 */

type PageFixture = {
  source: "starterTemplates" | "marketplaceSeeds";
  id: string;
  blocks: FeatureBlock[];
};

const pageFixtures: PageFixture[] = [
  ...starterTemplates.map((t) => ({
    source: "starterTemplates" as const,
    id: t.id,
    blocks: t.blocks,
  })),
  ...marketplaceSeeds.map((s) => ({
    source: "marketplaceSeeds" as const,
    id: s.id,
    blocks: s.blocks,
  })),
];

function hasSourceBlock(blocks: FeatureBlock[]): boolean {
  return blocks.some((b) => getManifest(b.type)?.kind === "source");
}

describe("page fixtures", () => {
  for (const fixture of pageFixtures) {
    describe(`${fixture.source}/${fixture.id}`, () => {
      it("keeps every block through normalizeStoredBlock", () => {
        for (const block of fixture.blocks) {
          const stored = normalizeStoredBlock(block);
          expect(
            stored,
            `${fixture.source}/${fixture.id}: block ${block.id} (${block.type}) did not survive normalizeStoredBlock`
          ).not.toBeNull();
        }
      });

      it("never changes or drops an author-written config key", () => {
        for (const block of fixture.blocks) {
          const stored = normalizeStoredBlock(block);
          for (const key of Object.keys(block.config)) {
            expect(
              stored?.config,
              `${fixture.source}/${fixture.id}: block ${block.id} (${block.type}) dropped author-written key "${key}"`
            ).toHaveProperty(key);
            expect(
              stored?.config[key],
              `${fixture.source}/${fixture.id}: block ${block.id} (${block.type}) changed author-written value of "${key}"`
            ).toEqual(block.config[key]);
          }
        }
      });

      it("passes validatePageWiring with zero issues", () => {
        const issues = validatePageWiring(fixture.blocks);
        expect(issues, `${fixture.source}/${fixture.id} has wiring issues`).toEqual(
          []
        );
      });

      it("composes a non-empty stream when the page declares a source", () => {
        if (!hasSourceBlock(fixture.blocks)) return;
        const stream = buildStream(fixture.blocks);
        expect(
          stream.length,
          `${fixture.source}/${fixture.id} declares a source but composes an empty stream`
        ).toBeGreaterThan(0);
      });
    });
  }

  describe("pieceLibrary exclusion", () => {
    // build-stream.ts:31-36 has no pieceLibrary entry in its SOURCES dispatch
    // — its notes come from an uploaded MIDI file outside block config, so a
    // page whose only source is pieceLibrary composes to an empty stream.
    // Shipping that as a template or seed would be a broken demo. The
    // exclusion stays pinned here until the operator decides buildStream
    // should learn about uploaded-MIDI state.
    it("appears in no starter template or marketplace seed", () => {
      for (const fixture of pageFixtures) {
        for (const block of fixture.blocks) {
          expect(
            block.type,
            `${fixture.source}/${fixture.id} contains pieceLibrary`
          ).not.toBe("pieceLibrary");
        }
      }
    });
  });
});
