import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  LOCAL_TRACKING_KEYS,
  appendLocalChordDrillEvent,
  appendLocalArpeggioTransition,
  appendLocalWorkshopEvent,
  appendLocalWorkshopMiss,
  listLocalChordDrillEvents,
  listLocalArpeggioEvents,
  listLocalWorkshopEvents,
  listLocalWorkshopMissEvents,
  clearLocalWorkshopByPage,
  updateLocalChordDrillGrade,
  writeLocalTechniqueSession,
  readLocalTechniqueLog,
  localTrackingEventCount,
} from "@/lib/local-practice-history";

describe("local practice history", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("appends chord drill events in import-compatible shape", () => {
    const id = appendLocalChordDrillEvent({
      chord: "Cmaj7",
      reactionTimeMs: 850,
      redo: false,
    });
    expect(id).toMatch(/^local_/);

    const rows = listLocalChordDrillEvents();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.chord).toBe("Cmaj7");
    expect(rows[0]?.reactionTimeMs).toBe(850);

    const raw = JSON.parse(
      localStorage.getItem(LOCAL_TRACKING_KEYS.chordDrill) ?? "[]"
    ) as Array<{ ms: number; chord: string }>;
    expect(raw[0]?.ms).toBe(850);
    expect(raw[0]?.chord).toBe("Cmaj7");
  });

  it("updates local chord grades by id", () => {
    const id = appendLocalChordDrillEvent({
      chord: "Dm7",
      reactionTimeMs: 600,
      redo: false,
    });
    updateLocalChordDrillGrade(id, "good");
    expect(listLocalChordDrillEvents()[0]?.grade).toBe("good");
  });

  it("stores arpeggio transitions and counts events", () => {
    appendLocalArpeggioTransition({
      chord: "Am11",
      fromDeg: "1",
      toDeg: "3",
      reactionTimeMs: 400,
    });
    expect(listLocalArpeggioEvents()).toHaveLength(1);
    expect(localTrackingEventCount()).toBeGreaterThanOrEqual(1);
  });

  it("writes technique sessions to the legacy habit log key", () => {
    writeLocalTechniqueSession({
      date: "2026-07-29",
      exercise: "Czerny",
      bpm: 66,
      notes: "ok",
    });
    const log = readLocalTechniqueLog();
    expect(log["2026-07-29"]?.bpm).toBe(66);
    expect(log["2026-07-29"]?.exercise).toBe("Czerny");
  });

  it("stores root-cycle quality for Tracking group keys", async () => {
    const { appendLocalRootCycleEvent, listLocalRootCycleEvents } =
      await import("@/lib/local-practice-history");
    appendLocalRootCycleEvent({
      mode: "chord",
      label: "Cmaj7",
      root: "C",
      quality: "maj7",
      reactionTimeMs: 500,
    });
    expect(listLocalRootCycleEvents()[0]?.quality).toBe("maj7");
  });

  it("appends workshop events and misses", () => {
    const id = appendLocalWorkshopEvent({
      pageId: "page-1",
      target: "Cmaj7",
      reactionTimeMs: 900,
      misses: 1,
      grade: "Good",
    });
    expect(id).toMatch(/^local_/);

    appendLocalWorkshopMiss({
      pageId: "page-1",
      target: "Cmaj7",
      played: "C,E,G",
    });

    const events = listLocalWorkshopEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.pageId).toBe("page-1");
    expect(events[0]?.chord).toBe("Cmaj7");
    expect(events[0]?.misses).toBe(1);
    expect(events[0]?.grade).toBe("Good");

    expect(listLocalWorkshopMissEvents()).toHaveLength(1);
    expect(localTrackingEventCount()).toBeGreaterThanOrEqual(2);
  });

  it("clears workshop history by page", () => {
    appendLocalWorkshopEvent({
      pageId: "page-a",
      target: "Dm7",
      reactionTimeMs: 800,
      misses: 0,
    });
    appendLocalWorkshopEvent({
      pageId: "page-b",
      target: "G7",
      reactionTimeMs: 700,
      misses: 0,
    });
    clearLocalWorkshopByPage("page-a");

    const events = listLocalWorkshopEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.pageId).toBe("page-b");
  });
});
