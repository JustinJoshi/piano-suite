/**
 * Free-tier browser practice history (WP5).
 *
 * Writes use the same localStorage keys / shapes as the Reflex import UIs so
 * upgrading to Pro can call existing bulkImport mutations without a new format.
 */

export const LOCAL_TRACKING_KEYS = {
  chordDrill: "blocked-drill-first-chord-log",
  arpeggio: "blocked-drill-arpeggio-log",
  arpeggioMiss: "blocked-drill-arpeggio-miss-log",
  rootCycle: "blocked-drill-rootcycle-log",
  progression: "piano-suite-progression-log-v1",
  workshop: "piano-suite-workshop-log-v1",
  workshopMiss: "piano-suite-workshop-miss-log-v1",
} as const;

export const LOCAL_TECHNIQUE_KEY = "technique-habit-log-v1";

export type LocalChordDrillEvent = {
  id: string;
  chord: string;
  ms: number;
  grade?: string | null;
  isRedo?: boolean;
  ts: number;
};

export type LocalArpeggioEvent = {
  chord: string;
  fromDeg: string;
  toDeg: string;
  ms: number;
  ts: number;
};

export type LocalArpeggioMissEvent = {
  chord: string;
  fromDeg: string;
  toDeg: string;
  played: string;
  ts: number;
};

export type LocalRootCycleEvent = {
  mode: "chord" | "arpeggio";
  label?: string;
  root?: string;
  quality?: string;
  ms: number;
  fromDeg?: string;
  toDeg?: string;
  ts: number;
};

export type LocalProgressionEvent = {
  progression: string;
  key: string;
  stepLabel: string;
  chord: string;
  ms: number;
  ts: number;
};

export type LocalWorkshopEvent = {
  id: string;
  pageId: string;
  target: string;
  ms: number;
  grade?: string | null;
  misses: number;
  ts: number;
};

export type LocalWorkshopMissEvent = {
  id: string;
  pageId: string;
  target: string;
  played: string;
  ts: number;
};

/** Dispatched after local history writes so Tracking / Technique can refresh. */
export const LOCAL_HISTORY_CHANGED_EVENT = "piano-suite-local-history";

export function notifyLocalHistoryChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCAL_HISTORY_CHANGED_EVENT));
}

export type LocalTechniqueLog = Record<
  string,
  { bpm: number; notes?: string; exercise?: string }
>;

/** Convex-shaped rows for Tracking panels when reading Free local history. */
export type LocalTrackingChordRow = {
  _id: string;
  chord: string;
  reactionTimeMs: number;
  grade?: string;
  redo: boolean;
  timestamp: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readArray<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, rows: T[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(rows));
  notifyLocalHistoryChanged();
}

function newId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function appendLocalChordDrillEvent(args: {
  chord: string;
  reactionTimeMs: number;
  redo: boolean;
  grade?: string;
}): string {
  const id = newId();
  const rows = readArray<LocalChordDrillEvent>(LOCAL_TRACKING_KEYS.chordDrill);
  rows.push({
    id,
    chord: args.chord,
    ms: args.reactionTimeMs,
    grade: args.grade ?? null,
    isRedo: args.redo,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.chordDrill, rows);
  return id;
}

export function updateLocalChordDrillGrade(
  eventId: string,
  grade: string
): void {
  const rows = readArray<LocalChordDrillEvent>(LOCAL_TRACKING_KEYS.chordDrill);
  const next = rows.map((row) =>
    row.id === eventId ? { ...row, grade } : row
  );
  writeArray(LOCAL_TRACKING_KEYS.chordDrill, next);
}

export function appendLocalArpeggioTransition(args: {
  chord: string;
  fromDeg: string;
  toDeg: string;
  reactionTimeMs: number;
}): void {
  const rows = readArray<LocalArpeggioEvent>(LOCAL_TRACKING_KEYS.arpeggio);
  rows.push({
    chord: args.chord,
    fromDeg: args.fromDeg,
    toDeg: args.toDeg,
    ms: args.reactionTimeMs,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.arpeggio, rows);
}

export function appendLocalArpeggioMiss(args: {
  chord: string;
  fromDeg: string;
  toDeg: string;
  played: string;
}): void {
  const rows = readArray<LocalArpeggioMissEvent>(
    LOCAL_TRACKING_KEYS.arpeggioMiss
  );
  rows.push({ ...args, ts: Date.now() });
  writeArray(LOCAL_TRACKING_KEYS.arpeggioMiss, rows);
}

export function appendLocalRootCycleEvent(args: {
  mode: string;
  label?: string;
  root?: string;
  quality?: string;
  fromDeg?: string;
  toDeg?: string;
  reactionTimeMs: number;
}): void {
  const rows = readArray<LocalRootCycleEvent>(LOCAL_TRACKING_KEYS.rootCycle);
  rows.push({
    mode: args.mode === "arpeggio" ? "arpeggio" : "chord",
    label: args.label,
    root: args.root,
    quality: args.quality,
    fromDeg: args.fromDeg,
    toDeg: args.toDeg,
    ms: args.reactionTimeMs,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.rootCycle, rows);
}

export function appendLocalProgressionEvent(args: {
  progression: string;
  key: string;
  stepLabel: string;
  chord: string;
  reactionTimeMs: number;
}): void {
  const rows = readArray<LocalProgressionEvent>(LOCAL_TRACKING_KEYS.progression);
  rows.push({
    progression: args.progression,
    key: args.key,
    stepLabel: args.stepLabel,
    chord: args.chord,
    ms: args.reactionTimeMs,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.progression, rows);
}

export function appendLocalWorkshopEvent(args: {
  pageId: string;
  target: string;
  reactionTimeMs: number;
  misses: number;
  grade?: string;
}): string {
  const id = newId();
  const rows = readArray<LocalWorkshopEvent>(LOCAL_TRACKING_KEYS.workshop);
  rows.push({
    id,
    pageId: args.pageId,
    target: args.target,
    ms: args.reactionTimeMs,
    misses: args.misses,
    grade: args.grade ?? null,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.workshop, rows);
  return id;
}

export function appendLocalWorkshopMiss(args: {
  pageId: string;
  target: string;
  played: string;
}): void {
  const rows = readArray<LocalWorkshopMissEvent>(LOCAL_TRACKING_KEYS.workshopMiss);
  rows.push({
    id: newId(),
    pageId: args.pageId,
    target: args.target,
    played: args.played,
    ts: Date.now(),
  });
  writeArray(LOCAL_TRACKING_KEYS.workshopMiss, rows);
}

export function listLocalWorkshopEvents(): Array<{
  _id: string;
  pageId: string;
  chord: string;
  reactionTimeMs: number;
  grade?: string;
  misses: number;
  redo: boolean;
  timestamp: number;
}> {
  return readArray<LocalWorkshopEvent>(LOCAL_TRACKING_KEYS.workshop).map((e) => ({
    _id: e.id ?? `local_ws_${e.ts}_${e.target}`,
    pageId: e.pageId,
    chord: e.target,
    reactionTimeMs: e.ms,
    grade: e.grade ?? undefined,
    misses: e.misses,
    redo: false,
    timestamp: e.ts,
  }));
}

export function listLocalWorkshopMissEvents(): Array<{
  _id: string;
  pageId: string;
  chord: string;
  played: string;
  timestamp: number;
}> {
  return readArray<LocalWorkshopMissEvent>(LOCAL_TRACKING_KEYS.workshopMiss).map(
    (e) => ({
      _id: e.id ?? `local_ws_miss_${e.ts}_${e.target}`,
      pageId: e.pageId,
      chord: e.target,
      played: e.played,
      timestamp: e.ts,
    })
  );
}

export function clearLocalWorkshopByPage(pageId: string): void {
  writeArray(
    LOCAL_TRACKING_KEYS.workshop,
    readArray<LocalWorkshopEvent>(LOCAL_TRACKING_KEYS.workshop).filter(
      (e) => e.pageId !== pageId
    )
  );
  writeArray(
    LOCAL_TRACKING_KEYS.workshopMiss,
    readArray<LocalWorkshopMissEvent>(LOCAL_TRACKING_KEYS.workshopMiss).filter(
      (e) => e.pageId !== pageId
    )
  );
}

export function listLocalChordDrillEvents(): LocalTrackingChordRow[] {
  return readArray<LocalChordDrillEvent>(LOCAL_TRACKING_KEYS.chordDrill).map(
    (e) => ({
      _id: e.id ?? `legacy_${e.ts}_${e.chord}`,
      chord: e.chord,
      reactionTimeMs: e.ms,
      grade: e.grade ?? undefined,
      redo: !!e.isRedo,
      timestamp: e.ts,
    })
  );
}

export function listLocalArpeggioEvents(): Array<{
  _id: string;
  chord: string;
  fromDeg: string;
  toDeg: string;
  reactionTimeMs: number;
  redo: boolean;
  timestamp: number;
}> {
  return readArray<LocalArpeggioEvent>(LOCAL_TRACKING_KEYS.arpeggio).map(
    (e, i) => ({
      _id: `local_arp_${e.ts}_${i}`,
      chord: e.chord,
      fromDeg: e.fromDeg,
      toDeg: e.toDeg,
      reactionTimeMs: e.ms,
      redo: false,
      timestamp: e.ts,
    })
  );
}

export function listLocalArpeggioMissEvents(): Array<{
  _id: string;
  chord: string;
  fromDeg: string;
  toDeg: string;
  played: string;
  timestamp: number;
}> {
  return readArray<LocalArpeggioMissEvent>(LOCAL_TRACKING_KEYS.arpeggioMiss).map(
    (e, i) => ({
      _id: `local_miss_${e.ts}_${i}`,
      chord: e.chord,
      fromDeg: e.fromDeg,
      toDeg: e.toDeg,
      played: e.played,
      timestamp: e.ts,
    })
  );
}

export function listLocalRootCycleEvents(): Array<{
  _id: string;
  mode?: string;
  chord?: string;
  root?: string;
  quality?: string;
  fromDeg?: string;
  toDeg?: string;
  reactionTimeMs: number;
  redo: boolean;
  timestamp: number;
}> {
  return readArray<LocalRootCycleEvent>(LOCAL_TRACKING_KEYS.rootCycle).map(
    (e, i) => ({
      _id: `local_rc_${e.ts}_${i}`,
      mode: e.mode,
      chord: e.label,
      root: e.root,
      quality: rootCycleQuality(e),
      fromDeg: e.fromDeg,
      toDeg: e.toDeg,
      reactionTimeMs: e.ms,
      redo: false,
      timestamp: e.ts,
    })
  );
}

export function readLocalTechniqueLog(): LocalTechniqueLog {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(LOCAL_TECHNIQUE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LocalTechniqueLog;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalTechniqueSession(args: {
  date: string;
  exercise: string;
  bpm: number;
  notes?: string;
}): void {
  if (!canUseStorage()) return;
  const log = readLocalTechniqueLog();
  log[args.date] = {
    bpm: args.bpm,
    notes: args.notes,
    exercise: args.exercise,
  };
  localStorage.setItem(LOCAL_TECHNIQUE_KEY, JSON.stringify(log));
  notifyLocalHistoryChanged();
}

export function clearLocalTechniqueLog(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(LOCAL_TECHNIQUE_KEY);
  notifyLocalHistoryChanged();
}

export function clearLocalChordDrillByChord(chord: string): void {
  const rows = readArray<LocalChordDrillEvent>(LOCAL_TRACKING_KEYS.chordDrill);
  writeArray(
    LOCAL_TRACKING_KEYS.chordDrill,
    rows.filter((e) => e.chord !== chord)
  );
}

export function clearLocalArpeggioByTransition(
  chord: string,
  fromDeg: string,
  toDeg: string
): void {
  writeArray(
    LOCAL_TRACKING_KEYS.arpeggio,
    readArray<LocalArpeggioEvent>(LOCAL_TRACKING_KEYS.arpeggio).filter(
      (e) =>
        !(e.chord === chord && e.fromDeg === fromDeg && e.toDeg === toDeg)
    )
  );
  writeArray(
    LOCAL_TRACKING_KEYS.arpeggioMiss,
    readArray<LocalArpeggioMissEvent>(LOCAL_TRACKING_KEYS.arpeggioMiss).filter(
      (e) =>
        !(e.chord === chord && e.fromDeg === fromDeg && e.toDeg === toDeg)
    )
  );
}

function rootCycleQuality(e: LocalRootCycleEvent): string | undefined {
  if (e.quality) return e.quality;
  if (
    e.mode === "chord" &&
    e.label &&
    e.root &&
    e.label.startsWith(e.root)
  ) {
    return e.label.slice(e.root.length);
  }
  return undefined;
}

export function clearLocalRootCycleByGroup(args: {
  mode: string;
  quality?: string;
  fromDeg?: string;
  toDeg?: string;
}): void {
  const raw = readArray<LocalRootCycleEvent>(LOCAL_TRACKING_KEYS.rootCycle);
  writeArray(
    LOCAL_TRACKING_KEYS.rootCycle,
    raw.filter((e) => {
      if (e.mode !== args.mode) return true;
      if (args.quality && rootCycleQuality(e) !== args.quality) return true;
      if (args.fromDeg && e.fromDeg !== args.fromDeg) return true;
      if (args.toDeg && e.toDeg !== args.toDeg) return true;
      return false;
    })
  );
}

export function localTrackingEventCount(): number {
  return (
    readArray(LOCAL_TRACKING_KEYS.chordDrill).length +
    readArray(LOCAL_TRACKING_KEYS.arpeggio).length +
    readArray(LOCAL_TRACKING_KEYS.arpeggioMiss).length +
    readArray(LOCAL_TRACKING_KEYS.rootCycle).length +
    readArray(LOCAL_TRACKING_KEYS.progression).length +
    readArray(LOCAL_TRACKING_KEYS.workshop).length +
    readArray(LOCAL_TRACKING_KEYS.workshopMiss).length
  );
}
