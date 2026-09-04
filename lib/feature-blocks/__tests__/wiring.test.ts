import { describe, it, expect } from "vitest";
import { validatePageWiring, getManifest } from "../manifest";
import type { FeatureBlock } from "../types";

function block(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

describe("validatePageWiring", () => {
  it("reports no issue for a page containing only midiConnectionBar", () => {
    // The bar embeds the on-screen keyboard when no hardware is connected,
    // so its page always has note input.
    expect(validatePageWiring([block("midiConnectionBar")])).toEqual([]);
  });

  it("reports unmet_requirement for a noteRoll with no source", () => {
    const issues = validatePageWiring([block("noteRoll")]);

    expect(issues).toHaveLength(1);
    expect(issues[0].issue).toBe("unmet_requirement");
    expect(issues[0].type).toBe("noteRoll");
  });

  it("reports no issue for a noteRoll once a pieceLibrary feeds it", () => {
    expect(
      validatePageWiring([block("noteRoll"), block("pieceLibrary")])
    ).toEqual([]);
  });

  it("advertises a transport output a requirement can match", () => {
    // No shipped block requires ["transport"] yet, so the contract is
    // checked on the manifest: the clock must not advertise an empty output.
    const transport = getManifest("transport");
    expect(transport?.outputs).toContain("audioLoop");
  });
});
