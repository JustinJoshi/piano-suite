import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { TargetDisplayBlock } from "@/components/feature-blocks/target-display-block";
import { DrillTimerBlock } from "@/components/feature-blocks/drill-timer-block";
import { ChordLibraryBlock } from "@/components/feature-blocks/chord-library-block";
import { ChordSetBlock } from "@/components/feature-blocks/chord-set-block";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import {
  pressVirtualNote,
  releaseAllVirtualNotes,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";
import {
  appendLocalWorkshopEvent,
  appendLocalWorkshopMiss,
} from "@/lib/local-practice-history";

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: vi.fn(() => ({
    canPersist: false,
    canAccess: true,
    isSignedIn: false,
  })),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => undefined),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    tracking: { logPracticeEvent: {}, logMissEvent: {} },
    waitlist: { joinWaitlist: {} },
  },
}));

vi.mock("@/lib/local-practice-history", () => ({
  appendLocalWorkshopEvent: vi.fn(() => "localId"),
  appendLocalWorkshopMiss: vi.fn(),
}));

// The rootless-ii-v-i-slow seed's exact blocks (lib/marketplace-seeds.ts,
// read-only): chordLibrary + targetDisplay + drillTimer + sessionStats —
// a source-only page with no target block. Three chords × 12 loops.
const SEED_BLOCKS = [
  { id: "chordLibrary", type: "chordLibrary", config: {
      mode: "romanNumerals",
      numerals: "ii7 V7 Imaj7",
      keyRoot: "C",
      voicing: "rootlessA",
      showNext: true,
      loopCount: 12,
    } },
  { id: "targetDisplay", type: "targetDisplay", config: {
      view: "symbols",
      showNext: true,
      showPosition: true,
    } },
  { id: "drillTimer", type: "drillTimer", config: {
      countdownSeconds: 0,
      breakSeconds: 0,
      multiRep: true,
      showLiveTimer: true,
    } },
  { id: "sessionStats", type: "sessionStats", config: {
      windowDays: 30,
      showGrades: true,
      showBest: true,
    } },
];

function page(blocks: object[]) {
  return blocks as Array<{ id: string; type: string; config: unknown }>;
}

// Hold the notes of the current target: press every pc in 0..11 with the
// held set the caller wants. pc → MIDI uses 60 + pc.
function holdPcs(pcs: Iterable<number>) {
  releaseAllVirtualNotes();
  for (const pc of pcs) pressVirtualNote(60 + pc);
}

describe("source practice (wire-source-practice)", () => {
  beforeEach(() => {
    __resetMidiSessionForTests();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    releaseAllVirtualNotes();
    __resetMidiSessionForTests();
  });

  it("the rootless seed page arms through DrillTimerBlock and shows grouped targets", () => {
    render(
      <DrillRuntimeProvider pageId="seed-rootless" blocks={page(SEED_BLOCKS)}>
        <TargetDisplayBlock {...SEED_BLOCKS[1].config} />
        <DrillTimerBlock {...SEED_BLOCKS[2].config} />
      </DrillRuntimeProvider>
    );

    // 36 grouped targets: 3 chords × 12 loops. The raw stream also has 36
    // notes, but the display reads the runtime's grouped list — proven by
    // the advance test below (the stream's rows would not move targetIndex).
    expect(screen.getByText("1 of 36")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    // countdownSeconds: 0 → straight through armed into timing.
    expect(screen.getByText("Timing")).toBeInTheDocument();
    expect(appendLocalWorkshopEvent).not.toHaveBeenCalled();
  });

  it("playing the current grouped target advances the display and logs one success", async () => {
    render(
      <DrillRuntimeProvider pageId="seed-rootless" blocks={page(SEED_BLOCKS)}>
        <TargetDisplayBlock {...SEED_BLOCKS[1].config} />
        <DrillTimerBlock {...SEED_BLOCKS[2].config} />
      </DrillRuntimeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    // The first target is ii7 in C: Dm7 rootless A = F A C E → pcs 0,2,5,9.
    // The on-screen keyboard injects the notes via pressVirtualNote, the
    // same channel real hardware flows through.
    act(() => {
      holdPcs([0, 2, 5, 9]);
    });

    await waitFor(() => {
      expect(appendLocalWorkshopEvent).toHaveBeenCalledTimes(1);
    });

    expect(appendLocalWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: "seed-rootless",
        target: "Dm7",
        misses: 0,
        grade: "Good",
      })
    );
    expect(appendLocalWorkshopMiss).not.toHaveBeenCalled();

    // The display advanced to the second grouped target: V7 (G7).
    expect(screen.getByText("2 of 36")).toBeInTheDocument();
    expect(screen.getByText("G7")).toBeInTheDocument();
  });

  it("a wrong chord logs a miss before the right one succeeds", async () => {
    render(
      <DrillRuntimeProvider pageId="seed-rootless" blocks={page(SEED_BLOCKS)}>
        <TargetDisplayBlock {...SEED_BLOCKS[1].config} />
        <DrillTimerBlock {...SEED_BLOCKS[2].config} />
      </DrillRuntimeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    act(() => {
      holdPcs([1, 3]); // wrong notes
    });

    await waitFor(() => {
      expect(appendLocalWorkshopMiss).toHaveBeenCalledTimes(1);
    });

    act(() => {
      holdPcs([0, 2, 5, 9]); // Dm7 rootless A
    });

    await waitFor(() => {
      expect(appendLocalWorkshopEvent).toHaveBeenCalledTimes(1);
    });
    expect(appendLocalWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({ target: "Dm7", misses: 1, grade: "Hard" })
    );
  });

  it("an explicit target block on a page with a different source still grades only the explicit targets", async () => {
    const blocks = [
      ...SEED_BLOCKS.filter((b) => b.type !== "drillTimer"),
      { id: "chords", type: "chordSet", config: {
          roots: ["F"],
          qualityGroups: ["7th"],
          order: "sequential",
          requireExact: false,
          goodThreshold: 0,
          hardThreshold: 2,
        } },
      { id: "timer", type: "drillTimer", config: SEED_BLOCKS[2].config },
    ];

    const { unmount } = render(
      <DrillRuntimeProvider pageId="seed-explicit" blocks={page(blocks)}>
        <ChordSetBlock {...{ roots: ["F"], qualityGroups: ["7th"], order: "sequential" }} />
        <TargetDisplayBlock {...SEED_BLOCKS[1].config} />
        <DrillTimerBlock {...SEED_BLOCKS[2].config} />
      </DrillRuntimeProvider>
    );

    // The chordSet owns the page: its five F-rooted 7th chords are the
    // whole target list, never the stream's 36.
    await waitFor(() => {
      expect(screen.getByText("1 of 5")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    // Playing the stream's first chord (Dm7 shape, a superset of Fmaj7's
    // pcs with requireExact off) must NOT satisfy the explicit Fmaj7 target:
    // pcs {5,9,0} are absent.
    act(() => {
      holdPcs([0, 2, 5, 9]);
    });
    expect(appendLocalWorkshopEvent).not.toHaveBeenCalled();

    // Fmaj7's own pitch classes (0,4,5,9) do.
    act(() => {
      holdPcs([0, 4, 5, 9]);
    });

    await waitFor(() => {
      expect(appendLocalWorkshopEvent).toHaveBeenCalledTimes(1);
    });
    expect(appendLocalWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({ target: "Fmaj7" })
    );
    unmount();
  });

  it("a freePlay-only source page stays ungraded", () => {
    const blocks = [
      { id: "lib", type: "chordLibrary", config: { chords: "Cmaj7, G7" } },
      { id: "fp", type: "freePlay", config: { scale: "majorPentatonic", root: "C", windowSeconds: 30 } },
    ];

    render(
      <DrillRuntimeProvider pageId="seed-freeplay" blocks={page(blocks)}>
        <TargetDisplayBlock {...SEED_BLOCKS[1].config} />
      </DrillRuntimeProvider>
    );

    // No timer/transport/display trigger → no fallback targets; the display
    // falls back to raw stream rows (2 notes) for preview. Without any
    // runtime driver there is no Start button and no scoring at all.
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start/i })).toBeNull();
    expect(appendLocalWorkshopEvent).not.toHaveBeenCalled();
  });

  it("a stream-only preview page (empty pageId) keeps per-note display rows", () => {
    render(
      <DrillRuntimeProvider pageId="" blocks={page([
        { id: "lib", type: "chordLibrary", config: { chords: "G7, Dm7" } },
        { id: "disp", type: "targetDisplay", config: { view: "symbols", showNext: true, showPosition: true } },
      ])}>
        <ChordLibraryBlock {...{ chords: "G7, Dm7" }} />
        <TargetDisplayBlock {...{ view: "symbols", showNext: true, showPosition: true }} />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });
});
