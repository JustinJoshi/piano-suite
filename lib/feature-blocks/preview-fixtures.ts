// Preview data for component demonstrations in the library.

import type { PracticeNote } from "../practice-note";

/**
 * Generate preview note sequences by kind. Used when rendering components
 * in the library so they display something meaningful without requiring
 * the full runtime.
 */
export function previewNotes(kind: string): PracticeNote[] {
  switch (kind) {
    case "chordSet":
    case "chord-library":
      return previewChords();
    case "scaleRunner":
    case "scale-library":
      return previewScale();
    case "rootCycle":
    case "progression":
      return previewProgression();
    case "noteRoll":
      return previewNoteRoll();
    case "targetDisplay":
      return previewSymbols();
    case "freePlayScope":
      return previewFreePlay();
    default:
      return [];
  }
}

/**
 * Preview: three chords played sequentially.
 */
function previewChords(): PracticeNote[] {
  return [
    {
      midi: [60, 64, 67],
      pcs: new Set([0, 4, 7]),
      symbol: "C",
      onsetMs: 0,
      durationMs: 1000,
    },
    {
      midi: [65, 69, 72],
      pcs: new Set([5, 9, 0]),
      symbol: "F",
      onsetMs: 1000,
      durationMs: 1000,
    },
    {
      midi: [67, 71, 74],
      pcs: new Set([7, 11, 2]),
      symbol: "G",
      onsetMs: 2000,
      durationMs: 1000,
    },
  ];
}

/**
 * Preview: a C major scale up and down.
 */
function previewScale(): PracticeNote[] {
  const cMajor = [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60];
  return cMajor.map((midi, idx) => ({
    midi: [midi],
    pcs: new Set([midi % 12]),
    symbol: noteNameFromMidi(midi),
    onsetMs: idx * 300,
    durationMs: 250,
  }));
}

/**
 * Preview: a simple ii-V-I.
 */
function previewProgression(): PracticeNote[] {
  return [
    {
      midi: [62, 65, 69],
      pcs: new Set([2, 5, 9]),
      symbol: "ii",
      onsetMs: 0,
      durationMs: 1000,
    },
    {
      midi: [67, 71, 74],
      pcs: new Set([7, 11, 2]),
      symbol: "V",
      onsetMs: 1000,
      durationMs: 1000,
    },
    {
      midi: [60, 64, 67],
      pcs: new Set([0, 4, 7]),
      symbol: "I",
      onsetMs: 2000,
      durationMs: 1000,
    },
  ];
}

/**
 * Preview: a falling-notes roll with a melody and chords.
 */
function previewNoteRoll(): PracticeNote[] {
  return [
    {
      midi: [60],
      pcs: new Set([0]),
      symbol: "C",
      hand: "right",
      onsetMs: 0,
      durationMs: 500,
    },
    {
      midi: [62],
      pcs: new Set([2]),
      symbol: "D",
      hand: "right",
      onsetMs: 500,
      durationMs: 500,
    },
    {
      midi: [64],
      pcs: new Set([4]),
      symbol: "E",
      hand: "right",
      onsetMs: 1000,
      durationMs: 500,
    },
    {
      midi: [60, 64, 67],
      pcs: new Set([0, 4, 7]),
      symbol: "C",
      hand: "left",
      onsetMs: 1500,
      durationMs: 1500,
    },
  ];
}

/**
 * Preview: chord symbols for display.
 */
function previewSymbols(): PracticeNote[] {
  return [
    { midi: [], pcs: new Set([0, 4, 7]), symbol: "C major" },
    { midi: [], pcs: new Set([0, 3, 7]), symbol: "C minor" },
    { midi: [], pcs: new Set([0, 4, 7, 11]), symbol: "Cmaj7" },
    { midi: [], pcs: new Set([0, 3, 7, 10]), symbol: "Cm7" },
  ];
}

/**
 * Preview: free-play notes over a scale.
 */
function previewFreePlay(): PracticeNote[] {
  // No targets, just example notes the user might play
  const cPentatonic = [60, 62, 64, 67, 69, 72];
  return cPentatonic.map((midi) => ({
    midi: [midi],
    pcs: new Set([midi % 12]),
    symbol: noteNameFromMidi(midi),
  }));
}

/**
 * Convert MIDI note number to English note name (C, C#, D, etc.).
 */
function noteNameFromMidi(midi: number): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return notes[midi % 12] || "?";
}
