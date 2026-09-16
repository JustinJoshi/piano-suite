import { describe, it, expect } from "vitest";
import { validateArrangement } from "@/lib/feature-blocks/validate-arrangement";
import { starterTemplates } from "@/lib/starter-templates";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

function block(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

describe("validateArrangement", () => {
  it("returns status: valid with no issues field for a well-wired page", () => {
    expect(
      validateArrangement([block("noteRoll"), block("pieceLibrary")])
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
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe("orphan_transform");
      expect(result.issues[0].type).toBe("rhythmPattern");
    }
  });

  it("rejects an unmet requirement (a target block needing MIDI input with none present)", () => {
    const result = validateArrangement([block("noteRoll")]);

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe("unmet_requirement");
      expect(result.issues[0].type).toBe("noteRoll");
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

  describe.each(starterTemplates)("starter template $id", (template) => {
    it("validates as status: valid", () => {
      expect(validateArrangement(template.blocks)).toEqual({
        status: "valid",
      });
    });
  });

  describe.each(marketplaceSeeds)("marketplace seed $id", (seed) => {
    it("validates as status: valid", () => {
      expect(validateArrangement(seed.blocks)).toEqual({ status: "valid" });
    });
  });
});
