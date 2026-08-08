import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAudioEngine } from "@/lib/audio-engine";

const startMock = vi.fn();
const stopMock = vi.fn();
const disposeMock = vi.fn();
const readyPromise = Promise.resolve();

const mockSampler = {
  ready: readyPromise,
  output: { volume: 100 },
  start: startMock,
  stop: stopMock,
  dispose: disposeMock,
};

vi.mock("smplr", () => ({
  SplendidGrandPiano: vi.fn(() => mockSampler),
  Soundfont: vi.fn(() => mockSampler),
}));

describe("createAudioEngine", () => {
  let audioContextMock: {
    state: string;
    resume: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    startMock.mockClear();
    stopMock.mockClear();
    disposeMock.mockClear();

    audioContextMock = {
      state: "running",
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Reset the module-level AudioContext cache so each test gets a fresh mock.
    delete (globalThis as Record<string, unknown>).__pianoSuiteAudioCtx;

    vi.stubGlobal(
      "AudioContext",
      function MockAudioContext() {
        return audioContextMock;
      } as unknown as typeof AudioContext
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a sampler and reports ready", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7);
    expect(engine.state).toBe("idle");
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("plays a note with clamped velocity", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7);
    await engine.load();
    engine.play(60, 100);
    expect(startMock).toHaveBeenCalledWith({ note: 60, velocity: 100 });

    startMock.mockClear();
    engine.play(62, 200);
    expect(startMock).toHaveBeenCalledWith({ note: 62, velocity: 127 });

    startMock.mockClear();
    engine.play(64, -5);
    expect(startMock).toHaveBeenCalledWith({ note: 64, velocity: 0 });
  });

  it("stops a note", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7);
    await engine.load();
    engine.stop(60);
    expect(stopMock).toHaveBeenCalledWith(60);
  });

  it("maps volume to smplr's 0..127 scale", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.5);
    await engine.load();
    engine.setVolume(0.25);
    expect(mockSampler.output.volume).toBeCloseTo(31.75, 1);
  });

  it("disposes the sampler", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7);
    await engine.load();
    engine.dispose();
    expect(disposeMock).toHaveBeenCalled();
    expect(engine.state).toBe("idle");
  });
});
