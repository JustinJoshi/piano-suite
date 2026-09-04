/**
 * Pure functions to render target notes in different display styles.
 * No React, DOM, or external dependencies.
 */

import type { PracticeNote } from "../../practice-note";

export type SymbolView = {
  kind: "symbols";
  current: string;
  next?: string;
  position?: string;
};

export type KeysDiagramView = {
  kind: "keysDiagram";
  current: Set<number>;
  next?: Set<number>;
  position?: string;
};

export type TargetDisplayView = SymbolView | KeysDiagramView;

/**
 * Build a symbols view showing chord/note names.
 * Returns the current target's symbol and optionally the next one.
 */
export function buildSymbolView(
  notes: PracticeNote[],
  currentIndex: number,
  options: { showNext?: boolean; showPosition?: boolean } = {}
): SymbolView {
  const current = notes[currentIndex] ?? null;
  const next = options.showNext ? notes[currentIndex + 1] : undefined;

  const view: SymbolView = {
    kind: "symbols",
    current: current?.symbol ?? "—",
  };

  if (next) {
    view.next = next.symbol;
  }

  if (options.showPosition && notes.length > 0) {
    view.position = `${currentIndex + 1} of ${notes.length}`;
  }

  return view;
}

/**
 * Build a keys diagram view showing pitch classes on a keyboard.
 * Returns the current target's pitch-class set and optionally the next.
 */
export function buildKeysDiagramView(
  notes: PracticeNote[],
  currentIndex: number,
  options: { showNext?: boolean; showPosition?: boolean } = {}
): KeysDiagramView {
  const current = notes[currentIndex] ?? null;
  const next = options.showNext ? notes[currentIndex + 1] : undefined;

  const view: KeysDiagramView = {
    kind: "keysDiagram",
    current: current?.pcs ?? new Set(),
  };

  if (next) {
    view.next = next.pcs;
  }

  if (options.showPosition && notes.length > 0) {
    view.position = `${currentIndex + 1} of ${notes.length}`;
  }

  return view;
}
