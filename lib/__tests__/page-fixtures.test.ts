import { describe, expect, it } from "vitest";
import { buildStream } from "@/lib/feature-blocks/build-stream";
import { getManifest, validatePageWiring } from "@/lib/feature-blocks/manifest";
import { normalizeStoredBlock } from "@/lib/feature-blocks/schemas";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import type { PracticeNote } from "@/lib/practice-note";
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

      it("has no wiring problems beyond unscored_page", () => {
        // Display-only pages (Hanon cell, rootless ii-V-I, piece-trainer)
        // legitimately carry the single page-level unscored_page guidance
        // issue; any other issue is a real wiring problem.
        const issues = validatePageWiring(fixture.blocks).filter(
          (issue) => issue.issue !== "unscored_page"
        );
        expect(issues, `${fixture.source}/${fixture.id} has wiring issues`).toEqual(
          []
        );
      });

      it("composes a non-empty stream when the page declares a source", () => {
        if (!hasSourceBlock(fixture.blocks)) return;
        // Runtime sources (pieceLibrary) contribute through the runtimeNotes
        // map, so a fixture holding one gets a synthetic entry per block id.
        const runtimeNotes = new Map<string, PracticeNote[]>();
        for (const block of fixture.blocks) {
          if (block.type === "pieceLibrary") {
            runtimeNotes.set(block.id, [
              { midi: [60], pcs: new Set([0]), symbol: "test", onsetMs: 0 },
            ]);
          }
        }
        const stream = buildStream(fixture.blocks, undefined, runtimeNotes);
        expect(
          stream.length,
          `${fixture.source}/${fixture.id} declares a source but composes an empty stream`
        ).toBeGreaterThan(0);
      });
    });
  }

  describe("pieceLibrary placement", () => {
    // The runtime-source channel (phase `runtime-source-channel`, commit
    // 4f9584e) decided how uploaded pieces compose: pieceLibrary's notes
    // arrive via the runtimeNotes map, not block config, so a seed carrying
    // it is a valid demo. What stays pinned: starter templates carry none
    // (a template cannot hold an upload), and exactly one seed — the
    // piece-trainer demo — does.
    it("appears in no starter template", () => {
      for (const fixture of pageFixtures.filter(
        (f) => f.source === "starterTemplates"
      )) {
        for (const block of fixture.blocks) {
          expect(
            block.type,
            `${fixture.source}/${fixture.id} contains pieceLibrary`
          ).not.toBe("pieceLibrary");
        }
      }
    });

    it("appears in exactly the piece-trainer marketplace seed", () => {
      const ids = marketplaceSeeds
        .filter((s) => s.blocks.some((b) => b.type === "pieceLibrary"))
        .map((s) => s.id);
      expect(ids).toEqual(["piece-trainer"]);
    });
  });
});
