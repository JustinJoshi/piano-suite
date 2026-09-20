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

    expect(issues[0].issue).toBe("unmet_requirement");
    expect(issues[0].type).toBe("noteRoll");
    // The display also triggers the page-level unscored_page notice: the
    // page shows notes but has no target block to score against.
    expect(issues).toHaveLength(2);
    expect(issues[1].issue).toBe("unscored_page");
  });

  it("reports only unscored_page for a noteRoll once a pieceLibrary feeds it", () => {
    // The wiring is complete, but the page still scores nothing: pieceLibrary
    // is a source, not a target block.
    const issues = validatePageWiring([block("noteRoll"), block("pieceLibrary")]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issue).toBe("unscored_page");
  });

  it("reports one unscored_page for a display fed by a source with no target block", () => {
    const issues = validatePageWiring([
      block("chordLibrary"),
      block("targetDisplay"),
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0].issue).toBe("unscored_page");
    expect(issues[0].type).toBe("targetDisplay");
  });

  it("reports no unscored_page once a target block joins the page", () => {
    expect(
      validatePageWiring([
        block("chordLibrary"),
        block("targetDisplay"),
        block("chordSet"),
      ]).filter((issue) => issue.issue === "unscored_page")
    ).toEqual([]);
  });

  it("reports no unscored_page for a page with no display blocks at all", () => {
    // The daily-hub and metronome-basics seeds are legitimately ungraded.
    expect(
      validatePageWiring([block("metronome"), block("textBlock")])
    ).toEqual([]);
  });

  it("reports at most one unscored_page even with two displays", () => {
    const issues = validatePageWiring([
      block("chordLibrary"),
      block("targetDisplay"),
      block("noteRoll"),
    ]);

    expect(issues.filter((issue) => issue.issue === "unscored_page")).toHaveLength(1);
    expect(issues.find((issue) => issue.issue === "unscored_page")?.type).toBe(
      "targetDisplay"
    );
  });

  it("advertises a transport output a requirement can match", () => {
    // No shipped block requires ["transport"] yet, so the contract is
    // checked on the manifest: the clock must not advertise an empty output.
    const transport = getManifest("transport");
    expect(transport?.outputs).toContain("audioLoop");
  });
});
