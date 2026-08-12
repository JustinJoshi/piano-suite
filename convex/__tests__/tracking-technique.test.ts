/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

describe("tracking and technique scaling (Phase 6)", () => {
  const proIdentity = {
    subject: "clerk_phase6_pro",
    email: "phase6@example.com",
    name: "Phase 6 Pro",
    pla: "u:pro",
    fea: "u:sync",
  };

  it("listChordDrillEvents respects the limit and returns only the user's events", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    for (let i = 0; i < 5; i++) {
      await asPro.mutation(api.tracking.logChordDrillEvent, {
        chord: "Cmaj7",
        reactionTimeMs: 500 + i,
        redo: false,
      });
    }

    const all = await asPro.query(api.tracking.listChordDrillEvents, {});
    expect(all).toHaveLength(5);

    const limited = await asPro.query(api.tracking.listChordDrillEvents, {
      limit: 2,
    });
    expect(limited).toHaveLength(2);

    // Most recent first because of .order("desc").
    expect(limited[0].reactionTimeMs).toBeGreaterThan(
      limited[1].reactionTimeMs
    );
  });

  it("listArpeggioMissEvents respects the limit", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    for (let i = 0; i < 3; i++) {
      await asPro.mutation(api.tracking.logArpeggioMiss, {
        chord: "Cmaj7",
        fromDeg: "1",
        toDeg: "3",
        played: "D",
      });
    }

    const limited = await asPro.query(api.tracking.listArpeggioMissEvents, {
      limit: 1,
    });
    expect(limited).toHaveLength(1);
  });

  it("listTechniqueSessions respects the limit", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    for (let i = 0; i < 4; i++) {
      await asPro.mutation(api.technique.logTechniqueSession, {
        date: `2026-08-0${i + 1}`,
        exercise: "Czerny",
        bpm: 60 + i,
      });
    }

    const limited = await asPro.query(api.technique.listTechniqueSessions, {
      limit: 2,
    });
    expect(limited).toHaveLength(2);
  });

  it("updateChordDrillGrade rejects cross-user updates", async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(proIdentity);
    const eventId = await asOwner.mutation(api.tracking.logChordDrillEvent, {
      chord: "Cmaj7",
      reactionTimeMs: 600,
      redo: false,
    });

    const asOther = t.withIdentity({
      subject: "clerk_phase6_other",
      email: "other@example.com",
      name: "Other User",
      pla: "u:pro",
      fea: "u:sync",
    });

    await expect(
      asOther.mutation(api.tracking.updateChordDrillGrade, {
        eventId,
        grade: "Good",
      })
    ).rejects.toThrow(/Event not found/i);
  });

  it("clearChordDrillEventsByChord deletes only matching chord events", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.tracking.logChordDrillEvent, {
      chord: "Cmaj7",
      reactionTimeMs: 600,
      redo: false,
    });
    await asPro.mutation(api.tracking.logChordDrillEvent, {
      chord: "Dm7",
      reactionTimeMs: 700,
      redo: false,
    });

    await asPro.mutation(api.tracking.clearChordDrillEventsByChord, {
      chord: "Cmaj7",
    });

    const remaining = await asPro.query(api.tracking.listChordDrillEvents, {});
    expect(remaining).toHaveLength(1);
    expect(remaining[0].chord).toBe("Dm7");
  });

  it("bulkImportTechniqueSessions upserts and avoids N+1 behavior", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.technique.bulkImportTechniqueSessions, {
      sessions: [
        { date: "2026-08-01", exercise: "Czerny", bpm: 60, timestamp: 1 },
        { date: "2026-08-02", exercise: "Hanon", bpm: 72, timestamp: 2 },
      ],
    });

    const first = await asPro.query(api.technique.listTechniqueSessions, {});
    expect(first).toHaveLength(2);

    // Re-import the same date with different BPM — should patch, not create a duplicate.
    await asPro.mutation(api.technique.bulkImportTechniqueSessions, {
      sessions: [
        {
          date: "2026-08-01",
          exercise: "Czerny",
          bpm: 80,
          notes: "Faster",
          timestamp: 3,
        },
        { date: "2026-08-03", exercise: "Scales", bpm: 90, timestamp: 4 },
      ],
    });

    const second = await asPro.query(api.technique.listTechniqueSessions, {});
    expect(second).toHaveLength(3);

    const updated = second.find((s) => s.date === "2026-08-01");
    expect(updated?.bpm).toBe(80);
    expect(updated?.notes).toBe("Faster");
  });

  it("clearTechniqueSessions removes all user sessions across batches", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    for (let i = 0; i < 5; i++) {
      await asPro.mutation(api.technique.logTechniqueSession, {
        date: `2026-08-0${i + 1}`,
        exercise: "Czerny",
        bpm: 60,
      });
    }

    await asPro.mutation(api.technique.clearTechniqueSessions, {});

    const remaining = await asPro.query(api.technique.listTechniqueSessions, {});
    expect(remaining).toHaveLength(0);
  });
});
