import { describe, it, expect } from "vitest";
import {
  summarizePracticeEvents,
  formatMs,
  EMPTY_SESSION_SUMMARY,
  type PracticeSummaryEvent,
} from "@/lib/session-stats";

const NOW = Date.UTC(2026, 8, 2, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

function event(
  overrides: Partial<PracticeSummaryEvent> = {}
): PracticeSummaryEvent {
  return {
    reactionTimeMs: 1000,
    grade: "Good",
    timestamp: NOW,
    pageId: "page-1",
    ...overrides,
  };
}

describe("summarizePracticeEvents", () => {
  it("returns the empty summary when nothing matches", () => {
    expect(
      summarizePracticeEvents([], { pageId: "page-1", windowDays: 7, now: NOW })
    ).toEqual(EMPTY_SESSION_SUMMARY);
  });

  it("counts only events from the requested page", () => {
    const summary = summarizePracticeEvents(
      [event(), event({ pageId: "page-2" }), event()],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.reps).toBe(2);
  });

  it("drops events older than the window", () => {
    const summary = summarizePracticeEvents(
      [event(), event({ timestamp: NOW - 8 * DAY })],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.reps).toBe(1);
  });

  it("computes best and average reaction times", () => {
    const summary = summarizePracticeEvents(
      [
        event({ reactionTimeMs: 900 }),
        event({ reactionTimeMs: 1500 }),
        event({ reactionTimeMs: 1200 }),
      ],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.bestMs).toBe(900);
    expect(summary.averageMs).toBe(1200);
  });

  it("tallies grades and ignores unknown labels", () => {
    const summary = summarizePracticeEvents(
      [
        event({ grade: "Good" }),
        event({ grade: "Hard" }),
        event({ grade: "Again" }),
        event({ grade: "Good" }),
        event({ grade: "Nonsense" }),
        event({ grade: undefined }),
      ],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.grades).toEqual({ Again: 1, Hard: 1, Good: 2, Easy: 0 });
    // Ungraded reps still count as work done.
    expect(summary.reps).toBe(6);
  });

  it("reports the most recent rep", () => {
    const summary = summarizePracticeEvents(
      [event({ timestamp: NOW - DAY }), event({ timestamp: NOW - 2 * DAY })],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.lastPracticedAt).toBe(NOW - DAY);
  });

  it("counts distinct days practiced", () => {
    const summary = summarizePracticeEvents(
      [
        event({ timestamp: NOW }),
        event({ timestamp: NOW - 60 * 1000 }),
        event({ timestamp: NOW - 2 * DAY }),
      ],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.daysPracticed).toBe(2);
  });

  it("ignores events with a non-finite timestamp", () => {
    const summary = summarizePracticeEvents(
      [event(), event({ timestamp: Number.NaN })],
      { pageId: "page-1", windowDays: 7, now: NOW }
    );
    expect(summary.reps).toBe(1);
  });

  it("does not share its grade object between calls", () => {
    const first = summarizePracticeEvents([event()], {
      pageId: "page-1",
      windowDays: 7,
      now: NOW,
    });
    first.grades.Good = 99;
    const second = summarizePracticeEvents([event()], {
      pageId: "page-1",
      windowDays: 7,
      now: NOW,
    });
    expect(second.grades.Good).toBe(1);
  });
});

describe("formatMs", () => {
  it("shows milliseconds under a second and seconds above", () => {
    expect(formatMs(null)).toBe("—");
    expect(formatMs(840)).toBe("840ms");
    expect(formatMs(1240)).toBe("1.24s");
  });
});
