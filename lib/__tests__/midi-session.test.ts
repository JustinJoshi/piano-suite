import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  __resetMidiSessionForTests,
  connectMidiSession,
  getMidiSessionSnapshot,
  setMidiSelectedInputId,
  subscribeMidiSession,
  ensureMidiSessionRestored,
} from "@/lib/midi-session";

function createMockMidiInput(id: string, name: string) {
  return {
    id,
    name,
    onmidimessage: null as ((event: MIDIMessageEvent) => void) | null,
  };
}

function createMockMidiAccess(inputs: ReturnType<typeof createMockMidiInput>[]) {
  const inputMap = new Map(inputs.map((input) => [input.id, input]));

  return {
    inputs: {
      forEach: (cb: (input: (typeof inputs)[0]) => void) => inputs.forEach(cb),
      get: (id: string) => inputMap.get(id),
    },
    onstatechange: null as ((event: Event) => void) | null,
  };
}

function createMockMidiMessage(data: number[]): MIDIMessageEvent {
  return new MockMidiMessageEvent(data) as unknown as MIDIMessageEvent;
}

class MockMidiMessageEvent extends Event {
  data: Uint8Array;

  constructor(data: number[]) {
    super("midimessage");
    this.data = new Uint8Array(data);
  }
}

describe("midi-session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("navigator", {
      requestMIDIAccess: vi.fn(),
    });
    __resetMidiSessionForTests();
  });

  afterEach(() => {
    __resetMidiSessionForTests();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("connects and lists MIDI inputs", async () => {
    const inputs = [
      createMockMidiInput("input-1", "Roland Digital Piano"),
      createMockMidiInput("input-2", "Virtual MIDI"),
    ];
    const access = createMockMidiAccess(inputs);
    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(
      access as unknown as MIDIAccess
    );

    await connectMidiSession();

    const snap = getMidiSessionSnapshot();
    expect(snap.connected).toBe(true);
    expect(snap.inputs).toHaveLength(2);
    expect(snap.selectedInputId).toBe("input-1");
  });

  it("is idempotent when connect is called twice", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);
    vi.mocked(navigator.requestMIDIAccess).mockResolvedValue(
      access as unknown as MIDIAccess
    );

    await connectMidiSession();
    await connectMidiSession();

    expect(navigator.requestMIDIAccess).toHaveBeenCalledTimes(1);
    expect(getMidiSessionSnapshot().connected).toBe(true);
  });

  it("persists connection and restores from sessionStorage", async () => {
    const inputs = [
      createMockMidiInput("input-1", "Roland Digital Piano"),
      createMockMidiInput("input-2", "Virtual MIDI"),
    ];
    const access = createMockMidiAccess(inputs);
    vi.mocked(navigator.requestMIDIAccess).mockResolvedValue(
      access as unknown as MIDIAccess
    );

    await connectMidiSession();
    setMidiSelectedInputId("input-2");

    expect(sessionStorage.getItem("piano-suite-midi-v1")).toContain("input-2");

    // Simulate a new page load: reset in-memory store but keep sessionStorage.
    const persisted = sessionStorage.getItem("piano-suite-midi-v1");
    __resetMidiSessionForTests();
    if (persisted) {
      sessionStorage.setItem("piano-suite-midi-v1", persisted);
    }

    expect(getMidiSessionSnapshot().connected).toBe(false);

    await ensureMidiSessionRestored();

    const snap = getMidiSessionSnapshot();
    expect(snap.connected).toBe(true);
    expect(snap.selectedInputId).toBe("input-2");
    expect(inputs[1].onmidimessage).not.toBeNull();
  });

  it("does not auto-restore without a prior session", async () => {
    const request = vi.mocked(navigator.requestMIDIAccess);
    await ensureMidiSessionRestored();
    expect(request).not.toHaveBeenCalled();
    expect(getMidiSessionSnapshot().connected).toBe(false);
  });

  it("notifies subscribers on connect and note events", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);
    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(
      access as unknown as MIDIAccess
    );

    const listener = vi.fn();
    const unsubscribe = subscribeMidiSession(listener);

    await connectMidiSession();
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    inputs[0].onmidimessage?.(createMockMidiMessage([0x90, 60, 100]));
    expect(listener).toHaveBeenCalled();
    expect(getMidiSessionSnapshot().heldNotes).toEqual([60]);

    unsubscribe();
  });

  it("keeps the MIDI handler attached across subscriber unmount", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);
    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(
      access as unknown as MIDIAccess
    );

    const unsubscribe = subscribeMidiSession(() => {});
    await connectMidiSession();
    expect(inputs[0].onmidimessage).not.toBeNull();

    unsubscribe();
    expect(inputs[0].onmidimessage).not.toBeNull();
  });
});
