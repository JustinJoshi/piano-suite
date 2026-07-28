import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMidi } from "@/hooks/useMidi";

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

describe("useMidi", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "navigator",
      {
        requestMIDIAccess: vi.fn(),
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unsupported when requestMIDIAccess is missing", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("navigator", {});

    const { result } = renderHook(() => useMidi());
    expect(result.current.supported).toBe(false);
    expect(result.current.error).toBe("Web MIDI is not supported in this browser.");
  });

  it("connects and lists MIDI inputs", async () => {
    const inputs = [
      createMockMidiInput("input-1", "Roland Digital Piano"),
      createMockMidiInput("input-2", "Virtual MIDI"),
    ];
    const access = createMockMidiAccess(inputs);

    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(access as unknown as MIDIAccess);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.inputs).toHaveLength(2);
    expect(result.current.inputs[0].name).toBe("Roland Digital Piano");
    expect(result.current.selectedInputId).toBe("input-1");
  });

  it("tracks held notes from note on/off messages", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);

    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(access as unknown as MIDIAccess);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.connect();
    });

    const input = inputs[0];

    act(() => {
      input.onmidimessage?.(createMockMidiMessage([0x90, 60, 100]));
    });

    await waitFor(() => {
      expect(result.current.heldNotes).toEqual([60]);
    });

    act(() => {
      input.onmidimessage?.(createMockMidiMessage([0x90, 64, 100]));
    });

    await waitFor(() => {
      expect(result.current.heldNotes).toEqual([60, 64]);
    });

    act(() => {
      input.onmidimessage?.(createMockMidiMessage([0x80, 60, 0]));
    });

    await waitFor(() => {
      expect(result.current.heldNotes).toEqual([64]);
    });
  });

  it("treats note-on with velocity 0 as note-off", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);

    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(access as unknown as MIDIAccess);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.connect();
    });

    const input = inputs[0];

    act(() => {
      input.onmidimessage?.(createMockMidiMessage([0x90, 60, 100]));
    });

    await waitFor(() => {
      expect(result.current.heldNotes).toEqual([60]);
    });

    act(() => {
      input.onmidimessage?.(createMockMidiMessage([0x90, 60, 0]));
    });

    await waitFor(() => {
      expect(result.current.heldNotes).toEqual([]);
    });
  });

  it("dispatches custom midi-note-on events", async () => {
    const inputs = [createMockMidiInput("input-1", "Roland Digital Piano")];
    const access = createMockMidiAccess(inputs);

    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(access as unknown as MIDIAccess);

    const listener = vi.fn();
    window.addEventListener("midi-note-on", listener as EventListener);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      inputs[0].onmidimessage?.(createMockMidiMessage([0x90, 60, 100]));
    });

    await waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    const event = listener.mock.calls[0][0] as CustomEvent<
      import("@/hooks/useMidi").MidiNoteEventDetail
    >;
    expect(event.detail).toMatchObject({
      note: 60,
      pc: 0,
      velocity: 100,
    });

    window.removeEventListener("midi-note-on", listener as EventListener);
  });

  it("switches active handler when selected input changes", async () => {
    const inputs = [
      createMockMidiInput("input-1", "Roland Digital Piano"),
      createMockMidiInput("input-2", "Virtual MIDI"),
    ];
    const access = createMockMidiAccess(inputs);

    vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce(access as unknown as MIDIAccess);

    const { result } = renderHook(() => useMidi());

    await act(async () => {
      await result.current.connect();
    });

    expect(inputs[0].onmidimessage).not.toBeNull();
    expect(inputs[1].onmidimessage).toBeNull();

    act(() => {
      result.current.setSelectedInputId("input-2");
    });

    await waitFor(() => {
      expect(inputs[0].onmidimessage).toBeNull();
      expect(inputs[1].onmidimessage).not.toBeNull();
    });
  });
});
