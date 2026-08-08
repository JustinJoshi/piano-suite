import { describe, it, expect, vi } from "vitest";
import { parseSampleFiles, createSampleMapSampler } from "@/lib/sample-map-kit";

const mockSampler = {
  ready: Promise.resolve(),
  output: { volume: 100 },
};

vi.mock("smplr", () => ({
  Sampler: vi.fn(() => mockSampler),
}));

function makeFile(name: string, type = "audio/wav"): File {
  return new File(["audio"], name, { type });
}

describe("parseSampleFiles", () => {
  it("maps note-name filenames to midi notes", async () => {
    const entries = await parseSampleFiles([
      makeFile("C4.wav"),
      makeFile("F#3.mp3"),
    ]);
    const notes = entries.map((e) => e.note).sort((a, b) => a - b);
    expect(notes).toEqual([54, 60]);
  });

  it("maps numeric filenames to midi notes", async () => {
    const entries = await parseSampleFiles([makeFile("72.wav")]);
    expect(entries[0]?.note).toBe(72);
  });

  it("ignores non-audio files", async () => {
    const entries = await parseSampleFiles([
      makeFile("readme.txt", "text/plain"),
      makeFile("C4.wav"),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.note).toBe(60);
  });

  it("ignores files that do not map to a note", async () => {
    const entries = await parseSampleFiles([
      makeFile("hello.wav"),
      makeFile("C4.wav"),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.note).toBe(60);
  });
});

describe("createSampleMapSampler", () => {
  it("decodes sample blobs and builds a sampler", async () => {
    const decodeAudioData = vi.fn().mockResolvedValue({} as AudioBuffer);
    const context = { decodeAudioData } as unknown as AudioContext;

    const entries = [
      { note: 60, blob: new Blob(["audio"]), name: "C4.wav" },
    ];

    const sampler = await createSampleMapSampler(context, entries);
    expect(decodeAudioData).toHaveBeenCalled();
    expect(sampler).toBe(mockSampler);
  });

  it("throws when no samples decode", async () => {
    const decodeAudioData = vi.fn().mockRejectedValue(new Error("decode failed"));
    const context = { decodeAudioData } as unknown as AudioContext;

    await expect(
      createSampleMapSampler(context, [
        { note: 60, blob: new Blob(["audio"]), name: "C4.wav" },
      ])
    ).rejects.toThrow("No valid audio samples");
  });
});
