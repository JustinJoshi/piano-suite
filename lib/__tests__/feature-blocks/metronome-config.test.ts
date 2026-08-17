import { describe, it, expect } from "vitest";
import {
  normalizeMetronomeConfig,
  metronomeDefaultConfig,
} from "@/lib/feature-blocks/metronome/config";

describe("normalizeMetronomeConfig", () => {
  it("returns defaults for undefined input", () => {
    expect(normalizeMetronomeConfig(undefined)).toEqual(metronomeDefaultConfig);
  });

  it("returns defaults for null input", () => {
    expect(normalizeMetronomeConfig(null)).toEqual(metronomeDefaultConfig);
  });

  it("returns defaults for non-object input", () => {
    expect(normalizeMetronomeConfig("bad")).toEqual(metronomeDefaultConfig);
  });

  it("clamps bpm to the configured min/max range", () => {
    const config = normalizeMetronomeConfig({
      bpm: 500,
      minBpm: 40,
      maxBpm: 200,
    });
    expect(config.bpm).toBe(200);
  });

  it("swaps min and max if they are reversed", () => {
    const config = normalizeMetronomeConfig({ minBpm: 200, maxBpm: 40 });
    expect(config.minBpm).toBe(40);
    expect(config.maxBpm).toBe(200);
    expect(config.bpm).toBeLessThanOrEqual(200);
    expect(config.bpm).toBeGreaterThanOrEqual(40);
  });

  it("clamps beatsPerBar between 1 and 12", () => {
    expect(normalizeMetronomeConfig({ beatsPerBar: 0 }).beatsPerBar).toBe(1);
    expect(normalizeMetronomeConfig({ beatsPerBar: 20 }).beatsPerBar).toBe(12);
  });

  it("preserves valid config values", () => {
    const config = normalizeMetronomeConfig({
      bpm: 90,
      beatsPerBar: 6,
      accentFirstBeat: false,
      minBpm: 50,
      maxBpm: 180,
    });

    expect(config.bpm).toBe(90);
    expect(config.beatsPerBar).toBe(6);
    expect(config.accentFirstBeat).toBe(false);
    expect(config.minBpm).toBe(50);
    expect(config.maxBpm).toBe(180);
  });
});
