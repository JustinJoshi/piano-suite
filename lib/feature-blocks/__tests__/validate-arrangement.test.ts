import { describe, it, expect } from "vitest";
import { validateArrangement } from "@/lib/feature-blocks/validate-arrangement";
import { starterTemplates } from "@/lib/starter-templates";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

function block(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

describe("validateArrangement", () => {
  it("reports only unscored_page for a wired display page with no target block", () => {
    // pieceLibrary feeds the noteRoll, so the wiring is complete — but the
    // page still scores nothing, and the validator must say so.
    const result = validateArrangement([
      block("noteRoll"),
      block("pieceLibrary"),
    ]);

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe("unscored_page");
    }
  });

  it("returns status: valid for a display page with a target block present", () => {
    expect(
      validateArrangement([
        block("noteRoll"),
        block("pieceLibrary"),
        block("chordSet"),
        block("drillTimer"),
      ])
    ).toEqual({ status: "valid" });
  });

  it("rejects an unknown block type", () => {
    const result = validateArrangement([block("notARealBlockType")]);

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe("unmet_requirement");
      expect(result.issues[0].detail).toContain("Unknown component type");
    }
  });

  it("rejects an orphan transform (no upstream source)", () => {
    const result = validateArrangement([block("rhythmPattern")]);

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues[0].issue).toBe("orphan_transform");
      expect(result.issues[0].type).toBe("rhythmPattern");
      // The transform accepts practiceNotes, so the page-level unscored_page
      // guidance rides along too.
      expect(result.issues).toHaveLength(2);
      expect(result.issues[1].issue).toBe("unscored_page");
    }
  });

  it("rejects an unmet requirement (a target block needing MIDI input with none present)", () => {
    const result = validateArrangement([block("noteRoll")]);

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues[0].issue).toBe("unmet_requirement");
      expect(result.issues[0].type).toBe("noteRoll");
      // The page-level unscored_page guidance rides along: the lone display
      // has no target block to score against.
      expect(result.issues).toHaveLength(2);
      expect(result.issues[1].issue).toBe("unscored_page");
    }
  });

  it("produces zero issues for a page containing only midiConnectionBar", () => {
    // Regression guard for the already-merged Phase 2.0 fix to
    // `requirementToStream`: the bar embeds the on-screen keyboard when no
    // hardware is connected, so its page always has note input.
    expect(validateArrangement([block("midiConnectionBar")])).toEqual({
      status: "valid",
    });
  });

  // Shipped templates and seeds must have no wiring problems other than
  // unscored_page: display-only pages (Hanon cell, rootless ii-V-I,
  // piece-trainer) are legitimately ungraded and now carry exactly that one
  // guidance issue. Pages with no display blocks at all (daily hub,
  // metronome basics) must stay fully clean.
  function expectNoWiringProblems(blocks: FeatureBlock[]) {
    const result = validateArrangement(blocks);
    if (result.status === "valid") return;
    expect(
      result.issues.filter((issue) => issue.issue !== "unscored_page")
    ).toEqual([]);
  }

  describe.each(starterTemplates)("starter template $id", (template) => {
    it("carries no wiring problems beyond unscored_page", () => {
      expectNoWiringProblems(template.blocks);
    });
  });

  describe.each(marketplaceSeeds)("marketplace seed $id", (seed) => {
    it("carries no wiring problems beyond unscored_page", () => {
      expectNoWiringProblems(seed.blocks);
    });
  });

  it("keeps the daily-hub and metronome-basics seeds fully clean", () => {
    // They have no display blocks, so not even unscored_page applies.
    for (const seed of marketplaceSeeds) {
      if (seed.id !== "daily-hub" && seed.id !== "metronome-basics") continue;
      expect(validateArrangement(seed.blocks)).toEqual({ status: "valid" });
    }
  });
});

describe("unmet-requirement issues carry a structured requirement", () => {
  // Only `practiceNotes` is producible through the real registry: no shipped
  // manifest requires "transport" yet, and the blocks requiring "midiInput"
  // satisfy it themselves (they are note inputs). The other two ids are
  // pinned at the wiringNotice level in
  // components/custom-practice/__tests__/wiring-notice.test.tsx.
  it("tags an unmet practiceNotes issue with requirement: practiceNotes", () => {
    const result = validateArrangement([block("noteRoll")]);
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") throw new Error("unreachable");
    expect(result.issues[0].issue).toBe("unmet_requirement");
    expect(result.issues[0].requirement).toBe("practiceNotes");
    expect(result.issues).toHaveLength(2);
    expect(result.issues[1].issue).toBe("unscored_page");
  });

  it("leaves the unknown-type issue without a requirement", () => {
    const result = validateArrangement([block("notARealBlockType")]);
    expect(result.status).toBe("invalid");
    if (result.status !== "invalid") throw new Error("unreachable");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].requirement).toBeUndefined();
  });
});
