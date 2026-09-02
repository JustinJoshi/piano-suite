/**
 * Pure builders that turn block config into drill-runtime targets.
 *
 * The runtime consumes an ordered list of pitch-class sets, so anything a
 * pianist practices that can be written as "play these notes, then these" is
 * expressible here: chords, scales, key cycles, progressions. Keeping the
 * builders pure (no React, DOM, MIDI, or Convex) is what makes each new drill
 * block a config file plus a render component rather than a new engine.
 *
 * `ChordTarget` is imported as a type only, so this module does not pull the
 * client-side runtime into a test or server bundle.
 */

import {
  ROOTS,
  type Root,
  buildChord,
  buildPitchClassSet,
  normalizePc,
  noteName,
} from "./music-theory";
import { buildScaleSteps } from "./scales";
import { buildKeyCycleRoots, rootByName } from "./key-cycles";
import { parseRomanNumerals } from "./roman-numerals";
import type { ChordTarget } from "./drill-runtime";
import type { ScaleRunnerConfig } from "./feature-blocks/scale-runner/config";
import {
  cycleQualityById,
  type RootCycleConfig,
} from "./feature-blocks/root-cycle/config";
import {
  progressionText,
  type ProgressionBlockConfig,
} from "./feature-blocks/progression/config";

export type ScaleTargetParams = Pick<
  ScaleRunnerConfig,
  "root" | "scaleId" | "span" | "pattern" | "direction"
>;

/**
 * One target per note of the run.
 *
 * The runtime scores pitch classes, so the octave a two-octave run implies is
 * not verified — the target list still spans it because the *count* of steps
 * is what makes a two-octave scale a different drill from a one-octave one.
 */
export function buildScaleTargets(config: ScaleTargetParams): ChordTarget[] {
  const root = rootByName(config.root);

  const steps = buildScaleSteps({
    rootPc: root.pc,
    useFlats: root.flat,
    scaleId: config.scaleId,
    span: config.span,
    pattern: config.pattern,
    direction: config.direction,
  });

  return steps.map((step, index) => ({
    id: `scale-${index}-${step.name}`,
    symbol: step.name,
    notes: [step.degree === "" ? step.name : `${step.name} (${step.degree})`],
    pcs: new Set([normalizePc(root.pc + step.offset)]),
  }));
}

export type RootCycleTargetParams = Pick<
  RootCycleConfig,
  "qualityId" | "startRoot" | "order" | "keyCount"
>;

/** One chord shape carried around a key cycle. */
export function buildRootCycleTargets(
  config: RootCycleTargetParams,
  random: () => number = Math.random
): ChordTarget[] {
  const { quality } = cycleQualityById(config.qualityId);
  const start = rootByName(config.startRoot);
  const roots = buildKeyCycleRoots(config.order, start.pc, random).slice(
    0,
    config.keyCount
  );

  return roots.map((root, index) => ({
    id: `cycle-${index}-${root.name}${quality.suffix}`,
    symbol: `${root.name}${quality.suffix}`,
    notes: buildChord(root, quality.tones),
    pcs: buildPitchClassSet(root, quality.tones),
  }));
}

function rootForPc(pc: number): Root {
  const normalized = normalizePc(pc);
  return (
    ROOTS.find((r) => r.pc === normalized) ?? {
      pc: normalized,
      name: noteName(normalized),
      flat: false,
    }
  );
}

export type ProgressionTargets = {
  targets: ChordTarget[];
  /** Roman-numeral tokens the user typed that could not be parsed. */
  invalidTokens: string[];
};

export type ProgressionTargetParams = Pick<
  ProgressionBlockConfig,
  "source" | "keyRoot" | "customText" | "cycleKeys" | "cycleOrder" | "keyCount"
>;

/**
 * A roman-numeral progression, optionally repeated around a key cycle so the
 * same shape gets drilled in every key.
 */
export function buildProgressionTargets(
  config: ProgressionTargetParams,
  random: () => number = Math.random
): ProgressionTargets {
  const { chords, invalidTokens } = parseRomanNumerals(progressionText(config));
  if (chords.length === 0) return { targets: [], invalidTokens };

  const startKey = rootByName(config.keyRoot);
  const keys = config.cycleKeys
    ? buildKeyCycleRoots(config.cycleOrder, startKey.pc, random).slice(
        0,
        config.keyCount
      )
    : [startKey];

  const targets: ChordTarget[] = [];

  keys.forEach((key, keyIndex) => {
    chords.forEach((chord, chordIndex) => {
      const root = rootForPc(key.pc + chord.degreeSemitones);
      const symbol = `${root.name}${chord.quality.suffix}`;
      targets.push({
        id: `prog-${keyIndex}-${chordIndex}-${symbol}`,
        symbol,
        notes: buildChord(root, chord.quality.tones),
        pcs: buildPitchClassSet(root, chord.quality.tones),
      });
    });
  });

  return { targets, invalidTokens };
}
