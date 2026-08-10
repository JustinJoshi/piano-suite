import { describe, expect, it } from "vitest";
import {
  impulseAmplitude,
  normalizeVelocity,
  pruneImpulses,
  snapshotImpulses,
  type MidiImpulse,
} from "@/lib/midi-impulse";

describe("midi-impulse", () => {
  describe("normalizeVelocity", () => {
    it("returns 0 for zero or negative velocity", () => {
      expect(normalizeVelocity(0)).toBe(0);
      expect(normalizeVelocity(-10)).toBe(0);
    });

    it("normalizes 1..127 to 0..1", () => {
      expect(normalizeVelocity(1)).toBeCloseTo(1 / 127);
      expect(normalizeVelocity(64)).toBeCloseTo(64 / 127);
      expect(normalizeVelocity(127)).toBe(1);
    });

    it("clamps values above 127", () => {
      expect(normalizeVelocity(200)).toBe(1);
    });
  });

  describe("impulseAmplitude", () => {
    it("returns full velocity at birth", () => {
      const impulse: MidiImpulse = {
        note: 60,
        pc: 0,
        velocity: 1,
        bornAt: 0,
      };
      expect(impulseAmplitude(impulse, 0, 1000)).toBeCloseTo(1);
    });

    it("decays toward zero over the decay window", () => {
      const impulse: MidiImpulse = {
        note: 60,
        pc: 0,
        velocity: 1,
        bornAt: 0,
      };
      expect(impulseAmplitude(impulse, 500, 1000)).toBeLessThan(0.3);
      expect(impulseAmplitude(impulse, 1000, 1000)).toBe(0);
    });

    it("returns 0 after the decay window", () => {
      const impulse: MidiImpulse = {
        note: 60,
        pc: 0,
        velocity: 1,
        bornAt: 0,
      };
      expect(impulseAmplitude(impulse, 2000, 1000)).toBe(0);
    });
  });

  describe("pruneImpulses", () => {
    it("removes impulses that have fully decayed", () => {
      const impulse: MidiImpulse = {
        note: 60,
        pc: 0,
        velocity: 1,
        bornAt: 0,
      };
      expect(pruneImpulses([impulse], 1000, 1000)).toHaveLength(0);
    });

    it("keeps impulses that are still ringing", () => {
      const impulse: MidiImpulse = {
        note: 60,
        pc: 0,
        velocity: 1,
        bornAt: 0,
      };
      expect(pruneImpulses([impulse], 100, 1000)).toHaveLength(1);
    });
  });

  describe("snapshotImpulses", () => {
    it("returns zero signals when no impulses are alive", () => {
      const snapshot = snapshotImpulses([], 0, { decayMs: 1000 });
      expect(snapshot.impulses).toHaveLength(0);
      expect(snapshot.peakAmp).toBe(0);
      expect(snapshot.newest).toBeNull();
      expect(snapshot.strongest).toBeNull();
    });

    it("identifies the strongest and newest impulses", () => {
      const impulses: MidiImpulse[] = [
        { note: 60, pc: 0, velocity: 0.5, bornAt: 0 },
        { note: 64, pc: 4, velocity: 1, bornAt: 10 },
      ];
      const snapshot = snapshotImpulses(impulses, 10, { decayMs: 1000 });
      expect(snapshot.peakAmp).toBeCloseTo(1);
      expect(snapshot.strongest?.note).toBe(64);
      expect(snapshot.newest?.note).toBe(64);
    });

    it("prefers a newer but softer impulse as newest", () => {
      const impulses: MidiImpulse[] = [
        { note: 60, pc: 0, velocity: 1, bornAt: 0 },
        { note: 64, pc: 4, velocity: 0.5, bornAt: 20 },
      ];
      const snapshot = snapshotImpulses(impulses, 20, { decayMs: 1000 });
      expect(snapshot.strongest?.note).toBe(60);
      expect(snapshot.newest?.note).toBe(64);
    });
  });
});
