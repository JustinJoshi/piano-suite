import { describe, it, expect } from "vitest";
import { normalizeMidiConnectionBarConfig } from "@/lib/feature-blocks/midi-connection-bar/config";

describe("midiConnectionBar config", () => {
  it("normalizes a valid config", () => {
    expect(normalizeMidiConnectionBarConfig({ compact: true })).toEqual({
      compact: true,
    });
  });

  it("defaults to non-compact", () => {
    expect(normalizeMidiConnectionBarConfig(null)).toEqual({
      compact: false,
    });
  });
});
