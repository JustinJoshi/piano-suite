import { describe, expect, it } from "vitest";
import {
  IDLE_MODE,
  PC_MODE_TABLE,
  impulseAmplitude,
  mapMidiToChladni,
  midiOctave,
  modeEnergy,
  modeForNote,
  normalizeVelocity,
  pitchClass,
  pruneImpulses,
  scaleModeForOctave,
  type MidiImpulse,
} from "@/lib/chladni-ripple";

describe("chladni-ripple mapping", () => {
  it("has twelve unique pitch-class mode identities", () => {
    expect(PC_MODE_TABLE).toHaveLength(12);
    const keys = PC_MODE_TABLE.map(([m, n]) => `${m},${n}`);
    expect(new Set(keys).size).toBe(12);
    for (const [m, n] of PC_MODE_TABLE) {
      expect(m).not.toBe(n);
      expect(m).toBeGreaterThanOrEqual(2);
      expect(n).toBeGreaterThanOrEqual(2);
    }
  });

  it("maps pitch class and octave from MIDI note numbers", () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(61)).toBe(1);
    expect(pitchClass(-1)).toBe(11);
    expect(midiOctave(60)).toBe(4);
    expect(midiOctave(72)).toBe(5);
  });

  it("normalizes and clamps velocity", () => {
    expect(normalizeVelocity(0)).toBe(0);
    expect(normalizeVelocity(127)).toBe(1);
    expect(normalizeVelocity(64)).toBeCloseTo(64 / 127);
    expect(normalizeVelocity(200)).toBe(1);
  });

  it("increases mode energy for higher octaves of the same PC", () => {
    const low = modeForNote(48, 0.35); // C3
    const mid = modeForNote(60, 0.35); // C4
    const high = modeForNote(72, 0.35); // C5
    expect(modeEnergy(high)).toBeGreaterThan(modeEnergy(mid));
    expect(modeEnergy(mid)).toBeGreaterThan(modeEnergy(low));
  });

  it("keeps pitch-class identity distinct after octave scaling", () => {
    const c4 = modeForNote(60, 0.35);
    const d4 = modeForNote(62, 0.35);
    expect(c4).not.toEqual(d4);
  });

  it("scaleModeForOctave avoids m === n", () => {
    const scaled = scaleModeForOctave([4, 4], 6, 0.5);
    expect(scaled[0]).not.toBe(scaled[1]);
  });

  it("decays impulse amplitude toward zero", () => {
    const impulse: MidiImpulse = {
      note: 60,
      pc: 0,
      velocity: 1,
      bornAt: 0,
    };
    expect(impulseAmplitude(impulse, 0, 1000)).toBeCloseTo(1);
    expect(impulseAmplitude(impulse, 500, 1000)).toBeLessThan(0.3);
    expect(impulseAmplitude(impulse, 1000, 1000)).toBe(0);
    expect(pruneImpulses([impulse], 1000, 1000)).toHaveLength(0);
  });

  it("returns idle viz when nothing is held or ringing", () => {
    const viz = mapMidiToChladni([], [], 0);
    expect(viz.mode).toEqual(IDLE_MODE);
    expect(viz.activePc).toBeNull();
    expect(viz.lineIntensity).toBeLessThan(0.5);
  });

  it("maps a held note to its PC mode and boosts intensity from impulses", () => {
    const impulse: MidiImpulse = {
      note: 60,
      pc: 0,
      velocity: 1,
      bornAt: 0,
    };
    const viz = mapMidiToChladni([60], [impulse], 0, {
      baseIntensity: 0.45,
    });
    expect(viz.activePc).toBe(0);
    expect(viz.mode).toEqual(modeForNote(60));
    expect(viz.lineIntensity).toBeGreaterThan(0.45);
  });

  it("blends a second held note as nextMode", () => {
    const viz = mapMidiToChladni(
      [60, 64],
      [
        { note: 60, pc: 0, velocity: 0.8, bornAt: 0 },
        { note: 64, pc: 4, velocity: 0.9, bornAt: 10 },
      ],
      10
    );
    expect(viz.morph).toBeGreaterThan(0);
    expect(viz.nextMode).toEqual(modeForNote(60));
    expect(viz.mode).toEqual(modeForNote(64));
  });
});
