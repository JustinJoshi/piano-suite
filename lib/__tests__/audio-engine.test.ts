import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAudioEngine, clearAudioCache } from "@/lib/audio-engine";

const startMock = vi.fn();
const stopMock = vi.fn();
const disposeMock = vi.fn();
const loadInstrumentMock = vi.fn().mockResolvedValue(undefined);
const readyPromise = Promise.resolve();

const mockSampler = {
  ready: readyPromise,
  output: { volume: 100 },
  start: startMock,
  stop: stopMock,
  dispose: disposeMock,
  loadInstrument: loadInstrumentMock,
};

vi.mock("smplr", () => ({
  SplendidGrandPiano: vi.fn(() => mockSampler),
  Soundfont: vi.fn(() => mockSampler),
  ElectricPiano: vi.fn(() => mockSampler),
  Mallet: vi.fn(() => mockSampler),
  Soundfont2: vi.fn(() => mockSampler),
  Sampler: vi.fn(() => mockSampler),
  CacheStorage: vi.fn(() => ({})),
}));

const loadCustomKitBlobMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/audio-storage", () => ({
  loadCustomKitBlob: loadCustomKitBlobMock,
}));

vi.mock("@/lib/sf2-kit", () => ({
  createSf2Sampler: vi.fn(() => Promise.resolve(mockSampler)),
}));

vi.mock("@/lib/sample-map-kit", () => ({
  createSampleMapSampler: vi.fn(() => Promise.resolve(mockSampler)),
}));

describe("createAudioEngine", () => {
  let audioContextMock: {
    state: string;
    resume: ReturnType<typeof vi.fn>;
    decodeAudioData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    startMock.mockClear();
    stopMock.mockClear();
    disposeMock.mockClear();
    loadInstrumentMock.mockClear();
    loadCustomKitBlobMock.mockReset();
    mockSampler.ready = readyPromise;

    audioContextMock = {
      state: "running",
      resume: vi.fn().mockResolvedValue(undefined),
      decodeAudioData: vi.fn().mockResolvedValue({}),
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
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    expect(engine.state).toBe("idle");
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("loads built-in soundfont presets", async () => {
    const engine = createAudioEngine(
      "fluidr3-acoustic-grand-piano",
      0.7,
      null
    );
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("loads dynamic sf presets", async () => {
    const engine = createAudioEngine(
      "sf:FluidR3_GM:acoustic_grand_piano",
      0.7,
      null
    );
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("loads electric piano presets", async () => {
    const engine = createAudioEngine("ep:CP80", 0.7, null);
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("loads mallet presets", async () => {
    const engine = createAudioEngine("mallet:Marimba", 0.7, null);
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("notifies state changes through onStateChange", async () => {
    const onStateChange = vi.fn();
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null, {
      onStateChange,
    });
    await engine.load();
    expect(onStateChange).toHaveBeenCalledWith("loading");
    expect(onStateChange).toHaveBeenCalledWith("ready");
  });

  it("plays a note with clamped velocity", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
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
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    await engine.load();
    engine.stop(60);
    expect(stopMock).toHaveBeenCalledWith(60);
  });

  it("maps volume to smplr's 0..127 scale", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.5, null);
    await engine.load();
    engine.setVolume(0.25);
    expect(mockSampler.output.volume).toBeCloseTo(31.75, 1);
  });

  it("disposes the sampler", async () => {
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    await engine.load();
    engine.dispose();
    expect(disposeMock).toHaveBeenCalled();
    expect(engine.state).toBe("idle");
  });

  it("loads a custom SF2 kit", async () => {
    const blob = new Blob(["sf2"]);
    loadCustomKitBlobMock.mockResolvedValue(blob);

    const engine = createAudioEngine("custom", 0.7, {
      kind: "sf2",
      id: "kit-1",
      name: "My Piano",
      preset: "Grand Piano",
    });
    await engine.load();
    expect(engine.state).toBe("ready");
  });

  it("errors when a custom SF2 blob is missing", async () => {
    loadCustomKitBlobMock.mockResolvedValue(undefined);

    const engine = createAudioEngine("custom", 0.7, {
      kind: "sf2",
      id: "missing",
      name: "Missing",
      preset: "Piano",
    });
    await engine.load();
    expect(engine.state).toBe("error");
  });

  it("ignores load completion after dispose", async () => {
    let resolveReady: () => void = () => {};
    mockSampler.ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const onStateChange = vi.fn();
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null, {
      onStateChange,
    });
    const loadPromise = engine.load();
    expect(engine.state).toBe("loading");

    engine.dispose();
    resolveReady();
    await loadPromise;

    // The stale continuation must not clobber the disposed engine's state.
    expect(engine.state).toBe("idle");
    expect(onStateChange).not.toHaveBeenCalledWith("ready");
  });

  it("ignores load failure after dispose", async () => {
    let rejectReady: (err: unknown) => void = () => {};
    mockSampler.ready = new Promise<void>((_, reject) => {
      rejectReady = reject;
    });

    const onStateChange = vi.fn();
    const engine = createAudioEngine("splendid-grand-piano", 0.7, null, {
      onStateChange,
    });
    const loadPromise = engine.load();

    engine.dispose();
    rejectReady(new Error("boom"));
    await loadPromise;

    expect(engine.state).toBe("idle");
    expect(onStateChange).not.toHaveBeenCalledWith("error");
  });

  it("does not start a deferred note after dispose", async () => {
    let resolveReady: () => void = () => {};
    mockSampler.ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    engine.play(60, 100);
    engine.dispose();
    resolveReady();
    // Flush the load().then(...) continuation.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(startMock).not.toHaveBeenCalled();
  });

  it("does not schedule notes while the context is suspended", async () => {
    audioContextMock.state = "suspended";

    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    await engine.load();
    engine.play(60, 100);

    expect(startMock).not.toHaveBeenCalled();
    expect(audioContextMock.resume).toHaveBeenCalled();
  });

  it("resumes the shared context from a user gesture", () => {
    audioContextMock.state = "suspended";

    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    engine.resumeFromUserGesture();

    expect(audioContextMock.resume).toHaveBeenCalled();
  });

  it("treats Safari's interrupted state as resumable", () => {
    audioContextMock.state = "interrupted";

    const engine = createAudioEngine("splendid-grand-piano", 0.7, null);
    engine.resumeFromUserGesture();

    expect(audioContextMock.resume).toHaveBeenCalled();
  });
});

describe("clearAudioCache", () => {
  it("deletes the piano-suite cache", async () => {
    const deleteMock = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { delete: deleteMock });

    await clearAudioCache();
    expect(deleteMock).toHaveBeenCalledWith("piano-suite");
    vi.unstubAllGlobals();
  });

  it("does nothing when caches is unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    await expect(clearAudioCache()).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
});
